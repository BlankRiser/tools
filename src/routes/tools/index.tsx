import { Button } from "#/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "#/components/ui/input-group";
import { TOOL_CATEGORIES, type ToolCategory, type ToolItem, toolsList } from "#/data/tools-list";
import { cn } from "#/lib/utils";
import { ArrowUpRightIcon, MagnifyingGlassIcon, ShieldCheckIcon, XIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { matchSorter } from "match-sorter";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/tools/")({
  component: ToolsRoute,
});

function ToolsRoute() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isEditable = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (e.key === "/" && !isEditable) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const availableTools = useMemo(() => toolsList.filter((tool) => !tool.comingSoon), []);

  const filteredTools = useMemo(() => {
    const byCategory =
      activeCategory === "all"
        ? availableTools
        : availableTools.filter((tool) => tool.category === activeCategory);

    const query = searchQuery.trim();
    if (!query) return byCategory;
    return matchSorter(byCategory, query, {
      keys: ["id", "name", "title", "description", "params.toolID", "category"],
    });
  }, [availableTools, activeCategory, searchQuery]);

  const groupedTools = useMemo(() => {
    const query = searchQuery.trim();
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
      activeCategory !== "all"
        ? [activeCategory]
        : query
          ? Array.from(groupsMap.keys())
          : TOOL_CATEGORIES;

    return categoriesOrder
      .map((category) => ({
        category,
        tools: groupsMap.get(category) ?? [],
      }))
      .filter((group) => group.tools.length > 0);
  }, [filteredTools, activeCategory, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-xs text-primary">
            <ShieldCheckIcon className="size-3.5" weight="fill" />
            <span>100% Client-Side Execution • Zero Backend</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Tool Directory</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            All {availableTools.length} browser-native utilities, formatters, converters, and visualizers. Built by{" "}
            <a
              href="https://ram.codes"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary"
            >
              Ram (ram.codes)
            </a>
            .
          </p>
        </div>

        <div className="w-full sm:w-80">
          <InputGroup className="h-9 bg-card">
            <InputGroupAddon align="inline-start">
              <MagnifyingGlassIcon className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
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
              placeholder="Search tools..."
              aria-label="Search tools by ID, name, title, or description"
            />
            <InputGroupAddon align="inline-end">
              {searchQuery ? (
                <InputGroupButton
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <XIcon className="size-3.5" />
                </InputGroupButton>
              ) : (
                <InputGroupButton
                  size="xs"
                  variant="ghost"
                  onClick={() => searchInputRef.current?.focus()}
                  className="px-1.5 font-mono text-2xs text-muted-foreground hover:text-foreground"
                  aria-label="Focus search input"
                >
                  <kbd className="pointer-events-none">⌘K</kbd>
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-8 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors",
            activeCategory === "all"
              ? "bg-foreground text-background"
              : "border border-border/80 bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          All Categories ({availableTools.length})
        </button>
        {TOOL_CATEGORIES.map((cat) => {
          const count = availableTools.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory((prev) => (prev === cat ? "all" : cat))}
              className={cn(
                "rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "bg-foreground text-background"
                  : "border border-border/80 bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {groupedTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/30 px-6 py-16 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <MagnifyingGlassIcon className="size-5" />
          </div>
          <h2 className="text-sm font-semibold">No matching tools found</h2>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            No tools matched <span className="font-mono text-foreground">"{searchQuery}"</span>. Try searching for a different keyword or category.
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
            <section key={category} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <h2 className="text-base font-semibold tracking-tight text-foreground">{category}</h2>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-2xs font-medium text-muted-foreground">
                  {tools.length} {tools.length === 1 ? "tool" : "tools"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/80 bg-border/80 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool, idx) => {
                  const Icon = tool.icon;
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/80 bg-background text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
                              <Icon className="size-4" weight="duotone" />
                            </div>
                            <span className="font-mono text-[11px] text-muted-foreground/70">
                              {indexLabel}
                            </span>
                          </div>
                          <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground opacity-50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground group-hover:opacity-100" />
                        </div>
                        <h3 className="mt-3.5 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                          {tool.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
