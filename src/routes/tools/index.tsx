import { ToolListing } from "#/components/common/tool-listing";
import { Button } from "#/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "#/components/ui/input-group";
import { TOOL_CATEGORIES, type ToolCategory, type ToolItem, toolsList } from "#/data/tools-list";
import { cn } from "#/lib/utils";
import { MagnifyingGlassIcon, ShieldCheckIcon, XIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
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
    const byCategory = activeCategory === "all" ? availableTools : availableTools.filter((tool) => tool.category === activeCategory);

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

    const categoriesOrder = activeCategory !== "all" ? [activeCategory] : query ? Array.from(groupsMap.keys()) : TOOL_CATEGORIES;

    return categoriesOrder
      .map((category) => ({
        category,
        tools: groupsMap.get(category) ?? [],
      }))
      .filter((group) => group.tools.length > 0);
  }, [filteredTools, activeCategory, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* rig.ai Technical Directory Header */}
      <div className="directory-intro mb-8 flex flex-col gap-6 border-b border-border/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-medium text-primary">
            <ShieldCheckIcon className="size-3.5" weight="fill" />
            <span>// DIRECTORY MATRIX // 100% IN-BROWSER ISOLATION</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Developer Tool Directory</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {availableTools.length} offline-ready browser utilities. AST parsers, cryptographic hashing, color science, and document converters
            executing with zero network latency.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <InputGroup className="h-11 border-border/90 bg-card">
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
              placeholder="Search tools (⌘K)..."
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

      {/* rig.ai Category Filter Chips */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={cn(
            "min-h-9 rounded-md border px-3.5 py-1.5 font-mono text-xs font-medium transition-colors",
            activeCategory === "all"
              ? "border-foreground bg-foreground font-semibold text-background"
              : "border-border/80 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          ALL [{availableTools.length}]
        </button>
        {TOOL_CATEGORIES.map((cat) => {
          const count = availableTools.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory((prev) => (prev === cat ? "all" : cat))}
              className={cn(
                "min-h-9 rounded-md border px-3.5 py-1.5 font-mono text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "border-foreground bg-foreground font-semibold text-background"
                  : "border-border/80 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {cat.toUpperCase()} [{count}]
            </button>
          );
        })}
      </div>

      {groupedTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <MagnifyingGlassIcon className="size-5" />
          </div>
          <h2 className="font-heading text-base font-semibold">No matching tools found</h2>
          <p className="mt-1 max-w-sm font-mono text-xs text-muted-foreground">
            No tools matched "{searchQuery}". Try searching for another format or keyword.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 font-mono text-xs"
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
              searchInputRef.current?.focus();
            }}
          >
            RESET_FILTERS
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedTools.map(({ category, tools }, idx) => (
            <section key={category} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-primary">// 0{idx + 1}</span>
                  <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">{category}</h2>
                </div>
                <span className="rounded border border-border/70 bg-card px-2 py-0.5 font-mono text-2xs font-medium text-muted-foreground uppercase">
                  {tools.length} {tools.length === 1 ? "TOOL" : "TOOLS"}
                </span>
              </div>

              <ToolListing tools={tools} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
