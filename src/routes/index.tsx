import { Faq } from "#/components/common/faq";
import { Principles } from "#/components/common/principles";
import { TOOL_CAPABILITY_TAGS } from "#/components/common/tool-directory";
import { ToolOrbitalSphere } from "#/components/common/tool-orbital-sphere";
import { Button } from "#/components/ui/button";
import { TOOL_CATEGORIES, type ToolCategory, type ToolItem, toolsList } from "#/data/tools-list";
import { cn } from "#/lib/utils";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  GithubLogoIcon,
  GlobeSimpleIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  XIcon
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { matchSorter } from "match-sorter";
import * as React from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<ToolCategory | "all">("all");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "/" && !isEditable) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const availableTools = React.useMemo(
    () => toolsList.filter((tool) => !tool.comingSoon),
    [],
  );

  const filteredTools = React.useMemo(() => {
    const byCategory =
      activeCategory === "all"
        ? availableTools
        : availableTools.filter((t) => t.category === activeCategory);

    const query = searchQuery.trim();
    if (!query) return byCategory;

    return matchSorter(byCategory, query, {
      keys: ["id", "name", "title", "description", "params.toolID", "category"],
    });
  }, [availableTools, activeCategory, searchQuery]);

  const groupedTools = React.useMemo(() => {
    const groupsMap = new Map<ToolCategory, ToolItem[]>();
    for (const tool of filteredTools) {
      const existing = groupsMap.get(tool.category);
      if (existing) {
        existing.push(tool);
      } else {
        groupsMap.set(tool.category, [tool]);
      }
    }

    const categoriesOrder =
      activeCategory === "all" ? TOOL_CATEGORIES : [activeCategory];

    return categoriesOrder
      .map((category) => ({
        category,
        tools: groupsMap.get(category) ?? [],
      }))
      .filter((group) => group.tools.length > 0);
  }, [filteredTools, activeCategory]);

  return (
    <div className="flex flex-col">
      {/* =====================================================================
          HERO SECTION: Left Pitch & Actions + Right Revolving Tool Solar System
      ===================================================================== */}
      <section className="overflow-hidden border-b border-border/80 bg-background">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-12 sm:px-6 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Column (7 cols): Headline, Copy, Action Buttons, and Search */}
            <div className="flex flex-col items-start lg:col-span-7">
              {/* Top Status & Creator Pill Strip */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-medium text-primary">
                  <LockKeyIcon className="size-3.5" weight="fill" />
                  100% Client-Side • Zero Backend
                </span>

                <a
                  href="https://ram.codes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <span>Developed by Ram</span>
                  <span className="font-medium text-foreground">(ram.codes)</span>
                  <ArrowUpRightIcon className="size-3" />
                </a>

                <a
                  href="https://github.com/BlankRiser"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <GithubLogoIcon className="size-3.5" />
                  <span>@BlankRiser</span>
                </a>
              </div>

              {/* Headline */}
              <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
                Local-first developer utilities built for speed, craft, and privacy.
              </h1>

              {/* Description */}
              <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
                A minimal workbench of{" "}
                <span className="font-medium text-foreground">
                  {availableTools.length} browser-native tools
                </span>
                . Format and repair JSON or JSONL, query nested datasets, synthesize procedural CSS
                and Tailwind gradients, convert HTML and SVG to typed TSX, and process encrypted
                PDFs. Everything runs inside your browser tab; none of your data is ever sent to a
                backend.
              </p>

              {/* Action Buttons Grouped Cleanly Under the Pitch */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <a href="#tool-directory">
                  <Button size="lg" className="h-10 gap-2 text-xs font-semibold">
                    Explore {availableTools.length} Tools
                    <ArrowRightIcon className="size-3.5" />
                  </Button>
                </a>
                <a
                  href="https://github.com/BlankRiser/tools"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" className="h-10 gap-2 text-xs">
                    <GithubLogoIcon className="size-4" />
                    Source on GitHub
                  </Button>
                </a>
                <a
                  href="https://ram.codes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="lg" className="h-10 gap-1.5 text-xs">
                    <GlobeSimpleIcon className="size-4 text-primary" />
                    ram.codes
                    <ArrowUpRightIcon className="size-3 opacity-60" />
                  </Button>
                </a>
              </div>

              {/* Instant Search & Category Filter Bar */}
              <div className="mt-9 w-full max-w-xl space-y-3">
                <div className="relative flex items-center">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && searchQuery) {
                        e.preventDefault();
                        setSearchQuery("");
                      }
                    }}
                    placeholder={`Filter ${availableTools.length} tools (e.g. "json", "gradient", "jsx", "pdf", "geojson")...`}
                    aria-label="Search all developer tools"
                    className="h-10 w-full rounded-lg border border-border bg-card pr-16 pl-10 text-xs text-foreground shadow-2xs transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="absolute right-2.5 flex items-center gap-1">
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          searchInputRef.current?.focus();
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Clear search query"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    ) : (
                      <kbd className="pointer-events-none rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        ⌘K
                      </kbd>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                      activeCategory === "all"
                        ? "bg-foreground text-background"
                        : "border border-border/70 bg-card/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    All ({availableTools.length})
                  </button>
                  {TOOL_CATEGORIES.map((cat) => {
                    const count = availableTools.filter((t) => t.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setActiveCategory((prev) => (prev === cat ? "all" : cat))
                        }
                        className={cn(
                          "rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                          activeCategory === cat
                            ? "bg-foreground text-background"
                            : "border border-border/70 bg-card/70 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Revolving Solar-System Sphere of All Tools */}
            <div className="hidden lg:block lg:col-span-5">
              <ToolOrbitalSphere tools={availableTools} />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          COMPLETE CATEGORIZED TOOL DIRECTORY (SEO & Instant Navigation)
      ===================================================================== */}
      <section id="tool-directory" className="border-b border-border/80 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {groupedTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
              <MagnifyingGlassIcon className="mb-3 size-8 text-muted-foreground" />
              <h2 className="text-base font-semibold">No matching tools found</h2>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                No tools matched{" "}
                <span className="font-mono font-medium text-foreground">"{searchQuery}"</span>.
                Try searching for JSON, JSX, Gradient, PDF, GeoJSON, Regex, or Cron.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  searchInputRef.current?.focus();
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedTools.map(({ category, tools }) => (
                <div key={category} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-semibold tracking-tight text-foreground">
                        {category}
                      </h2>
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                        {tools.length} {tools.length === 1 ? "tool" : "tools"}
                      </span>
                    </div>
                  </div>

                  {/* Architectural 1px Hairline Grid */}
                  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/80 bg-border/80 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool, idx) => {
                      const Icon = tool.icon;
                      const tags = TOOL_CAPABILITY_TAGS[tool.params.toolID] ?? [];
                      const indexLabel = String(idx + 1).padStart(2, "0");

                      return (
                        <Link
                          key={tool.params.toolID}
                          to={tool.to}
                          params={tool.params}
                          className="group flex flex-col justify-between bg-card p-5 transition-colors outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-md border border-border/80 bg-background text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
                                  <Icon className="size-4" weight="duotone" />
                                </div>
                                <span className="font-mono text-[11px] text-muted-foreground/70">
                                  {indexLabel}
                                </span>
                              </div>
                              <ArrowUpRightIcon className="size-4 text-muted-foreground opacity-50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground group-hover:opacity-100" />
                            </div>

                            <h3 className="mt-3.5 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                              {tool.title}
                            </h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                              {tool.description}
                            </p>
                          </div>

                          {tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded border border-border/70 bg-background/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Principles />

      <Faq />
    </div>
  );
}

