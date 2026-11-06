import { Faq } from "#/components/common/faq";
import { Principles } from "#/components/common/principles";
import { ToolListing } from "#/components/common/tool-listing";
import { ToolOrbitalSphere } from "#/components/common/tool-orbital-sphere";
import { Button } from "#/components/ui/button";
import { TOOL_CATEGORIES, type ToolCategory, toolsList } from "#/data/tools-list";
import { cn } from "#/lib/utils";
import { ArrowRightIcon, CpuIcon, LockKeyIcon, MagnifyingGlassIcon, ShieldCheckIcon, TerminalIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { matchSorter } from "match-sorter";
import * as React from "react";

export const Route = createFileRoute("/")({ component: Home });

const FEATURED_TOOL_IDS = [
  // Converters & Formatters
  "json-formatter",
  "data-explorer",
  "pdf-tools",
  "json-csv",
  // Text & Regex
  "diff-checker",
  "regex-tester",
  "string-case-converter",
  // Encoding & Web
  "jwt-encoder-decoder",
  "qr-code-generator",
  "url-parser",
  // Geospatial & Maps
  "geojson-viewer",
  "map-wallpaper",
  "bounding-box-picker",
  // Audio & Privacy
  "audio-cleaner-transcriber",
  "note-redactor",
] as const;

const QUICK_FILTERS = [
  { label: "JSON & JSONL", query: "json" },
  { label: "JWT Signer", query: "jwt" },
  { label: "Regex Tester", query: "regex" },
  { label: "PDF Organizer", query: "pdf" },
  { label: "Color Science", query: "color" },
  { label: "GeoJSON Map", query: "geojson" },
  { label: "Diff Checker", query: "diff" },
  { label: "Audio Cleaner", query: "audio" },
] as const;

function Home() {
  const availableTools = React.useMemo(() => toolsList.filter((tool) => !tool.comingSoon), []);
  const featuredTools = React.useMemo(
    () => FEATURED_TOOL_IDS.map((id) => availableTools.find((tool) => tool.params.toolID === id)).filter((tool) => tool !== undefined),
    [availableTools],
  );
  const featuredByCategory = React.useMemo(() => {
    const map = new Map<ToolCategory, typeof featuredTools>();
    for (const category of TOOL_CATEGORIES) {
      map.set(category, featuredTools.filter((tool) => tool.category === category).slice(0, 3));
    }
    return map;
  }, [featuredTools]);

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const focusSearch = () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="home-page">
      {/* Hero with Telemetry and ToolOrbitalSphere */}
      <section className="relative overflow-hidden border-b border-border/80 bg-background">
        {/* Subtle grid background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Column: Hero Text, Status Badges, and Quick CTAs */}
            <div>
              {/* Technical Eyebrow Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 font-mono text-xs font-medium text-primary">
                <span className="size-2 animate-pulse rounded-full bg-primary" />
                <span>Zero network exfiltration: 100% in-browser runtime</span>
              </div>

              {/* Headline with DM Sans */}
              <h1 className="font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Every developer tool you reach for.
                <span className="mt-1.5 block text-primary">Strictly inside your browser.</span>
              </h1>

              {/* Subheading with Geist */}
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {availableTools.length} desktop-grade utilities for JSON formatting, JWT verification, AST compilation, GIS mapping, and PDF
                manipulation. Your payloads never touch an external server: zero cloud uploads, zero rate limits, and zero data leakage.
              </p>

              {/* Action Buttons & Shortcut Indicator */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/tools">
                  <Button size="lg" className="h-11 gap-2 px-5 text-sm font-semibold">
                    Browse All {availableTools.length} Tools <ArrowRightIcon className="size-4" />
                  </Button>
                </Link>

                <Button variant="outline" size="lg" className="h-11 gap-2 px-4 font-mono text-xs" onClick={focusSearch}>
                  <TerminalIcon className="size-4 text-primary" />
                  Quick Search
                  <kbd className="ml-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
                </Button>
              </div>
            </div>
            <div className="tech-crosshair-wrap relative rounded-2xl border border-border/90 bg-card/60 p-4 shadow-lg backdrop-blur-xs sm:p-6">
              <span className="tech-crosshair-tl">+</span>
              <span className="tech-crosshair-tr">+</span>
              <span className="tech-crosshair-bl">+</span>
              <span className="tech-crosshair-br">+</span>
              <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3 font-mono text-2xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="font-medium text-foreground">DEVHAVEN Tools</span>
                </div>
                <span className="font-mono text-primary">// CLICK NODE TO LAUNCH</span>
              </div>
              <ToolOrbitalSphere tools={availableTools} className="max-w-105" />
              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 font-mono text-2xs text-muted-foreground">
                <span>ORBITS: 3 CONCENTRIC TIERS</span>
                <span className="text-foreground">STATUS: RUNTIME_SYNCHRONIZED</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-border/80 bg-card/20 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs font-semibold tracking-wider text-primary uppercase">Command Palette</p>
              <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Find any utility instantly</h2>
              <p className="mt-1 text-xs text-muted-foreground">Search by format, algorithm, or task. Press ⌘K or / anywhere to activate.</p>
            </div>
            <Link
              to="/tools"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              BROWSE_ALL_TOOLS ({availableTools.length}) <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>

          <HomeToolSearch tools={availableTools} inputRef={searchInputRef} />
        </div>
      </section>

      <section className="border-b border-border/80 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-semibold tracking-wider text-primary uppercase">The Zero-Exfiltration Guarantee</p>
            <h2 className="mt-1.5 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Air-gapped by architecture.</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Most online developer utilities secretly transmit your payloads to remote backend microservices and logging aggregators. DevHaven is
              built on a strict zero-exfiltration contract: every byte stays inside your browser sandbox.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <div className="tech-crosshair-wrap flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
              <span className="tech-crosshair-tl">+</span>
              <span className="tech-crosshair-tr">+</span>
              <span className="tech-crosshair-bl">+</span>
              <span className="tech-crosshair-br">+</span>
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-2xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    LOCAL_V8_HEAP_ISOLATED
                  </span>
                  <LockKeyIcon className="size-6 text-primary" weight="duotone" />
                </div>

                <h3 className="mt-5 font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Confidential payloads never touch a network socket
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  When you inspect production error JSON, decrypt sensitive legal PDFs, or verify internal JWT signing keys, your data is parsed
                  directly in browser memory. Not a single HTTP POST, WebSocket frame, or diagnostic telemetry ping is ever emitted.
                </p>
                <div className="mt-6 space-y-2.5 border-t border-border/70 pt-5 font-mono text-xs text-foreground">
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-emerald-500">✓</span>
                    <span className="text-xs text-muted-foreground">
                      <strong className="font-medium text-foreground">Zero backend proxy:</strong> No middleware servers, caching layers, or cloud
                      storage.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-emerald-500">✓</span>
                    <span className="text-xs text-muted-foreground">
                      <strong className="font-medium text-foreground">Ephemeral browser memory:</strong> State clears instantly on tab close or manual
                      reset.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-emerald-500">✓</span>
                    <span className="text-xs text-muted-foreground">
                      <strong className="font-medium text-foreground">Auditable in DevTools:</strong> Disconnect your internet connection or watch the
                      Network tab.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4 font-mono text-2xs text-muted-foreground">
                <span>SECURITY BOUNDARY: CLIENT_ONLY</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">AIR_GAPPED_READY</span>
              </div>
            </div>

            {/* Right Column: 3 High-Signal Pillar Cards */}
            <div className="flex flex-col gap-4">
              <div className="tech-crosshair-wrap rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                <span className="tech-crosshair-tl">+</span>
                <span className="tech-crosshair-tr">+</span>
                <div className="flex items-start gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CpuIcon className="size-4.5" weight="duotone" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-foreground">Hardware-Accelerated WebCrypto</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      W3C Web Cryptography API for native HMAC-SHA256, RSA-PSS, and ECDSA key verification without remote secrets exposure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="tech-crosshair-wrap rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                <span className="tech-crosshair-tl">+</span>
                <span className="tech-crosshair-tr">+</span>
                <div className="flex items-start gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheckIcon className="size-4.5" weight="duotone" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-foreground">Native AST & Math Runtimes</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Shiki TextMate syntax tokenization via WebAssembly, Babel AST compilation, and 10-space OKLCH/LAB color science.
                    </p>
                  </div>
                </div>
              </div>

              <div className="tech-crosshair-wrap rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                <span className="tech-crosshair-tl">+</span>
                <span className="tech-crosshair-tr">+</span>
                <div className="flex items-start gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TerminalIcon className="size-4.5" weight="duotone" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-foreground">Zero Cold Boots, No Cloud Caps</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Instant sub-millisecond execution. No rate limits, no 25MB file upload caps, and no cloud queue delays.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tool Shelf by Category */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs font-semibold tracking-wider text-primary uppercase">Tool Matrix Directory</p>
            <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Pick up where your work is</h2>
            <p className="mt-2 text-sm text-muted-foreground">Curated utilities across all 5 engineering categories.</p>
          </div>
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-foreground transition-colors hover:text-primary"
          >
            VIEW_FULL_DIRECTORY ({availableTools.length} UTILITIES) <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="divide-y divide-border/80">
          {TOOL_CATEGORIES.map((category, categoryIndex) => {
            const tools = featuredByCategory.get(category) ?? [];
            if (tools.length === 0) return null;

            return (
              <section key={category} className="grid gap-6 py-8 md:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)] md:gap-12">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-sm font-semibold text-primary tabular-nums">{String(categoryIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">{category}</h3>
                    <p className="mt-1 font-mono text-2xs text-muted-foreground uppercase">// ISOLATED CLIENT MODULES</p>
                  </div>
                </div>
                <ToolListing tools={tools} />
              </section>
            );
          })}
        </div>
      </section>

      <Principles />
      <Faq />
    </div>
  );
}

function HomeToolSearch({
  tools,
  inputRef: externalInputRef,
}: {
  tools: (typeof toolsList)[number][];
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = React.useState("");
  const localInputRef = React.useRef<HTMLInputElement | null>(null);
  const inputRef = externalInputRef ?? localInputRef;

  const matches = query.trim()
    ? matchSorter(tools, query.trim(), {
        keys: ["id", "name", "title", "description", "params.toolID", "category"],
      }).slice(0, 8)
    : [];

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (!isEditable && (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"))) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputRef]);

  return (
    <div className="home-search-wrap max-w-4xl">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="home-tool-search"
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
            if (event.key === "Enter" && matches[0]) window.location.assign(`/tools/${matches[0].params.toolID}`);
          }}
          placeholder="Filter utilities (e.g. JSON, JWT, Regex, Base64, OKLCH, GeoJSON)..."
          aria-label="Search developer tools"
          aria-controls="home-tool-search-results"
          aria-expanded={matches.length > 0}
          role="combobox"
          aria-autocomplete="list"
          className="h-14 w-full rounded-xl border border-border/90 bg-card pr-28 pl-12 text-base text-foreground shadow-xs transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        <div className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-1.5 font-mono text-2xs text-muted-foreground">
          <kbd className="rounded border border-border bg-muted/80 px-1.5 py-0.5">⌘K</kbd>
          <span>/</span>
          <kbd className="rounded border border-border bg-muted/80 px-1.5 py-0.5">/</kbd>
        </div>

        {query.trim() && (
          <div
            id="home-tool-search-results"
            role="listbox"
            className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-4 py-2 font-mono text-2xs text-muted-foreground">
              <span>MATCHED UTILITIES: {matches.length}</span>
              <span>ENTER TO LAUNCH · ESC TO CLOSE</span>
            </div>
            {matches.length > 0 ? (
              <div className="max-h-96 divide-y divide-border/60 overflow-y-auto">
                {matches.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.params.toolID}
                      to={tool.to}
                      params={tool.params}
                      role="option"
                      aria-selected="false"
                      className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/70 focus-visible:bg-accent"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4.5" weight="duotone" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-heading text-sm font-semibold text-foreground">{tool.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{tool.description}</span>
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-2xs tracking-wider text-muted-foreground uppercase">
                        {tool.category}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="px-5 py-4 font-mono text-xs text-muted-foreground">// NO_MATCHES_FOUND: TRY SEARCHING FOR ANOTHER FORMAT OR UTILITY</p>
            )}
          </div>
        )}
      </div>

      {/* Quick Filter Pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-2xs font-medium tracking-wider text-muted-foreground uppercase">Quick filters:</span>
        {QUICK_FILTERS.map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={() => {
              setQuery(pill.query);
              inputRef.current?.focus();
            }}
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-2xs transition-colors",
              query.toLowerCase() === pill.query.toLowerCase()
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {pill.label}
          </button>
        ))}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="ml-1 font-mono text-2xs text-muted-foreground underline hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between font-mono text-2xs text-muted-foreground">
        <span>100% client-side evaluation: no search queries collected</span>
        <span>Press Escape to dismiss · Enter to launch</span>
      </div>
    </div>
  );
}
