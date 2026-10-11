import { TOOL_CATEGORIES, toolsList } from "#/data/tools-list";
import {
  ArrowUpRightIcon,
  GithubLogoIcon,
  GlobeSimpleIcon,
  LockSimpleIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { DevHavenLogo } from "./devhaven-logo";

export function Footer() {
  const toolsByCategory = React.useMemo(() => {
    const active = toolsList.filter((t) => !t.comingSoon);
    return TOOL_CATEGORIES.map((category) => ({
      category,
      tools: active.filter((t) => t.category === category),
    }));
  }, []);

  return (
    <footer
      aria-label="Site Footer and Tool Directory"
      className="border-t border-border/80 bg-card/40 text-foreground"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        {/* Top Grid: Brand + Full Categorized Internal Link Directory for SEO */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Brand, Creator Attribution & Zero-Server Guarantee (4 cols) */}
          <div className="flex flex-col justify-between space-y-6 lg:col-span-4">
            <div className="space-y-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
              >
                <DevHavenLogo className="size-7" />
                <span>DevHaven Tools</span>
              </Link>

              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                A minimal, high-precision suite of browser-native utilities for software engineers,
                data analysts, and interface designers. Built for speed, keyboard ergonomics, and
                complete data sovereignty.
              </p>

              {/* Client-Side Privacy Box */}
              <div className="rounded-lg border border-border/80 bg-background/70 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ShieldCheckIcon className="size-4 shrink-0 text-primary" weight="fill" />
                  <span>100% Client-Side Execution</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  All parsing, formatting, PDF encryption, and rendering happens directly inside
                  your browser via Web Workers, Canvas, and WebCrypto. None of your data is ever
                  sent to a backend server.
                </p>
              </div>
            </div>

            {/* Creator Attribution Card */}
            <div className="space-y-2.5 pt-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Crafted & Maintained By
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://ram.codes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <GlobeSimpleIcon className="size-3.5 text-primary" />
                  <span>Ram (ram.codes)</span>
                  <ArrowUpRightIcon className="size-3 opacity-60" />
                </a>

                <a
                  href="https://github.com/BlankRiser"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <GithubLogoIcon className="size-3.5" />
                  <span>@BlankRiser</span>
                  <ArrowUpRightIcon className="size-3 opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Categorized Tool Links for Crawlability & Quick Navigation (8 cols) */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-8">
            {toolsByCategory.map((group) => (
              <div key={group.category} className="space-y-3">
                <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                  {group.category}
                </h2>
                <ul className="space-y-2">
                  {group.tools.map((tool) => (
                    <li key={tool.params.toolID}>
                      <Link
                        to={tool.to}
                        params={tool.params}
                        className="block text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {tool.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Developed by{" "}
              <a
                href="https://ram.codes"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
              >
                Ram
              </a>
            </span>
            <span className="text-border">•</span>
            <a
              href="https://github.com/BlankRiser"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] transition-colors hover:text-foreground"
            >
              github.com/BlankRiser
            </a>
            <span className="text-border">•</span>
            <a
              href="https://ram.codes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] transition-colors hover:text-foreground"
            >
              ram.codes
            </a>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <LockSimpleIcon className="size-3.5 text-primary" />
              Zero Telemetry • Zero Cookies • Offline-Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
