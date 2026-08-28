import { CopyButton } from "#/components/ui/copy-button";
import type { RegexMatch } from "./run-regex";

export function MatchList({ matches }: { matches: RegexMatch[] }) {
  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground">No matches yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {matches.map((match, index) => (
        <li key={`${match.index}-${index}`} className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
                Match {index + 1}
                <span className="ml-2 font-mono font-normal normal-case">
                  [{match.index}, {match.end})
                </span>
              </p>
              <p className="mt-1 break-all font-mono text-sm">{match.match || "∅ empty"}</p>
            </div>
            <CopyButton value={match.match} className="shrink-0" />
          </div>
          {match.groups.length > 0 && (
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {match.groups.map((group, groupIndex) => (
                <li key={`${group.name ?? "g"}-${groupIndex}`} className="rounded-md border bg-background/60 px-2 py-1.5">
                  <p className="text-2xs text-muted-foreground">
                    {group.name ? `?<${group.name}>` : `$${groupIndex + 1}`}
                    {group.start != null && group.end != null ? ` · [${group.start}, ${group.end})` : ""}
                  </p>
                  <p className="break-all font-mono text-xs">{group.value === undefined ? "undefined" : group.value}</p>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
