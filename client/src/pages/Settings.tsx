/*
  Design System: "Cinema Noir Console"
  File purpose: Settings — account details, shareable link, cache reset, sign-out.
*/

import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { encodeShareHash } from "@/lib/xtream";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, LogOut, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

export default function Settings() {
  const { credentials, authInfo, logout, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  const shareUrl =
    credentials && typeof window !== "undefined"
      ? `${window.location.origin}/#c=${encodeShareHash(credentials)}`
      : "";

  const expDate = authInfo?.user_info?.exp_date
    ? new Date(Number(authInfo.user_info.exp_date) * 1000)
    : null;

  function copyShare() {
    if (!shareUrl) return;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => toast.success("Share link copied"))
      .catch(() => toast.error("Failed to copy"));
  }

  function clearCache() {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("iptv.cache.")) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      toast.success(`Cleared ${keys.length} cache entries`);
    } catch {
      toast.error("Failed to clear cache");
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
      toast.success("Account refreshed");
    } finally {
      setRefreshing(false);
    }
  }

  function onLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary/80">
          Preferences
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight mt-1">
          Settings
        </h1>
      </header>

      {/* Account */}
      <section className="rounded-lg border hairline bg-card/60 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h2 className="font-display text-lg">Account</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <Field label="Username" value={credentials?.username || "—"} />
          <Field label="Server" value={credentials?.host || "—"} mono />
          <Field
            label="Status"
            value={authInfo?.user_info?.status || "Unknown"}
          />
          <Field
            label="Expires"
            value={expDate ? expDate.toLocaleString() : "—"}
          />
          <Field
            label="Max connections"
            value={authInfo?.user_info?.max_connections || "—"}
          />
          <Field
            label="Active now"
            value={authInfo?.user_info?.active_cons || "—"}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw
              className={"w-4 h-4 " + (refreshing ? "animate-spin" : "")}
            />
            Refresh account info
          </Button>
          <Button
            variant="outline"
            onClick={onLogout}
            className="text-destructive-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </section>

      {/* Share */}
      <section className="rounded-lg border hairline bg-card/60 p-5 sm:p-6 space-y-3">
        <div>
          <h2 className="font-display text-lg">Private share link</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send this link to a friend to let them use this player with the
            same credentials. The credentials stay inside the URL hash and are
            never sent to any server.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 h-10 px-3 rounded-md bg-background border hairline text-xs font-mono"
          />
          <Button onClick={copyShare}>
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>
      </section>

      {/* Cache */}
      <section className="rounded-lg border hairline bg-card/60 p-5 sm:p-6 space-y-3">
        <div>
          <h2 className="font-display text-lg">Cache</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Clearing the cache forces the player to re-download categories and
            listings from the server. Use this if you see stale content.
          </p>
        </div>
        <Button variant="outline" onClick={clearCache}>
          <Trash2 className="w-4 h-4" />
          Clear cached catalog
        </Button>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-1 truncate " + (mono ? "font-mono text-xs" : "text-sm")
        }
      >
        {value}
      </div>
    </div>
  );
}
