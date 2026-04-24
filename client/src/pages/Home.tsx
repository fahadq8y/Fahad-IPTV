/*
  Design System: "Cinema Noir Console"
  File purpose: Root redirect — pushes users to /app/live if signed in,
  else to /login. Also consumes any #c=... share hash.
*/

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { credentials } = useAuth();

  useEffect(() => {
    if (credentials) navigate("/app/live", { replace: true });
    else navigate("/login", { replace: true });
  }, [credentials, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="font-mono text-xs tracking-[0.2em] uppercase">
          Loading console…
        </span>
      </div>
    </div>
  );
}
