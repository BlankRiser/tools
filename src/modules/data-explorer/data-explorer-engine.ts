import * as toml from "smol-toml";
import yaml from "yaml";
import { parseDelimitedText, parseXml, stringifyDelimitedText } from "../data-converter/data-converter";

export type ExplorerInputFormat = "auto" | "json" | "csv" | "tsv" | "xml" | "yaml" | "jsonl" | "toml";

export type NodeValueType = "string" | "number" | "boolean" | "null" | "array" | "object";

export interface FlattenedNode {
  /** Unique ID for React keys */
  id: string;
  /** Full path e.g. DATA.keyA.a[0][0].a1 */
  path: string;
  /** Generalized wildcard path e.g. DATA.keyA.a[*][*].a1 */
  wildcardPath: string;
  /** Immediate key name or array index string e.g. "a1" or "[0]" */
  key: string;
  /** Nearest named ancestor key (ignoring array indices), e.g. for DATA.keyA.a[0][1] -> "a" */
  nearestNamedKey: string;
  /** Parent path e.g. DATA.keyA.a[0][0] */
  parentPath: string;
  /** Nesting depth (root = 0) */
  depth: number;
  /** How many array levels this node is nested inside */
  arrayDepth: number;
  /** Value type */
  valueType: NodeValueType;
  /** True if string, number, boolean, or null */
  isLeaf: boolean;
  /** Raw JS value */
  value: unknown;
  /** Formatted string representation for display & searching */
  displayValue: string;
}

export interface KeyMetadataStat {
  key: string;
  count: number;
  depths: number[];
  wildcardPaths: string[];
  types: Record<NodeValueType, number>;
  uniqueValuesCount: number;
  nullCount: number;
  numericStats?: {
    min: number;
    max: number;
    sum: number;
    avg: number;
  };
  sampleValues: string[];
}

export interface DatasetMetadata {
  detectedFormat: Exclude<ExplorerInputFormat, "auto">;
  rootType: NodeValueType;
  totalNodes: number;
  totalLeafNodes: number;
  totalObjects: number;
  totalArrays: number;
  maxDepth: number;
  maxArrayDepth: number;
  byteSize: number;
  uniqueKeys: string[];
  uniqueWildcardPaths: string[];
  keyStats: KeyMetadataStat[];
}

export type FilterTargetField = "any" | "key" | "path" | "value" | "object_prop";

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "regex"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "in_list"
  | "is_null"
  | "is_not_null"
  | "is_type"
  | "has_key";

export interface FilterRule {
  id: string;
  enabled: boolean;
  target: FilterTargetField;
  /** Used when target === "object_prop" to inspect a specific key inside an object */
  propertyKey: string;
  operator: FilterOperator;
  value: string;
  secondValue: string;
}

export type GroupByMode =
  | "none"
  | "key"
  | "value"
  | "parent_path"
  | "wildcard_path"
  | "type"
  | "depth"
  | "object_prop";

export type SortByMode =
  | "none"
  | "value_asc"
  | "value_desc"
  | "key_asc"
  | "key_desc"
  | "path_asc"
  | "depth_asc"
  | "depth_desc";

export type ExtractionMode =
  | "matched_values"
  | "projected_objects"
  | "key_value_records";

export type CopyOutputFormat =
  | "values_json"
  | "records_json"
  | "path_map_json"
  | "lines"
  | "csv";

export interface ExplorerQueryConfig {
  /** Global quick search across keys, paths, and values */
  searchQuery: string;
  /** Wildcard or prefix path filter e.g. DATA.keyA.a[*][*].a1 or **.a1 */
  pathPattern: string;
  /** Multi-selected keys to extract/project (e.g. ["a1"] or ["a1", "a2"]) */
  selectedKeys: string[];
  /** How selectedKeys should be extracted */
  extractionMode: ExtractionMode;
  /** Require all selectedKeys on an object (AND) vs any selectedKey (OR) when in projected_objects mode */
  requireAllSelectedKeys: boolean;
  /** Leaf/Node scope */
  nodeScope: "leaves_only" | "objects_only" | "arrays_only" | "all_nodes";
  /** Allowed value types (empty = all) */
  allowedTypes: NodeValueType[];
  /** Min depth filter */
  minDepth: number | null;
  /** Max depth filter */
  maxDepth: number | null;
  /** Min array nesting depth filter */
  minArrayDepth: number | null;
  /** Rule combinator */
  ruleLogic: "AND" | "OR";
  /** List of filter rules */
  rules: FilterRule[];
  /** Deduplicate extracted values */
  deduplicateValues: boolean;
  /** Sort mode */
  sortBy: SortByMode;
  /** Grouping mode */
  groupBy: GroupByMode;
  /** Property name when groupBy === "object_prop" */
  groupByProperty: string;
}

export interface GroupedExplorerBucket {
  groupKey: string;
  label: string;
  count: number;
  percentage: number;
  uniqueValuesCount: number;
  numericStats?: {
    min: number;
    max: number;
    sum: number;
    avg: number;
  };
  values: unknown[];
  nodes: FlattenedNode[];
}

export interface ExplorerEvaluationResult {
  matchedNodes: FlattenedNode[];
  /** Extracted values or projected objects ready for copying/viewing */
  extractedItems: unknown[];
  /** Key-value + path records */
  records: Array<{
    path: string;
    key: string;
    type: NodeValueType;
    depth: number;
    value: unknown;
  }>;
  groups: GroupedExplorerBucket[];
}

// ============================================================================
// 1. Relaxed JS Object / JSON / Multi-Format Parser
// ============================================================================

/**
 * Normalizes a relaxed JS/TS object literal (unquoted keys, single quotes, trailing commas, comments)
 * into valid JSON so expressions like:
 * `{ DATA: { keyA: { a: [[{ a1:11, a2: 21}, 68000000]] } } }`
 * parse cleanly without using `eval`.
 */
export function normalizeRelaxedJson(raw: string): string {
  let result = "";
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const ch = raw[i];
    const next = raw[i + 1];

    // Line comment //
    if (ch === "/" && next === "/") {
      i += 2;
      while (i < len && raw[i] !== "\n") i++;
      continue;
    }

    // Block comment /* ... */
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < len && !(raw[i] === "*" && raw[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    // Double-quoted string
    if (ch === '"') {
      result += '"';
      i++;
      while (i < len) {
        if (raw[i] === "\\") {
          result += raw[i] + (raw[i + 1] ?? "");
          i += 2;
          continue;
        }
        if (raw[i] === '"') {
          result += '"';
          i++;
          break;
        }
        result += raw[i];
        i++;
      }
      continue;
    }

    // Single-quoted string -> convert to double-quoted string
    if (ch === "'") {
      result += '"';
      i++;
      while (i < len) {
        if (raw[i] === "\\") {
          const esc = raw[i + 1] ?? "";
          if (esc === "'") {
            result += "'";
          } else {
            result += "\\" + esc;
          }
          i += 2;
          continue;
        }
        if (raw[i] === '"') {
          result += '\\"';
          i++;
          continue;
        }
        if (raw[i] === "'") {
          result += '"';
          i++;
          break;
        }
        result += raw[i];
        i++;
      }
      continue;
    }

    // Check for unquoted object key after `{` or `,`
    if (/[A-Za-z_$]/.test(ch)) {
      let ident = "";
      let j = i;
      while (j < len && /[A-Za-z0-9_$-]/.test(raw[j])) {
        ident += raw[j];
        j++;
      }
      let k = j;
      while (k < len && /\s/.test(raw[k])) k++;

      if (raw[k] === ":") {
        result += `"${ident}":`;
        i = k + 1;
        continue;
      }

      if (ident === "undefined") {
        result += "null";
        i = j;
        continue;
      }

      result += ident;
      i = j;
      continue;
    }

    result += ch;
    i++;
  }

  // Strip trailing commas before `}` or `]`
  return result.replace(/,(\s*[}\]])/g, "$1");
}

export function detectExplorerFormat(input: string): Exclude<ExplorerInputFormat, "auto"> {
  const trimmed = input.trim();
  if (!trimmed) return "json";

  if (trimmed.startsWith("<?xml") || (trimmed.startsWith("<") && trimmed.endsWith(">"))) {
    return "xml";
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return "json";
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (
    lines.length > 1 &&
    lines.every((l) => l.trim().startsWith("{") && l.trim().endsWith("}"))
  ) {
    return "jsonl";
  }

  if (trimmed.includes("\t") && lines.length > 1) {
    const firstTabs = (lines[0].match(/\t/g) || []).length;
    if (firstTabs > 0) return "tsv";
  }

  if (trimmed.includes(",") && lines.length > 1) {
    const firstCommas = (lines[0].match(/,/g) || []).length;
    const secondCommas = (lines[1].match(/,/g) || []).length;
    if (firstCommas > 0 && Math.abs(firstCommas - secondCommas) <= 2) {
      return "csv";
    }
  }

  if (/^\s*\[[^\]]+\]\s*$/m.test(trimmed) || /^\s*[A-Za-z0-9_-]+\s*=\s*/m.test(trimmed)) {
    try {
      toml.parse(trimmed);
      return "toml";
    } catch {
      // fall through
    }
  }

  return "yaml";
}

export function parseExplorerInput(
  input: string,
  format: ExplorerInputFormat,
): {
  data: unknown;
  detectedFormat: Exclude<ExplorerInputFormat, "auto">;
  error?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { data: null, detectedFormat: "json" };
  }

  const resolvedFormat = format === "auto" ? detectExplorerFormat(trimmed) : format;

  try {
    switch (resolvedFormat) {
      case "json": {
        try {
          return { data: JSON.parse(trimmed), detectedFormat: "json" };
        } catch {
          // Try relaxed JS/TS object literal normalization
          const normalized = normalizeRelaxedJson(trimmed);
          return { data: JSON.parse(normalized), detectedFormat: "json" };
        }
      }
      case "jsonl": {
        const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const parsed = lines.map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return JSON.parse(normalizeRelaxedJson(line));
          }
        });
        return { data: parsed, detectedFormat: "jsonl" };
      }
      case "csv": {
        return {
          data: parseDelimitedText(trimmed, ",", true),
          detectedFormat: "csv",
        };
      }
      case "tsv": {
        return {
          data: parseDelimitedText(trimmed, "\t", true),
          detectedFormat: "tsv",
        };
      }
      case "xml": {
        return {
          data: parseXml(trimmed),
          detectedFormat: "xml",
        };
      }
      case "toml": {
        return {
          data: toml.parse(trimmed),
          detectedFormat: "toml",
        };
      }
      case "yaml": {
        return {
          data: yaml.parse(trimmed),
          detectedFormat: "yaml",
        };
      }
    }
  } catch (err) {
    return {
      data: null,
      detectedFormat: resolvedFormat,
      error: err instanceof Error ? err.message : "Failed to parse input data.",
    };
  }
}

// ============================================================================
// 2. Deep Tree Flattening & Metadata Extraction
// ============================================================================

export function getNodeValueType(val: unknown): NodeValueType {
  if (val === null || val === undefined) return "null";
  if (Array.isArray(val)) return "array";
  const t = typeof val;
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "object";
}

export function formatNodeDisplayValue(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

export function flattenDataAndComputeMetadata(
  data: unknown,
  rawInput: string,
  detectedFormat: Exclude<ExplorerInputFormat, "auto">,
): {
  nodes: FlattenedNode[];
  metadata: DatasetMetadata;
} {
  const nodes: FlattenedNode[] = [];
  let totalLeafNodes = 0;
  let totalObjects = 0;
  let totalArrays = 0;
  let maxDepth = 0;
  let maxArrayDepth = 0;

  const keyAccumulator = new Map<
    string,
    {
      count: number;
      depths: Set<number>;
      wildcardPaths: Set<string>;
      types: Record<NodeValueType, number>;
      uniqueValues: Set<string>;
      nullCount: number;
      numericValues: number[];
      sampleValues: string[];
    }
  >();

  const wildcardPathsSet = new Set<string>();

  function recordKeyStat(
    keyName: string,
    depth: number,
    wildcardPath: string,
    vType: NodeValueType,
    rawVal: unknown,
    dispVal: string,
  ) {
    if (!keyName || keyName.startsWith("[")) return;
    let entry = keyAccumulator.get(keyName);
    if (!entry) {
      entry = {
        count: 0,
        depths: new Set(),
        wildcardPaths: new Set(),
        types: { string: 0, number: 0, boolean: 0, null: 0, array: 0, object: 0 },
        uniqueValues: new Set(),
        nullCount: 0,
        numericValues: [],
        sampleValues: [],
      };
      keyAccumulator.set(keyName, entry);
    }

    entry.count++;
    entry.depths.add(depth);
    entry.wildcardPaths.add(wildcardPath);
    entry.types[vType] = (entry.types[vType] || 0) + 1;

    if (vType === "null") {
      entry.nullCount++;
    } else if (vType !== "object" && vType !== "array") {
      entry.uniqueValues.add(dispVal);
      if (entry.sampleValues.length < 5 && !entry.sampleValues.includes(dispVal)) {
        entry.sampleValues.push(dispVal);
      }
      if (typeof rawVal === "number" && !Number.isNaN(rawVal)) {
        entry.numericValues.push(rawVal);
      }
    }
  }

  let idCounter = 0;

  function traverse(
    current: unknown,
    path: string,
    wildcardPath: string,
    key: string,
    nearestNamedKey: string,
    parentPath: string,
    depth: number,
    arrayDepth: number,
  ) {
    const vType = getNodeValueType(current);
    const isLeaf = vType !== "object" && vType !== "array";
    const dispVal = formatNodeDisplayValue(current);

    if (depth > maxDepth) maxDepth = depth;
    if (arrayDepth > maxArrayDepth) maxArrayDepth = arrayDepth;

    if (isLeaf) totalLeafNodes++;
    else if (vType === "object") totalObjects++;
    else if (vType === "array") totalArrays++;

    if (wildcardPath) {
      wildcardPathsSet.add(wildcardPath);
    }

    if (depth > 0) {
      nodes.push({
        id: `n_${idCounter++}`,
        path,
        wildcardPath,
        key,
        nearestNamedKey,
        parentPath,
        depth,
        arrayDepth,
        valueType: vType,
        isLeaf,
        value: current,
        displayValue: dispVal,
      });

      recordKeyStat(key, depth, wildcardPath, vType, current, dispVal);
    }

    if (vType === "array") {
      const arr = current as unknown[];
      for (let i = 0; i < arr.length; i++) {
        const childPath = path ? `${path}[${i}]` : `[${i}]`;
        const childWildcard = wildcardPath ? `${wildcardPath}[*]` : "[*]";
        traverse(
          arr[i],
          childPath,
          childWildcard,
          `[${i}]`,
          nearestNamedKey || "root",
          path || "root",
          depth + 1,
          arrayDepth + 1,
        );
      }
    } else if (vType === "object" && current !== null) {
      const entries = Object.entries(current as Record<string, unknown>);
      for (const [k, v] of entries) {
        const needsBracket = !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k);
        const childPath = !path
          ? k
          : needsBracket
            ? `${path}["${k}"]`
            : `${path}.${k}`;
        const childWildcard = !wildcardPath
          ? k
          : needsBracket
            ? `${wildcardPath}["${k}"]`
            : `${wildcardPath}.${k}`;

        traverse(
          v,
          childPath,
          childWildcard,
          k,
          k,
          path || "root",
          depth + 1,
          arrayDepth,
        );
      }
    }
  }

  if (data !== null && data !== undefined) {
    traverse(data, "", "", "root", "root", "", 0, 0);
  }

  const keyStats: KeyMetadataStat[] = Array.from(keyAccumulator.entries()).map(
    ([key, stat]) => {
      let numericStats: KeyMetadataStat["numericStats"];
      if (stat.numericValues.length > 0) {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        let sum = 0;
        for (const n of stat.numericValues) {
          if (n < min) min = n;
          if (n > max) max = n;
          sum += n;
        }
        numericStats = {
          min,
          max,
          sum: Math.round(sum * 1000) / 1000,
          avg: Math.round((sum / stat.numericValues.length) * 1000) / 1000,
        };
      }

      return {
        key,
        count: stat.count,
        depths: Array.from(stat.depths).sort((a, b) => a - b),
        wildcardPaths: Array.from(stat.wildcardPaths),
        types: stat.types,
        uniqueValuesCount: stat.uniqueValues.size,
        nullCount: stat.nullCount,
        numericStats,
        sampleValues: stat.sampleValues,
      };
    },
  );

  return {
    nodes,
    metadata: {
      detectedFormat,
      rootType: getNodeValueType(data),
      totalNodes: nodes.length,
      totalLeafNodes,
      totalObjects,
      totalArrays,
      maxDepth,
      maxArrayDepth,
      byteSize: new Blob([rawInput]).size,
      uniqueKeys: keyStats.map((k) => k.key),
      uniqueWildcardPaths: Array.from(wildcardPathsSet),
      keyStats,
    },
  };
}

// ============================================================================
// 3. Path Pattern & Rule Filtering Engine
// ============================================================================

/**
 * Matches a node's path or wildcardPath against a user pattern.
 * Supports:
 * - Exact or substring path e.g. `DATA.keyA.a`
 * - Wildcard array indices `[*]` e.g. `DATA.keyA.a[*][*].a1`
 * - Glob `*` (single segment) and `**` (any depth) e.g. `**.a1`
 */
export function matchesPathPattern(node: FlattenedNode, patternInput: string): boolean {
  const pattern = patternInput.trim();
  if (!pattern) return true;

  const lowerPattern = pattern.toLowerCase();
  const lowerPath = node.path.toLowerCase();
  const lowerWildcard = node.wildcardPath.toLowerCase();

  if (lowerPath === lowerPattern || lowerWildcard === lowerPattern) {
    return true;
  }

  // If no glob characters are used, check substring match on path or wildcardPath
  if (!pattern.includes("*")) {
    return lowerPath.includes(lowerPattern) || lowerWildcard.includes(lowerPattern);
  }

  // Convert glob pattern (`**`, `[*]`, `*`) into a RegExp
  const regexSource = pattern
    .replace(/[.+?^${}()|\\]/g, "\\$&")
    .replace(/\\\[\\\*\\\]/g, "\\[(?:\\d+|\\*)\\]")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^.\\[\\]]*");

  try {
    const rx = new RegExp(`^${regexSource}$`, "i");
    return rx.test(node.path) || rx.test(node.wildcardPath);
  } catch {
    return lowerPath.includes(lowerPattern);
  }
}

function evaluateSingleRule(node: FlattenedNode, rule: FilterRule): boolean {
  if (!rule.enabled) return true;

  // Determine the candidate value & string to test based on `rule.target`
  let candidateRaw: unknown = node.value;
  let candidateStr = node.displayValue;

  if (rule.target === "key") {
    candidateRaw = node.key;
    candidateStr = node.key;
  } else if (rule.target === "path") {
    candidateRaw = node.path;
    candidateStr = node.path;
  } else if (rule.target === "any") {
    candidateStr = `${node.path} ${node.key} ${node.displayValue}`;
  } else if (rule.target === "object_prop") {
    const prop = rule.propertyKey.trim();
    if (!prop) return true;
    // Either the node is an object containing `prop`, OR the node itself is a leaf whose key === `prop`
    if (node.valueType === "object" && node.value !== null) {
      const obj = node.value as Record<string, unknown>;
      if (!(prop in obj)) return false;
      candidateRaw = obj[prop];
      candidateStr = formatNodeDisplayValue(candidateRaw);
    } else if (node.key === prop) {
      candidateRaw = node.value;
      candidateStr = node.displayValue;
    } else {
      return false;
    }
  }

  const targetVal = rule.value.trim();
  const lowerCandidate = candidateStr.toLowerCase();
  const lowerTarget = targetVal.toLowerCase();

  switch (rule.operator) {
    case "equals": {
      if (typeof candidateRaw === "number" && targetVal !== "" && !Number.isNaN(Number(targetVal))) {
        return candidateRaw === Number(targetVal);
      }
      return lowerCandidate === lowerTarget;
    }
    case "not_equals": {
      if (typeof candidateRaw === "number" && targetVal !== "" && !Number.isNaN(Number(targetVal))) {
        return candidateRaw !== Number(targetVal);
      }
      return lowerCandidate !== lowerTarget;
    }
    case "contains":
      return lowerCandidate.includes(lowerTarget);
    case "not_contains":
      return !lowerCandidate.includes(lowerTarget);
    case "starts_with":
      return lowerCandidate.startsWith(lowerTarget);
    case "ends_with":
      return lowerCandidate.endsWith(lowerTarget);
    case "regex": {
      if (!targetVal) return true;
      try {
        return new RegExp(targetVal, "i").test(candidateStr);
      } catch {
        return false;
      }
    }
    case "gt": {
      const num = Number(candidateRaw);
      const cmp = Number(targetVal);
      return !Number.isNaN(num) && !Number.isNaN(cmp) && num > cmp;
    }
    case "gte": {
      const num = Number(candidateRaw);
      const cmp = Number(targetVal);
      return !Number.isNaN(num) && !Number.isNaN(cmp) && num >= cmp;
    }
    case "lt": {
      const num = Number(candidateRaw);
      const cmp = Number(targetVal);
      return !Number.isNaN(num) && !Number.isNaN(cmp) && num < cmp;
    }
    case "lte": {
      const num = Number(candidateRaw);
      const cmp = Number(targetVal);
      return !Number.isNaN(num) && !Number.isNaN(cmp) && num <= cmp;
    }
    case "between": {
      const num = Number(candidateRaw);
      const min = Number(targetVal);
      const max = Number(rule.secondValue.trim());
      if (Number.isNaN(num) || Number.isNaN(min) || Number.isNaN(max)) return false;
      return num >= Math.min(min, max) && num <= Math.max(min, max);
    }
    case "in_list": {
      const list = targetVal
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (list.length === 0) return true;
      return list.includes(lowerCandidate);
    }
    case "is_null":
      return candidateRaw === null || candidateRaw === undefined || candidateStr === "";
    case "is_not_null":
      return candidateRaw !== null && candidateRaw !== undefined && candidateStr !== "";
    case "is_type":
      return getNodeValueType(candidateRaw) === lowerTarget;
    case "has_key": {
      if (node.valueType === "object" && node.value !== null) {
        return Object.prototype.hasOwnProperty.call(node.value, targetVal);
      }
      return node.key === targetVal;
    }
  }
}

// ============================================================================
// 4. Main Query, Multi-Key Selection, Sorting & Grouping Execution
// ============================================================================

export function evaluateExplorerQuery(
  allNodes: FlattenedNode[],
  config: ExplorerQueryConfig,
): ExplorerEvaluationResult {
  const selectedKeySet = new Set(config.selectedKeys);
  const hasSelectedKeys = selectedKeySet.size > 0;
  const searchLower = config.searchQuery.trim().toLowerCase();
  const activeRules = config.rules.filter((r) => r.enabled);

  // Step 1: Filter nodes
  const matchedNodes = allNodes.filter((node) => {
    // If user selected keys and is in `projected_objects` mode, we match objects that contain those keys
    if (hasSelectedKeys && config.extractionMode === "projected_objects") {
      if (node.valueType !== "object" || node.value === null) return false;
      const obj = node.value as Record<string, unknown>;
      const objKeys = Object.keys(obj);
      const matchesSelection = config.requireAllSelectedKeys
        ? config.selectedKeys.every((k) => objKeys.includes(k))
        : config.selectedKeys.some((k) => objKeys.includes(k));
      if (!matchesSelection) return false;
    } else if (hasSelectedKeys) {
      // Match nodes whose key (or nearestNamedKey) is in selectedKeySet
      if (!selectedKeySet.has(node.key)) return false;
    } else {
      // Standard nodeScope check when no specific keys are forced
      if (config.nodeScope === "leaves_only" && !node.isLeaf) return false;
      if (config.nodeScope === "objects_only" && node.valueType !== "object") return false;
      if (config.nodeScope === "arrays_only" && node.valueType !== "array") return false;
    }

    // Value type filter
    if (
      config.allowedTypes.length > 0 &&
      !config.allowedTypes.includes(node.valueType)
    ) {
      return false;
    }

    // Depth filters
    if (config.minDepth !== null && node.depth < config.minDepth) return false;
    if (config.maxDepth !== null && node.depth > config.maxDepth) return false;
    if (config.minArrayDepth !== null && node.arrayDepth < config.minArrayDepth) {
      return false;
    }

    // Path pattern filter
    if (config.pathPattern.trim() && !matchesPathPattern(node, config.pathPattern)) {
      return false;
    }

    // Quick search filter
    if (searchLower) {
      const hay = `${node.path} ${node.key} ${node.displayValue}`.toLowerCase();
      if (!hay.includes(searchLower)) return false;
    }

    // Rule builder conditions
    if (activeRules.length > 0) {
      if (config.ruleLogic === "AND") {
        if (!activeRules.every((r) => evaluateSingleRule(node, r))) return false;
      } else {
        if (!activeRules.some((r) => evaluateSingleRule(node, r))) return false;
      }
    }

    return true;
  });

  // Step 2: Sort matched nodes
  const sortedNodes = [...matchedNodes];
  if (config.sortBy !== "none") {
    sortedNodes.sort((a, b) => {
      switch (config.sortBy) {
        case "value_asc":
        case "value_desc": {
          const dir = config.sortBy === "value_asc" ? 1 : -1;
          if (typeof a.value === "number" && typeof b.value === "number") {
            return (a.value - b.value) * dir;
          }
          return a.displayValue.localeCompare(b.displayValue, undefined, { numeric: true }) * dir;
        }
        case "key_asc":
          return a.key.localeCompare(b.key, undefined, { numeric: true });
        case "key_desc":
          return b.key.localeCompare(a.key, undefined, { numeric: true });
        case "path_asc":
          return a.path.localeCompare(b.path, undefined, { numeric: true });
        case "depth_asc":
          return a.depth - b.depth;
        case "depth_desc":
          return b.depth - a.depth;
        default:
          return 0;
      }
    });
  }

  // Step 3: Deduplicate if enabled
  const finalNodes: FlattenedNode[] = [];
  if (config.deduplicateValues) {
    const seen = new Set<string>();
    for (const node of sortedNodes) {
      const sig =
        hasSelectedKeys && config.extractionMode === "projected_objects" && node.valueType === "object" && node.value !== null
          ? JSON.stringify(
              Object.fromEntries(
                config.selectedKeys
                  .filter((k) => k in (node.value as Record<string, unknown>))
                  .map((k) => [k, (node.value as Record<string, unknown>)[k]]),
              ),
            )
          : `${node.valueType}:${node.displayValue}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        finalNodes.push(node);
      }
    }
  } else {
    finalNodes.push(...sortedNodes);
  }

  // Step 4: Build extracted items & records
  const extractedItems: unknown[] = [];
  const records: ExplorerEvaluationResult["records"] = [];

  for (const node of finalNodes) {
    if (
      hasSelectedKeys &&
      config.extractionMode === "projected_objects" &&
      node.valueType === "object" &&
      node.value !== null
    ) {
      const srcObj = node.value as Record<string, unknown>;
      const projected: Record<string, unknown> = {};
      for (const k of config.selectedKeys) {
        if (k in srcObj) {
          projected[k] = srcObj[k];
        }
      }
      extractedItems.push(projected);
      records.push({
        path: node.path,
        key: node.key,
        type: "object",
        depth: node.depth,
        value: projected,
      });
    } else if (config.extractionMode === "key_value_records") {
      const rec = {
        path: node.path,
        key: node.key,
        value: node.value,
      };
      extractedItems.push(rec);
      records.push({
        path: node.path,
        key: node.key,
        type: node.valueType,
        depth: node.depth,
        value: node.value,
      });
    } else {
      extractedItems.push(node.value);
      records.push({
        path: node.path,
        key: node.key,
        type: node.valueType,
        depth: node.depth,
        value: node.value,
      });
    }
  }

  // Step 5: Compute Grouping Buckets if groupBy !== "none"
  const groups: GroupedExplorerBucket[] = [];
  if (config.groupBy !== "none" && finalNodes.length > 0) {
    const bucketMap = new Map<string, FlattenedNode[]>();

    for (const node of finalNodes) {
      let gKey = "";
      switch (config.groupBy) {
        case "key":
          gKey = node.key;
          break;
        case "value":
          gKey = node.displayValue;
          break;
        case "parent_path":
          gKey = node.parentPath || "root";
          break;
        case "wildcard_path":
          gKey = node.wildcardPath || "root";
          break;
        case "type":
          gKey = node.valueType;
          break;
        case "depth":
          gKey = `Depth ${node.depth}`;
          break;
        case "object_prop": {
          const prop = config.groupByProperty.trim();
          if (node.valueType === "object" && node.value !== null && prop in (node.value as Record<string, unknown>)) {
            gKey = formatNodeDisplayValue((node.value as Record<string, unknown>)[prop]);
          } else {
            gKey = "(missing)";
          }
          break;
        }
      }

      const list = bucketMap.get(gKey);
      if (list) {
        list.push(node);
      } else {
        bucketMap.set(gKey, [node]);
      }
    }

    for (const [groupKey, bucketNodes] of bucketMap.entries()) {
      const uniqueVals = new Set<string>();
      const numVals: number[] = [];
      const values: unknown[] = [];

      for (const n of bucketNodes) {
        uniqueVals.add(n.displayValue);
        values.push(n.value);
        if (typeof n.value === "number" && !Number.isNaN(n.value)) {
          numVals.push(n.value);
        }
      }

      let numericStats: GroupedExplorerBucket["numericStats"];
      if (numVals.length > 0) {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        let sum = 0;
        for (const v of numVals) {
          if (v < min) min = v;
          if (v > max) max = v;
          sum += v;
        }
        numericStats = {
          min,
          max,
          sum: Math.round(sum * 1000) / 1000,
          avg: Math.round((sum / numVals.length) * 1000) / 1000,
        };
      }

      groups.push({
        groupKey,
        label: groupKey,
        count: bucketNodes.length,
        percentage: Math.round((bucketNodes.length / finalNodes.length) * 1000) / 10,
        uniqueValuesCount: uniqueVals.size,
        numericStats,
        values,
        nodes: bucketNodes,
      });
    }

    groups.sort((a, b) => b.count - a.count);
  }

  return {
    matchedNodes: finalNodes,
    extractedItems,
    records,
    groups,
  };
}

// ============================================================================
// 5. Serialization for Copying Filtered Results
// ============================================================================

export function formatFilteredOutputForCopy(
  evaluation: ExplorerEvaluationResult,
  format: CopyOutputFormat,
): string {
  switch (format) {
    case "values_json":
      return JSON.stringify(evaluation.extractedItems, null, 2);
    case "records_json":
      return JSON.stringify(evaluation.records, null, 2);
    case "path_map_json": {
      const mapObj: Record<string, unknown> = {};
      for (const r of evaluation.records) {
        mapObj[r.path] = r.value;
      }
      return JSON.stringify(mapObj, null, 2);
    }
    case "lines":
      return evaluation.extractedItems
        .map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)))
        .join("\n");
    case "csv": {
      const items = evaluation.extractedItems;
      if (items.length === 0) return "";
      const allObjects = items.every(
        (it) => typeof it === "object" && it !== null && !Array.isArray(it),
      );
      if (allObjects) {
        return stringifyDelimitedText(items, ",");
      }
      return stringifyDelimitedText(
        evaluation.records.map((r) => ({
          path: r.path,
          key: r.key,
          type: r.type,
          depth: r.depth,
          value: typeof r.value === "object" ? JSON.stringify(r.value) : r.value,
        })),
        ",",
      );
    }
  }
}
