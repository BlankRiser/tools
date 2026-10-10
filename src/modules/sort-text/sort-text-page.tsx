import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { CopyButton } from "#/components/ui/copy-button";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  DownloadSimpleIcon,
  EraserIcon,
  EyeIcon,
  FileArrowUpIcon,
  FunnelIcon,
  HashIcon,
  ListBulletsIcon,
  ShuffleIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_SORT_OPTIONS,
  type DuplicateFilterMode,
  type NumberStripMode,
  type OutputView,
  processSortText,
  type SortAlgorithm,
  type SortTextOptions,
} from "./sort-utils";

const SAMPLE_PRESETS: Record<string, { label: string; text: string; options?: Partial<SortTextOptions> }> = {
  tasks: {
    label: "Numbered Tasks",
    text: `3. Submit monthly expense reports
1. Conduct candidate interviews
5. Review pull requests
2. Deploy release to staging
4. Update API documentation
1. Conduct candidate interviews
6. Sync with design team`,
    options: {
      algorithm: "alphabetical-asc",
      stripNumbers: "leading",
      duplicateMode: "remove",
      outputView: "ordered-decimal",
    },
  },
  timeline: {
    label: "Timeline / Dates",
    text: `2024-03-15 - v2.0 Global Rollout
2023-11-01 - Project Kickoff & Scoping
2024-01-10 - Architecture & Threat Model Review
2023-12-15 - Alpha Internal Preview
2024-02-28 - Beta Bug Bash
Oct 14, 2023 - Initial Ideation Session
2023-11-01 - Project Kickoff & Scoping`,
    options: {
      algorithm: "date-asc",
      stripNumbers: "none",
      duplicateMode: "remove",
      outputView: "ordered-decimal",
    },
  },
  groceries: {
    label: "Duplicates & Words",
    text: `Bananas
Apples
coffee
Oranges
Bananas
Milk
apples
Bread
Eggs
Coffee
Tea
Honey`,
    options: {
      algorithm: "alphabetical-asc",
      stripNumbers: "none",
      duplicateMode: "remove",
      caseSensitiveDuplicates: false,
      outputView: "ordered-decimal",
    },
  },
  versions: {
    label: "Semantic Versions",
    text: `v1.10.0
v1.2.0
v1.1.0
v2.0.0-rc1
v1.3.1
v1.9.4
v1.20.0
v1.0.5`,
    options: {
      algorithm: "natural-asc",
      stripNumbers: "none",
      duplicateMode: "remove",
      outputView: "ordered-padded",
    },
  },
};

const SORT_ALGORITHMS: Array<{ value: SortAlgorithm; label: string; icon: typeof SortAscendingIcon }> = [
  { value: "alphabetical-asc", label: "Alphabetical (A → Z)", icon: SortAscendingIcon },
  { value: "alphabetical-desc", label: "Alphabetical (Z → A)", icon: SortDescendingIcon },
  { value: "natural-asc", label: "Natural (1, 2, 10)", icon: SortAscendingIcon },
  { value: "natural-desc", label: "Natural (10, 2, 1)", icon: SortDescendingIcon },
  { value: "date-asc", label: "Dates (Oldest first)", icon: CalendarCheckIcon },
  { value: "date-desc", label: "Dates (Newest first)", icon: CalendarCheckIcon },
  { value: "numeric-asc", label: "Numeric (Smallest first)", icon: HashIcon },
  { value: "numeric-desc", label: "Numeric (Largest first)", icon: HashIcon },
  { value: "length-asc", label: "Line Length (Shortest first)", icon: ListBulletsIcon },
  { value: "length-desc", label: "Line Length (Longest first)", icon: ListBulletsIcon },
  { value: "random", label: "Random Shuffle", icon: ShuffleIcon },
  { value: "reverse", label: "Reverse Current Order", icon: ArrowsClockwiseIcon },
];

const NUMBER_STRIP_MODES: Array<{ value: NumberStripMode; label: string; hint: string }> = [
  { value: "none", label: "Keep Numbers", hint: "Preserve all numbers and numbering" },
  { value: "leading", label: "Strip Leading Numbers", hint: "Remove 1., 1), [1], 01 - at start of lines" },
  { value: "all", label: "Strip All Digits", hint: "Remove every numeric digit (0-9) from text" },
];

const DUPLICATE_MODES: Array<{ value: DuplicateFilterMode; label: string; hint: string }> = [
  { value: "all", label: "Keep All", hint: "Do not filter duplicates" },
  { value: "remove", label: "Remove Duplicates", hint: "Keep only unique lines" },
  { value: "only-duplicates", label: "Show Duplicates Only", hint: "Filter to only repeated items" },
  { value: "count-occurrences", label: "Count Occurrences", hint: "Append count: Item (x3)" },
];

const OUTPUT_VIEWS: Array<{ value: OutputView; label: string; category: "ordered" | "unordered" | "code" }> = [
  { value: "plain", label: "Plain Text (No Prefix)", category: "code" },
  { value: "ordered-decimal", label: "Ordered: 1. 2. 3.", category: "ordered" },
  { value: "ordered-padded", label: "Ordered: 01. 02. 10.", category: "ordered" },
  { value: "ordered-alpha-lower", label: "Ordered: a. b. c.", category: "ordered" },
  { value: "ordered-alpha-upper", label: "Ordered: A. B. C.", category: "ordered" },
  { value: "ordered-roman-lower", label: "Ordered: i. ii. iii.", category: "ordered" },
  { value: "ordered-roman-upper", label: "Ordered: I. II. III.", category: "ordered" },
  { value: "ordered-markdown", label: "Markdown Ordered List", category: "ordered" },
  { value: "ordered-html", label: "HTML <ol> List", category: "ordered" },
  { value: "unordered-bullet", label: "Bulleted: • List", category: "unordered" },
  { value: "unordered-hyphen", label: "Bulleted: - List", category: "unordered" },
  { value: "unordered-html", label: "HTML <ul> List", category: "unordered" },
  { value: "delimited-comma", label: "Comma-separated", category: "code" },
  { value: "delimited-json", label: "JSON Array", category: "code" },
];

const DELIMITERS: Array<{ value: ". " | ") " | ": " | " - " | " "; label: string }> = [
  { value: ". ", label: "Dot (1. )" },
  { value: ") ", label: "Parenthesis (1) )" },
  { value: ": ", label: "Colon (1: )" },
  { value: " - ", label: "Hyphen (1 - )" },
  { value: " ", label: "Space (1 )" },
];

export function SortTextPage() {
  const [inputText, setInputText] = useState(SAMPLE_PRESETS.tasks.text);
  const [options, setOptions] = useState<SortTextOptions>({
    ...DEFAULT_SORT_OPTIONS,
    stripNumbers: "leading",
    outputView: "ordered-decimal",
    duplicateMode: "remove",
  });
  const [viewTab, setViewTab] = useState<"text" | "rendered">("text");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => {
    return processSortText(inputText, options);
  }, [inputText, options]);

  const loadPreset = (key: keyof typeof SAMPLE_PRESETS) => {
    const preset = SAMPLE_PRESETS[key];
    if (!preset) return;
    setInputText(preset.text);
    if (preset.options) {
      setOptions((prev) => ({
        ...prev,
        ...preset.options,
      }));
    }
    toast.success(`Loaded preset: ${preset.label}`);
  };

  const handleCopy = useCallback(async () => {
    if (!result.formattedOutput) return;
    try {
      await navigator.clipboard.writeText(result.formattedOutput);
      setCopied(true);
      toast.success("Sorted text copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, [result.formattedOutput]);

  const handleDownload = () => {
    if (!result.formattedOutput) return;
    let ext = "txt";
    if (options.outputView === "ordered-markdown") ext = "md";
    if (options.outputView.includes("html")) ext = "html";
    if (options.outputView === "delimited-json") ext = "json";

    const blob = new Blob([result.formattedOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sorted-list.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as sorted-list.${ext}`);
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      setInputText(text);
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error("Failed to read file");
    }
  };

  const handleShuffle = () => {
    setOptions((prev) => ({
      ...prev,
      algorithm: "random",
      randomSeed: Math.floor(Math.random() * 1000000),
    }));
    toast.success("Shuffled lines randomly");
  };

  const isOrderedView = options.outputView.startsWith("ordered-") && !options.outputView.includes("html") && !options.outputView.includes("markdown");

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col gap-4 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Sort Text & Lists</h1>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
              Sort lines alphabetically, naturally, or chronologically by date. Filter duplicates, strip numbers, and render in custom ordered list formats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.tsv,.md,.json,.log"
              className="sr-only"
              onChange={(e) => {
                void handleFileUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileArrowUpIcon data-icon="inline-start" />
              Upload file
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  if (clip) {
                    setInputText(clip);
                    toast.success("Pasted from clipboard");
                  }
                } catch {
                  toast.error("Could not read clipboard");
                }
              }}
            >
              <CopyIcon data-icon="inline-start" />
              Paste
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setInputText("");
                toast.success("Cleared text");
              }}
              disabled={!inputText}
            >
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-1.5 border-y border-border/60 py-2 text-xs">
          <span className="mr-1 font-medium text-muted-foreground">Sample Presets:</span>
          {Object.entries(SAMPLE_PRESETS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => loadPreset(key as keyof typeof SAMPLE_PRESETS)}
              className="rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 text-2xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Global Controls Bar */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Sort Algorithm */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Sort Method</Label>
            <Select
              value={options.algorithm}
              onValueChange={(val) =>
                setOptions((prev) => ({
                  ...prev,
                  algorithm: val as SortAlgorithm,
                  ...(val === "random" ? { randomSeed: Math.floor(Math.random() * 1000000) } : {}),
                }))
              }
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_ALGORITHMS.map((algo) => (
                  <SelectItem key={algo.value} value={algo.value} className="text-xs">
                    {algo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Number Stripping */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Number Stripping</Label>
            <Select
              value={options.stripNumbers}
              onValueChange={(val) => setOptions((prev) => ({ ...prev, stripNumbers: val as NumberStripMode }))}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUMBER_STRIP_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value} className="text-xs">
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Duplicate Handling */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Duplicate Filter</Label>
            <Select
              value={options.duplicateMode}
              onValueChange={(val) =>
                setOptions((prev) => ({ ...prev, duplicateMode: val as DuplicateFilterMode }))
              }
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUPLICATE_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value} className="text-xs">
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Output View Format */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Output Format</Label>
            <Select
              value={options.outputView}
              onValueChange={(val) => setOptions((prev) => ({ ...prev, outputView: val as OutputView }))}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_VIEWS.map((view) => (
                  <SelectItem key={view.value} value={view.value} className="text-xs">
                    {view.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary Options Toggles */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={options.trimLines}
              onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, trimLines: !!checked }))}
            />
            <span>Trim whitespace</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={options.ignoreEmptyLines}
              onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, ignoreEmptyLines: !!checked }))}
            />
            <span>Remove blank lines</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={options.caseSensitiveSort}
              onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, caseSensitiveSort: !!checked }))}
            />
            <span>Case-sensitive sort</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={options.caseSensitiveDuplicates}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, caseSensitiveDuplicates: !!checked }))
              }
            />
            <span>Case-sensitive duplicates</span>
          </label>

          {isOrderedView && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Delimiter:</span>
              <Select
                value={options.orderedDelimiter}
                onValueChange={(val) =>
                  setOptions((prev) => ({
                    ...prev,
                    orderedDelimiter: val as typeof options.orderedDelimiter,
                  }))
                }
              >
                <SelectTrigger size="sm" className="h-6 text-2xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIMITERS.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-2xs">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {options.algorithm.startsWith("date-") && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Date Format:</span>
              <Select
                value={options.dateFormatPreference}
                onValueChange={(val) =>
                  setOptions((prev) => ({
                    ...prev,
                    dateFormatPreference: val as typeof options.dateFormatPreference,
                  }))
                }
              >
                <SelectTrigger size="sm" className="h-6 text-2xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" className="text-2xs">Auto-detect</SelectItem>
                  <SelectItem value="us" className="text-2xs">US Format (MM/DD)</SelectItem>
                  <SelectItem value="eu" className="text-2xs">EU Format (DD/MM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {options.algorithm === "random" && (
            <Button size="xs" variant="outline" onClick={handleShuffle} className="h-6 gap-1 px-2 text-2xs">
              <ShuffleIcon className="size-3" />
              Re-shuffle
            </Button>
          )}
        </div>

        {/* Dual Pane Workspace */}
        <div className="grid flex-1 items-stretch gap-4 overflow-hidden lg:grid-cols-2">
          {/* Input Panel */}
          <Card className="flex flex-1 flex-col overflow-hidden py-3">
            <CardHeader className="py-0 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Input Lines ({result.stats.inputCount})
                </CardTitle>
                <span className="font-mono text-2xs text-muted-foreground">
                  {inputText.length} chars
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col py-0">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type lines here to sort..."
                spellCheck={false}
                className="h-full min-h-[18rem] resize-none font-mono text-xs leading-relaxed"
              />
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="flex flex-1 flex-col overflow-hidden py-3">
            <CardHeader className="py-0 pb-2">
              <div className="flex items-center justify-between">
                {/* View Switcher: Raw Text vs Visual List */}
                <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewTab("text")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      viewTab === "text"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CodeIcon className="size-3.5" />
                    Text Output
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab("rendered")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      viewTab === "rendered"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <EyeIcon className="size-3.5" />
                    Rendered List ({result.stats.outputCount})
                  </button>
                </div>

                {/* Copy & Download Actions */}
                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant={copied ? "default" : "outline"}
                    onClick={handleCopy}
                    disabled={!result.formattedOutput}
                    className="h-7 text-xs"
                  >
                    {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleDownload}
                    disabled={!result.formattedOutput}
                    title="Download output file"
                    className="h-7 text-xs"
                  >
                    <DownloadSimpleIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col overflow-hidden py-0">
              {viewTab === "text" ? (
                /* Raw formatted text output */
                <Textarea
                  value={result.formattedOutput}
                  readOnly
                  placeholder="Sorted output will appear here..."
                  spellCheck={false}
                  className="h-full min-h-[18rem] resize-none font-mono text-xs leading-relaxed bg-muted/30"
                />
              ) : (
                /* Visual Rendered List view */
                <div className="flex-1 overflow-auto rounded-lg border border-border/80 bg-muted/10 p-3">
                  {result.items.length === 0 ? (
                    <div className="flex h-full min-h-[16rem] items-center justify-center text-xs text-muted-foreground">
                      No lines to display
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {result.items.map((item, idx) => (
                        <div
                          key={`item-${idx}-${item.processed}`}
                          className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-2 text-xs transition-colors hover:border-primary/40 hover:bg-card/80"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {/* Number / Position Badge */}
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-3xs font-semibold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                              {idx + 1}
                            </span>

                            {/* Item Text */}
                            <span className="truncate font-mono text-xs text-foreground">
                              {item.processed}
                            </span>

                            {/* Date Badge if detected */}
                            {item.extractedDate && (
                              <span
                                className="inline-flex shrink-0 items-center gap-1 rounded bg-sky-500/10 px-1.5 py-0.5 font-mono text-3xs text-sky-600 dark:text-sky-400"
                                title={`Parsed date: ${item.extractedDate.toISOString()}`}
                              >
                                <CalendarBlankIcon className="size-2.5" />
                                {item.extractedDate.toLocaleDateString()}
                              </span>
                            )}

                            {/* Duplicate count badge */}
                            {item.occurrenceCount > 1 && (
                              <span
                                className="inline-flex shrink-0 items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-3xs font-medium text-amber-600 dark:text-amber-400"
                                title={`Found ${item.occurrenceCount} occurrences`}
                              >
                                ×{item.occurrenceCount}
                              </span>
                            )}
                          </div>

                          {/* Quick single-line copy */}
                          <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                            <CopyButton value={item.processed} size="icon-xs" variant="ghost" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Footer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-2xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              <strong className="text-foreground">{result.stats.outputCount}</strong> lines sorted
            </span>
            {result.stats.duplicatesRemoved > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <FunnelIcon className="size-3" />
                <strong className="font-semibold">{result.stats.duplicatesRemoved}</strong> duplicates removed
              </span>
            )}
            {result.stats.emptyLinesRemoved > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <EraserIcon className="size-3" />
                <strong>{result.stats.emptyLinesRemoved}</strong> blank lines removed
              </span>
            )}
            {result.stats.datesDetected > 0 && (
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <CalendarCheckIcon className="size-3" />
                <strong>{result.stats.datesDetected}</strong> dates identified
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              <strong className="text-foreground">{result.stats.charCount}</strong> characters output
            </span>
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
