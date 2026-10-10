import { cn } from "#/lib/utils";

import type { RegexMatch } from "./run-regex";

const TINTS = ["bg-chart-1/35", "bg-chart-2/35", "bg-chart-3/35", "bg-chart-4/35", "bg-chart-5/35"];

type Segment = {
  text: string;
  matchIndex: number | null;
};

function segmentsFromMatches(text: string, matches: RegexMatch[]): Segment[] {
  if (!text) return [];
  const sorted = [...matches].sort((a, b) => a.index - b.index || a.end - b.end);
  const segments: Segment[] = [];
  let cursor = 0;

  sorted.forEach((match, matchIndex) => {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), matchIndex: null });
    }
    if (match.end === match.index) {
      segments.push({ text: "\u200b", matchIndex });
    } else if (match.index >= cursor) {
      segments.push({ text: text.slice(match.index, match.end), matchIndex });
      cursor = match.end;
    }
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matchIndex: null });
  }

  return segments;
}

export function MatchHighlight({ text, matches }: { text: string; matches: RegexMatch[] }) {
  const segments = segmentsFromMatches(text, matches);

  if (!text) {
    return <p className="text-sm text-muted-foreground">Matches will highlight here.</p>;
  }

  return (
    <pre className="max-h-64 overflow-auto font-mono text-sm leading-relaxed break-all whitespace-pre-wrap">
      {segments.map((segment, index) =>
        segment.matchIndex === null ? (
          <span key={index}>{segment.text}</span>
        ) : (
          <mark key={index} className={cn("rounded-sm px-0.5 text-foreground", TINTS[segment.matchIndex % TINTS.length])}>
            {segment.text}
          </mark>
        ),
      )}
    </pre>
  );
}
