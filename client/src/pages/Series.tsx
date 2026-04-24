/*
  Design System: "Cinema Noir Console"
  File purpose: Series browser — category chips, poster grid, and a
  detail dialog with seasons/episodes list and embedded player.
*/

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildSeriesStreamUrl,
  getSeries,
  getSeriesCategories,
  getSeriesInfo,
  type SeriesEpisode,
  type SeriesItem,
} from "@/lib/xtream";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import VideoPlayer from "@/components/VideoPlayer";
import { Clapperboard, Loader2, Play, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Series() {
  const { credentials } = useAuth();
  const [catId, setCatId] = useState<string | "all">("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SeriesItem | null>(null);

  const catsKey = credentials
    ? `series.cats.${credentials.host}.${credentials.username}`
    : null;
  const listKey = credentials
    ? `series.list.${credentials.host}.${credentials.username}.${catId}`
    : null;

  const { data: categories, loading: catsLoading } = useCachedFetch(
    catsKey,
    async () => {
      if (!credentials) throw new Error("No credentials");
      return getSeriesCategories(credentials);
    },
  );
  const { data: list, loading: listLoading } = useCachedFetch(
    listKey,
    async () => {
      if (!credentials) throw new Error("No credentials");
      return getSeries(
        credentials,
        catId === "all" ? undefined : (catId as string),
      );
    },
  );

  const filtered = useMemo(() => {
    if (!list) return [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(x => x.name.toLowerCase().includes(s));
  }, [list, q]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col gap-3">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary/80">
          Binge · Series
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            Series
          </h1>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search series…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-md bg-card/60 border hairline text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </header>

      <div className="overflow-x-auto scroll-row -mx-2 px-2">
        <div className="flex gap-2 pb-2">
          <Chip
            active={catId === "all"}
            onClick={() => setCatId("all")}
            label="All"
          />
          {catsLoading ? (
            <span className="text-xs text-muted-foreground flex items-center gap-2 px-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading…
            </span>
          ) : (
            (categories || []).map(c => (
              <Chip
                key={c.category_id}
                active={catId === c.category_id}
                onClick={() => setCatId(c.category_id)}
                label={c.category_name}
              />
            ))
          )}
        </div>
      </div>

      {listLoading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div className="min-h-[40vh] grid place-items-center">
          <div className="text-center">
            <Clapperboard className="w-8 h-8 mx-auto text-muted-foreground" />
            <div className="font-display text-lg mt-2">No series found</div>
            <p className="text-sm text-muted-foreground">
              Try a different category.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {filtered.map(s => (
            <SeriesCard
              key={s.series_id}
              series={s}
              onClick={() => setSelected(s)}
            />
          ))}
        </div>
      )}

      <SeriesDetailDialog
        series={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 h-9 px-3.5 rounded-full text-sm border transition-colors whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card/60 border-border/80 text-foreground/80 hover:text-foreground hover:border-primary/40",
      )}
    >
      {label}
    </button>
  );
}

function SeriesCard({
  series,
  onClick,
}: {
  series: SeriesItem;
  onClick: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const rating = Number(series.rating_5based || 0);
  return (
    <button
      onClick={onClick}
      className="tile-hover group text-left rounded-lg overflow-hidden bg-card border hairline"
    >
      <div className="aspect-[2/3] relative bg-gradient-to-br from-muted/40 to-muted/10 overflow-hidden">
        {series.cover && !broken ? (
          <img
            src={series.cover}
            alt={series.name}
            loading="lazy"
            onError={() => setBroken(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <Clapperboard className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        {rating > 0 ? (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-black/60 backdrop-blur text-white text-[11px] px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-primary" />
            {rating.toFixed(1)}
          </span>
        ) : null}
      </div>
      <div className="px-3 py-2.5 border-t hairline">
        <div className="text-sm truncate font-medium">{series.name}</div>
        {series.genre ? (
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate uppercase tracking-wider">
            {series.genre}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-card border hairline animate-pulse">
          <div className="aspect-[2/3] bg-muted/30" />
          <div className="p-3">
            <div className="h-3 w-3/4 bg-muted/40 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SeriesDetailDialog({
  series,
  onClose,
}: {
  series: SeriesItem | null;
  onClose: () => void;
}) {
  const { credentials } = useAuth();
  const [playing, setPlaying] = useState<SeriesEpisode | null>(null);
  const [season, setSeason] = useState<string>("1");

  const key =
    credentials && series
      ? `series.info.${credentials.host}.${credentials.username}.${series.series_id}`
      : null;
  const { data, loading } = useCachedFetch(key, async () => {
    if (!credentials || !series) throw new Error("no");
    return getSeriesInfo(credentials, series.series_id);
  });

  useEffect(() => {
    if (!series) {
      setPlaying(null);
      setSeason("1");
    }
  }, [series]);

  useEffect(() => {
    if (data && data.episodes) {
      const keys = Object.keys(data.episodes);
      if (keys.length && !keys.includes(season)) {
        setSeason(keys[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const episodes = data?.episodes?.[season] || [];
  const src =
    playing && credentials
      ? buildSeriesStreamUrl(
          credentials,
          playing.id,
          playing.container_extension || "mp4",
        )
      : "";

  return (
    <Dialog open={!!series} onOpenChange={v => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">{series?.name || "Series"}</DialogTitle>
        <DialogDescription className="sr-only">Series details</DialogDescription>

        {playing ? (
          <>
            <div className="aspect-video bg-black">
              <VideoPlayer src={src} autoPlay controls className="h-full" />
            </div>
            <div className="p-4 flex items-center justify-between border-t hairline">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Now playing
                </div>
                <div className="text-sm font-medium truncate">
                  S{season} · E{playing.episode_num} — {playing.title}
                </div>
              </div>
              <Button variant="outline" onClick={() => setPlaying(null)}>
                Back to episodes
              </Button>
            </div>
          </>
        ) : (
          <div className="grid md:grid-cols-[240px_1fr] min-h-0 overflow-hidden">
            <div className="md:aspect-auto aspect-[2/3] bg-muted/20 shrink-0">
              {series?.cover ? (
                <img
                  src={series.cover}
                  alt={series.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <Clapperboard className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-5 sm:p-6 flex flex-col gap-4 min-w-0 overflow-y-auto">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary/80">
                  Series
                </div>
                <h2 className="font-display text-2xl sm:text-3xl tracking-tight mt-1">
                  {series?.name}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-mono flex-wrap">
                  {series?.releaseDate ? <span>{series.releaseDate}</span> : null}
                  {series?.genre ? <span>{series.genre}</span> : null}
                  {Number(series?.rating_5based || 0) > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary" />
                      {Number(series?.rating_5based).toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>

              {series?.plot ? (
                <p className="text-sm leading-relaxed text-foreground/85">
                  {series.plot}
                </p>
              ) : null}

              <div className="border-t hairline pt-4">
                {loading ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading seasons…
                  </div>
                ) : data && Object.keys(data.episodes || {}).length > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Season
                      </div>
                      <Select value={season} onValueChange={setSeason}>
                        <SelectTrigger className="h-9 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(data.episodes).map(k => (
                            <SelectItem key={k} value={k}>
                              Season {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground">
                        {episodes.length} episode
                        {episodes.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <ul className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                      {episodes.map(ep => (
                        <li key={ep.id}>
                          <button
                            onClick={() => setPlaying(ep)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-md border hairline bg-card/60 hover:border-primary/50 hover:bg-card transition-colors text-left group"
                          >
                            <span className="w-8 h-8 rounded bg-primary/15 text-primary grid place-items-center shrink-0">
                              <Play className="w-3.5 h-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="text-sm font-medium block truncate">
                                E{ep.episode_num} — {ep.title}
                              </span>
                              {ep.info?.duration ? (
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {ep.info.duration}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No episodes available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
