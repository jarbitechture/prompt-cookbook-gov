import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// At build time Vite replaces import.meta.env.VITE_ENTRY with a string
// literal, letting Rollup tree-shake the unused bundles.
// In dev (undefined) the unified App is rendered unchanged.
const entry = import.meta.env.VITE_ENTRY as string | undefined;

async function mount() {
  let Root: React.ComponentType;

  if (entry === "portal") {
    const { default: PortalApp } = await import("./PortalApp");
    Root = PortalApp;
  } else if (entry === "cookbook") {
    const { default: CookbookApp } = await import("./CookbookApp");
    Root = CookbookApp;
  } else if (entry === "builder") {
    const { default: BuilderApp } = await import("./BuilderApp");
    Root = BuilderApp;
  } else {
    // Dev fallback — unified single-app for `pnpm dev`
    const { default: App } = await import("./App");
    Root = App;
  }

  createRoot(document.getElementById("root")!).render(
    React.createElement(Root)
  );
}

mount();
