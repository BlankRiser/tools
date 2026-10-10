import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import {
  ArrowsClockwiseIcon,
  ArrowsLeftRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FileArrowUpIcon,
  GearIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { convertData, DEFAULT_CONVERTER_OPTIONS, detectFormat, type DataConverterOptions, type DataFormat } from "./data-converter";

const FORMAT_OPTIONS: Array<{ value: DataFormat; label: string; ext: string }> = [
  { value: "json", label: "JSON", ext: ".json" },
  { value: "jsonl", label: "JSONL", ext: ".jsonl" },
  { value: "csv", label: "CSV", ext: ".csv" },
  { value: "tsv", label: "TSV", ext: ".tsv" },
  { value: "yaml", label: "YAML", ext: ".yaml" },
  { value: "toml", label: "TOML", ext: ".toml" },
  { value: "xml", label: "XML", ext: ".xml" },
];

const SAMPLE_DATASETS: Record<string, { label: string; format: DataFormat; data: string }> = {
  users: {
    label: "Users Table",
    format: "json",
    data: JSON.stringify(
      [
        { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin", active: true },
        { id: 2, name: "Bob Smith", email: "bob@example.com", role: "developer", active: true },
        { id: 3, name: "Carol Danvers", email: "carol@example.com", role: "designer", active: false },
        { id: 4, name: "Dave Miller", email: "dave@example.com", role: "manager", active: true },
      ],
      null,
      2,
    ),
  },
  config: {
    label: "App Config",
    format: "yaml",
    data: `app:
  name: DevHaven Tools
  version: 1.0.0
  environment: production
server:
  host: 0.0.0.0
  port: 8080
  cors:
    enabled: true
    origins:
      - https://devhaven.tools
      - https://app.devhaven.tools
database:
  driver: postgres
  pool_size: 20
  timeout_seconds: 30`,
  },
  logs: {
    label: "JSONL Logs",
    format: "jsonl",
    data: `{"timestamp":"2026-10-10T10:00:00Z","level":"info","event":"server_boot","port":8080}
{"timestamp":"2026-10-10T10:01:23Z","level":"info","event":"request","method":"GET","path":"/tools","status":200}
{"timestamp":"2026-10-10T10:02:45Z","level":"warn","event":"rate_limit_exceeded","ip":"192.168.1.42"}
{"timestamp":"2026-10-10T10:03:12Z","level":"error","event":"db_connection_timeout","retry":1}`,
  },
};

export function DataConverterPage() {
  const [sourceFormat, setSourceFormat] = useState<DataFormat>("json");
  const [targetFormat, setTargetFormat] = useState<DataFormat>("yaml");
  const [input, setInput] = useState(SAMPLE_DATASETS.users.data);
  const [options, setOptions] = useState<DataConverterOptions>(DEFAULT_CONVERTER_OPTIONS);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversion = useMemo(() => convertData(input, sourceFormat, targetFormat, options), [input, sourceFormat, targetFormat, options]);

  const handleSwap = () => {
    if (conversion.output && !conversion.error) {
      setInput(conversion.output);
    }
    const prevSource = sourceFormat;
    setSourceFormat(targetFormat);
    setTargetFormat(prevSource);
  };

  const handleAutoDetect = () => {
    const detected = detectFormat(input);
    setSourceFormat(detected);
    toast.info(`Detected format: ${detected.toUpperCase()}`);
  };

  const handleCopy = useCallback(async () => {
    if (!conversion.output) return;
    try {
      await navigator.clipboard.writeText(conversion.output);
      setCopied(true);
      toast.success("Converted output copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy output to clipboard");
    }
  }, [conversion.output]);

  const handleDownload = () => {
    if (!conversion.output) return;
    const targetMeta = FORMAT_OPTIONS.find((f) => f.value === targetFormat);
    const ext = targetMeta?.ext || `.${targetFormat}`;
    const filename = `converted-data${ext}`;
    const blob = new Blob([conversion.output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setInput(text);

    // Try auto-detecting format from filename extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "json") setSourceFormat("json");
    else if (ext === "jsonl" || ext === "ndjson") setSourceFormat("jsonl");
    else if (ext === "csv") setSourceFormat("csv");
    else if (ext === "tsv") setSourceFormat("tsv");
    else if (ext === "yaml" || ext === "yml") setSourceFormat("yaml");
    else if (ext === "toml") setSourceFormat("toml");
    else if (ext === "xml") setSourceFormat("xml");
    else {
      setSourceFormat(detectFormat(text));
    }
    toast.success(`Loaded ${file.name}`);
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Format Converter</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Convert seamlessly between JSON, JSONL, CSV, TSV, YAML, TOML, and XML in any direction with automatic validation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.jsonl,.ndjson,.csv,.tsv,.yaml,.yml,.toml,.xml,.txt"
              className="sr-only"
              onChange={(e) => {
                void handleFileUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileArrowUpIcon data-icon="inline-start" />
              Load file
            </Button>

            {Object.entries(SAMPLE_DATASETS).map(([key, item]) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => {
                  setInput(item.data);
                  setSourceFormat(item.format);
                }}
              >
                {item.label}
              </Button>
            ))}

            <Button variant="ghost" onClick={() => setInput("")} disabled={!input}>
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        {/* Format Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Source Format */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">From</span>
              <div className="inline-flex flex-wrap items-center rounded-lg border border-border bg-muted/40 p-0.5">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setSourceFormat(f.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors",
                      sourceFormat === f.value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Swap Button */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleSwap}
              title="Swap source and target formats (and output into input)"
              className="shrink-0"
            >
              <ArrowsLeftRightIcon weight="bold" className="size-4" />
            </Button>

            {/* Target Format */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">To</span>
              <div className="inline-flex flex-wrap items-center rounded-lg border border-border bg-muted/40 p-0.5">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setTargetFormat(f.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors",
                      targetFormat === f.value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleAutoDetect} className="gap-1.5 text-xs">
              <ArrowsClockwiseIcon className="size-3.5" />
              Auto-detect source
            </Button>

            {/* Options Popover */}
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <GearIcon className="size-3.5" />
                    Options
                  </Button>
                }
              />
              <PopoverContent align="end" className="w-80 space-y-4 p-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Format Settings</h4>
                  <p className="text-xs text-muted-foreground">Adjust serialization options.</p>
                </div>

                {/* JSON Indent */}
                <div className="space-y-1.5">
                  <Label className="text-xs">JSON Indentation</Label>
                  <div className="flex items-center gap-1.5">
                    {([2, 4, 0] as const).map((indent) => (
                      <button
                        key={indent}
                        type="button"
                        onClick={() => setOptions((o) => ({ ...o, jsonIndent: indent }))}
                        className={cn(
                          "flex-1 rounded-md border border-border px-2 py-1 text-xs font-medium",
                          options.jsonIndent === indent ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {indent === 0 ? "Minified" : `${indent} spaces`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* YAML Indent */}
                <div className="space-y-1.5">
                  <Label className="text-xs">YAML Indentation</Label>
                  <div className="flex items-center gap-1.5">
                    {([2, 4] as const).map((indent) => (
                      <button
                        key={indent}
                        type="button"
                        onClick={() => setOptions((o) => ({ ...o, yamlIndent: indent }))}
                        className={cn(
                          "flex-1 rounded-md border border-border px-2 py-1 text-xs font-medium",
                          options.yamlIndent === indent ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {indent} spaces
                      </button>
                    ))}
                  </div>
                </div>

                {/* CSV Header */}
                <div className="pt-1">
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <Checkbox
                      checked={options.csvHasHeader}
                      onCheckedChange={(checked) => setOptions((o) => ({ ...o, csvHasHeader: checked === true }))}
                    />
                    <span>First row is column headers (CSV/TSV)</span>
                  </label>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* Left: Input */}
          <div className="flex flex-col gap-2">
            <div className="flex min-h-8 items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="data-input" className="text-base font-semibold">
                  Source ({sourceFormat.toUpperCase()})
                </Label>
              </div>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {input.length.toLocaleString()} chars · {input ? input.split("\n").length : 0} lines
              </span>
            </div>

            <Textarea
              id="data-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder={`Paste ${sourceFormat.toUpperCase()} data here...`}
              className="[field-sizing:fixed] h-[34rem] min-h-[26rem] resize-none overflow-auto font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Right: Output */}
          <div className="flex flex-col gap-2">
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="data-output" className="text-base font-semibold">
                  Output ({targetFormat.toUpperCase()})
                </Label>
                {conversion.recordCount > 0 && !conversion.error && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-2xs font-medium text-primary">
                    {conversion.recordCount.toLocaleString()} {conversion.recordCount === 1 ? "record" : "records"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload} disabled={!conversion.output || !!conversion.error} className="gap-1.5">
                  <DownloadSimpleIcon weight="bold" className="size-4" />
                  Download
                </Button>
                <Button size="sm" onClick={handleCopy} disabled={!conversion.output || !!conversion.error} className="gap-1.5">
                  {copied ? (
                    <>
                      <CheckIcon weight="bold" className="size-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon weight="bold" className="size-4" />
                      Copy Output
                    </>
                  )}
                </Button>
              </div>
            </div>

            {conversion.error ? (
              <div className="flex h-[34rem] min-h-[26rem] flex-col items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
                <WarningCircleIcon className="mb-2 size-8 text-destructive" weight="fill" />
                <p className="text-sm font-semibold text-destructive">Invalid {sourceFormat.toUpperCase()} Syntax</p>
                <p className="mt-1 max-w-md font-mono text-xs break-all whitespace-pre-wrap text-muted-foreground">{conversion.error}</p>
              </div>
            ) : !conversion.output ? (
              <div className="flex h-[34rem] min-h-[26rem] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-card/30 p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">Converted data will appear here</p>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Paste {sourceFormat.toUpperCase()} on the left or select a sample dataset above.
                </p>
              </div>
            ) : (
              <Textarea
                id="data-output"
                value={conversion.output}
                readOnly
                spellCheck={false}
                className="[field-sizing:fixed] h-[34rem] min-h-[26rem] resize-none overflow-auto font-mono text-xs leading-relaxed"
              />
            )}
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
