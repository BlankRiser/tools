import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { CopyButton } from "#/components/ui/copy-button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import {
  CaretDownIcon,
  CaretRightIcon,
  CodeIcon,
  DatabaseIcon,
  DownloadSimpleIcon,
  FunnelIcon,
  InfoIcon,
  KeyIcon,
  StackIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparkleIcon,
  TableIcon,
  TrashIcon,
  TreeStructureIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type CopyOutputFormat,
  type ExplorerInputFormat,
  type ExplorerQueryConfig,
  type FilterOperator,
  type FilterRule,
  type FilterTargetField,
  type GroupByMode,
  type NodeValueType,
  type SortByMode,
  evaluateExplorerQuery,
  flattenDataAndComputeMetadata,
  formatFilteredOutputForCopy,
  parseExplorerInput,
} from "./data-explorer-engine";

type ResultViewTab = "values" | "table" | "groups" | "metadata";

const SAMPLE_NESTED_ARRAY_DATA = `{
  DATA: {
    keyA: {
      a: [[{ a1: 11, a2: 21 }, 68000000], [{ a1: 11, a2: 21 }, 98320000]],
      b: [[{ b1: 22, b2: 22 }, 67320000], [{ b1: 12, b2: 22 }, 83714000]],
    },
    keyB: {
      a: [[{ a1: 19, a2: 35 }, 112500000]],
      meta: { region: "us-east", active: true }
    }
  }
}`;

const SAMPLE_ECOMMERCE_JSON = `{
  "store": "DevHaven Cloud",
  "orders": [
    {
      "orderId": "ORD-1001",
      "status": "completed",
      "region": "NA",
      "customer": { "name": "Aria Chen", "tier": "enterprise" },
      "items": [
        { "sku": "GPU-A100", "category": "compute", "qty": 2, "price": 1250 },
        { "sku": "NVME-4TB", "category": "storage", "qty": 4, "price": 320 }
      ]
    },
    {
      "orderId": "ORD-1002",
      "status": "processing",
      "region": "EU",
      "customer": { "name": "Liam Patel", "tier": "pro" },
      "items": [
        { "sku": "GPU-H100", "category": "compute", "qty": 1, "price": 2800 },
        { "sku": "NET-10G", "category": "network", "qty": 2, "price": 190 }
      ]
    },
    {
      "orderId": "ORD-1003",
      "status": "completed",
      "region": "NA",
      "customer": { "name": "Maya Lin", "tier": "enterprise" },
      "items": [
        { "sku": "GPU-A100", "category": "compute", "qty": 3, "price": 1250 }
      ]
    }
  ]
}`;

const SAMPLE_CSV_DATA = `service,region,env,latency_ms,status_code,error_rate,healthy
auth-api,us-east-1,prod,42,200,0.01,true
billing-worker,us-east-1,prod,185,200,0.04,true
search-index,eu-west-1,prod,640,503,0.45,false
edge-gateway,ap-south-1,prod,28,200,0.00,true
analytics-ingest,eu-west-1,staging,310,429,0.18,false
auth-api,eu-west-1,prod,55,200,0.02,true`;

const SAMPLE_XML_DATA = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <item>
    <id>SRV-01</id>
    <cluster>alpha</cluster>
    <cpuCores>64</cpuCores>
    <memoryGb>256</memoryGb>
    <status>online</status>
  </item>
  <item>
    <id>SRV-02</id>
    <cluster>beta</cluster>
    <cpuCores>32</cpuCores>
    <memoryGb>128</memoryGb>
    <status>maintenance</status>
  </item>
  <item>
    <id>SRV-03</id>
    <cluster>alpha</cluster>
    <cpuCores>128</cpuCores>
    <memoryGb>512</memoryGb>
    <status>online</status>
  </item>
</catalog>`;

const FILTER_OPERATOR_OPTIONS: Array<{ value: FilterOperator; label: string }> = [
  { value: "equals", label: "Equals (==)" },
  { value: "not_equals", label: "Not Equals (!=)" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does Not Contain" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "regex", label: "Matches Regex" },
  { value: "gt", label: "Greater Than (>)" },
  { value: "gte", label: "Greater or Equal (>=)" },
  { value: "lt", label: "Less Than (<)" },
  { value: "lte", label: "Less or Equal (<=)" },
  { value: "between", label: "Between (Min & Max)" },
  { value: "in_list", label: "In Comma List (a, b, c)" },
  { value: "is_null", label: "Is Null / Empty" },
  { value: "is_not_null", label: "Is Not Null" },
  { value: "is_type", label: "Is Type (number, string...)" },
  { value: "has_key", label: "Object Has Key" },
];

const ALL_VALUE_TYPES: NodeValueType[] = ["number", "string", "boolean", "object", "array", "null"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const DEFAULT_QUERY_CONFIG: ExplorerQueryConfig = {
  searchQuery: "",
  pathPattern: "",
  selectedKeys: ["a1"],
  extractionMode: "matched_values",
  requireAllSelectedKeys: false,
  nodeScope: "leaves_only",
  allowedTypes: [],
  minDepth: null,
  maxDepth: null,
  minArrayDepth: null,
  ruleLogic: "AND",
  rules: [],
  deduplicateValues: false,
  sortBy: "none",
  groupBy: "none",
  groupByProperty: "",
};

export function DataExplorerPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Raw input text & format
  const [rawInput, setRawInput] = useState<string>(SAMPLE_NESTED_ARRAY_DATA);
  const [inputFormat, setInputFormat] = useState<ExplorerInputFormat>("auto");
  const [isInputCollapsed, setIsInputCollapsed] = useState<boolean>(false);

  // Query & filter state
  const [queryConfig, setQueryConfig] = useState<ExplorerQueryConfig>(DEFAULT_QUERY_CONFIG);

  // Output view & copy format
  const [activeView, setActiveView] = useState<ResultViewTab>("values");
  const [copyFormat, setCopyFormat] = useState<CopyOutputFormat>("values_json");

  // Parse input and flatten structure + metadata
  const parsedResult = useMemo(
    () => parseExplorerInput(rawInput, inputFormat),
    [rawInput, inputFormat],
  );

  const { nodes: allNodes, metadata } = useMemo(() => {
    if (parsedResult.error || parsedResult.data === null || parsedResult.data === undefined) {
      return {
        nodes: [],
        metadata: {
          detectedFormat: parsedResult.detectedFormat,
          rootType: "null" as NodeValueType,
          totalNodes: 0,
          totalLeafNodes: 0,
          totalObjects: 0,
          totalArrays: 0,
          maxDepth: 0,
          maxArrayDepth: 0,
          byteSize: 0,
          uniqueKeys: [],
          uniqueWildcardPaths: [],
          keyStats: [],
        },
      };
    }
    return flattenDataAndComputeMetadata(
      parsedResult.data,
      rawInput,
      parsedResult.detectedFormat,
    );
  }, [parsedResult, rawInput]);

  // Evaluate filters, key extractions, sorting, and grouping
  const evaluation = useMemo(
    () => evaluateExplorerQuery(allNodes, queryConfig),
    [allNodes, queryConfig],
  );

  // Serialized string for copying/downloading
  const serializedOutput = useMemo(
    () => formatFilteredOutputForCopy(evaluation, copyFormat),
    [evaluation, copyFormat],
  );

  // Handlers for updating queryConfig
  const handleToggleSelectedKey = useCallback((key: string) => {
    setQueryConfig((prev) => {
      const exists = prev.selectedKeys.includes(key);
      return {
        ...prev,
        selectedKeys: exists
          ? prev.selectedKeys.filter((k) => k !== key)
          : [...prev.selectedKeys, key],
      };
    });
  }, []);

  const handleToggleAllowedType = useCallback((vType: NodeValueType) => {
    setQueryConfig((prev) => {
      const exists = prev.allowedTypes.includes(vType);
      return {
        ...prev,
        allowedTypes: exists
          ? prev.allowedTypes.filter((t) => t !== vType)
          : [...prev.allowedTypes, vType],
      };
    });
  }, []);

  const handleAddRule = useCallback(() => {
    const newRule: FilterRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      enabled: true,
      target: "value",
      propertyKey: metadata.uniqueKeys[0] ?? "",
      operator: "equals",
      value: "",
      secondValue: "",
    };
    setQueryConfig((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  }, [metadata.uniqueKeys]);

  const handleUpdateRule = useCallback((id: string, patch: Partial<FilterRule>) => {
    setQueryConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const handleRemoveRule = useCallback((id: string) => {
    setQueryConfig((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== id),
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setQueryConfig({
      ...DEFAULT_QUERY_CONFIG,
      selectedKeys: [],
    });
    toast.info("Cleared all active filters and key selections.");
  }, []);

  const handleFileUpload = useCallback(async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setRawInput(text);
      setInputFormat("auto");
      setQueryConfig((prev) => ({ ...prev, selectedKeys: [], pathPattern: "" }));
      toast.success(`Loaded "${file.name}" (${formatBytes(file.size)})`);
    } catch {
      toast.error("Failed to read uploaded file.");
    }
  }, []);

  const handleDownloadFiltered = useCallback(() => {
    if (!serializedOutput) return;
    const ext = copyFormat === "csv" ? "csv" : copyFormat === "lines" ? "txt" : "json";
    const mime =
      copyFormat === "csv"
        ? "text/csv"
        : copyFormat === "lines"
          ? "text/plain"
          : "application/json";
    const blob = new Blob([serializedOutput], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filtered-data.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded filtered-data.${ext}`);
  }, [copyFormat, serializedOutput]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (queryConfig.searchQuery.trim()) count++;
    if (queryConfig.pathPattern.trim()) count++;
    if (queryConfig.selectedKeys.length > 0) count++;
    if (queryConfig.allowedTypes.length > 0) count++;
    if (queryConfig.minDepth !== null || queryConfig.maxDepth !== null || queryConfig.minArrayDepth !== null) count++;
    count += queryConfig.rules.filter((r) => r.enabled).length;
    if (queryConfig.deduplicateValues) count++;
    if (queryConfig.groupBy !== "none") count++;
    return count;
  }, [queryConfig]);

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Explorer & Query Engine</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Paste or upload JSON, JS objects, CSV, TSV, XML, YAML, or TOML to inspect schema metadata, extract keys across multi-depth arrays,
              build multi-rule filters, group & aggregate values, and copy filtered outputs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.jsonl,.csv,.tsv,.xml,.yaml,.yml,.toml,.txt"
              className="sr-only"
              onChange={(e) => void handleFileUpload(e.target.files)}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <UploadSimpleIcon className="mr-1.5 size-4" weight="bold" />
              Upload File
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRawInput("");
                setQueryConfig({ ...DEFAULT_QUERY_CONFIG, selectedKeys: [] });
              }}
              disabled={!rawInput}
            >
              <TrashIcon className="mr-1.5 size-4 text-destructive" />
              Clear Input
            </Button>
          </div>
        </div>

        {/* Sample Presets & Input Card */}
        <Card>
          <CardHeader className="border-b border-border/60 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInputCollapsed((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
                >
                  {isInputCollapsed ? <CaretRightIcon className="size-4" /> : <CaretDownIcon className="size-4" />}
                  <DatabaseIcon className="size-4 text-primary" weight="bold" />
                  <span>Source Data Input</span>
                </button>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary uppercase">
                  {metadata.detectedFormat}
                </span>
                {rawInput.trim() && !parsedResult.error && (
                  <span className="text-xs text-muted-foreground">
                    ({formatBytes(metadata.byteSize)} • {metadata.totalNodes} nodes • max depth {metadata.maxDepth})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <SparkleIcon className="size-3.5 text-amber-500" weight="fill" />
                  Samples:
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setRawInput(SAMPLE_NESTED_ARRAY_DATA);
                    setInputFormat("auto");
                    setQueryConfig({
                      ...DEFAULT_QUERY_CONFIG,
                      selectedKeys: ["a1"],
                    });
                  }}
                >
                  Nested Array Tree (a1/b1)
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setRawInput(SAMPLE_ECOMMERCE_JSON);
                    setInputFormat("auto");
                    setQueryConfig({
                      ...DEFAULT_QUERY_CONFIG,
                      selectedKeys: ["sku", "price"],
                      extractionMode: "projected_objects",
                    });
                  }}
                >
                  Orders JSON
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setRawInput(SAMPLE_CSV_DATA);
                    setInputFormat("auto");
                    setQueryConfig({
                      ...DEFAULT_QUERY_CONFIG,
                      selectedKeys: [],
                      groupBy: "none",
                    });
                  }}
                >
                  Metrics CSV
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setRawInput(SAMPLE_XML_DATA);
                    setInputFormat("auto");
                    setQueryConfig({
                      ...DEFAULT_QUERY_CONFIG,
                      selectedKeys: [],
                    });
                  }}
                >
                  Catalog XML
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isInputCollapsed && (
            <CardContent className="space-y-3 pt-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-xs font-medium text-muted-foreground">Format:</span>
                  {(
                    [
                      { id: "auto", label: "Auto-Detect" },
                      { id: "json", label: "JSON / JS Object" },
                      { id: "csv", label: "CSV" },
                      { id: "tsv", label: "TSV" },
                      { id: "xml", label: "XML" },
                      { id: "yaml", label: "YAML" },
                      { id: "jsonl", label: "JSONL" },
                      { id: "toml", label: "TOML" },
                    ] as Array<{ id: ExplorerInputFormat; label: string }>
                  ).map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setInputFormat(fmt.id)}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                        inputFormat === fmt.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                spellCheck={false}
                placeholder="Paste JSON, JavaScript object literal, CSV, TSV, XML, YAML, or TOML here..."
                className="field-sizing-fixed h-44 resize-y font-mono text-xs"
              />

              {parsedResult.error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <WarningCircleIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
                  <div>
                    <p className="font-semibold">Parse Error ({parsedResult.detectedFormat.toUpperCase()})</p>
                    <p className="mt-0.5 font-mono text-[11px]">{parsedResult.error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Dataset Metadata Summary Strip */}
        {!parsedResult.error && metadata.totalNodes > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
              <span className="text-[11px] text-muted-foreground">Detected Format & Root</span>
              <p className="mt-0.5 font-mono text-sm font-bold text-foreground uppercase">
                {metadata.detectedFormat} ({metadata.rootType})
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
              <span className="text-[11px] text-muted-foreground">Total Nodes / Leaves</span>
              <p className="mt-0.5 font-mono text-sm font-bold text-primary">
                {metadata.totalNodes} / {metadata.totalLeafNodes} leaves
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
              <span className="text-[11px] text-muted-foreground">Objects & Arrays</span>
              <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                {metadata.totalObjects} obj • {metadata.totalArrays} arr
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
              <span className="text-[11px] text-muted-foreground">Max Tree / Array Depth</span>
              <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                Depth {metadata.maxDepth} (Arr: {metadata.maxArrayDepth})
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
              <span className="text-[11px] text-muted-foreground">Unique Named Keys</span>
              <p className="mt-0.5 font-mono text-sm font-bold text-foreground">{metadata.uniqueKeys.length} keys</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 shadow-2xs">
              <span className="text-[11px] font-medium text-primary">Matched Results</span>
              <p className="mt-0.5 font-mono text-sm font-bold text-primary">
                {evaluation.extractedItems.length} {evaluation.extractedItems.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        )}

        {/* Main Explorer Workbench: Left (Comprehensive Filters & Grouping) | Right (Filtered Results, Table, Groups, Metadata) */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* LEFT PANEL (5 cols): Multi-Depth Key Selection, Path Scope, Filter Rules & Grouping */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            {/* 1. Multi-Key Selector at Any Depth */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-2.5">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <KeyIcon className="size-4 text-primary" weight="bold" />
                    <span>Select Keys to Extract ({queryConfig.selectedKeys.length})</span>
                  </CardTitle>
                  {queryConfig.selectedKeys.length > 0 && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setQueryConfig((prev) => ({ ...prev, selectedKeys: [] }))}
                    >
                      Clear Keys
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Click one or more keys (at any object or nested array depth) to extract their values or project matching objects.
                </p>
              </CardHeader>

              <CardContent className="space-y-3 pt-3.5">
                {metadata.keyStats.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No named keys discovered yet.</p>
                ) : (
                  <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {metadata.keyStats.map((kStat) => {
                      const isSelected = queryConfig.selectedKeys.includes(kStat.key);
                      return (
                        <button
                          key={kStat.key}
                          type="button"
                          onClick={() => handleToggleSelectedKey(kStat.key)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                              : "border-border/70 bg-muted/30 text-foreground hover:border-primary/40 hover:bg-muted",
                          )}
                          title={`Paths: ${kStat.wildcardPaths.join(", ")}`}
                        >
                          <span>{kStat.key}</span>
                          <span
                            className={cn(
                              "rounded px-1 py-0.2 text-[10px]",
                              isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground",
                            )}
                          >
                            {kStat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Extraction Mode when keys are selected */}
                <div className="space-y-2 border-t border-border/50 pt-2.5">
                  <Label className="text-xs font-medium">Key Extraction Mode</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: "matched_values", label: "Raw Values" },
                        { id: "projected_objects", label: "Project Objects" },
                        { id: "key_value_records", label: "Path + Value" },
                      ] as Array<{ id: ExplorerQueryConfig["extractionMode"]; label: string }>
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setQueryConfig((prev) => ({ ...prev, extractionMode: m.id }))}
                        className={cn(
                          "rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                          queryConfig.extractionMode === m.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {queryConfig.extractionMode === "projected_objects" && queryConfig.selectedKeys.length > 1 && (
                    <label className="flex cursor-pointer items-center justify-between rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        Require objects to contain ALL selected keys ({queryConfig.selectedKeys.join(" & ")})
                      </span>
                      <Checkbox
                        checked={queryConfig.requireAllSelectedKeys}
                        onCheckedChange={(checked) =>
                          setQueryConfig((prev) => ({
                            ...prev,
                            requireAllSelectedKeys: Boolean(checked),
                          }))
                        }
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Search, Path Pattern, Depth & Type Scope */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-2.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <TreeStructureIcon className="size-4 text-primary" weight="bold" />
                    <span>Path, Depth & Type Filters</span>
                  </CardTitle>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="xs" onClick={handleResetFilters}>
                      Reset All ({activeFilterCount})
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-3.5">
                {/* Global Quick Search */}
                <div className="space-y-1">
                  <Label htmlFor="explorer-quick-search" className="text-xs">
                    Quick Search (Key, Path, or Value)
                  </Label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="explorer-quick-search"
                      value={queryConfig.searchQuery}
                      onChange={(e) => setQueryConfig((prev) => ({ ...prev, searchQuery: e.target.value }))}
                      placeholder="Search any text, number, key, or path..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                </div>

                {/* Wildcard Path Pattern */}
                <div className="space-y-1.5">
                  <Label htmlFor="explorer-path-pattern" className="text-xs">
                    Wildcard Path Filter (Supports <code className="font-mono">[*]</code>, <code className="font-mono">*</code>,{" "}
                    <code className="font-mono">**</code>)
                  </Label>
                  <Input
                    id="explorer-path-pattern"
                    value={queryConfig.pathPattern}
                    onChange={(e) => setQueryConfig((prev) => ({ ...prev, pathPattern: e.target.value }))}
                    placeholder="e.g. DATA.keyA.a[*][*].a1 or **.a1"
                    className="h-8 font-mono text-xs"
                  />
                  {metadata.uniqueWildcardPaths.length > 0 && (
                    <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto pt-0.5">
                      {metadata.uniqueWildcardPaths.slice(0, 12).map((wp) => (
                        <button
                          key={wp}
                          type="button"
                          onClick={() =>
                            setQueryConfig((prev) => ({
                              ...prev,
                              pathPattern: prev.pathPattern === wp ? "" : wp,
                            }))
                          }
                          className={cn(
                            "rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                            queryConfig.pathPattern === wp
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {wp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Node Scope (when no specific keys are selected) */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Node Level Scope</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        { id: "leaves_only", label: "Leaves" },
                        { id: "objects_only", label: "Objects" },
                        { id: "arrays_only", label: "Arrays" },
                        { id: "all_nodes", label: "All" },
                      ] as Array<{ id: ExplorerQueryConfig["nodeScope"]; label: string }>
                    ).map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setQueryConfig((prev) => ({ ...prev, nodeScope: sc.id }))}
                        className={cn(
                          "rounded-md border py-1 text-[11px] font-medium transition-colors",
                          queryConfig.nodeScope === sc.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Type Filter Pills */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Filter by Data Type</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_VALUE_TYPES.map((vt) => {
                      const active = queryConfig.allowedTypes.includes(vt);
                      return (
                        <button
                          key={vt}
                          type="button"
                          onClick={() => handleToggleAllowedType(vt)}
                          className={cn(
                            "rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium transition-colors",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/70 bg-muted/30 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {vt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tree Depth & Nested Array Depth */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Min Depth</Label>
                    <Input
                      type="number"
                      min={0}
                      max={metadata.maxDepth}
                      value={queryConfig.minDepth ?? ""}
                      onChange={(e) =>
                        setQueryConfig((prev) => ({
                          ...prev,
                          minDepth: e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                      placeholder="0"
                      className="h-7 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Max Depth</Label>
                    <Input
                      type="number"
                      min={0}
                      max={metadata.maxDepth}
                      value={queryConfig.maxDepth ?? ""}
                      onChange={(e) =>
                        setQueryConfig((prev) => ({
                          ...prev,
                          maxDepth: e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                      placeholder={String(metadata.maxDepth)}
                      className="h-7 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]" title="Minimum nested array depth (e.g. 2 for [[...]])">
                      Min Array Depth
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={metadata.maxArrayDepth}
                      value={queryConfig.minArrayDepth ?? ""}
                      onChange={(e) =>
                        setQueryConfig((prev) => ({
                          ...prev,
                          minArrayDepth: e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                      placeholder="0"
                      className="h-7 font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Multi-Condition Filter Rules Builder */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-2.5">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <FunnelIcon className="size-4 text-primary" weight="bold" />
                    <span>Filter Rules ({queryConfig.rules.length})</span>
                  </CardTitle>

                  <div className="flex items-center gap-1.5">
                    {queryConfig.rules.length > 1 && (
                      <div className="flex rounded-md border border-border bg-muted p-0.5 text-[10px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setQueryConfig((prev) => ({ ...prev, ruleLogic: "AND" }))}
                          className={cn(
                            "rounded px-1.5 py-0.5",
                            queryConfig.ruleLogic === "AND" ? "bg-background text-primary shadow-2xs" : "text-muted-foreground",
                          )}
                        >
                          AND
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueryConfig((prev) => ({ ...prev, ruleLogic: "OR" }))}
                          className={cn(
                            "rounded px-1.5 py-0.5",
                            queryConfig.ruleLogic === "OR" ? "bg-background text-primary shadow-2xs" : "text-muted-foreground",
                          )}
                        >
                          OR
                        </button>
                      </div>
                    )}
                    <Button variant="outline" size="xs" onClick={handleAddRule}>
                      <PlusIcon className="mr-1 size-3.5" weight="bold" />
                      Add Condition
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 pt-3.5">
                {queryConfig.rules.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                    No custom conditions added. Click <strong>Add Condition</strong> to filter by numeric comparisons, regex, lists, or object
                    properties.
                  </div>
                ) : (
                  queryConfig.rules.map((rule) => (
                    <div key={rule.id} className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={rule.enabled}
                            onCheckedChange={(checked) => handleUpdateRule(rule.id, { enabled: Boolean(checked) })}
                          />
                          <select
                            value={rule.target}
                            onChange={(e) => handleUpdateRule(rule.id, { target: e.target.value as FilterTargetField })}
                            className="h-7 rounded border border-border bg-background px-2 text-xs font-medium text-foreground"
                          >
                            <option value="value">Node Value</option>
                            <option value="key">Key Name</option>
                            <option value="path">Full Path</option>
                            <option value="object_prop">Specific Key / Property</option>
                            <option value="any">Any (Key / Path / Value)</option>
                          </select>
                        </div>

                        <select
                          value={rule.operator}
                          onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as FilterOperator })}
                          className="h-7 flex-1 rounded border border-border bg-background px-2 text-xs font-medium text-foreground"
                        >
                          {FILTER_OPERATOR_OPTIONS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveRule(rule.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                          title="Remove condition"
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>

                      {rule.target === "object_prop" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">Property Key:</span>
                          <Input
                            value={rule.propertyKey}
                            onChange={(e) => handleUpdateRule(rule.id, { propertyKey: e.target.value })}
                            placeholder="e.g. a1, price, status"
                            className="h-7 flex-1 font-mono text-xs"
                          />
                        </div>
                      )}

                      {rule.operator !== "is_null" && rule.operator !== "is_not_null" && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={rule.value}
                            onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                            placeholder={
                              rule.operator === "in_list"
                                ? "11, 21, 22"
                                : rule.operator === "is_type"
                                  ? "number | string | boolean | object | array"
                                  : "Comparison value..."
                            }
                            className="h-7 flex-1 font-mono text-xs"
                          />
                          {rule.operator === "between" && (
                            <Input
                              value={rule.secondValue}
                              onChange={(e) => handleUpdateRule(rule.id, { secondValue: e.target.value })}
                              placeholder="Max value..."
                              className="h-7 flex-1 font-mono text-xs"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* 4. Grouping, Sorting & Deduplication Card */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-2.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <StackIcon className="size-4 text-primary" weight="bold" />
                  <span>Group, Sort & Deduplicate</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs">Group Values By</Label>
                    <select
                      value={queryConfig.groupBy}
                      onChange={(e) => {
                        const nextGroup = e.target.value as GroupByMode;
                        setQueryConfig((prev) => ({ ...prev, groupBy: nextGroup }));
                        if (nextGroup !== "none") {
                          setActiveView("groups");
                        }
                      }}
                      className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground"
                    >
                      <option value="none">No Grouping</option>
                      <option value="key">Key Name (e.g. a1, a2, b1)</option>
                      <option value="value">Value Frequency (Count & %)</option>
                      <option value="parent_path">Parent Path / Branch</option>
                      <option value="wildcard_path">Wildcard Path Pattern</option>
                      <option value="type">Data Type</option>
                      <option value="depth">Nesting Depth</option>
                      <option value="object_prop">Specific Object Property</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Sort Results By</Label>
                    <select
                      value={queryConfig.sortBy}
                      onChange={(e) => setQueryConfig((prev) => ({ ...prev, sortBy: e.target.value as SortByMode }))}
                      className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground"
                    >
                      <option value="none">Document Order</option>
                      <option value="value_asc">Value (Low → High / A → Z)</option>
                      <option value="value_desc">Value (High → Low / Z → A)</option>
                      <option value="key_asc">Key Name (A → Z)</option>
                      <option value="key_desc">Key Name (Z → A)</option>
                      <option value="path_asc">Full Path (A → Z)</option>
                      <option value="depth_asc">Depth (Shallow → Deep)</option>
                      <option value="depth_desc">Depth (Deep → Shallow)</option>
                    </select>
                  </div>
                </div>

                {queryConfig.groupBy === "object_prop" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Group By Object Property Key</Label>
                    <Input
                      value={queryConfig.groupByProperty}
                      onChange={(e) => setQueryConfig((prev) => ({ ...prev, groupByProperty: e.target.value }))}
                      placeholder="e.g. status, category, region, a1"
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <div>
                    <Label htmlFor="dedup-toggle" className="text-xs font-medium">
                      Deduplicate Extracted Values
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Keep only unique values in the filtered output</p>
                  </div>
                  <Switch
                    id="dedup-toggle"
                    checked={queryConfig.deduplicateValues}
                    onCheckedChange={(checked) => setQueryConfig((prev) => ({ ...prev, deduplicateValues: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT PANEL (7 cols): Filtered Output Copy Bar + Multi-View Inspector */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Card>
              <CardHeader className="border-b border-border/60 pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* View Switcher Tabs */}
                  <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => setActiveView("values")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                        activeView === "values" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <CodeIcon className="size-3.5" weight="bold" />
                      <span>Values ({evaluation.extractedItems.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView("table")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                        activeView === "table" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <TableIcon className="size-3.5" weight="bold" />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView("groups")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                        activeView === "groups" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <StackIcon className="size-3.5" weight="bold" />
                      <span>Groups ({evaluation.groups.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView("metadata")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                        activeView === "metadata" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <InfoIcon className="size-3.5" weight="bold" />
                      <span>Schema ({metadata.keyStats.length})</span>
                    </button>
                  </div>

                  {/* Copy & Export Controls */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={copyFormat}
                      onChange={(e) => setCopyFormat(e.target.value as CopyOutputFormat)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground"
                      title="Choose output format for Copy / Download"
                    >
                      <option value="values_json">Values Array JSON</option>
                      <option value="records_json">Path + Value Records JSON</option>
                      <option value="path_map_json">Path-to-Value Map JSON</option>
                      <option value="lines">Plain Lines (Newline-separated)</option>
                      <option value="csv">CSV Table</option>
                    </select>

                    <CopyButton value={serializedOutput} variant="default" size="icon-sm" />

                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={handleDownloadFiltered}
                      disabled={!serializedOutput}
                      title="Download filtered output"
                    >
                      <DownloadSimpleIcon className="size-4" weight="bold" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {/* VIEW 1: EXTRACTED VALUES & SERIALIZED OUTPUT */}
                {activeView === "values" && (
                  <div className="space-y-4">
                    {/* Active Selection Summary Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-foreground">Active Extraction:</span>
                        {queryConfig.selectedKeys.length > 0 ? (
                          queryConfig.selectedKeys.map((k) => (
                            <span key={k} className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                              {k}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">All matching nodes ({queryConfig.nodeScope.replace("_", " ")})</span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {evaluation.extractedItems.length} result{evaluation.extractedItems.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {/* Copyable Formatted Code Output */}
                    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/30">
                      <div className="flex items-center justify-between border-b border-border/60 bg-muted/50 px-3.5 py-2">
                        <span className="font-mono text-xs font-medium text-muted-foreground">
                          Filtered Output ({copyFormat.replace(/_/g, " ").toUpperCase()})
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">Copy Filtered</span>
                          <CopyButton value={serializedOutput} variant="outline" size="icon-xs" />
                        </div>
                      </div>
                      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground select-all">
                        <code>{serializedOutput || "// No matching values found for the current filters."}</code>
                      </pre>
                    </div>

                    {/* Matched Items Quick Cards */}
                    {evaluation.records.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Matched Nodes Breakdown ({Math.min(evaluation.records.length, 50)} of {evaluation.records.length})
                          </span>
                        </div>
                        <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                          {evaluation.records.slice(0, 50).map((rec, idx) => {
                            const valStr = typeof rec.value === "object" && rec.value !== null ? JSON.stringify(rec.value) : String(rec.value);
                            return (
                              <div
                                key={`${rec.path}_${idx}`}
                                className="group flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/15 px-3 py-1.5 text-xs hover:border-primary/40"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate font-mono text-[11px] text-muted-foreground" title={rec.path}>
                                      {rec.path}
                                    </span>
                                    <span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                                      {rec.type} • d{rec.depth}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 truncate font-mono text-xs font-semibold text-foreground" title={valStr}>
                                    {valStr}
                                  </p>
                                </div>
                                <CopyButton value={valStr} size="icon-xs" className="opacity-70 group-hover:opacity-100" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 2: TABLE / PATH EXPLORER VIEW */}
                {activeView === "table" && (
                  <div className="space-y-3">
                    {evaluation.matchedNodes.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground">No nodes match your current filter criteria.</div>
                    ) : (
                      <div className="max-h-[34rem] overflow-auto rounded-xl border border-border/70">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead className="sticky top-0 z-10 border-b border-border bg-muted/90 backdrop-blur-xs">
                            <tr>
                              <th className="px-3 py-2 font-semibold text-muted-foreground">#</th>
                              <th className="px-3 py-2 font-semibold text-muted-foreground">Full Path</th>
                              <th className="px-3 py-2 font-semibold text-muted-foreground">Key</th>
                              <th className="px-3 py-2 font-semibold text-muted-foreground">Type</th>
                              <th className="px-3 py-2 font-semibold text-muted-foreground">Depth</th>
                              <th className="px-3 py-2 font-semibold text-muted-foreground">Value</th>
                              <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Copy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {evaluation.matchedNodes.slice(0, 200).map((node, i) => (
                              <tr key={node.id} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{i + 1}</td>
                                <td className="max-w-52 truncate px-3 py-2 font-mono text-[11px] text-foreground" title={node.path}>
                                  {node.path}
                                </td>
                                <td className="px-3 py-2 font-mono text-xs font-semibold text-primary">{node.key}</td>
                                <td className="px-3 py-2">
                                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                    {node.valueType}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                                  {node.depth} {node.arrayDepth > 0 && `(arr:${node.arrayDepth})`}
                                </td>
                                <td className="max-w-64 truncate px-3 py-2 font-mono text-xs font-medium text-foreground" title={node.displayValue}>
                                  {node.displayValue}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <CopyButton value={node.displayValue} size="icon-xs" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 3: GROUPED & AGGREGATED VIEW */}
                {activeView === "groups" && (
                  <div className="space-y-3">
                    {queryConfig.groupBy === "none" ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-center">
                        <StackIcon className="size-8 text-primary" weight="duotone" />
                        <p className="text-sm font-semibold text-foreground">Grouping is currently set to None</p>
                        <p className="max-w-md text-xs text-muted-foreground">
                          Choose a grouping mode below to group matched values by Key Name, Value Frequency, Parent Path, Wildcard Path, Data Type, or
                          Nesting Depth.
                        </p>
                        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                          {(
                            [
                              { id: "key", label: "Group by Key Name" },
                              { id: "value", label: "Group by Value Frequency" },
                              { id: "parent_path", label: "Group by Parent Path" },
                              { id: "wildcard_path", label: "Group by Wildcard Path" },
                              { id: "type", label: "Group by Data Type" },
                            ] as Array<{ id: GroupByMode; label: string }>
                          ).map((g) => (
                            <Button
                              key={g.id}
                              variant="outline"
                              size="xs"
                              onClick={() => setQueryConfig((prev) => ({ ...prev, groupBy: g.id }))}
                            >
                              {g.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : evaluation.groups.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted-foreground">No matched items to group.</div>
                    ) : (
                      <div className="max-h-[36rem] space-y-2.5 overflow-y-auto pr-1">
                        {evaluation.groups.map((grp) => {
                          const groupValuesJson = JSON.stringify(grp.values, null, 2);
                          return (
                            <div key={grp.groupKey} className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                                    {grp.label}
                                  </span>
                                  <span className="font-mono text-xs font-semibold text-foreground">
                                    {grp.count} {grp.count === 1 ? "item" : "items"} ({grp.percentage}%)
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">• {grp.uniqueValuesCount} unique</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground">Copy Group Values</span>
                                  <CopyButton value={groupValuesJson} size="icon-xs" variant="outline" />
                                </div>
                              </div>

                              {/* Percentage Bar */}
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, grp.percentage)}%` }} />
                              </div>

                              {/* Numeric Aggregations if available */}
                              {grp.numericStats && (
                                <div className="flex flex-wrap gap-3 rounded-lg border border-border/50 bg-background/70 px-2.5 py-1.5 font-mono text-[11px]">
                                  <span>
                                    <strong className="text-muted-foreground">Sum:</strong> {grp.numericStats.sum}
                                  </span>
                                  <span>
                                    <strong className="text-muted-foreground">Avg:</strong> {grp.numericStats.avg}
                                  </span>
                                  <span>
                                    <strong className="text-muted-foreground">Min:</strong> {grp.numericStats.min}
                                  </span>
                                  <span>
                                    <strong className="text-muted-foreground">Max:</strong> {grp.numericStats.max}
                                  </span>
                                </div>
                              )}

                              {/* Preview of values in group */}
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {grp.nodes.slice(0, 12).map((n) => (
                                  <span
                                    key={n.id}
                                    className="max-w-60 truncate rounded border border-border/60 bg-background px-2 py-0.5 font-mono text-[11px] text-foreground"
                                    title={`${n.path}: ${n.displayValue}`}
                                  >
                                    {n.displayValue}
                                  </span>
                                ))}
                                {grp.nodes.length > 12 && (
                                  <span className="px-1.5 py-0.5 text-[11px] text-muted-foreground">+{grp.nodes.length - 12} more</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 4: METADATA & DISCOVERED KEYS SCHEMA CATALOG */}
                {activeView === "metadata" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Complete catalog of all keys discovered across every nesting depth, including data types, cardinality, numeric statistics, and
                      wildcard paths. Click any key to filter by it.
                    </p>

                    <div className="max-h-[34rem] space-y-2.5 overflow-y-auto pr-1">
                      {metadata.keyStats.map((kStat) => {
                        const isSelected = queryConfig.selectedKeys.includes(kStat.key);
                        const activeTypes = Object.entries(kStat.types)
                          .filter(([, count]) => count > 0)
                          .map(([t, count]) => `${t} (${count})`);

                        return (
                          <div
                            key={kStat.key}
                            className={cn(
                              "rounded-xl border p-3 transition-colors",
                              isSelected ? "border-primary bg-primary/5" : "border-border/70 bg-muted/20",
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-foreground">{kStat.key}</span>
                                <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                                  {kStat.count} occurrences
                                </span>
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                  Depths: {kStat.depths.join(", ")}
                                </span>
                              </div>

                              <Button
                                variant={isSelected ? "default" : "outline"}
                                size="xs"
                                onClick={() => {
                                  handleToggleSelectedKey(kStat.key);
                                  setActiveView("values");
                                }}
                              >
                                {isSelected ? "Selected" : `Extract "${kStat.key}"`}
                              </Button>
                            </div>

                            <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                              <div>
                                <span className="text-[11px] text-muted-foreground">Types: </span>
                                <span className="font-mono text-[11px] font-medium text-foreground">{activeTypes.join(", ")}</span>
                              </div>
                              <div>
                                <span className="text-[11px] text-muted-foreground">Unique Leaf Values: </span>
                                <span className="font-mono text-[11px] font-medium text-foreground">
                                  {kStat.uniqueValuesCount}
                                  {kStat.nullCount > 0 ? ` (${kStat.nullCount} null)` : ""}
                                </span>
                              </div>
                            </div>

                            {kStat.numericStats && (
                              <div className="mt-1.5 flex flex-wrap gap-3 rounded-md border border-border/50 bg-background/70 px-2.5 py-1 font-mono text-[11px]">
                                <span>Min: {kStat.numericStats.min}</span>
                                <span>Max: {kStat.numericStats.max}</span>
                                <span>Sum: {kStat.numericStats.sum}</span>
                                <span>Avg: {kStat.numericStats.avg}</span>
                              </div>
                            )}

                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">Paths:</span>
                              {kStat.wildcardPaths.map((wp) => (
                                <button
                                  key={wp}
                                  type="button"
                                  onClick={() => {
                                    setQueryConfig((prev) => ({
                                      ...prev,
                                      selectedKeys: [],
                                      pathPattern: wp,
                                    }));
                                    setActiveView("values");
                                  }}
                                  className="rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-primary hover:text-primary"
                                >
                                  {wp}
                                </button>
                              ))}
                            </div>

                            {kStat.sampleValues.length > 0 && (
                              <p className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">
                                Samples: <span className="text-foreground">{kStat.sampleValues.join(", ")}</span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
