import { type ToolItem, toolsList } from "#/data/tools-list";
import { cn } from "#/lib/utils";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { matchSorter } from "match-sorter";
import * as React from "react";

const SUGGESTED_TOOL_IDS = [
  "json-formatter",
  "map-wallpaper",
  "diff-checker",
  "pdf-tools",
  "jwt-encoder-decoder",
  "geojson-viewer",
];

export function NavSearchCombobox({ className }: { className?: string }) {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  });

  // Close combobox whenever route changes
  React.useEffect(() => {
    setIsOpen(false);
    setQuery("");
  }, [currentPath]);

  const availableTools = React.useMemo(() => {
    return toolsList.filter((tool) => !tool.comingSoon);
  }, []);

  const displayedTools = React.useMemo(() => {
    const q = query.trim();
    if (!q) {
      return SUGGESTED_TOOL_IDS.map((id) =>
        availableTools.find((t) => t.params.toolID === id),
      ).filter(Boolean) as ToolItem[];
    }
    return matchSorter(availableTools, q, {
      keys: ["id", "name", "title", "description", "params.toolID", "category"],
    }).slice(0, 8);
  }, [availableTools, query]);

  // Reset selected index when matches change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view when keyboard navigating
  React.useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeItem = listRef.current.querySelector(
      `[data-combobox-index="${selectedIndex}"]`,
    ) as HTMLElement | null;
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  // Global keyboard shortcuts (⌘K or /)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      // If user is on the landing page and the hero search bar exists, let hero search handle it
      if (document.getElementById("home-tool-search")) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
        return;
      }

      if (e.key === "/" && !isEditable) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const launchTool = React.useCallback(
    (tool: ToolItem) => {
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
      navigate({
        to: tool.to,
        params: tool.params,
      });
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
      return;
    }

    if (displayedTools.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % displayedTools.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? displayedTools.length - 1 : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetTool = displayedTools[selectedIndex] ?? displayedTools[0];
      if (targetTool) {
        launchTool(targetTool);
      }
    }
  };

  const isSearching = query.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-xs sm:max-w-sm lg:max-w-md", className)}
    >
      <div className="relative flex items-center">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3.5 size-3.5 text-muted-foreground/75"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="nav-search-listbox"
          aria-autocomplete="list"
          aria-label="Search all developer tools"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search 26+ tools..."
          className="h-8.5 w-full rounded-full border border-border/80 bg-muted/35 pr-14 pl-9 font-sans text-xs text-foreground placeholder:text-muted-foreground/60 transition-all hover:border-border hover:bg-muted/65 focus:border-primary/60 focus:bg-background focus:ring-2 focus:ring-primary/15 focus:outline-none"
        />
        <div className="pointer-events-none absolute right-2.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <kbd className="inline-flex items-center rounded border border-border/75 bg-background/90 px-1.5 py-0.5 shadow-2xs font-mono font-medium text-muted-foreground/90">
            ⌘K
          </kbd>
        </div>
      </div>

      {isOpen && (
        <div
          id="nav-search-listbox"
          role="listbox"
          className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-border/80 bg-popover/98 shadow-2xl backdrop-blur-xl sm:absolute sm:top-[calc(100%+0.5rem)] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[32rem] md:w-[34rem]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3.5 py-2 font-mono text-2xs text-muted-foreground">
            <span className="font-medium tracking-wide">
              {isSearching
                ? `MATCHED UTILITIES (${displayedTools.length})`
                : "FEATURED UTILITIES"}
            </span>
            <span className="hidden sm:inline opacity-80">
              ↑↓ NAVIGATE · ↵ SELECT · ESC
            </span>
            <span className="sm:hidden">↵ SELECT</span>
          </div>

          {/* Results List */}
          {displayedTools.length > 0 ? (
            <div
              ref={listRef}
              className="max-h-80 divide-y divide-border/40 overflow-y-auto p-1.5"
            >
              {displayedTools.map((tool, index) => {
                const Icon = tool.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={tool.params.toolID}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-combobox-index={index}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => launchTool(tool)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform",
                        isSelected
                          ? "bg-primary text-primary-foreground scale-105"
                          : "bg-primary/10 text-primary group-hover:scale-105",
                      )}
                    >
                      <Icon className="size-4" weight="duotone" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-heading text-xs font-semibold text-foreground">
                          {tool.title}
                        </span>
                        {tool.isNew && (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.2 font-mono text-3xs font-medium text-emerald-600 dark:text-emerald-400">
                            NEW
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-2xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-2 sm:flex">
                      <span className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-3xs uppercase tracking-wider text-muted-foreground">
                        {tool.category}
                      </span>
                      <ArrowRightIcon
                        className={cn(
                          "size-3.5 transition-transform",
                          isSelected
                            ? "translate-x-0.5 text-foreground opacity-100"
                            : "text-muted-foreground opacity-0 group-hover:opacity-60",
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">
              <p className="font-semibold text-foreground/80">NO MATCHES FOUND</p>
              <p className="mt-1 text-2xs text-muted-foreground">
                No utilities match "{query}". Try checking the spelling or browse All Tools.
              </p>
            </div>
          )}

          {/* Footer telemetry */}
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-3.5 py-1.5 font-mono text-3xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              100% In-Browser · Zero Network Requests
            </span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
