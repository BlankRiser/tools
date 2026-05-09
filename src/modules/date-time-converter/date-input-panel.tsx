import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { cn } from "#/lib/utils";
import { WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { CopyButton } from "../../components/ui/copy-button";

import type { InputMode } from "./use-date-time-store";

interface Representation {
  label: string;
  value: string;
}

interface DateInputPanelProps {
  inputValue: string;
  inputMode: InputMode;
  parseError: string | null;
  representations: Representation[];
  onInputChange: (value: string) => void;
  onModeChange: (mode: InputMode) => void;
}

const MODE_LABELS: Record<InputMode, string> = {
  iso: "ISO 8601",
  "unix-s": "Unix (seconds)",
  "unix-ms": "Unix (ms)",
  rfc: "RFC Date",
  custom: "Custom",
};

const MODE_PLACEHOLDERS: Record<InputMode, string> = {
  iso: "2024-01-15T10:30:00.000Z",
  "unix-s": "1705312200",
  "unix-ms": "1705312200000",
  rfc: "Mon, 15 Jan 2024 10:30:00 GMT",
  custom: "Jan 15, 2024 10:30:00 AM",
};

export function DateInputPanel({ inputValue, inputMode, parseError, representations, onInputChange, onModeChange }: DateInputPanelProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Input / Conversion</h2>
        <Select value={inputMode} onValueChange={(v: any) => onModeChange(v)}>
          <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
            <SelectValue>{(value: string | null) => (value ? MODE_LABELS[value as InputMode] : "")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(MODE_LABELS) as InputMode[]).map((mode) => (
              <SelectItem key={mode} value={mode}>
                {MODE_LABELS[mode]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="dt-input" className="text-xs text-muted-foreground">
          Enter date-time
        </Label>
        <div className="relative flex items-center gap-2">
          <Input
            id="dt-input"
            type={inputMode === "custom" ? "datetime-local" : "text"}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={MODE_PLACEHOLDERS[inputMode]}
            className={cn("font-mono text-sm", parseError && inputValue ? "border-destructive focus-visible:ring-destructive/20" : "")}
          />
          {inputValue && (
            <Button variant="ghost" size="icon-sm" onClick={() => onInputChange("")} title="Clear input">
              <XCircleIcon weight="fill" className="text-muted-foreground" />
            </Button>
          )}
        </div>
        {parseError && inputValue && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <WarningCircleIcon className="size-3.5 shrink-0" />
            {parseError}
          </div>
        )}
        {!inputValue && <p className="text-xs text-muted-foreground">Paste any date-time string to change the base date.</p>}
      </div>

      <div className="flex flex-col gap-0 overflow-hidden rounded-lg border">
        {representations.map((rep, i) => (
          <div
            key={rep.label}
            className={cn(
              "group flex items-center justify-between gap-2 px-3 py-2",
              i !== representations.length - 1 && "border-b",
              "transition-colors hover:bg-muted/40",
            )}
          >
            <span className="w-24 shrink-0 text-2xs font-semibold text-muted-foreground uppercase">{rep.label}</span>
            <span className="flex-1 truncate font-mono text-xs">{rep.value}</span>
            <CopyButton value={rep.value} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
