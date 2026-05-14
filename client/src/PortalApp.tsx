/**
 * PortalApp — entry for the portal bundle (VITE_ENTRY=portal, VITE_BASE=/)
 *
 * Serves only the Portal route.  Cross-bundle links to /cookbook/ and
 * /builder/ are plain <a> tags so the browser does a full document load and
 * IIS routes them to the correct Application.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Portal from "./pages/Portal";
import NotFound from "./pages/NotFound";

function PortalRoutes() {
  return (
    <Switch>
      <Route path="/" component={Portal} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function PortalApp() {
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
            <PortalRoutes />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
