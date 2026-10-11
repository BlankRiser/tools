import { Button } from "#/components/ui/button";
import { type ToolID, toolsList } from "#/data/tools-list";
import { useTheme } from "#/hooks/use-theme";
import {
  ArrowUpRightIcon,
  GithubLogoIcon,
  MoonStarsIcon,
  ShieldCheckIcon,
  SunDimIcon,
} from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as React from "react";
import { DevHavenLogo } from "./devhaven-logo";

const DEFAULT_NAV_TOOL_IDS: ToolID[] = [
  "json-formatter",
  "data-explorer",
  "gradient-generator",
  "html-to-jsx",
];

// Concise labels for the navbar pills so any of the 24 tools fits cleanly
const SHORT_NAV_LABELS: Partial<Record<ToolID, string>> = {
  "json-formatter": "JSON",
  "data-explorer": "Data Explorer",
  "gradient-generator": "Gradients",
  "html-to-jsx": "HTML → JSX",
  "json-csv": "Data Converter",
  "pdf-tools": "PDF Tools",
  "color-generator": "Colors",
  "cron-expression-builder": "Cron Builder",
  "date-time-converter": "Date & Time",
  "diff-checker": "Diff Checker",
  "regex-tester": "Regex",
  "sort-text": "Sort Text",
  "markdown-to-rich-text": "MD → Rich Text",
  "markdown-stripper": "MD Stripper",
  "markdown-toc-generator": "MD TOC",
  "string-case-converter": "Case Converter",
  "text-inspector": "Text Inspector",
  "jwt-encoder-decoder": "JWT Codec",
  "url-parser": "URL Parser",
  "base64-image-codec": "Base64 Image",
  "qr-code-generator": "QR Generator",
  "map-wallpaper": "Map Wallpaper",
  "geojson-viewer": "GeoJSON Viewer",
  "bounding-box-picker": "BBox Picker",
  "distance-calculator": "Distance Calc",
};

interface RecentNavState {
  slots: ToolID[];
  cursor: number;
  filledCount: number;
}

const STORAGE_KEY = "devhaven:navbar-recent-tools:v1";

function loadInitialNavState(): RecentNavState {
  if (typeof window === "undefined") {
    return {
      slots: [...DEFAULT_NAV_TOOL_IDS],
      cursor: 0,
      filledCount: 0,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        slots: [...DEFAULT_NAV_TOOL_IDS],
        cursor: 0,
        filledCount: 0,
      };
    }
    const parsed = JSON.parse(raw) as Partial<RecentNavState>;
    const validIds = new Set(toolsList.filter((t) => !t.comingSoon).map((t) => t.params.toolID));
    if (
      Array.isArray(parsed.slots) &&
      parsed.slots.length === 4 &&
      parsed.slots.every((id) => validIds.has(id as ToolID)) &&
      typeof parsed.cursor === "number" &&
      typeof parsed.filledCount === "number"
    ) {
      return {
        slots: parsed.slots as ToolID[],
        cursor: parsed.cursor % 4,
        filledCount: Math.min(4, Math.max(0, parsed.filledCount)),
      };
    }
  } catch {
    // Ignore storage errors
  }

  return {
    slots: [...DEFAULT_NAV_TOOL_IDS],
    cursor: 0,
    filledCount: 0,
  };
}

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [navState, setNavState] = React.useState<RecentNavState>(loadInitialNavState);

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const activeToolsMap = React.useMemo(() => {
    const map = new Map<ToolID, (typeof toolsList)[number]>();
    for (const tool of toolsList) {
      if (!tool.comingSoon) {
        map.set(tool.params.toolID, tool);
      }
    }
    return map;
  }, []);

  // Track visited tool routes and replace navbar slots from left to right
  React.useEffect(() => {
    if (!pathname.startsWith("/tools/")) return;
    const slug = pathname.replace(/^\/tools\//, "").replace(/\/$/, "") as ToolID;
    if (!activeToolsMap.has(slug)) return;

    setNavState((prev) => {
      const existingIdx = prev.slots.indexOf(slug);

      // Already in the visited slots: keep positions stable
      if (existingIdx !== -1 && existingIdx < prev.filledCount) {
        return prev;
      }

      const nextSlots = [...prev.slots];

      if (existingIdx !== -1 && existingIdx >= prev.filledCount) {
        // Tool was in an unvisited default slot to the right: swap into current left-to-right cursor
        const displaced = nextSlots[prev.cursor];
        nextSlots[prev.cursor] = slug;
        nextSlots[existingIdx] = displaced;
      } else {
        // Replace slot at current left-to-right cursor
        nextSlots[prev.cursor] = slug;
      }

      const nextState: RecentNavState = {
        slots: nextSlots,
        cursor: (prev.cursor + 1) % 4,
        filledCount: Math.min(4, prev.filledCount + 1),
      };

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch {
        // Ignore storage write errors
      }

      return nextState;
    });
  }, [pathname, activeToolsMap]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <nav
        aria-label="Primary Navigation"
        className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        {/* Brand & Client-Side Privacy Indicator */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            viewTransition={{ types: ["slide-left"] }}
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
          >
            <DevHavenLogo className="size-7 text-foreground transition-colors hover:text-primary" />
            <span>DevHaven</span>
            <span className="font-mono text-xs font-normal text-muted-foreground">
              /tools
            </span>
          </Link>

          <span
            className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground md:inline-flex"
            title="All computation runs locally in your browser. Zero server uploads."
          >
            <ShieldCheckIcon className="size-3.5 text-primary" weight="fill" />
            100% Client-Side
          </span>
        </div>

        {/* Center / Right Navigation Links */}
        <div className="flex items-center gap-1">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{
              className: "bg-accent text-foreground",
            }}
            activeOptions={{
              exact: true,
            }}
            viewTransition={{ types: ["slide-right"] }}
          >
            <span>All Tools</span>
            <span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
              {activeToolsMap.size}
            </span>
          </Link>

          {/* Dynamic 4-Slot Tool Bar (Defaults replaced left-to-right as tools are visited) */}
          <div className="hidden items-center gap-0.5 lg:flex">
            {navState.slots.map((toolID) => {
              const tool = activeToolsMap.get(toolID);
              const label = SHORT_NAV_LABELS[toolID] ?? tool?.title ?? toolID;
              return (
                <Link
                  key={toolID}
                  to="/tools/$toolID"
                  params={{ toolID }}
                  title={tool?.title}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  activeProps={{
                    className: "bg-accent text-foreground",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="mx-1.5 h-4 w-px bg-border/80" />

          <a
            href="https://ram.codes"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 rounded-md px-2.5 py-1.5 font-mono text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
            title="Developed by Ram (ram.codes)"
          >
            <span>ram.codes</span>
            <ArrowUpRightIcon className="size-3 opacity-70" />
          </a>

          <a
            href="https://github.com/BlankRiser"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ram on GitHub (@BlankRiser)"
            title="GitHub (@BlankRiser)"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <GithubLogoIcon className="size-4" />
          </a>

          <Button
            size="icon-sm"
            variant="ghost"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "light" ? (
              <SunDimIcon weight="bold" />
            ) : (
              <MoonStarsIcon weight="bold" />
            )}
          </Button>
        </div>
      </nav>
    </header>
  );
}
