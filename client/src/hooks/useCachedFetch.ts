/*
  Design System: "Cinema Noir Console"
  File purpose: Tiny cache-aware async hook. Caches results in-memory + localStorage
  for fast re-navigation between tabs. Keyed by a stable string.
*/

import { useCallback, useEffect, useRef, useState } from "react";

const memCache = new Map<string, { ts: number; data: unknown }>();
const DEFAULT_TTL = 1000 * 60 * 10; // 10 minutes

function lsGet<T>(key: string): { ts: number; data: T } | null {
  try {
    const raw = localStorage.getItem("iptv.cache." + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, value: { ts: number; data: T }) {
  try {
    localStorage.setItem("iptv.cache." + key, JSON.stringify(value));
  } catch {
    // quota exceeded — swallow
  }
}

export function useCachedFetch<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: { ttl?: number; persistent?: boolean } = {},
) {
  const { ttl = DEFAULT_TTL, persistent = true } = options;
  const [data, setData] = useState<T | null>(() => {
    if (!key) return null;
    const mem = memCache.get(key);
    if (mem && Date.now() - mem.ts < ttl) return mem.data as T;
    if (persistent) {
      const ls = lsGet<T>(key);
      if (ls && Date.now() - ls.ts < ttl) {
        memCache.set(key, ls);
        return ls.data;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!data && !!key);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (force = false) => {
      if (!key) return;
      const mem = memCache.get(key);
      if (!force && mem && Date.now() - mem.ts < ttl) {
        setData(mem.data as T);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        const entry = { ts: Date.now(), data: result };
        memCache.set(key, entry);
        if (persistent) lsSet(key, entry);
        if (mounted.current) {
          setData(result);
          setLoading(false);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        if (mounted.current) {
          setError(msg);
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, ttl, persistent],
  );

  useEffect(() => {
    if (key) {
      run(false);
    } else {
      setData(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, error, refetch: () => run(true) };
}
