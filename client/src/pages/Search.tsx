/*
  Design System: "Cinema Noir Console"
  File purpose: Unified search across Live, Movies, and Series using the
  already-cached "all" lists. Shows three sections with top matches.
*/

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildLiveStreamUrl,
  getLiveStreams,
  getSeries,
  getVodStreams,
  type LiveStream,
  type SeriesItem,
  type VodStream,
} from "@/lib/xtream";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import { Search as SearchIcon, Tv, Film, Clapperboard, Loader2 } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function SearchPage() {
  const { credentials } = useAuth();
  const [location] = useLocation();
  const [q, setQ] = useState("");
  const [liveSelected, setLiveSelected] = useState<LiveStream | null>(null);

  useEffect(() => {
    const u = new URL(window.location.href);
    const query = u.searchParams.get("q") || "";
    setQ(query);
  }, [location]);

  const liveKey = credentials
    ? `live.streams.${credentials.host}.${credentials.username}.all`
    : null;
  const vodKey = credentials
    ? `vod.streams.${credentials.host}.${credentials.username}.all`
    : null;
  const seriesKey = credentials
    ? `series.list.${credentials.host}.${credentials.username}.all`
    : null;

  const { data: live, loading: l1 } = useCachedFetch(liveKey, async () => {
    if (!credentials) throw new Error("no");
    return getLiveStreams(credentials);
  });
  const { data: vod, loading: l2 } = useCachedFetch(vodKey, async () => {
    if (!credentials) throw new Error("no");
    return getVodStreams(credentials);
  });
  const { data: series, loading: l3 } = useCachedFetch(seriesKey, async () => {
    if (!credentials) throw new Error("no");
    return getSeries(credentials);
  });

  const query = q.trim().toLowerCase();

  const liveResults = useMemo(
    () =>
      query
        ? (live || []).filter(x => x.name.toLowerCase().includes(query)).slice(0, 18)
        : [],
    [live, query],
  );
  const vodResults = useMemo(
    () =>
      query
        ? (vod || []).filter(x => x.name.toLowerCase().includes(query)).slice(0, 18)
        : [],
    [vod, query],
  );
  const seriesResults = useMemo(
    () =>
      query
        ? (series || [])
            .filter(x => x.name.toLowerCase().includes(query))
            .slice(0, 18)
        : [],
    [series, query],
  );

  const anyLoading = l1 || l2 || l3;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <header>
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary/80">
          Search
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight mt-1">
          {query ? (
            <>
              Results for <span className="italic text-primary">“{q}”</span>
            </>
          ) : (
            "Search your library"
          )}
        </h1>
      </header>

      {!query ? (
        <div className="grid place-items-center min-h-[40vh]">
          <div className="text-center max-w-sm">
            <SearchIcon className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-3">
              Use the top bar to search channels, movies, and series.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Section
            title="Live channels"
            icon={<Tv className="w-4 h-4" />}
            loading={anyLoading}
            empty={liveResults.length === 0}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {liveResults.map(ch => (
                <button
                  key={ch.stream_id}
                  onClick={() => setLiveSelected(ch)}
                  className="tile-hover text-left rounded-lg overflow-hidden bg-card border hairline"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted/40 to-muted/10 grid place-items-center">
                    {ch.stream_icon ? (
                      <img
                        src={ch.stream_icon}
                        alt={ch.name}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <Tv className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="px-3 py-2 border-t hairline text-sm truncate">
                    {ch.name}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <Section
            title="Movies"
            icon={<Film className="w-4 h-4" />}
            loading={anyLoading}
            empty={vodResults.length === 0}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {vodResults.map(m => (
                <Link
                  key={m.stream_id}
                  href="/app/movies"
                  className="tile-hover text-left rounded-lg overflow-hidden bg-card border hairline"
                >
                  <div className="aspect-[2/3] bg-muted/20">
                    {m.stream_icon ? (
                      <img
                        src={m.stream_icon}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center">
                        <Film className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 border-t hairline text-sm truncate">
                    {m.name}
                  </div>
                </Link>
              ))}
            </div>
          </Section>

          <Section
            title="Series"
            icon={<Clapperboard className="w-4 h-4" />}
            loading={anyLoading}
            empty={seriesResults.length === 0}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {seriesResults.map(s => (
                <Link
                  key={s.series_id}
                  href="/app/series"
                  className="tile-hover text-left rounded-lg overflow-hidden bg-card border hairline"
                >
                  <div className="aspect-[2/3] bg-muted/20">
                    {s.cover ? (
                      <img
                        src={s.cover}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center">
                        <Clapperboard className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 border-t hairline text-sm truncate">
                    {s.name}
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        </>
      )}

      <Sheet
        open={!!liveSelected}
        onOpenChange={v => (!v ? setLiveSelected(null) : null)}
      >
        <SheetContent side="right" className="p-0 sm:max-w-2xl">
          <div className="h-14 border-b hairline flex items-center px-4">
            <div className="text-sm font-medium truncate">
              {liveSelected?.name}
            </div>
          </div>
          <div className="aspect-video bg-black">
            {liveSelected && credentials ? (
              <VideoPlayer
                src={buildLiveStreamUrl(credentials, liveSelected.stream_id)}
                isLive
                autoPlay
                controls
                className="h-full"
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({
  title,
  icon,
  loading,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-display text-xl tracking-tight">{title}</h2>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {empty ? (
        <div className="text-sm text-muted-foreground border hairline rounded-md p-4 bg-card/40">
          No matches in {title.toLowerCase()}.
        </div>
      ) : (
        children
      )}
    </section>
  );
}
