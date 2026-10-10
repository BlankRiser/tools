import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { CopyButton } from "#/components/ui/copy-button";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import { CheckIcon, ClipboardTextIcon, CodeIcon, EyeIcon, FileArrowUpIcon, TrashIcon } from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { convertMarkdown, copyRichTextToClipboard } from "./markdown-converter";

const SAMPLE_MARKDOWN = `# Release Notes — v2.4.0

Convert **Markdown** into formatted *rich text* ready to paste directly into **Google Docs**, **Notion**, **Microsoft Word**, **Gmail**, or **Slack**.

## Key Highlights

- **Instant Rich Clipboard**: Copies both \`text/html\` and \`text/plain\` MIME payloads.
- **Full GFM Support**: Tables, task lists, ~~strikethrough~~, blockquotes, and code blocks.
- **Zero Cleanup**: Preserves heading hierarchy, list indentation, and inline code formatting.

### Launch Checklist

- [x] Parse GitHub Flavored Markdown
- [x] Generate inline-styled HTML for rich-text editors
- [ ] Share with the engineering team

> "Simplicity is about subtracting the obvious and adding the meaningful." — John Maeda

### Benchmark Summary

| Target App | Headings & Lists | Tables | Code Blocks |
| :--- | :--- | :--- | :--- |
| Google Docs | Supported | Supported | Supported |
| Notion | Supported | Supported | Supported |
| Gmail / Slack | Supported | Supported | Supported |

### Example Snippet

\`\`\`ts
const item = new ClipboardItem({
  "text/html": new Blob([html], { type: "text/html" }),
  "text/plain": new Blob([text], { type: "text/plain" }),
});
await navigator.clipboard.write([item]);
\`\`\`

---

Need more tools? Visit [DevHaven Tools](https://github.com/BlankRiser/tools).`;

type OutputTab = "preview" | "html";

const RICH_TEXT_PREVIEW_CLASSES = cn(
  "text-sm leading-relaxed text-foreground",
  "[&_h1]:mt-5 [&_h1]:mb-3 [&_h1]:border-b [&_h1]:border-border/60 [&_h1]:pb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1:first-child]:mt-0",
  "[&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2:first-child]:mt-0",
  "[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3:first-child]:mt-0",
  "[&_h4]:mt-3 [&_h4]:mb-1.5 [&_h4]:text-sm [&_h4]:font-semibold",
  "[&_p]:my-2.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6",
  "[&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6",
  "[&_li]:leading-relaxed [&_li>input[type=checkbox]]:mr-2 [&_li>input[type=checkbox]]:accent-primary",
  "[&_blockquote]:my-3 [&_blockquote]:rounded-r-md [&_blockquote]:border-l-2 [&_blockquote]:border-primary/60 [&_blockquote]:bg-muted/40 [&_blockquote]:py-1.5 [&_blockquote]:pr-3 [&_blockquote]:pl-3.5 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/60 [&_pre]:bg-muted/50 [&_pre]:p-3.5 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-relaxed",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-left",
  "[&_hr]:my-5 [&_hr]:border-border/70",
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-80",
  "[&_del]:text-muted-foreground [&_del]:line-through",
  "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg",
);

export function MarkdownToRichTextPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [activeTab, setActiveTab] = useState<OutputTab>("preview");
  const [copiedRich, setCopiedRich] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversion = useMemo(() => convertMarkdown(markdown), [markdown]);

  const handleCopyRichText = useCallback(async () => {
    if (!conversion.html) return;
    try {
      await copyRichTextToClipboard(conversion.clipboardHtml, conversion.plainText);
      setCopiedRich(true);
      toast.success("Rich text copied to clipboard");
      setTimeout(() => setCopiedRich(false), 1800);
    } catch (error) {
      console.error("Failed to copy rich text:", error);
      toast.error("Could not copy rich text to clipboard");
    }
  }, [conversion]);

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
            <h1 className="text-3xl font-bold tracking-tight">Markdown to Rich Text</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Convert Markdown into formatted rich text ready to paste into Google Docs, Notion, Word, Gmail, or Slack.
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
            <Button variant="outline" onClick={() => setMarkdown(SAMPLE_MARKDOWN)} disabled={markdown === SAMPLE_MARKDOWN}>
              Sample
            </Button>
            <Button variant="ghost" onClick={() => setMarkdown("")} disabled={!markdown}>
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* Left Column: Markdown Input */}
          <div className="flex flex-col gap-2">
            <div className="flex min-h-8 items-center justify-between gap-2">
              <Label htmlFor="markdown-input" className="text-base font-semibold">
                Markdown Source
              </Label>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {conversion.wordCount.toLocaleString()} words · {conversion.charCount.toLocaleString()} chars
              </span>
            </div>

            <Textarea
              id="markdown-input"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
              placeholder="Type or paste Markdown here..."
              className="[field-sizing:fixed] h-[34rem] min-h-[26rem] resize-none overflow-auto font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Right Column: Rich Text Output / HTML Source */}
          <div className="flex flex-col gap-2">
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    activeTab === "preview" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <EyeIcon className="size-3.5" />
                  Rich Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("html")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    activeTab === "html" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CodeIcon className="size-3.5" />
                  HTML
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <CopyButton value={activeTab === "html" ? conversion.html : conversion.plainText} variant="outline" size="icon-sm" />
                <Button size="sm" onClick={handleCopyRichText} disabled={!conversion.html} className="gap-1.5">
                  {copiedRich ? (
                    <>
                      <CheckIcon weight="bold" className="size-4" />
                      Copied Rich Text
                    </>
                  ) : (
                    <>
                      <ClipboardTextIcon weight="duotone" className="size-4" />
                      Copy Rich Text
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!conversion.html ? (
              <div className="flex h-[34rem] min-h-[26rem] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-card/30 p-6 text-center">
                <ClipboardTextIcon className="mb-2 size-8 text-muted-foreground/60" weight="duotone" />
                <p className="text-sm font-medium text-muted-foreground">Rich text preview will appear here</p>
                <p className="mt-1 text-xs text-muted-foreground/80">Start typing Markdown on the left or load a sample document.</p>
              </div>
            ) : activeTab === "preview" ? (
              <div
                className={cn(
                  "h-[34rem] min-h-[26rem] overflow-auto rounded-lg border border-input bg-card p-5 dark:bg-input/20",
                  RICH_TEXT_PREVIEW_CLASSES,
                )}
                dangerouslySetInnerHTML={{ __html: conversion.html }}
              />
            ) : (
              <pre className="h-[34rem] min-h-[26rem] overflow-auto rounded-lg border border-input bg-card p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-foreground dark:bg-input/20">
                <code>{conversion.html}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
