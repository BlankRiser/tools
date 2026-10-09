import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import {
  CheckIcon,
  CopyIcon,
  EraserIcon,
  FileArrowUpIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_STRIP_OPTIONS,
  stripMarkdown,
  type StripMarkdownOptions,
} from "./strip-markdown";

const SAMPLE_MARKDOWN = `## Quarterly summary

**Revenue** grew *12%* — full numbers in [the report](https://example.com/q2-report).

Key wins:
- Closed the ~~stalled~~ enterprise deal
- Cut \`p95\` latency in half

| Metric | Q1 | Q2 |
| ------ | -- | -- |
| MRR | $84k | $94k |
| Churn | 2.1% | 1.8% |`;

const OPTION_ITEMS: Array<{
  key: keyof StripMarkdownOptions;
  label: string;
  hint: string;
}> = [
  {
    key: "keepListBullets",
    label: "Keep list bullets",
    hint: "Preserve • and numbered markers",
  },
  {
    key: "includeLinkUrls",
    label: "Include link URLs",
    hint: "Append (url) after link text",
  },
  {
    key: "keepCodeBlocks",
    label: "Keep code blocks",
    hint: "Strip fences, keep code body",
  },
  {
    key: "stripHtmlTags",
    label: "Strip HTML tags",
    hint: "Remove inline <kbd>, <span>, etc.",
  },
  {
    key: "collapseBlankLines",
    label: "Collapse blank lines",
    hint: "Limit consecutive empty lines",
  },
];

export function MarkdownStripperPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [options, setOptions] = useState<StripMarkdownOptions>(DEFAULT_STRIP_OPTIONS);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const result = useMemo(
    () => stripMarkdown(markdown, options),
    [markdown, options],
  );

  const toggleOption = (key: keyof StripMarkdownOptions, checked: boolean) => {
    setOptions((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleCopy = useCallback(async () => {
    if (!result.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      toast.success("Clean plain text copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy plain text:", error);
      toast.error("Could not copy text to clipboard");
    }
  }, [result.text]);

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
            <h1 className="text-3xl font-bold tracking-tight">Markdown Stripper</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Strip Markdown symbols, formatting, frontmatter, and HTML tags from any text to extract clean, readable plain text.
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

        {/* Options Bar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
          {OPTION_ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center gap-2 text-sm select-none"
            >
              <Checkbox
                checked={options[item.key]}
                onCheckedChange={(checked) =>
                  toggleOption(item.key, checked === true)
                }
              />
              <span className="font-medium">{item.label}</span>
              <span className="hidden text-xs text-muted-foreground xl:inline">
                ({item.hint})
              </span>
            </label>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* Left Column: Markdown Source */}
          <div className="flex flex-col gap-2">
            <div className="flex min-h-8 items-center justify-between gap-2">
              <Label htmlFor="strip-markdown-input" className="text-base font-semibold">
                Markdown Input
              </Label>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {result.originalChars.toLocaleString()} chars
              </span>
            </div>

            <Textarea
              id="strip-markdown-input"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
              placeholder="Paste Markdown with # headings, **bold**, [links](...), code blocks, or tables..."
              className="h-[32rem] min-h-[24rem] resize-none overflow-auto font-mono text-sm leading-relaxed [field-sizing:fixed]"
            />
          </div>

          {/* Right Column: Clean Plain Text Output */}
          <div className="flex flex-col gap-2">
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Label htmlFor="strip-markdown-output" className="text-base font-semibold">
                  Clean Plain Text
                </Label>
                {result.removedChars > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-2xs font-medium text-primary">
                    −{result.removedChars.toLocaleString()} chars stripped
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {result.wordCount.toLocaleString()} words · {result.cleanedChars.toLocaleString()} chars
                </span>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  disabled={!result.text}
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
                      Copy Plain Text
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!result.text ? (
              <div className="flex h-[32rem] min-h-[24rem] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-card/30 p-6 text-center">
                <EraserIcon className="mb-2 size-8 text-muted-foreground/60" weight="duotone" />
                <p className="text-sm font-medium text-muted-foreground">
                  Clean plain text will appear here
                </p>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Paste Markdown on the left to strip all formatting symbols.
                </p>
              </div>
            ) : (
              <Textarea
                id="strip-markdown-output"
                value={result.text}
                readOnly
                spellCheck={false}
                className="h-[32rem] min-h-[24rem] resize-none overflow-auto font-mono text-sm leading-relaxed [field-sizing:fixed]"
              />
            )}
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
