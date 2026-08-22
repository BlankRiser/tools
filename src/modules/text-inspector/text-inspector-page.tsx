import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { FileArrowUpIcon, TrashIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState, useTransition } from "react";
import { analyzeText, formatBytes, formatCount } from "./analyze-text";
import { TextMetricsPanel } from "./text-metrics-panel";

const SAMPLE_TEXT = `DevHaven Tools is a small workshop for developers who live in the details.

Paste a log, a README, a draft, or a novel. The inspector counts characters, words, sentences, and paragraphs; it also reports UTF-8 bytes, ASCII versus Unicode, reading time, and which tokens show up most often.

It's meant for huge pastes. Drop a .txt file if the clipboard is the bottleneck.`;

export function TextInspectorPage() {
  const [text, setText] = useState("");
  const [deferredText, setDeferredText] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysis = useMemo(() => analyzeText(deferredText), [deferredText]);

  const updateText = (next: string) => {
    setText(next);
    startTransition(() => setDeferredText(next));
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const contents = await file.text();
    updateText(contents);
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Text Inspector</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Paste any length of text and inspect characters, words, sentences, encoding, and frequency.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json,.csv,.log,.xml,.html,.css,.js,.ts,text/*"
              className="sr-only"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileArrowUpIcon data-icon="inline-start" />
              Load file
            </Button>
            <Button variant="outline" onClick={() => updateText(SAMPLE_TEXT)} disabled={text === SAMPLE_TEXT}>
              Sample
            </Button>
            <Button variant="ghost" onClick={() => updateText("")} disabled={!text}>
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="flex min-h-[28rem] flex-col gap-2">
            <Label htmlFor="text-inspector-input" className="text-lg font-semibold">
              Source
            </Label>
            <Textarea
              id="text-inspector-input"
              value={text}
              onChange={(event) => updateText(event.target.value)}
              placeholder="Paste or type here. Large documents are welcome."
              spellCheck={false}
              className="h-[32rem] min-h-[28rem] resize-none overflow-auto font-mono text-sm [field-sizing:fixed]"
            />
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatCount(text.length)} characters
              {analysis.bytes > 0 ? ` · ${formatBytes(analysis.bytes)}` : ""}
              {isPending ? " · updating…" : ""}
            </p>
          </div>

          <TextMetricsPanel analysis={analysis} stale={isPending} />
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
