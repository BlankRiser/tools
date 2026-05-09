import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { CopyButton } from "../../components/ui/copy-button";
import { getFormatsForFormat } from "../../lib/date-time-utils";
import type { DisplayFormat } from "./use-date-time-store";
import { formatDatetime } from "../../lib/date-time-utils";

interface FormatPanelProps {
  displayFormat: DisplayFormat;
  customFormat: string;
  effectiveDate: Date;
  onFormatChange: (fmt: DisplayFormat) => void;
  onCustomFormatChange: (fmt: string) => void;
}

const FORMAT_OPTIONS: { value: DisplayFormat; label: string }[] = [
  { value: "iso8601", label: "ISO 8601" },
  { value: "rfc2822", label: "RFC 2822" },
  { value: "rfc3339", label: "RFC 3339" },
  { value: "unix", label: "Unix Timestamp" },
  { value: "locale", label: "Locale Format" },
  { value: "human", label: "Human Readable" },
  { value: "12hour", label: "12-Hour" },
  { value: "24hour", label: "24-Hour" },
  { value: "custom", label: "Custom Token" },
];

export function FormatPanel({
  displayFormat,
  customFormat,
  effectiveDate,
  onFormatChange,
  onCustomFormatChange,
}: FormatPanelProps) {
  const preview = formatDatetime(effectiveDate, displayFormat, customFormat);
  const tokenHint = getFormatsForFormat(displayFormat, customFormat);

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm">
      <h2 className="text-sm font-semibold">Format Controls</h2>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Display Format</Label>
          <Select value={displayFormat} onValueChange={(v: any) => onFormatChange(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  value ? FORMAT_OPTIONS.find((o) => o.value === value)?.label ?? value : ""
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {displayFormat === "custom" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-fmt" className="text-xs text-muted-foreground">
              Custom Token Pattern{" "}
              <a
                href="https://date-fns.org/docs/format"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary underline underline-offset-2"
              >
                Reference ↗
              </a>
            </Label>
            <Input
              id="custom-fmt"
              value={customFormat}
              onChange={(e) => onCustomFormatChange(e.target.value)}
              placeholder="yyyy-MM-dd HH:mm:ss"
              className="font-mono text-sm"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Live Preview</Label>
          <div className="group flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <span className="flex-1 truncate font-mono text-sm font-medium">{preview}</span>
            <CopyButton
              value={preview}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          {tokenHint && (
            <p className="text-2xs font-mono text-muted-foreground">{tokenHint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
