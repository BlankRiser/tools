import { Button } from "#/components/ui/button";
import { CopyButton } from "#/components/ui/copy-button";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import { FileArrowUpIcon, ImageSquareIcon, TrashIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatBytes, formatCount, imageFileFromClipboard, loadImageSize, readFileAsDataUrl, toDataUrl } from "./codec";

type EncodedImage = {
  name: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  dataUrl: string;
  rawBase64: string;
  objectUrl: string;
};

export function EncodePanel() {
  const [encoded, setEncoded] = useState<EncodedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asDataUrl, setAsDataUrl] = useState(true);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (encoded?.objectUrl) URL.revokeObjectURL(encoded.objectUrl);
    };
  }, [encoded?.objectUrl]);

  const encodeFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !looksLikeImageName(file.name)) {
      setError("Choose an image file (PNG, JPEG, GIF, WebP, SVG, and similar).");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const comma = dataUrl.indexOf(",");
      const rawBase64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      const header = comma >= 0 ? dataUrl.slice(0, comma) : "";
      const mimeFromHeader = header.match(/^data:([^;,]+)/i)?.[1] ?? (file.type || "image/png");
      const mime = mimeFromHeader.startsWith("image/") ? mimeFromHeader : file.type || "image/png";
      const objectUrl = URL.createObjectURL(file);
      const size = await loadImageSize(objectUrl);

      setEncoded((prev) => {
        if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
        return {
          name: file.name || "image",
          mime,
          bytes: file.size,
          width: size.width,
          height: size.height,
          dataUrl: mimeFromHeader.startsWith("image/") ? dataUrl : toDataUrl(mime, rawBase64),
          rawBase64,
          objectUrl,
        };
      });
      setError(null);
    } catch {
      setError("Could not encode this file as Base64.");
    }
  }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = imageFileFromClipboard(event);
      if (file) {
        event.preventDefault();
        void encodeFile(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [encodeFile]);

  const output = encoded ? (asDataUrl ? encoded.dataUrl : encoded.rawBase64) : "";

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void encodeFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void encodeFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
        )}
      >
        <ImageSquareIcon className="size-8 text-muted-foreground" weight="duotone" />
        <span className="text-sm font-medium">Drop an image, click to browse, or paste from the clipboard</span>
        <span className="text-xs text-muted-foreground">PNG, JPEG, GIF, WebP, SVG, and other browser-supported formats</span>
      </button>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {encoded && (
        <>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr]">
            <div className="flex items-center justify-center overflow-hidden rounded-xl border bg-muted/30 p-3">
              <img src={encoded.objectUrl} alt={encoded.name} className="max-h-56 max-w-full object-contain" />
            </div>
            <dl className="grid grid-cols-2 content-start gap-2">
              <Meta label="File" value={encoded.name} />
              <Meta label="MIME" value={encoded.mime} />
              <Meta label="Pixels" value={`${encoded.width} × ${encoded.height}`} />
              <Meta label="File size" value={formatBytes(encoded.bytes)} />
              <Meta label="Encoded" value={`${formatCount(output.length)} chars`} />
            </dl>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label htmlFor="encode-output" className="text-lg font-semibold">
                Output
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch id="data-url-toggle" checked={asDataUrl} onCheckedChange={(checked) => setAsDataUrl(checked === true)} size="sm" />
                  <Label htmlFor="data-url-toggle" className="text-xs font-normal text-muted-foreground">
                    Data URL
                  </Label>
                </div>
                <CopyButton value={output} variant="outline" size="icon" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEncoded((prev) => {
                      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
                      return null;
                    });
                    setError(null);
                  }}
                >
                  <TrashIcon data-icon="inline-start" />
                  Clear
                </Button>
              </div>
            </div>
            <Textarea id="encode-output" readOnly value={output} spellCheck={false} className="h-56 resize-none overflow-auto font-mono text-xs [field-sizing:fixed]" />
          </div>
        </>
      )}

      {!encoded && (
        <Button variant="outline" className="w-fit" onClick={() => inputRef.current?.click()}>
          <FileArrowUpIcon data-icon="inline-start" />
          Choose image
        </Button>
      )}
    </div>
  );
}

function looksLikeImageName(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(name);
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
