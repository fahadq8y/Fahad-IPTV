/*
  Design System: "Cinema Noir Console"
  File purpose: Global app shell — left rail nav (Live/Movies/Series/Settings),
  compact top bar (search + account menu), main content area.
*/

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Tv,
  Film,
  Clapperboard,
  Settings as SettingsIcon,
  LogOut,
  Search,
  Share2,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { encodeShareHash } from "@/lib/xtream";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app/live", label: "Live TV", icon: Tv },
  { to: "/app/movies", label: "Movies", icon: Film },
  { to: "/app/series", label: "Series", icon: Clapperboard },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { credentials, authInfo, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function onShare() {
    if (!credentials) return;
    const hash = encodeShareHash(credentials);
    const url = `${window.location.origin}/#c=${hash}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Share link copied to clipboard"))
      .catch(() => toast.error("Failed to copy share link"));
  }

  function onLogout() {
    logout();
    navigate("/login");
  }

  const initials = (credentials?.username || "U").slice(0, 2).toUpperCase();
  const expDate = authInfo?.user_info?.exp_date
    ? new Date(Number(authInfo.user_info.exp_date) * 1000)
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-[232px] shrink-0 border-r hairline bg-sidebar/60 backdrop-blur">
        <div className="h-16 flex items-center px-5 border-b hairline">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 grid place-items-center rounded-md bg-primary/15 text-primary border hairline">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display text-base leading-none">
                Cinema
              </div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Console
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-5 px-3 space-y-1">
          <div className="px-2 py-1 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Browse
          </div>
          {NAV.map(item => {
            const Icon = item.icon;
            const active = location.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/80 hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {active ? (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t hairline space-y-1">
          <Link
            href="/app/settings"
            className={cn(
              "flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors",
              location.startsWith("/app/settings")
                ? "bg-primary/15 text-primary"
                : "text-foreground/80 hover:bg-accent hover:text-foreground",
            )}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            onClick={onShare}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share with a friend</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-sidebar border-r hairline flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b hairline">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 grid place-items-center rounded-md bg-primary/15 text-primary border hairline">
                  <Tv className="w-4 h-4" />
                </div>
                <div className="font-display text-base">Cinema Console</div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-5 px-3 space-y-1">
              {NAV.map(item => {
                const Icon = item.icon;
                const active = location.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 h-10 rounded-md text-sm",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-foreground/80 hover:bg-accent",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/app/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 h-10 rounded-md text-sm text-foreground/80 hover:bg-accent"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onShare();
                }}
                className="w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm text-foreground/80 hover:bg-accent"
              >
                <Share2 className="w-4 h-4" />
                <span>Share with a friend</span>
              </button>
            </nav>
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b hairline bg-background/70 backdrop-blur sticky top-0 z-30">
          <div className="h-full px-4 sm:px-6 flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Search channels, movies, series…"
                  className="w-full h-10 pl-10 pr-3 rounded-md bg-card/60 border hairline text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const q = (e.currentTarget.value || "").trim();
                      if (q) {
                        navigate(`/app/search?q=${encodeURIComponent(q)}`);
                      }
                    }
                  }}
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-2 pl-2 pr-3 bg-card/60">
                  <span className="w-7 h-7 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-semibold">
                    {initials}
                  </span>
                  <span className="hidden sm:inline text-sm">
                    {credentials?.username || "Guest"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                    Account
                  </div>
                  <div className="mt-1 truncate">{credentials?.username}</div>
                  {expDate ? (
                    <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                      Expires {expDate.toLocaleDateString()}
                    </div>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="w-4 h-4" />
                  Copy share link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/settings")}>
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-destructive-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
