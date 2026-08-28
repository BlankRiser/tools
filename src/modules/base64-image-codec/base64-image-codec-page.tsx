import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { useState, type ReactNode } from "react";
import type { CodecMode } from "./codec";
import { DecodePanel } from "./decode-panel";
import { EncodePanel } from "./encode-panel";

export function Base64ImageCodecPage() {
  const [mode, setMode] = useState<CodecMode>("encode");

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Base64 Image Codec</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Encode images to Base64 strings, or decode Base64 back into a preview you can copy and download.
            </p>
          </div>
          <div className="flex rounded-lg border bg-muted/40 p-0.5">
            <ModeButton active={mode === "encode"} onClick={() => setMode("encode")}>
              Encode
            </ModeButton>
            <ModeButton active={mode === "decode"} onClick={() => setMode("decode")}>
              Decode
            </ModeButton>
          </div>
        </div>

        {mode === "encode" ? <EncodePanel /> : <DecodePanel />}
      </div>
    </GlobalErrorBoundary>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("rounded-md", active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
    >
      {children}
    </Button>
  );
}
