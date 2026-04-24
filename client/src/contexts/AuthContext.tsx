/*
  Design System: "Cinema Noir Console"
  File purpose: Global auth/session state for Xtream Codes credentials.
  Persists creds to localStorage so users don't re-enter on each visit.
*/

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthResponse, XtreamCredentials } from "@/lib/xtream";
import { authenticate, decodeShareHash } from "@/lib/xtream";

const STORAGE_KEY = "iptv.credentials.v1";
const STORAGE_INFO_KEY = "iptv.auth.v1";

interface AuthState {
  credentials: XtreamCredentials | null;
  authInfo: AuthResponse | null;
  loading: boolean;
  error: string | null;
  login: (
    creds: XtreamCredentials,
    opts?: { remember?: boolean },
  ) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function loadStoredCreds(): XtreamCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.host && obj.username && obj.password) return obj;
  } catch {
    // ignore
  }
  return null;
}

function loadStoredInfo(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentials] = useState<XtreamCredentials | null>(
    () => {
      // Priority: share hash (#c=...) then localStorage
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        const m = hash.match(/[#&]c=([^&]+)/);
        if (m) {
          const fromHash = decodeShareHash(m[1]);
          if (fromHash) return fromHash;
        }
      }
      return loadStoredCreds();
    },
  );
  const [authInfo, setAuthInfo] = useState<AuthResponse | null>(
    loadStoredInfo(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (
      creds: XtreamCredentials,
      opts: { remember?: boolean } = { remember: true },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const info = await authenticate(creds);
        setCredentials(creds);
        setAuthInfo(info);
        if (opts.remember !== false) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
          localStorage.setItem(STORAGE_INFO_KEY, JSON.stringify(info));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Login failed";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setCredentials(null);
    setAuthInfo(null);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_INFO_KEY);
    } catch {
      // ignore
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!credentials) return;
    setLoading(true);
    try {
      const info = await authenticate(credentials);
      setAuthInfo(info);
      localStorage.setItem(STORAGE_INFO_KEY, JSON.stringify(info));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Refresh failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  // Background validate if we have creds but no auth info
  useEffect(() => {
    if (credentials && !authInfo) {
      refresh().catch(() => void 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      credentials,
      authInfo,
      loading,
      error,
      login,
      logout,
      refresh,
    }),
    [credentials, authInfo, loading, error, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
