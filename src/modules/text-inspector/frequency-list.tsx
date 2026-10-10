import { Input } from "#/components/ui/input";
import { ScrollArea } from "#/components/ui/scroll-area";
import { useMemo, useState } from "react";
import { formatCount, formatShare, type FrequencyItem } from "./analyze-text";

type FrequencyListProps = {
  title: string;
  items: FrequencyItem[];
  emptyLabel: string;
  searchable?: boolean;
};

export function FrequencyList({ title, items, emptyLabel, searchable = false }: FrequencyListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return items;
    return items.filter((item) => item.token.toLocaleLowerCase().includes(needle));
  }, [items, query]);

  const maxCount = filtered[0]?.count ?? 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
        {searchable && items.length > 0 && (
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter" className="h-7 w-36 text-xs" />
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ScrollArea className="h-72 rounded-lg border bg-muted/20">
          <ol className="divide-y divide-border/60">
            {filtered.map((item) => (
              <li key={item.token} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-1.5">
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-sm">{item.token}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {formatCount(item.count)} · {formatShare(item.share)}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max((item.count / maxCount) * 100, 2)}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </ScrollArea>
      )}
    </div>
  );
}
