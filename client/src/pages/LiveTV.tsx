/*
  Design System: "Cinema Noir Console"
  File purpose: Live TV — master-detail layout with categories list on the left
  and a dense channel grid on the right. Selecting a channel opens a focused
  player sheet with a LIVE pill.
*/

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildLiveStreamUrl,
  getLiveCategories,
  getLiveStreams,
  type LiveStream,
} from "@/lib/xtream";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import VideoPlayer from "@/components/VideoPlayer";
import { Loader2, Tv, Search, ChevronRight, X, Maximize2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function LiveTV() {
  const { credentials } = useAuth();
  const [catId, setCatId] = useState<string | "all">("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<LiveStream | null>(null);

  const cacheKey = credentials
    ? `live.cats.${credentials.host}.${credentials.username}`
    : null;
  const streamsKey =
    credentials && catId
      ? `live.streams.${credentials.host}.${credentials.username}.${catId}`
      : null;

  const {
    data: categories,
    loading: catsLoading,
    error: catsError,
  } = useCachedFetch(cacheKey, async () => {
    if (!credentials) throw new Error("No credentials");
    return getLiveCategories(credentials);
  });

  const {
    data: streams,
    loading: streamsLoading,
  } = useCachedFetch(streamsKey, async () => {
    if (!credentials) throw new Error("No credentials");
    return getLiveStreams(
      credentials,
      catId === "all" ? undefined : (catId as string),
    );
  });

  const filtered = useMemo(() => {
    if (!streams) return [];
    const s = q.trim().toLowerCase();
    if (!s) return streams;
    return streams.filter(x => x.name.toLowerCase().includes(s));
  }, [streams, q]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] h-[calc(100vh-4rem)]">
      {/* Categories rail */}
      <aside className="border-r hairline lg:overflow-y-auto bg-sidebar/30">
        <div className="p-4 border-b hairline sticky top-0 bg-sidebar/70 backdrop-blur z-10">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
            Categories
          </div>
          <h1 className="font-display text-2xl leading-tight">Live TV</h1>
        </div>
        {catsLoading ? (
          <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading categories…
          </div>
        ) : catsError ? (
          <div className="p-4 text-sm text-destructive-foreground">
            {catsError}
          </div>
        ) : (
          <ul className="py-2">
            <CategoryItem
              active={catId === "all"}
              onClick={() => setCatId("all")}
              label="All channels"
            />
            {(categories || []).map(c => (
              <CategoryItem
                key={c.category_id}
                active={catId === c.category_id}
                onClick={() => setCatId(c.category_id)}
                label={c.category_name}
              />
            ))}
          </ul>
        )}
      </aside>

      {/* Channel grid */}
      <section className="flex flex-col min-w-0">
        <div className="p-4 sm:p-6 border-b hairline flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Filter channels in this category…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-md bg-card/60 border hairline text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {filtered.length} channel{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {streamsLoading ? (
            <GridSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
              {filtered.map(ch => (
                <ChannelCard
                  key={ch.stream_id}
                  channel={ch}
                  onClick={() => setSelected(ch)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <PlayerSheet
        channel={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function CategoryItem({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left flex items-center gap-2 px-4 h-10 text-sm transition-colors group",
          active
            ? "bg-primary/15 text-primary border-l-2 border-primary"
            : "text-foreground/80 hover:bg-accent border-l-2 border-transparent",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronRight
          className={cn(
            "ml-auto w-3.5 h-3.5 opacity-0 transition-opacity",
            active ? "opacity-100" : "group-hover:opacity-50",
          )}
        />
      </button>
    </li>
  );
}

function ChannelCard({
  channel,
  onClick,
}: {
  channel: LiveStream;
  onClick: () => void;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      onClick={onClick}
      className="tile-hover group relative text-left rounded-lg overflow-hidden bg-card border hairline"
    >
      <div className="aspect-[4/3] w-full bg-gradient-to-br from-muted/40 to-muted/10 grid place-items-center relative">
        {channel.stream_icon && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.stream_icon}
            alt={channel.name}
            loading="lazy"
            onError={() => setBroken(true)}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Tv className="w-7 h-7" />
            <span className="font-mono text-[10px] tracking-widest uppercase">
              No logo
            </span>
          </div>
        )}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/90 bg-black/50 backdrop-blur px-1.5 py-0.5 rounded">
          <span className="live-dot" /> Live
        </span>
      </div>
      <div className="px-3 py-2.5 border-t hairline">
        <div className="text-sm truncate font-medium">{channel.name}</div>
        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
          #{String(channel.num).padStart(3, "0")}
        </div>
      </div>
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg bg-card border hairline animate-pulse"
        >
          <div className="aspect-[4/3] bg-muted/30" />
          <div className="p-3">
            <div className="h-3 w-3/4 bg-muted/40 rounded" />
            <div className="h-2 w-1/3 bg-muted/30 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full min-h-[300px] grid place-items-center">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-muted/30 grid place-items-center mx-auto">
          <Tv className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="mt-3 font-display text-lg">No channels found</div>
        <p className="text-sm text-muted-foreground mt-1">
          Try a different category or adjust your search.
        </p>
      </div>
    </div>
  );
}

function PlayerSheet({
  channel,
  onClose,
}: {
  channel: LiveStream | null;
  onClose: () => void;
}) {
  const { credentials } = useAuth();
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!channel) setFullscreen(false);
  }, [channel]);

  const src =
    channel && credentials
      ? buildLiveStreamUrl(credentials, channel.stream_id, "m3u8")
      : "";

  return (
    <Sheet open={!!channel} onOpenChange={v => (!v ? onClose() : null)}>
      <SheetContent
        side="right"
        className={cn(
          "p-0 bg-background border-l hairline flex flex-col",
          fullscreen
            ? "w-screen sm:max-w-none"
            : "w-full sm:max-w-2xl lg:max-w-3xl",
        )}
      >
        <div className="h-14 border-b hairline flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/90 bg-destructive/80 px-1.5 py-0.5 rounded">
              <span className="live-dot" /> Live
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {channel?.name || ""}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                Channel #{channel?.num}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFullscreen(v => !v)}
              className="p-2 rounded-md hover:bg-accent"
              title="Toggle wide view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-accent"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-black">
          {channel ? (
            <VideoPlayer
              key={channel.stream_id}
              src={src}
              isLive
              autoPlay
              controls
              muted={false}
              className="h-full"
            />
          ) : null}
        </div>

        {channel ? (
          <div className="p-4 border-t hairline">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Stream URL
            </div>
            <div className="text-[11px] font-mono break-all bg-card/60 border hairline rounded p-2 text-muted-foreground">
              {src}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
