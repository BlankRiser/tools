import { Footer } from "#/components/common/footer";
import { Navbar } from "#/components/common/navbar";
import { ToolOrbitalSphere } from "#/components/common/tool-orbital-sphere";
import { toolsList } from "#/data/tools-list";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";

import type { QueryClient } from "@tanstack/react-query";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-5xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
        <div className="max-w-lg">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            404 • Route Not Found
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Lost in orbit
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            The page you requested does not exist. Click any orbiting utility below to jump
            straight into a tool, or return to the main directory.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Return Home
            </Link>
            <Link
              to="/tools"
              className="inline-flex h-9 items-center rounded-md border border-border/80 bg-card px-4 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              Browse All Tools
            </Link>
          </div>
        </div>
        <ToolOrbitalSphere className="max-w-105" />
      </div>
    );
  },
});

const DEFAULT_TITLE =
  "DevHaven Tools | Local-First Developer Utilities & Visualizers by Ram";
const DEFAULT_DESCRIPTION =
  "24+ fast, privacy-first developer utilities that run 100% locally in your browser. Format JSON & JSONL, query nested CSV/JSON/XML, generate CSS & Tailwind gradients, convert HTML to JSX/TSX, organize PDFs, decode JWTs, and inspect GeoJSON with zero backend uploads.";

function RouteSeoSynchronizer() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  React.useEffect(() => {
    let nextTitle = DEFAULT_TITLE;
    let nextDesc = DEFAULT_DESCRIPTION;

    if (pathname === "/tools" || pathname === "/tools/") {
      nextTitle = "All Developer Tools Directory | DevHaven Tools by Ram";
      nextDesc =
        "Explore all 24+ client-side developer tools across Converters & Formatters, Text & Regex, Encoding & Web, and Geospatial & Maps. 100% local in-browser execution.";
    } else if (pathname.startsWith("/tools/")) {
      const slug = pathname.replace(/^\/tools\//, "").replace(/\/$/, "");
      const matchedTool = toolsList.find((t) => t.params.toolID === slug);
      if (matchedTool) {
        nextTitle = `${matchedTool.title} | Client-Side Developer Tool | DevHaven Tools`;
        nextDesc = `${matchedTool.description} Runs 100% locally in your browser with zero server uploads. Built by Ram (ram.codes).`;
      }
    }

    document.title = nextTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", nextDesc);
    }
  }, [pathname]);

  return null;
}

function RootComponent() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <RouteSeoSynchronizer />
      <Navbar />
      <main className="flex-1 antialiased">
        <Outlet />
      </main>
      <Footer />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
