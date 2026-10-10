import { Button } from "#/components/ui/button";
import { CopyButton } from "#/components/ui/copy-button";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { DownloadSimpleIcon, FileArrowUpIcon, TrashIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { downloadBytes, downloadFilename, formatBytes, formatCount, loadImageSize, parseBase64Input } from "./codec";

export function DecodePanel() {
  const [input, setInput] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => (input.trim() ? parseBase64Input(input) : null), [input]);

  const handleDecodedImage = async (dataUrl: string) => {
    try {
      const size = await loadImageSize(dataUrl);
      setDimensions(size);
      setRenderError(null);
    } catch (error) {
      setDimensions(null);
      setRenderError(error instanceof Error ? error.message : "The browser could not render this image.");
    }
  };

  const payload = parsed?.ok ? parsed.value : null;
  const parseError = parsed && !parsed.ok ? parsed.error : null;
  const error = parseError ?? renderError;

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.b64,.base64,text/plain"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setInput(await file.text());
          setRenderError(null);
          setDimensions(null);
        }}
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="decode-input" className="text-lg font-semibold">
            Base64 input
          </Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileArrowUpIcon data-icon="inline-start" />
              Load file
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!input}
              onClick={() => {
                setInput("");
                setRenderError(null);
                setDimensions(null);
              }}
            >
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>
        <Textarea
          id="decode-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setRenderError(null);
            setDimensions(null);
          }}
          spellCheck={false}
          placeholder="Paste a data URL or raw Base64 string."
          className="[field-sizing:fixed] h-48 resize-none overflow-auto font-mono text-xs"
        />
      </div>

      {error && input.trim() && <p className="text-sm font-medium text-destructive">{error}</p>}

      {payload && !parseError && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center overflow-hidden rounded-xl border bg-muted/30 p-3">
              <img
                src={payload.dataUrl}
                alt="Decoded"
                className="max-h-72 max-w-full object-contain"
                onLoad={() => {
                  void handleDecodedImage(payload.dataUrl);
                }}
                onError={() => {
                  setDimensions(null);
                  setRenderError("The browser could not render this image.");
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={payload.dataUrl} variant="outline" />
              <Button onClick={() => downloadBytes(payload.bytes, downloadFilename(payload.mime), payload.mime)} disabled={Boolean(renderError)}>
                <DownloadSimpleIcon data-icon="inline-start" />
                Download {downloadFilename(payload.mime)}
              </Button>
            </div>
          </div>
          <dl className="grid grid-cols-1 content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Meta label="MIME" value={payload.mime} />
            <Meta label="Pixels" value={dimensions ? `${dimensions.width} × ${dimensions.height}` : "…"} />
            <Meta label="Decoded size" value={formatBytes(payload.bytes.length)} />
            <Meta label="Base64 length" value={`${formatCount(payload.rawBase64.length)} chars`} />
          </dl>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border bg-muted/30 px-3 py-2">
      <dt className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="truncate font-mono text-sm" title={value}>
        {value}
      </dd>
    </div>
  );
}
