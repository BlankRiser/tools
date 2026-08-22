import { cn } from "#/lib/utils";
import { formatBytes, formatCount, formatDuration, formatShare, type TextAnalysis } from "./analyze-text";
import { FrequencyList } from "./frequency-list";

type TextMetricsPanelProps = {
  analysis: TextAnalysis;
  stale: boolean;
};

type Metric = {
  label: string;
  value: string;
  hint?: string;
};

function MetricCell({ label, value, hint }: Metric) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="truncate font-mono text-sm font-medium tabular-nums" title={value}>
        {value}
      </span>
      {hint && <span className="text-2xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function CompositionBar({ analysis }: { analysis: TextAnalysis }) {
  const total = analysis.codePoints || 1;
  const parts = [
    { label: "Letters", count: analysis.letters, className: "bg-primary" },
    { label: "Digits", count: analysis.digits, className: "bg-chart-2" },
    { label: "Punctuation", count: analysis.punctuation, className: "bg-chart-4" },
    { label: "Whitespace", count: analysis.whitespace, className: "bg-muted-foreground/40" },
    { label: "Other", count: analysis.other, className: "bg-chart-5" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Composition</span>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {parts.map((part) =>
          part.count === 0 ? null : <div key={part.label} className={cn("h-full", part.className)} style={{ width: `${(part.count / total) * 100}%` }} />,
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-5">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center gap-1.5 text-muted-foreground">
            <span className={cn("size-2 shrink-0 rounded-full", part.className)} />
            <span>
              {part.label} {formatShare(part.count / total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TextMetricsPanel({ analysis, stale }: TextMetricsPanelProps) {
  const metrics: Metric[] = [
    { label: "Characters", value: formatCount(analysis.characters), hint: "UTF-16 units" },
    { label: "Code points", value: formatCount(analysis.codePoints) },
    { label: "Graphemes", value: formatCount(analysis.graphemes) },
    { label: "Words", value: formatCount(analysis.words), hint: `${formatCount(analysis.uniqueWords)} unique` },
    { label: "Sentences", value: formatCount(analysis.sentences) },
    { label: "Paragraphs", value: formatCount(analysis.paragraphs) },
    { label: "Lines", value: formatCount(analysis.lines) },
    { label: "Bytes", value: formatCount(analysis.bytes), hint: formatBytes(analysis.bytes) },
    { label: "Avg word", value: analysis.avgWordLength === 0 ? "0" : analysis.avgWordLength.toFixed(1), hint: "characters" },
    { label: "Avg sentence", value: analysis.avgSentenceWords === 0 ? "0" : analysis.avgSentenceWords.toFixed(1), hint: "words" },
    { label: "Reading", value: formatDuration(analysis.readingSeconds), hint: "220 wpm" },
    { label: "Speaking", value: formatDuration(analysis.speakingSeconds), hint: "150 wpm" },
  ];

  const encodingTotal = analysis.codePoints || 1;

  return (
    <div className={cn("flex flex-col gap-6 transition-opacity", stale && "opacity-60")}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCell key={metric.label} {...metric} />
        ))}
      </div>

      <CompositionBar analysis={analysis} />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Encoding</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <MetricCell label="ASCII" value={formatShare(analysis.ascii / encodingTotal)} hint={formatCount(analysis.ascii)} />
          <MetricCell label="Non-ASCII" value={formatShare(analysis.nonAscii / encodingTotal)} hint={formatCount(analysis.nonAscii)} />
          <MetricCell label="Longest word" value={analysis.longestWord || "—"} />
        </div>
      </div>

      <div className="grid min-h-0 gap-6 lg:grid-cols-2">
        <FrequencyList title="Word frequency" items={analysis.wordFrequency} emptyLabel="No words to count yet." searchable />
        <FrequencyList title="Letter frequency" items={analysis.letterFrequency} emptyLabel="No letters to count yet." />
      </div>
    </div>
  );
}
