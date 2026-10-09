import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import {
  CheckIcon,
  CodeIcon,
  CopyIcon,
  EyeIcon,
  FileArrowUpIcon,
  ListNumbersIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_TOC_OPTIONS,
  generateMarkdownToc,
  type TocGeneratorOptions,
  type TocListStyle,
} from "./generate-toc";

const SAMPLE_MARKDOWN = `# Introduction

Welcome to the document.

## Getting Started

This section covers the basics.

### Prerequisites

What you need before starting.

### Installation

How to install the software.

## Usage

### Basic Usage

Simple examples.

### Advanced Usage

More complex examples.

## API Reference

### Methods

Available methods.

### Events

Event handling.

## Contributing

How to contribute.

## License

License information.`;

const LIST_STYLES: Array<{ value: TocListStyle; label: string }> = [
  { value: "hierarchical", label: "1.1. Hierarchical" },
  { value: "bullet", label: "- Bullet" },
  { value: "ordered", label: "1. Ordered" },
];

const DEPTH_LEVELS = [1, 2, 3, 4, 5, 6] as const;

type OutputView = "markdown" | "preview";

export function MarkdownTocGeneratorPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [options, setOptions] = useState<TocGeneratorOptions>(DEFAULT_TOC_OPTIONS);
  const [activeView, setActiveView] = useState<OutputView>("markdown");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const result = useMemo(
    () => generateMarkdownToc(markdown, options),
    [markdown, options],
  );

  const handleCopy = useCallback(async () => {
    if (!result.tocMarkdown) return;
    try {
      await navigator.clipboard.writeText(result.tocMarkdown);
      setCopied(true);
      toast.success("Table of Contents copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy TOC:", error);
      toast.error("Could not copy Table of Contents");
    }
  }, [result.tocMarkdown]);

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setMarkdown(text);
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Markdown TOC Generator</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Generate a GitHub-ready Markdown Table of Contents with anchor links from your document headings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.mdx,.txt,text/markdown,text/plain"
              className="sr-only"
              onChange={(e) => {
                void handleFileUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileArrowUpIcon data-icon="inline-start" />
              Load .md
            </Button>
            <Button
              variant="outline"
              onClick={() => setMarkdown(SAMPLE_MARKDOWN)}
              disabled={markdown === SAMPLE_MARKDOWN}
            >
              Sample
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMarkdown("")}
              disabled={!markdown}
            >
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-5">
            {/* List Style */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Style</span>
              <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                {LIST_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({ ...prev, listStyle: style.value }))
                    }
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors",
                      options.listStyle === style.value
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Heading Depth */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Max Depth</span>
              <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                {DEPTH_LEVELS.map((depth) => (
                  <button
                    key={depth}
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({
                        ...prev,
                        maxDepth: depth,
                        minDepth: Math.min(prev.minDepth, depth),
                      }))
                    }
                    className={cn(
                      "rounded-md px-2 py-1 font-mono text-xs font-medium transition-colors",
                      options.maxDepth === depth
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    H{depth}
                  </button>
                ))}
              </div>
            </div>

            {/* Indent Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Indent</span>
              <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                {([2, 4] as const).map((spaces) => (
                  <button
                    key={spaces}
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({ ...prev, indentSize: spaces }))
                    }
                    className={cn(
                      "rounded-md px-2 py-1 font-mono text-xs font-medium transition-colors",
                      options.indentSize === spaces
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {spaces}sp
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
            <Checkbox
              checked={options.includeLinks}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, includeLinks: checked === true }))
              }
            />
            <span className="font-medium">Include GitHub anchor links</span>
          </label>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* Left Column: Document Input */}
          <div className="flex flex-col gap-2">
            <div className="flex min-h-8 items-center justify-between gap-2">
              <Label htmlFor="toc-markdown-input" className="text-base font-semibold">
                Markdown Document
              </Label>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {result.items.length} of {result.totalHeadingsInDoc} headings included
              </span>
            </div>

            <Textarea
              id="toc-markdown-input"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
              placeholder="Paste your Markdown document with # headings..."
              className="h-[32rem] min-h-[24rem] resize-none overflow-auto font-mono text-sm leading-relaxed [field-sizing:fixed]"
            />
          </div>

          {/* Right Column: Generated TOC */}
          <div className="flex flex-col gap-2">
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Label htmlFor="toc-markdown-output" className="text-base font-semibold">
                  Generated Table of Contents
                </Label>
                <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveView("markdown")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      activeView === "markdown"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CodeIcon className="size-3.5" />
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView("preview")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      activeView === "preview"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <EyeIcon className="size-3.5" />
                    Preview
                  </button>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleCopy}
                disabled={!result.tocMarkdown}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <CheckIcon weight="bold" className="size-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon weight="bold" className="size-4" />
                    Copy TOC
                  </>
                )}
              </Button>
            </div>

            {!result.tocMarkdown ? (
              <div className="flex h-[32rem] min-h-[24rem] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-card/30 p-6 text-center">
                <ListNumbersIcon className="mb-2 size-8 text-muted-foreground/60" weight="duotone" />
                <p className="text-sm font-medium text-muted-foreground">
                  No headings found for the selected depth
                </p>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Add Markdown headings (#, ##, ###) or increase the Max Depth setting.
                </p>
              </div>
            ) : activeView === "markdown" ? (
              <Textarea
                id="toc-markdown-output"
                value={result.tocMarkdown}
                readOnly
                spellCheck={false}
                className="h-[32rem] min-h-[24rem] resize-none overflow-auto font-mono text-sm leading-relaxed [field-sizing:fixed]"
              />
            ) : (
              <div className="h-[32rem] min-h-[24rem] overflow-auto rounded-lg border border-input bg-card p-5 dark:bg-input/20">
                <ul className="space-y-1.5 text-sm">
                  {result.items.map((item, idx) => {
                    const marker =
                      options.listStyle === "hierarchical"
                        ? item.numberLabel
                        : options.listStyle === "ordered"
                          ? `${item.orderedNumber}.`
                          : "•";
                    return (
                      <li
                        key={`${item.slug}-${idx}`}
                        style={{ paddingLeft: `${item.level * 1.25}rem` }}
                        className="flex items-baseline gap-2 leading-relaxed"
                      >
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {marker}
                        </span>
                        {options.includeLinks ? (
                          <span className="font-medium text-primary underline underline-offset-4">
                            {item.text}
                          </span>
                        ) : (
                          <span className="font-medium text-foreground">
                            {item.text}
                          </span>
                        )}
                        <span className="font-mono text-2xs text-muted-foreground/70">
                          #{item.slug}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
