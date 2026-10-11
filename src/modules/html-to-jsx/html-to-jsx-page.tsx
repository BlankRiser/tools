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
  ArrowsLeftRightIcon,
  CheckCircleIcon,
  CodeIcon,
  DownloadSimpleIcon,
  FileArrowUpIcon,
  FileCodeIcon,
  ListChecksIcon,
  ListNumbersIcon,
  MagnifyingGlassIcon,
  QuotesIcon,
  SparkleIcon,
  TextAlignLeftIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import * as React from "react";
import { codeToTokens, type BundledTheme, type ThemedToken } from "shiki/bundle/web";
import { toast } from "sonner";
import {
  convertHtmlToJsx,
  DEFAULT_HTML_TO_JSX_OPTIONS,
  type AttributeTransformRecord,
  type HtmlToJsxOptions,
  type JsxIndentOption,
  type JsxOutputMode,
} from "./html-to-jsx-engine";

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

// ============================================================================
// Sample HTML Presets
// ============================================================================

const SAMPLE_HTML_CARD_FORM = `<!-- Pricing Card & Checkout Form -->
<section class="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" style="background-color: #ffffff; border-radius: 16px; --card-accent: #6366f1;">
  <header class="mb-4 flex items-center justify-between">
    <div>
      <span class="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
        Pro Plan
      </span>
      <h2 class="mt-1 text-xl font-bold text-slate-900">Developer Workspace</h2>
    </div>
    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&q=80" alt="Workspace avatar" class="h-12 w-12 rounded-xl object-cover" loading="lazy" crossorigin="anonymous">
  </header>

  <form action="/api/subscribe" method="POST" novalidate autocomplete="off">
    <div class="space-y-3">
      <div>
        <label for="work-email" class="block text-xs font-medium text-slate-700">Work Email</label>
        <input id="work-email" type="email" value="alex@devhaven.io" placeholder="you@company.com" maxlength="120" tabindex="1" required autofocus class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
      </div>

      <div class="flex items-center gap-2 pt-1">
        <input id="annual-billing" type="checkbox" checked class="h-4 w-4 rounded border-slate-300 text-indigo-600">
        <label for="annual-billing" class="text-xs text-slate-600">Enable annual billing (save 20%)</label>
      </div>

      <hr class="my-3 border-slate-200">

      <button type="submit" onclick="console.log('Upgrade clicked')" style="padding: 10px 16px; font-weight: 600;" class="w-full rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">
        Start 14-Day Trial
      </button>
    </div>
  </form>
</section>`;

const SAMPLE_HTML_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewbox="0 0 240 160" width="240" height="160" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <defs>
    <lineargradient id="aurora-grad" x1="0%" y1="0%" x2="100%" y2="100%" gradientunits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366F1" stop-opacity="1"></stop>
      <stop offset="50%" stop-color="#EC4899" stop-opacity="0.9"></stop>
      <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.85"></stop>
    </lineargradient>
    <clippath id="card-clip">
      <rect x="12" y="12" width="216" height="136" rx="20"></rect>
    </clippath>
  </defs>
  <g clip-path="url(#card-clip)">
    <rect x="12" y="12" width="216" height="136" rx="20" fill="url(#aurora-grad)" fill-opacity="0.18" stroke="url(#aurora-grad)" stroke-width="2"></rect>
    <circle cx="72" cy="80" r="32" fill="url(#aurora-grad)" fill-rule="evenodd"></circle>
    <path d="M124 62 H196 M124 80 H178 M124 98 H156" stroke="#1E293B" stroke-width="4" stroke-dasharray="1 0"></path>
  </g>
</svg>`;

const SAMPLE_HTML_TABLE_FRAGMENT = `<!-- Multiple root elements automatically wrap in a React Fragment -->
<div class="mb-3 flex items-center justify-between" data-testid="table-header">
  <h3 class="text-sm font-semibold">Cluster Latency Telemetry</h3>
  <span class="text-xs text-slate-500" contenteditable="false" spellcheck="false">Updated 2m ago</span>
</div>
<table cellpadding="8" cellspacing="0" class="w-full border-collapse text-left text-xs">
  <thead>
    <tr class="border-b border-slate-200 bg-slate-50">
      <th colspan="2" class="font-semibold">Region & Primary Node</th>
      <th class="font-semibold">P95 Latency</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-slate-100">
      <td rowspan="1" class="font-mono">us-east-1</td>
      <td>node-primary-01</td>
      <td style="color: #10b981; font-weight: 600;">12.4ms</td>
    </tr>
  </tbody>
</table>`;

// ============================================================================
// Shiki Syntax-Highlighted JSX/TSX Preview Component
// ============================================================================

interface ShikiJsxPreviewProps {
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

function ShikiJsxPreview({
  code,
  shikiTheme,
  showLineNumbers,
  wordWrap,
  searchQuery,
}: ShikiJsxPreviewProps) {
  const [tokenState, setTokenState] = React.useState<HighlightedTokensState | null>(null);

  React.useEffect(() => {
    if (!code) {
      setTokenState(null);
      return;
    }

    let cancelled = false;
    const maxHighlightChars = 250_000;
    const snippetToHighlight =
      code.length > maxHighlightChars
        ? `${code.slice(0, maxHighlightChars)}\n// ... Output truncated in syntax highlighter (${formatBytes(code.length)} total) ...`
        : code;

    codeToTokens(snippetToHighlight, {
      lang: "tsx",
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
        <p className="text-sm font-medium">No JSX output to preview</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Paste HTML or SVG markup on the left to generate formatted JSX / TSX.
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
                    wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre",
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
// Transform Log Audit View
// ============================================================================

const CATEGORY_LABELS: Record<
  AttributeTransformRecord["category"],
  { label: string; badgeClass: string }
> = {
  "html-attr": {
    label: "HTML Prop",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  "svg-attr": {
    label: "SVG Prop",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
  "style-obj": {
    label: "Inline Style",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  "event-handler": {
    label: "Event Handler",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  "boolean-attr": {
    label: "Boolean Prop",
    badgeClass: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  },
  "form-prop": {
    label: "Form Control",
    badgeClass: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  },
};

function TransformAuditTable({ records }: { records: AttributeTransformRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="flex h-full min-h-[380px] flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <ListChecksIcon className="mb-2 size-10 opacity-30" />
        <p className="text-sm font-medium">No attribute transformations needed</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          When HTML attributes (like <code className="font-mono">class</code>,{" "}
          <code className="font-mono">for</code>, <code className="font-mono">style</code>, or{" "}
          <code className="font-mono">stroke-width</code>) are converted, they will be listed here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border/70 text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Original HTML</th>
            <th className="px-3 py-2 font-medium">Converted JSX</th>
            <th className="py-2 pl-3 text-right font-medium">Occurrences</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50 font-mono">
          {records.map((rec, idx) => {
            const meta = CATEGORY_LABELS[rec.category];
            return (
              <tr key={`${rec.original}-${rec.converted}-${idx}`} className="hover:bg-muted/30">
                <td className="py-2.5 pr-3 font-sans">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
                      meta.badgeClass,
                    )}
                  >
                    {meta.label}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-rose-600 dark:text-rose-400">{rec.original}</td>
                <td className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400">
                  {rec.converted}
                </td>
                <td className="py-2.5 pl-3 text-right font-semibold">{rec.count}×</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main HTML to JSX Page
// ============================================================================

export function HtmlToJsxPage() {
  const { theme } = useTheme();
  const [rawHtml, setRawHtml] = React.useState<string>(SAMPLE_HTML_CARD_FORM);
  const [options, setOptions] = React.useState<HtmlToJsxOptions>(DEFAULT_HTML_TO_JSX_OPTIONS);

  // Preview controls
  const [previewTab, setPreviewTab] = React.useState<"code" | "audit">("code");
  const [showLineNumbers, setShowLineNumbers] = React.useState<boolean>(true);
  const [wordWrap, setWordWrap] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isDark = React.useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  }, [theme]);

  const effectiveShikiTheme: BundledTheme = isDark
    ? "catppuccin-mocha"
    : "catppuccin-latte";

  const result = React.useMemo(
    () => convertHtmlToJsx(rawHtml, options),
    [rawHtml, options],
  );

  const rawLinesCount = React.useMemo(
    () => (rawHtml ? rawHtml.split(/\r?\n/).length : 0),
    [rawHtml],
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      setRawHtml(content);
      if (file.name.toLowerCase().endsWith(".svg")) {
        setOptions((prev) => ({
          ...prev,
          outputMode: "svg-icon-tsx",
          componentName:
            file.name
              .replace(/\.[^.]+$/, "")
              .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
              .replace(/^[a-z]/, (c) => c.toUpperCase()) + "Icon",
        }));
      }
      toast.success(`Loaded ${file.name} (${formatBytes(file.size)})`);
    };
    reader.onerror = () => {
      toast.error("Failed to read uploaded file");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadOutput = () => {
    if (!result.jsx) return;
    const isTsx =
      options.outputMode === "component-tsx" || options.outputMode === "svg-icon-tsx";
    const filename = isTsx ? "converted-component.tsx" : "converted-markup.jsx";
    const blob = new Blob([result.jsx], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              HTML to JSX & TSX Converter
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Transform raw HTML snippets and SVG graphics into clean React JSX or typed TSX
              components. Automatically converts inline CSS styles to objects, camelCases SVG and
              DOM attributes, self-closes void tags, and wraps multi-root fragments.
            </p>
          </div>

          {/* Sample Presets & Upload */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setRawHtml(SAMPLE_HTML_CARD_FORM);
                setOptions((prev) => ({
                  ...prev,
                  outputMode: "fragment",
                  componentName: "PricingCard",
                }));
              }}
            >
              UI Card & Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setRawHtml(SAMPLE_HTML_SVG);
                setOptions((prev) => ({
                  ...prev,
                  outputMode: "svg-icon-tsx",
                  componentName: "AuroraIllustrationIcon",
                }));
              }}
            >
              SVG Graphic
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => {
                setRawHtml(SAMPLE_HTML_TABLE_FRAGMENT);
                setOptions((prev) => ({
                  ...prev,
                  outputMode: "component-tsx",
                  componentName: "LatencyTable",
                }));
              }}
            >
              <SparkleIcon className="size-3.5 text-primary" />
              Table & Multi-Root
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.svg,.xml,.txt"
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
              Upload HTML / SVG
            </Button>
          </div>
        </div>

        {/* Conversion Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs backdrop-blur-xs">
          {/* Left group: Output Mode, Component Name, Indentation */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Output Mode Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Output:</span>
              <div className="inline-flex flex-wrap rounded-lg border border-border/70 bg-muted/40 p-0.5">
                {(
                  [
                    { id: "fragment", label: "JSX Snippet" },
                    { id: "component-jsx", label: "Component (.jsx)" },
                    { id: "component-tsx", label: "TSX Component (.tsx)" },
                    { id: "svg-icon-tsx", label: "SVG Icon (.tsx)" },
                  ] as Array<{ id: JsxOutputMode; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({ ...prev, outputMode: item.id }))
                    }
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      options.outputMode === item.id
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Component Name Input when in component mode */}
            {options.outputMode !== "fragment" && (
              <>
                <div className="h-4 w-px bg-border/70" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Name:</span>
                  <Input
                    value={options.componentName}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        componentName: e.target.value,
                      }))
                    }
                    placeholder="MyComponent"
                    className="h-7 w-40 font-mono text-xs"
                  />
                </div>
              </>
            )}

            <div className="h-4 w-px bg-border/70" />

            {/* Indentation Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Indent:</span>
              <Select
                value={options.indent}
                onValueChange={(val) =>
                  setOptions((prev) => ({ ...prev, indent: val as JsxIndentOption }))
                }
              >
                <SelectTrigger className="h-7 w-[105px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Spaces</SelectItem>
                  <SelectItem value="4">4 Spaces</SelectItem>
                  <SelectItem value="tab">Tab (\t)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right group: Transform Option Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({
                  ...prev,
                  uncontrolledFormProps: !prev.uncontrolledFormProps,
                }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.uncontrolledFormProps
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Convert input value/checked to defaultValue/defaultChecked"
            >
              defaultValue
            </button>

            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({
                  ...prev,
                  numericStylePx: !prev.numericStylePx,
                }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.numericStylePx
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Convert pixel values in style={{}} to numbers (e.g. 16px -> 16)"
            >
              Numeric px
            </button>

            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({
                  ...prev,
                  useSingleQuotes: !prev.useSingleQuotes,
                }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.useSingleQuotes
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Use single quotes instead of double quotes for JSX attributes"
            >
              <QuotesIcon className="size-3.5" />
              Single Quotes
            </button>

            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({
                  ...prev,
                  commentMode: prev.commentMode === "convert" ? "strip" : "convert",
                }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.commentMode === "strip"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Strip HTML comments instead of converting to {/* ... */}"
            >
              Strip Comments
            </button>

            <button
              type="button"
              onClick={() =>
                setOptions((prev) => ({
                  ...prev,
                  stripDataAttributes: !prev.stripDataAttributes,
                }))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                options.stripDataAttributes
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
              title="Remove data-* attributes from elements"
            >
              Strip data-*
            </button>
          </div>
        </div>

        {/* Transformation Diagnostics Banner */}
        {rawHtml.trim().length > 0 && result.isValid && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon
                  className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  weight="fill"
                />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Converted {result.stats.elementsCount}{" "}
                  {result.stats.elementsCount === 1 ? "element" : "elements"}
                </span>
                <span className="text-xs text-muted-foreground">
                  — {result.stats.attributesConverted} attribute
                  {result.stats.attributesConverted === 1 ? "" : "s"} transformed to React JSX
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {result.stats.stylesConverted > 0 && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {result.stats.stylesConverted} style{" "}
                    {result.stats.stylesConverted === 1 ? "object" : "objects"}
                  </Badge>
                )}
                {result.stats.svgAttrsConverted > 0 && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {result.stats.svgAttrsConverted} SVG camelCased
                  </Badge>
                )}
                {result.stats.voidTagsClosed > 0 && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {result.stats.voidTagsClosed} self-closed
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono text-[11px]">
                  {result.stats.outputLines} lines • {formatBytes(result.stats.outputBytes)}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Main Split Workspace */}
        <div className="grid min-h-[540px] flex-1 grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left Panel: Raw HTML / SVG Input */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
            {/* Input Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <CodeIcon className="size-4 text-primary" />
                <span className="text-xs font-semibold">HTML / SVG Input</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {rawLinesCount} {rawLinesCount === 1 ? "line" : "lines"} •{" "}
                  {formatBytes(result.stats.inputBytes)}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={async () => {
                    try {
                      const clip = await navigator.clipboard.readText();
                      if (clip) {
                        setRawHtml(clip);
                        toast.success("Pasted HTML from clipboard");
                      }
                    } catch {
                      toast.error("Clipboard permission denied");
                    }
                  }}
                >
                  Paste
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setRawHtml("")}
                  disabled={!rawHtml}
                >
                  <TrashIcon className="mr-1 size-3.5" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Raw HTML Editor with Line Numbers */}
            <div className="relative flex flex-1 overflow-hidden">
              {showLineNumbers && (
                <div
                  aria-hidden="true"
                  className="w-11 shrink-0 border-r border-border/50 bg-muted/20 py-4 pr-2.5 text-right font-mono text-xs leading-relaxed text-muted-foreground/50 select-none"
                >
                  {Array.from({ length: Math.max(1, rawLinesCount) }).map((_, i) => (
                    <div key={i + 1}>{i + 1}</div>
                  ))}
                </div>
              )}
              <textarea
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                placeholder="Paste raw HTML, SVG markup, or full document here..."
                spellCheck={false}
                className={cn(
                  "h-full min-h-[460px] w-full flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none",
                  wordWrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto",
                )}
              />
            </div>
          </div>

          {/* Right Panel: Shiki JSX/TSX Output & Transform Audit */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
            {/* Output Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-3.5 py-2">
              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab("code")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    previewTab === "code"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <FileCodeIcon className="size-3.5" />
                  {options.outputMode === "component-tsx" ||
                  options.outputMode === "svg-icon-tsx"
                    ? "TSX Output"
                    : "JSX Output"}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("audit")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    previewTab === "audit"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ArrowsLeftRightIcon className="size-3.5" />
                  Transformations
                  {result.transformLog.length > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 font-mono text-[10px]",
                        previewTab === "audit"
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {result.transformLog.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search, Line Numbers, Word Wrap, Copy, Download */}
              <div className="flex flex-wrap items-center gap-1.5">
                {previewTab === "code" && (
                  <>
                    <div className="relative">
                      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter lines..."
                        className="h-7 w-32 pl-7 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLineNumbers((prev) => !prev)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
                        showLineNumbers
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
                      )}
                      title="Toggle Line Numbers"
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
                          : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
                      )}
                      title="Toggle Word Wrap"
                    >
                      <TextAlignLeftIcon className="size-3.5" />
                    </button>
                  </>
                )}

                <CopyButton
                  value={result.jsx}
                  label="Copy JSX"
                  disabled={!result.jsx}
                />

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2.5 text-xs"
                  onClick={handleDownloadOutput}
                  disabled={!result.jsx}
                >
                  <DownloadSimpleIcon className="size-3.5" />
                  Download
                </Button>
              </div>
            </div>

            {/* Output Content Area */}
            <div className="relative flex-1 overflow-hidden">
              {previewTab === "code" && (
                <ShikiJsxPreview
                  code={result.jsx}
                  shikiTheme={effectiveShikiTheme}
                  showLineNumbers={showLineNumbers}
                  wordWrap={wordWrap}
                  searchQuery={searchQuery}
                />
              )}

              {previewTab === "audit" && (
                <TransformAuditTable records={result.transformLog} />
              )}
            </div>
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
