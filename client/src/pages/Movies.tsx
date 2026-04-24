/*
  Design System: "Cinema Noir Console"
  File purpose: Movies (VOD) — category pills + poster grid. Clicking a
  poster opens a detail/player modal using container_extension from the API.
*/

import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildVodStreamUrl,
  getVodCategories,
  getVodInfo,
  getVodStreams,
  type VodStream,
} from "@/lib/xtream";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import VideoPlayer from "@/components/VideoPlayer";
import { Loader2, Film, Search, Star, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Movies() {
  const { credentials } = useAuth();
  const [catId, setCatId] = useState<string | "all">("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<VodStream | null>(null);

  const catsKey = credentials
    ? `vod.cats.${credentials.host}.${credentials.username}`
    : null;
  const streamsKey = credentials
    ? `vod.streams.${credentials.host}.${credentials.username}.${catId}`
    : null;

  const { data: categories, loading: catsLoading } = useCachedFetch(
    catsKey,
    async () => {
      if (!credentials) throw new Error("No credentials");
      return getVodCategories(credentials);
    },
  );
  const { data: streams, loading: streamsLoading } = useCachedFetch(
    streamsKey,
    async () => {
      if (!credentials) throw new Error("No credentials");
      return getVodStreams(
        credentials,
        catId === "all" ? undefined : (catId as string),
      );
    },
  );

  const filtered = useMemo(() => {
    if (!streams) return [];
    const s = q.trim().toLowerCase();
    if (!s) return streams;
    return streams.filter(x => x.name.toLowerCase().includes(s));
  }, [streams, q]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col gap-3">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary/80">
          Vault · Video on demand
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            Movies
          </h1>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search movies…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-md bg-card/60 border hairline text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </header>

      {/* Category chips */}
      <div className="overflow-x-auto scroll-row -mx-2 px-2">
        <div className="flex gap-2 pb-2">
          <CatChip
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
              <CatChip
                key={c.category_id}
                active={catId === c.category_id}
                onClick={() => setCatId(c.category_id)}
                label={c.category_name}
              />
            ))
          )}
        </div>
      </div>

      {streamsLoading ? (
        <PosterGridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="min-h-[40vh] grid place-items-center">
          <div className="text-center">
            <Film className="w-8 h-8 mx-auto text-muted-foreground" />
            <div className="font-display text-lg mt-2">No movies found</div>
            <p className="text-sm text-muted-foreground">
              Try a different category.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {filtered.map(m => (
            <MovieCard
              key={m.stream_id}
              movie={m}
              onClick={() => setSelected(m)}
            />
          ))}
        </div>
      )}

      <MovieDetailDialog
        movie={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function CatChip({
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

function MovieCard({
  movie,
  onClick,
}: {
  movie: VodStream;
  onClick: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const rating = Number(movie.rating_5based || 0);
  return (
    <button
      onClick={onClick}
      className="tile-hover group text-left rounded-lg overflow-hidden bg-card border hairline"
    >
      <div className="aspect-[2/3] relative bg-gradient-to-br from-muted/40 to-muted/10 overflow-hidden">
        {movie.stream_icon && !broken ? (
          <img
            src={movie.stream_icon}
            alt={movie.name}
            loading="lazy"
            onError={() => setBroken(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <Film className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-medium px-2 py-1 rounded-full">
            <Play className="w-3 h-3" /> Play
          </span>
          {rating > 0 ? (
            <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur text-white text-[11px] px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-primary" />
              {rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="px-3 py-2.5 border-t hairline">
        <div className="text-sm truncate font-medium">{movie.name}</div>
        <div className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">
          {movie.container_extension || "video"}
        </div>
      </div>
    </button>
  );
}

function PosterGridSkeleton() {
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

function MovieDetailDialog({
  movie,
  onClose,
}: {
  movie: VodStream | null;
  onClose: () => void;
}) {
  const { credentials } = useAuth();
  const [playing, setPlaying] = useState(false);
  const infoKey =
    credentials && movie
      ? `vod.info.${credentials.host}.${credentials.username}.${movie.stream_id}`
      : null;
  const { data: info } = useCachedFetch(infoKey, async () => {
    if (!credentials || !movie) throw new Error("No creds");
    return getVodInfo(credentials, movie.stream_id);
  });

  React.useEffect(() => {
    if (!movie) setPlaying(false);
  }, [movie]);

  const src =
    movie && credentials
      ? buildVodStreamUrl(
          credentials,
          movie.stream_id,
          movie.container_extension || "mp4",
        )
      : "";

  return (
    <Dialog open={!!movie} onOpenChange={v => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{movie?.name || "Movie"}</DialogTitle>
        <DialogDescription className="sr-only">
          Movie details and playback
        </DialogDescription>
        {playing ? (
          <div className="aspect-video bg-black">
            <VideoPlayer src={src} autoPlay controls className="h-full" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-[220px_1fr]">
            <div className="aspect-[2/3] sm:aspect-auto bg-muted/20">
              {movie?.stream_icon ? (
                <img
                  src={movie.stream_icon}
                  alt={movie.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <Film className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-5 sm:p-6 flex flex-col gap-4 min-w-0">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary/80">
                  Movie
                </div>
                <h2 className="font-display text-2xl sm:text-3xl tracking-tight mt-1">
                  {movie?.name}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
                  {info?.info?.releasedate ? (
                    <span>{info.info.releasedate}</span>
                  ) : null}
                  {info?.info?.genre ? <span>{info.info.genre}</span> : null}
                  {info?.info?.duration ? (
                    <span>{info.info.duration}</span>
                  ) : null}
                  {Number(movie?.rating_5based || 0) > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary" />
                      {Number(movie?.rating_5based).toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>
              {info?.info?.plot ? (
                <p className="text-sm leading-relaxed text-foreground/85 max-h-48 overflow-y-auto">
                  {info.info.plot}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No synopsis provided by the server.
                </p>
              )}
              {info?.info?.cast ? (
                <div className="text-xs text-muted-foreground">
                  <span className="font-mono uppercase tracking-wider text-[10px]">
                    Cast ·
                  </span>{" "}
                  {info.info.cast}
                </div>
              ) : null}
              <div className="mt-auto flex gap-2">
                <Button onClick={() => setPlaying(true)} className="gap-2">
                  <Play className="w-4 h-4" />
                  Play movie
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
