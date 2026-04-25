/*
  Design System: "Cinema Noir Console"
  File purpose: Login screen for Xtream Codes — dark cinematic layout with
  a left editorial hero and a right form. Uses serif display + mono metadata.
*/

import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Tv, ShieldCheck, Clapperboard, Film } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const { login, loading, error } = useAuth();
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!host || !username || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await login({ host, username, password }, { remember });
      toast.success("Signed in");
      navigate("/app/live");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      {/* Background cinematic gradient + grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 600px at 15% 10%, oklch(0.78 0.14 55 / 0.18), transparent 60%), radial-gradient(900px 500px at 90% 90%, oklch(0.62 0.22 25 / 0.12), transparent 55%)",
        }}
      />
      <div className="absolute inset-0 noise pointer-events-none" />

      <div className="relative grid lg:grid-cols-[1.1fr_0.9fr] min-h-screen">
        {/* Left editorial hero */}
        <section className="hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r hairline">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 grid place-items-center rounded-md bg-primary/15 text-primary border hairline">
              <Tv className="w-5 h-5" />
            </div>
            <div className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
              IPTV / Cinema Console
            </div>
          </div>

          <div className="max-w-xl">
            <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-primary mb-4">
              Private screening room
            </div>
            <h1 className="font-display text-5xl xl:text-6xl leading-[1.02] tracking-tight">
              Your channels,
              <br />
              <span className="italic text-primary">beautifully</span>{" "}
              streamed.
            </h1>
            <p className="mt-5 text-muted-foreground max-w-md leading-relaxed">
              Bring any Xtream Codes subscription into a calm, focused
              browser-based player. Live TV, movies and series — curated like
              a private lounge.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
              <Feature icon={<Tv className="w-4 h-4" />} label="Live TV" />
              <Feature
                icon={<Film className="w-4 h-4" />}
                label="Movies"
              />
              <Feature
                icon={<Clapperboard className="w-4 h-4" />}
                label="Series"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Credentials stay in your browser. Never sent anywhere else.
          </div>
        </section>

        {/* Right form */}
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-9 h-9 grid place-items-center rounded-md bg-primary/15 text-primary border hairline">
                <Tv className="w-5 h-5" />
              </div>
              <div className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
                IPTV / Cinema Console
              </div>
            </div>

            <div className="mb-8">
              <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-primary/80 mb-2">
                01 · Sign in
              </div>
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight">
                Connect your Xtream server
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Enter the portal URL and credentials provided by your IPTV
                supplier.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="host" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Server URL
                </Label>
                <Input
                  id="host"
                  placeholder="http://example.com:8080"
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  autoComplete="url"
                  className="h-11 bg-card/60 backdrop-blur border-border/80 font-mono text-sm"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="your_username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  className="h-11 bg-card/60 backdrop-blur border-border/80"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-11 bg-card/60 backdrop-blur border-border/80 pr-16"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={v => setRemember(Boolean(v))}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground font-normal"
                >
                  Remember me on this device
                </Label>
              </div>

              {error ? (
                <div className="text-sm text-destructive-foreground bg-destructive/15 border border-destructive/30 rounded-md px-3 py-2">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-medium tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  "Enter the lounge"
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground/80 font-mono text-center pt-2">
                By signing in you agree to stream only content you are
                authorized to access.
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card/50 border hairline backdrop-blur">
      <span className="text-primary">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
