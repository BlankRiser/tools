import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { CopyIcon, ShieldIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function NoteRedactorPage() {
  const [text, setText] = useState("");
  const [redacted, setRedacted] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const redactRef = useRef<{ redaction(text: string): Promise<{ redactedText: string }>; dispose(): void } | null>(null);
  useEffect(() => () => redactRef.current?.dispose(), []);

  async function run() {
    if (!text.trim()) {
      toast.error("Enter some notes to redact");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const { Redact } = await import("@desert-ant-labs/redact");
      if (!redactRef.current) redactRef.current = await Redact.load();
      setProgress(100);
      setRedacted((await redactRef.current.redaction(text)).redactedText);
    } catch (error) {
      console.error(error);
      toast.error("Could not load the redaction model. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Note Redactor</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Find and mask personal information in your notes. Processing stays in your browser.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <label htmlFor="redact-input" className="font-semibold">
              Your notes
            </label>
            <Textarea
              id="redact-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste notes containing names, emails, phone numbers, addresses, or IDs…"
              className="h-96 resize-y font-mono text-sm"
            />
            <Button onClick={() => void run()} disabled={busy || !text.trim()}>
              <ShieldIcon data-icon="inline-start" />
              {busy ? "Loading model and redacting…" : "Redact personal information"}
            </Button>
            {busy && (
              <div role="status" className="text-sm text-muted-foreground">
                Downloading or loading Redact model… <progress className="ml-2 align-middle" max={100} value={progress} />
              </div>
            )}
          </section>
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Redacted notes</h2>
              <Button
                variant="outline"
                size="sm"
                disabled={!redacted}
                onClick={() =>
                  void navigator.clipboard
                    .writeText(redacted)
                    .then(() => toast.success("Redacted notes copied"))
                    .catch(() => toast.error("Could not copy notes"))
                }
              >
                <CopyIcon data-icon="inline-start" />
                Copy
              </Button>
            </div>
            <Textarea readOnly value={redacted} placeholder="Your redacted notes will appear here…" className="h-96 resize-y font-mono text-sm" />
          </section>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
