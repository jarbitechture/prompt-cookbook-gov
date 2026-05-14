/**
 * CookbookApp — entry for the cookbook bundle
 * (VITE_ENTRY=cookbook, VITE_BASE=/cookbook/)
 *
 * Routes are relative to the /cookbook/ base; wouter's Router base prepends
 * it automatically.  Cross-bundle links (to / and /builder/) must use plain
 * <a> or window.location.href — never wouter Link/navigate — so the browser
 * does a full document load and IIS routes to the correct Application.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Resources from "./pages/Resources";
import NotFound from "./pages/NotFound";

function CookbookRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game" component={Game} />
      <Route path="/resources" component={Resources} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function CookbookApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "oklch(0.22 0.02 40)",
                color: "oklch(0.90 0.03 75)",
                border: "1px solid oklch(0.35 0.03 40)",
              },
            }}
          />
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <CookbookRoutes />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
