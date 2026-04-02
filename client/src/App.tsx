import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatbotWidget from "./components/ChatbotWidget";
import { getDepartment } from "./lib/departments";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Builder from "./pages/Builder";
import Resources from "./pages/Resources";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/game"} component={Game} />
      <Route path={"/builder"} component={Builder} />
      <Route path={"/resources"} component={Resources} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [deptContext, setDeptContext] = useState<string | undefined>(() => {
    try {
      const id = localStorage.getItem("cookbook-department");
      if (id) return getDepartment(id)?.personalization.chatbotContext;
    } catch {}
    return undefined;
  });

  // Listen for department changes from any component that writes to localStorage
  const syncDeptContext = useCallback(() => {
    try {
      const id = localStorage.getItem("cookbook-department");
      const ctx = id ? getDepartment(id)?.personalization.chatbotContext : undefined;
      setDeptContext(ctx);
    } catch {}
  }, []);

  useEffect(() => {
    window.addEventListener("storage", syncDeptContext);
    // Also listen for custom event dispatched by same-tab localStorage writes
    window.addEventListener("cookbook-department-changed", syncDeptContext);
    return () => {
      window.removeEventListener("storage", syncDeptContext);
      window.removeEventListener("cookbook-department-changed", syncDeptContext);
    };
  }, [syncDeptContext]);

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
          <Router />
          <ChatbotWidget departmentContext={deptContext} />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
