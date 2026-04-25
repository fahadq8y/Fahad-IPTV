/*
  Design System: "Cinema Noir Console"
  File purpose: Reusable HTML5 + hls.js video player. Falls back to native
  HLS on Safari. Autoplay muted for Live, unmuted controls retained.
*/

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertTriangle } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  isLive?: boolean;
  onError?: (message: string) => void;
}

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = true,
  muted = false,
  controls = true,
  className,
  isLive = false,
  onError,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setLoading(true);
    setError(null);

    // Cleanup previous hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handleError = (message: string) => {
      setError(message);
      setLoading(false);
      onError?.(message);
    };

    const onCanPlay = () => setLoading(false);
    const onPlaying = () => setLoading(false);
    const onWaiting = () => setLoading(true);
    const onLoadStart = () => setLoading(true);
    const onVideoError = () => {
      const mediaError = video.error;
      const code = mediaError?.code;
      const msg =
        code === 4
          ? "This stream format can’t be played in the browser."
          : "Playback error. The stream may be offline or blocked.";
      handleError(msg);
    };

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("loadstart", onLoadStart);
    video.addEventListener("error", onVideoError);

    const useHls = isHlsUrl(src);

    if (useHls && Hls.isSupported()) {
      const hls = new Hls({
        // Keep it light for live
        maxBufferLength: isLive ? 8 : 30,
        lowLatencyMode: isLive,
        enableWorker: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(() => void 0);
        }
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              handleError("Network error. Check your server or connection.");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              try {
                hls.recoverMediaError();
              } catch {
                handleError("Media error. Unable to recover playback.");
              }
              break;
            default:
              handleError("Playback error. The stream may be unavailable.");
          }
        }
      });
    } else if (
      useHls &&
      video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // Native HLS (Safari)
      video.src = src;
      if (autoPlay) video.play().catch(() => void 0);
    } else {
      // Direct source (mp4, mkv via browser support etc.)
      video.src = src;
      if (autoPlay) video.play().catch(() => void 0);
    }

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("loadstart", onLoadStart);
      video.removeEventListener("error", onVideoError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isLive]);

  return (
    <div className={"relative w-full h-full bg-black " + (className || "")}>
      <video
        ref={videoRef}
        poster={poster}
        controls={controls}
        muted={muted}
        playsInline
        className="w-full h-full object-contain bg-black"
      />
      {loading && !error ? (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="flex items-center gap-2 text-sm text-white/80 bg-black/40 backdrop-blur px-3 py-1.5 rounded-full">
            <Loader2 className="w-4 h-4 animate-spin" />
            Buffering…
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="max-w-sm text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-destructive/20 grid place-items-center">
              <AlertTriangle className="w-5 h-5 text-destructive-foreground" />
            </div>
            <div className="text-sm text-white/90">{error}</div>
            <div className="text-xs text-white/50 font-mono">
              Tip: some streams only play over HTTPS portals in modern browsers.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
