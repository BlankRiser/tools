import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { CopyButton } from "#/components/ui/copy-button";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useTheme } from "#/hooks/use-theme";
import { cn } from "#/lib/utils";
import {
  ArrowsInSimpleIcon,
  ArrowsLeftRightIcon,
  ArrowsOutSimpleIcon,
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CodeIcon,
  DownloadSimpleIcon,
  FileArrowUpIcon,
  FileCodeIcon,
  ListNumbersIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  SortAscendingIcon,
  SparkleIcon,
  TextAlignLeftIcon,
  TrashIcon,
  TreeStructureIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import * as React from "react";
import { codeToTokens, type BundledTheme, type ThemedToken } from "shiki/bundle/web";
import { toast } from "sonner";
import {
  attemptAutoRepairJson,
  DEFAULT_JSON_FORMATTER_OPTIONS,
  processJsonOrJsonl,
  type JsonDocumentMode,
  type JsonFormatAction,
  type JsonFormatterOptions,
  type JsonIndentOption,
} from "./json-formatter-engine";

function Badge({
  variant = "secondary",
  className,
  children,
}: {
  variant?: "secondary" | "outline" | "destructive";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "outline" && "border border-border/70 bg-background/50 text-muted-foreground",
        variant === "destructive" && "bg-destructive/15 text-destructive",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ============================================================================
// Sample Presets
// ============================================================================

const SAMPLE_JSON = `{
  "service": "devhaven-gateway",
  "version": "2.4.0",
  "environment": "production",
  "deployedAt": "2025-05-14T18:30:00Z",
  "features": {
    "rateLimiting": true,
    "maxRequestsPerMinute": 1200,
    "fallbackRegion": null,
    " notes ": ""
  },
  "clusters": [
    {
      "id": "us-east-1",
      "healthy": true,
      "latencyMs": 14.2,
      "nodes": ["node-a1", "node-a2", "node-a3"]
    },
    {
      "id": "eu-central-1",
      "healthy": true,
      "latencyMs": 28.7,
      "nodes": ["node-e1", "node-e2"]
    }
  ]
}`;

const SAMPLE_JSONL = `{"timestamp":"2025-05-14T18:00:01Z","level":"info","service":"auth-api","event":"user.login","userId":"usr_901","latencyMs":18}
{"timestamp":"2025-05-14T18:00:04Z","level":"warn","service":"billing-worker","event":"invoice.retry","userId":"usr_442","attempt":2,"latencyMs":145}
{"timestamp":"2025-05-14T18:00:09Z","level":"error","service":"checkout-api","event":"payment.declined","userId":"usr_719","errorCode":"INSUFFICIENT_FUNDS","latencyMs":92}
{"timestamp":"2025-05-14T18:00:12Z","level":"info","service":"auth-api","event":"token.refresh","userId":"usr_901","latencyMs":11}`;

const SAMPLE_RELAXED_BROKEN_JSON = `{
  // Unquoted keys, single quotes, and trailing commas!
  project: 'DevHaven Tools',
  active: true,
  tags: ['json', 'jsonl', 'shiki',],
  metrics: {
    stars: 1280,
    license: 'MIT',
  },
}`;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

// ============================================================================
// Shiki Syntax-Highlighted Preview Component
// ============================================================================

interface ShikiJsonPreviewProps {
  code: string;
  shikiTheme: BundledTheme;
  showLineNumbers: boolean;
  wordWrap: boolean;
  searchQuery: string;
}

interface HighlightedTokensState {
  lines: ThemedToken[][];
  bg?: string;
  fg?: string;
}

function ShikiJsonPreview({
  code,
  shikiTheme,
  showLineNumbers,
  wordWrap,
  searchQuery,
}: ShikiJsonPreviewProps) {
  const [tokenState, setTokenState] = React.useState<HighlightedTokensState | null>(null);

  React.useEffect(() => {
    if (!code) {
      setTokenState(null);
      return;
    }

    let cancelled = false;

    // Limit Shiki tokenization on extremely huge payloads (> 250KB) to keep UI snappy
    const maxHighlightChars = 250_000;
    const snippetToHighlight =
      code.length > maxHighlightChars
        ? `${code.slice(0, maxHighlightChars)}\n// ... Output truncated in syntax highlighter (${formatBytes(code.length)} total) ...`
        : code;

    codeToTokens(snippetToHighlight, {
      lang: "json",
      theme: shikiTheme,
    })
      .then((res) => {
        if (cancelled) return;
        setTokenState({
          lines: res.tokens,
          bg: res.bg,
          fg: res.fg,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setTokenState(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, shikiTheme]);

  const rawLines = React.useMemo(() => (code ? code.split(/\r?\n/) : []), [code]);

  const matchingLineSet = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || rawLines.length === 0) return new Set<number>();
    const matches = new Set<number>();
    for (let i = 0; i < rawLines.length; i++) {
      if (rawLines[i].toLowerCase().includes(query)) {
        matches.add(i + 1);
      }
    }
    return matches;
  }, [rawLines, searchQuery]);

  if (!code) {
    return (
      <div className="flex h-full min-h-[380px] flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <FileCodeIcon className="mb-2 size-10 opacity-30" />
        <p className="text-sm font-medium">No formatted output to preview</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Paste valid JSON or JSONL on the left to view the Shiki syntax-highlighted output.
        </p>
      </div>
    );
  }

  const matchingLineNumbers = Array.from(matchingLineSet);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-y-auto",
        wordWrap ? "overflow-x-hidden" : "overflow-x-auto",
      )}
      style={{
        backgroundColor: tokenState?.bg,
        color: tokenState?.fg,
      }}
    >
      {searchQuery.trim() && (
        <div className="sticky top-2 right-2 z-10 float-right mr-3 rounded-md border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-md">
          {matchingLineNumbers.length > 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Matched on {matchingLineNumbers.length} line{matchingLineNumbers.length === 1 ? "" : "s"} (
              {matchingLineNumbers.slice(0, 6).join(", ")}
              {matchingLineNumbers.length > 6 ? "…" : ""})
            </span>
          ) : (
            <span className="text-muted-foreground">No matches found</span>
          )}
        </div>
      )}

      <div className="min-h-full p-4 text-left font-mono text-xs leading-relaxed">
        {tokenState ? (
          tokenState.lines.map((lineTokens, idx) => {
            const lineNum = idx + 1;
            const isMatched = matchingLineSet.has(lineNum);
            return (
              <div
                key={lineNum}
                className={cn(
                  "flex items-baseline rounded-xs px-1 -mx-1",
                  isMatched && "bg-amber-500/20",
                )}
              >
                {showLineNumbers && (
                  <span
                    aria-hidden="true"
                    className="mr-4 inline-block w-8 shrink-0 text-right font-mono text-[11px] opacity-40 select-none"
                  >
                    {lineNum}
                  </span>
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    wordWrap
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre",
                  )}
                >
                  {lineTokens.length === 0 ? (
                    "\u00A0"
                  ) : (
                    lineTokens.map((token, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          color: token.color,
                          fontStyle: token.fontStyle && token.fontStyle & 1 ? "italic" : undefined,
                          fontWeight: token.fontStyle && token.fontStyle & 2 ? "bold" : undefined,
                        }}
                      >
                        {token.content}
                      </span>
                    ))
                  )}
                </span>
              </div>
            );
          })
        ) : (
          rawLines.map((lineText, idx) => {
            const lineNum = idx + 1;
            return (
              <div key={lineNum} className="flex items-baseline">
                {showLineNumbers && (
                  <span
                    aria-hidden="true"
                    className="mr-4 inline-block w-8 shrink-0 text-right font-mono text-[11px] opacity-40 select-none"
                  >
                    {lineNum}
                  </span>
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre",
                  )}
                >
                  {lineText || "\u00A0"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Interactive JSON Tree Node Inspector
// ============================================================================

interface JsonTreeNodeProps {
  label: string | number | null;
  value: unknown;
  path: string;
  depth?: number;
}

function JsonTreeNode({ label, value, path, depth = 0 }: JsonTreeNodeProps) {
  const [expanded, setExpanded] = React.useState(depth < 2);

  const isArray = Array.isArray(value);
  const isObject = typeof value === "object" && value !== null && !isArray;
  const isExpandable = isArray || isObject;

  const entries = React.useMemo(() => {
    if (isArray) {
      return (value as unknown[]).map((item, idx) => [idx, item] as const);
    }
    if (isObject) {
      return Object.entries(value as Record<string, unknown>);
    }
    return [];
  }, [value, isArray, isObject]);

  const handleCopyValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(serialized);
    toast.success(`Copied value at ${path}`);
  };

  if (!isExpandable) {
    return (
      <div className="group flex items-baseline gap-2 rounded px-2 py-0.5 font-mono text-xs hover:bg-muted/60">
        {label !== null && (
          <span className="font-medium text-sky-600 dark:text-sky-400">
            {typeof label === "number" ? `[${label}]` : `"${label}"`}:
          </span>
        )}
        <span
          className={cn(
            "break-all",
            typeof value === "string" && "text-emerald-600 dark:text-emerald-400",
            typeof value === "number" && "text-amber-600 dark:text-amber-400",
            typeof value === "boolean" && "font-semibold text-purple-600 dark:text-purple-400",
            value === null && "italic text-muted-foreground",
          )}
        >
          {typeof value === "string" ? `"${value}"` : String(value)}
        </span>
        <button
          type="button"
          onClick={handleCopyValue}
          className="ml-auto hidden rounded bg-background/80 px-1.5 py-0.2 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:inline-block group-hover:opacity-100 hover:text-foreground"
          title={`Copy ${path}`}
        >
          Copy
        </button>
      </div>
    );
  }

  return (
    <div className="font-mono text-xs">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className="group flex cursor-pointer items-center gap-1.5 rounded px-2 py-0.5 select-none hover:bg-muted/60"
      >
        {expanded ? (
          <CaretDownIcon className="size-3 shrink-0 text-muted-foreground" />
        ) : (
          <CaretRightIcon className="size-3 shrink-0 text-muted-foreground" />
        )}
        {label !== null && (
          <span className="font-medium text-sky-600 dark:text-sky-400">
            {typeof label === "number" ? `[${label}]` : `"${label}"`}:
          </span>
        )}
        <span className="text-muted-foreground">
          {isArray ? `Array(${entries.length})` : `Object{${entries.length}}`}
        </span>
        <button
          type="button"
          onClick={handleCopyValue}
          className="ml-auto hidden rounded bg-background/80 px-1.5 py-0.2 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:inline-block group-hover:opacity-100 hover:text-foreground"
        >
          Copy subtree
        </button>
      </div>

      {expanded && (
        <div className="ml-3 border-l border-border/60 pl-2">
          {entries.map(([key, childVal]) => {
            const childPath =
              typeof key === "number" ? `${path}[${key}]` : `${path}.${key}`;
            return (
              <JsonTreeNode
                key={String(key)}
                label={key}
                value={childVal}
                path={childPath}
                depth={depth + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export function JsonFormatterPage() {
  const { theme: appTheme } = useTheme();
  const [rawInput, setRawInput] = React.useState<string>(SAMPLE_JSON);
  const [options, setOptions] = React.useState<JsonFormatterOptions>(
    DEFAULT_JSON_FORMATTER_OPTIONS,
  );
  const [previewTab, setPreviewTab] = React.useState<"code" | "tree">("code");
  const [showLineNumbers, setShowLineNumbers] = React.useState<boolean>(true);
  const [wordWrap, setWordWrap] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = React.useRef<HTMLDivElement | null>(null);

  const result = React.useMemo(
    () => processJsonOrJsonl(rawInput, options),
    [rawInput, options],
  );

  const activeShikiTheme: BundledTheme =
    appTheme === "dark" ? "catppuccin-mocha" : "catppuccin-latte";

  const inputLines = React.useMemo(() => rawInput.split(/\r?\n/), [rawInput]);

  const errorLineSet = React.useMemo(
    () => new Set(result.errors.map((e) => e.line)),
    [result.errors],
  );

  const handleEditorScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextValue = `${rawInput.substring(0, start)}  ${rawInput.substring(end)}`;
      setRawInput(nextValue);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      setRawInput(content);
      if (file.name.endsWith(".jsonl") || file.name.endsWith(".ndjson")) {
        setOptions((prev) => ({ ...prev, mode: "jsonl" }));
      } else {
        setOptions((prev) => ({ ...prev, mode: "auto" }));
      }
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAutoRepair = () => {
    try {
      const repaired = attemptAutoRepairJson(rawInput, result.detectedMode);
      setRawInput(repaired);
      toast.success("Repaired relaxed JSON syntax (keys, quotes, trailing commas)");
    } catch (err) {
      toast.error(
        err instanceof Error ? `Auto-repair failed: ${err.message}` : "Could not auto-repair JSON",
      );
    }
  };

  const handleApplyToInput = () => {
    if (!result.isValid || !result.output) return;
    setRawInput(result.output);
    toast.success("Applied formatted output to editor");
  };

  const handleDownload = () => {
    if (!result.isValid || !result.output) return;
    const filename = "formatted-json.json";
    const blob = new Blob([result.output], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const jumpToErrorLine = (lineNum: number) => {
    if (!textareaRef.current) return;
    const lines = rawInput.split(/\r?\n/);
    let charOffset = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) {
      charOffset += lines[i].length + 1;
    }
    const lineLength = lines[lineNum - 1]?.length ?? 0;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset + lineLength);
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              JSON & JSONL Formatter
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Validate, beautify, minify, and convert between standard JSON and newline-delimited
              JSONL (NDJSON) with Shiki syntax highlighting, line-level diagnostics, and 1-click
              relaxed JSON repair.
            </p>
          </div>

          {/* Preset Loaders & Upload */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setRawInput(SAMPLE_JSON);
                setOptions((prev) => ({ ...prev, mode: "auto", action: "beautify" }));
              }}
            >
              Sample JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setRawInput(SAMPLE_JSONL);
                setOptions((prev) => ({ ...prev, mode: "auto", action: "beautify" }));
              }}
            >
              Sample JSONL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-amber-500/30 text-xs text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              onClick={() => {
                setRawInput(SAMPLE_RELAXED_BROKEN_JSON);
                setOptions((prev) => ({ ...prev, mode: "json" }));
              }}
            >
              <SparkleIcon className="size-3.5" />
              Broken / Relaxed JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.jsonl,.ndjson,.txt,application/json"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileArrowUpIcon className="size-3.5" />
              Upload File
            </Button>
          </div>
        </div>

        {/* Formatting Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs backdrop-blur-xs">
          {/* Left group: Mode, Action, Indent */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Format:</span>
              <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5">
                {(
                  [
                    { id: "auto", label: `Auto (${result.detectedMode.toUpperCase()})` },
                    { id: "json", label: "JSON" },
                    { id: "jsonl", label: "JSONL" },
                  ] as Array<{ id: JsonDocumentMode; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOptions((prev) => ({ ...prev, mode: item.id }))}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      options.mode === item.id
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-px bg-border/70" />

            {/* Action Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Action:</span>
              <div className="inline-flex flex-wrap rounded-lg border border-border/70 bg-muted/40 p-0.5">
                {(
                  [
                    {
                      id: "beautify",
                      label: "Beautify",
                      icon: ArrowsOutSimpleIcon,
                    },
                    {
                      id: "minify",
                      label: "Minify",
                      icon: ArrowsInSimpleIcon,
                    },
                    {
                      id: "to_jsonl",
                      label: "→ JSONL",
                      icon: ArrowsLeftRightIcon,
                    },
                    {
                      id: "to_json_array",
                      label: "→ JSON Array",
                      icon: CodeIcon,
                    },
                  ] as Array<{
                    id: JsonFormatAction;
                    label: string;
                    icon: React.ComponentType<{ className?: string }>;
                  }>
                ).map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setOptions((prev) => ({ ...prev, action: act.id }))}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        options.action === act.id
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="size-3.5" />
                      {act.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Indentation Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Indent:</span>
              <Select
                value={options.indent}
                onValueChange={(val) =>
                  setOptions((prev) => ({ ...prev, indent: val as JsonIndentOption }))
                }
                disabled={options.action === "minify" || options.action === "to_jsonl"}
              >
                <SelectTrigger className="h-7 w-[105px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Spaces</SelectItem>
                  <SelectItem value="4">4 Spaces</SelectItem>
                  <SelectItem value="8">8 Spaces</SelectItem>
                  <SelectItem value="tab">Tab (\t)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right group: Transform Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({ ...prev, sortKeys: !prev.sortKeys }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.sortKeys
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Recursively sort all object keys alphabetically"
            >
              <SortAscendingIcon className="size-3.5" />
              Sort Keys
            </button>

            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({ ...prev, removeNulls: !prev.removeNulls }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.removeNulls
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Strip properties and array elements with null values"
            >
              Strip null
            </button>

            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({
                  ...prev,
                  removeEmptyStrings: !prev.removeEmptyStrings,
                }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.removeEmptyStrings
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Strip properties and array elements with empty string values"
            >
              Strip ""
            </button>

            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({
                  ...prev,
                  escapeUnicode: !prev.escapeUnicode,
                }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.escapeUnicode
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Escape non-ASCII characters to \\uXXXX sequences"
            >
              Escape Unicode
            </button>
          </div>
        </div>

        {/* Validation Status & Diagnostics Banner */}
        {rawInput.trim().length > 0 && (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 transition-colors",
              result.isValid
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-destructive/40 bg-destructive/5",
            )}
          >
            {result.isValid ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon
                    className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    weight="fill"
                  />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Valid {result.detectedMode.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    — {result.stats.recordCount}{" "}
                    {result.stats.recordCount === 1 ? "record" : "records"} parsed
                    successfully
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    Depth: {result.stats.maxDepth}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    Keys: {result.stats.totalKeys}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    Lines: {result.stats.lineCount}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {formatBytes(result.stats.inputBytes)} →{" "}
                    {formatBytes(result.stats.outputBytes)} (
                    {result.stats.sizeDeltaPercent > 0
                      ? `+${result.stats.sizeDeltaPercent}%`
                      : `${result.stats.sizeDeltaPercent}%`}
                    )
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <WarningCircleIcon
                      className="size-4 shrink-0 text-destructive"
                      weight="fill"
                    />
                    <span className="text-xs font-semibold text-destructive">
                      Invalid {result.detectedMode.toUpperCase()} —{" "}
                      {result.errors.length}{" "}
                      {result.errors.length === 1 ? "syntax error" : "syntax errors"}{" "}
                      detected
                    </span>
                  </div>

                  {result.canAutoRepair && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-500"
                      onClick={handleAutoRepair}
                    >
                      <MagicWandIcon className="size-3.5" weight="bold" />
                      Auto-Repair Relaxed JSON
                    </Button>
                  )}
                </div>

                <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {result.errors.map((err, idx) => (
                    <div
                      key={`${err.line}-${idx}`}
                      onClick={() => jumpToErrorLine(err.line)}
                      className="cursor-pointer rounded-lg border border-destructive/25 bg-background/80 p-2 text-xs transition-colors hover:border-destructive/50"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="destructive"
                          className="h-4 px-1.5 font-mono text-[10px]"
                        >
                          Line {err.line}
                          {err.column !== null ? `, Col ${err.column}` : ""}
                        </Badge>
                        <span className="font-medium text-foreground">
                          {err.message}
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          Click to jump to line
                        </span>
                      </div>
                      {err.lineContent && (
                        <pre className="mt-1.5 overflow-x-auto rounded bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                          {err.lineContent}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Split Workspace */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left Panel: Raw JSON / JSONL Input Editor */}
          <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
            <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-tight text-foreground">
                  Input ({result.detectedMode.toUpperCase()})
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {inputLines.length} {inputLines.length === 1 ? "line" : "lines"}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {formatBytes(result.stats.inputBytes)}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                {result.canAutoRepair && !result.isValid && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 border-amber-500/40 text-xs text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                    onClick={handleAutoRepair}
                  >
                    <MagicWandIcon className="size-3.5" />
                    Repair
                  </Button>
                )}
                {result.isValid && result.output && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleApplyToInput}
                    title="Replace editor input with formatted output"
                  >
                    Apply Formatted
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setRawInput("")}
                  disabled={!rawInput}
                >
                  <TrashIcon className="size-3.5" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Editor Body with Synchronized Line Gutter */}
            <div className="relative flex flex-1 overflow-hidden">
              <div
                ref={gutterRef}
                aria-hidden="true"
                className="w-11 shrink-0 overflow-hidden border-r border-border/50 bg-muted/20 py-3 text-right font-mono text-xs leading-relaxed select-none"
              >
                {inputLines.map((_, i) => {
                  const lineNum = i + 1;
                  const hasError = errorLineSet.has(lineNum);
                  return (
                    <div
                      key={lineNum}
                      className={cn(
                        "px-2 text-[11px] leading-relaxed",
                        hasError
                          ? "bg-destructive/20 font-bold text-destructive"
                          : "text-muted-foreground/45",
                      )}
                    >
                      {lineNum}
                    </div>
                  );
                })}
              </div>

              <textarea
                ref={textareaRef}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                onScroll={handleEditorScroll}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder='Paste JSON or multi-line JSONL here...\n\nExample JSON:\n{"hello": "world"}\n\nExample JSONL:\n{"id": 1, "event": "click"}\n{"id": 2, "event": "view"}'
                className="h-full w-full flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Right Panel: Shiki Syntax-Highlighted Output & Tree Inspector */}
          <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
            {/* Preview Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-3.5 py-2">
              <div className="flex items-center gap-1.5">
                <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("code")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      previewTab === "code"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CodeIcon className="size-3.5" />
                    Shiki Highlight
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("tree")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      previewTab === "tree"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TreeStructureIcon className="size-3.5" />
                    Tree Inspector
                  </button>
                </div>

                {previewTab === "code" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowLineNumbers((prev) => !prev)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
                        showLineNumbers
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                      )}
                      title="Toggle line numbers"
                    >
                      <ListNumbersIcon className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setWordWrap((prev) => !prev)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
                        wordWrap
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                      )}
                      title="Toggle word wrap"
                    >
                      <TextAlignLeftIcon className="size-3.5" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <CopyButton
                  value={result.output}
                  label="Copy"
                  disabled={!result.isValid || !result.output}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={handleDownload}
                  disabled={!result.isValid || !result.output}
                >
                  <DownloadSimpleIcon className="size-3.5" />
                  Download
                </Button>
              </div>
            </div>

            {/* Search Filter Subbar */}
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/15 px-3.5 py-1.5">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inside formatted output..."
                  className="h-7 pl-8 text-xs"
                />
              </div>
            </div>

            {/* Preview Content Area */}
            <div className="flex-1 overflow-hidden">
              {!result.isValid ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <WarningCircleIcon className="mb-2 size-10 text-destructive/60" />
                  <p className="text-sm font-semibold text-foreground">
                    Cannot format until syntax errors are resolved
                  </p>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    Check the highlighted line numbers in the editor or click an error
                    above to jump directly to the offending token.
                  </p>
                  {result.canAutoRepair && (
                    <Button
                      size="sm"
                      className="mt-4 gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-500"
                      onClick={handleAutoRepair}
                    >
                      <MagicWandIcon className="size-4" weight="bold" />
                      Auto-Repair Relaxed JSON Now
                    </Button>
                  )}
                </div>
              ) : previewTab === "code" ? (
                <ShikiJsonPreview
                  code={result.output}
                  shikiTheme={activeShikiTheme}
                  showLineNumbers={showLineNumbers}
                  wordWrap={wordWrap}
                  searchQuery={searchQuery}
                />
              ) : (
                <div className="h-full overflow-auto p-3">
                  {result.parsedData !== null && result.parsedData !== undefined ? (
                    <JsonTreeNode
                      label={result.detectedMode === "jsonl" ? "JSONL Records" : "root"}
                      value={result.parsedData}
                      path="$"
                    />
                  ) : (
                    <p className="p-4 text-xs text-muted-foreground">
                      No data to display in tree view.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
