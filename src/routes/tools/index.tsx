import { Button } from "#/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "#/components/ui/input-group";
import { TOOL_CATEGORIES, type ToolCategory, type ToolItem, toolsList } from "#/data/tools-list";
import { ArrowUpRightIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { matchSorter } from "match-sorter";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/tools/")({
  component: ToolsRoute,
});

function ToolsRoute() {
  const [searchQuery, setSearchQuery] = useState("");
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

  const availableTools = useMemo(
    () => toolsList.filter((tool) => !tool.comingSoon),
    [],
  );

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return availableTools;
    return matchSorter(availableTools, query, {
      keys: ["id", "name", "title", "description", "params.toolID", "category"],
    });
  }, [availableTools, searchQuery]);

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

    const categoriesOrder = query
      ? Array.from(groupsMap.keys())
      : TOOL_CATEGORIES;

    return categoriesOrder
      .map((category) => ({
        category,
        tools: groupsMap.get(category) ?? [],
      }))
      .filter((group) => group.tools.length > 0);
  }, [filteredTools, searchQuery]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A collection of utilities and generators to explore and visualize data.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <InputGroup className="h-9 bg-card/60">
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
              searchInputRef.current?.focus();
            }}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedTools.map(({ category, tools }) => (
            <section key={category} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  {category}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-2xs font-medium text-muted-foreground">
                  {tools.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.params.toolID}
                      to={tool.to}
                      params={tool.params}
                      className="group outline-none"
                    >
                      <Card className="h-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring hover:border-primary/40 hover:bg-accent/40">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                              <Icon className="size-5" weight="duotone" />
                            </div>
                            <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <CardTitle className="mt-2 text-sm">{tool.title}</CardTitle>
                          <CardDescription className="text-xs leading-relaxed">
                            {tool.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
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
