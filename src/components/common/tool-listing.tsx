import type { ToolItem } from "#/data/tools-list";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

export function ToolListing({ tools }: { tools: ToolItem[] }) {
  return (
    <div className="tool-listing divide-y divide-border/80">
      {tools.map((tool, index) => {
        const Icon = tool.icon;

        return (
          <Link
            key={tool.params.toolID}
            to={tool.to}
            params={tool.params}
            className="tool-listing-row group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 py-4.5 outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 -mx-2"
          >
            <span className="font-mono text-xs tabular-nums text-muted-foreground group-hover:text-primary transition-colors">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card text-primary transition-all duration-150 group-hover:border-primary/50 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" weight="duotone" />
              </span>
              <span className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                    {tool.title}
                  </span>
                  <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
                    {tool.params.toolID}
                  </span>
                </div>
                <span className="mt-0.5 block max-w-[75ch] text-xs leading-relaxed text-muted-foreground font-sans">
                  {tool.description}
                </span>
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-block font-mono text-2xs text-muted-foreground group-hover:text-foreground transition-colors">
                LAUNCH
              </span>
              <ArrowUpRightIcon className="size-4.5 text-muted-foreground transition-[transform,color] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
