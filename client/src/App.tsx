/*
  Design System: "Cinema Noir Console"
  File purpose: Top-level routing, theme, and auth providers.
  The app is always dark; no theme switcher.
*/

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import LiveTV from "./pages/LiveTV";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Settings from "./pages/Settings";
import SearchPage from "./pages/Search";

function Protected({ children }: { children: React.ReactNode }) {
  const { credentials } = useAuth();
  const [location] = useLocation();
  if (!credentials) {
    return <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />

      <Route path="/app/live">
        <Protected>
          <AppLayout>
            <LiveTV />
          </AppLayout>
        </Protected>
      </Route>
      <Route path="/app/movies">
        <Protected>
          <AppLayout>
            <Movies />
          </AppLayout>
        </Protected>
      </Route>
      <Route path="/app/series">
        <Protected>
          <AppLayout>
            <Series />
          </AppLayout>
        </Protected>
      </Route>
      <Route path="/app/search">
        <Protected>
          <AppLayout>
            <SearchPage />
          </AppLayout>
        </Protected>
      </Route>
      <Route path="/app/settings">
        <Protected>
          <AppLayout>
            <Settings />
          </AppLayout>
        </Protected>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster richColors theme="dark" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
