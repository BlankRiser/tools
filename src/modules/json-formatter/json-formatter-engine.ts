import { normalizeRelaxedJson } from "../data-explorer/data-explorer-engine";

export type JsonDocumentMode = "auto" | "json" | "jsonl";

export type JsonFormatAction = "beautify" | "minify" | "to_jsonl" | "to_json_array";

export type JsonIndentOption = "2" | "4" | "8" | "tab";

export interface JsonFormatterOptions {
  mode: JsonDocumentMode;
  action: JsonFormatAction;
  indent: JsonIndentOption;
  sortKeys: boolean;
  removeNulls: boolean;
  removeEmptyStrings: boolean;
  escapeUnicode: boolean;
}

export interface JsonLineValidationError {
  /** 1-indexed line number in the input */
  line: number;
  /** 1-indexed column number in the line (if known) */
  column: number | null;
  message: string;
  /** The raw line text where the error occurred */
  lineContent: string;
}

export interface JsonFormatterResult {
  isValid: boolean;
  detectedMode: "json" | "jsonl";
  output: string;
  parsedData: unknown;
  errors: JsonLineValidationError[];
  canAutoRepair: boolean;
  stats: {
    inputBytes: number;
    outputBytes: number;
    sizeDeltaPercent: number;
    lineCount: number;
    recordCount: number;
    maxDepth: number;
    totalKeys: number;
  };
}

export const DEFAULT_JSON_FORMATTER_OPTIONS: JsonFormatterOptions = {
  mode: "auto",
  action: "beautify",
  indent: "2",
  sortKeys: false,
  removeNulls: false,
  removeEmptyStrings: false,
  escapeUnicode: false,
};

// ============================================================================
// Helpers: Error Position Extraction, Key Sorting, Null Stripping, Stats
// ============================================================================

/**
 * Extracts 1-indexed (line, column) from a native `JSON.parse` SyntaxError message.
 */
export function extractJsonErrorPosition(
  errorMessage: string,
  sourceText: string,
  lineOffset = 0,
): JsonLineValidationError {
  const lines = sourceText.split(/\r?\n/);

  // V8 / Chrome / Edge / Bun: "... at position 124" or "(line 5 column 12)"
  const lineColMatch = errorMessage.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch) {
    const lineNum = Number.parseInt(lineColMatch[1], 10);
    const colNum = Number.parseInt(lineColMatch[2], 10);
    return {
      line: lineOffset + lineNum,
      column: colNum,
      message: errorMessage,
      lineContent: lines[lineNum - 1] ?? "",
    };
  }

  const posMatch = errorMessage.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = Number.parseInt(posMatch[1], 10);
    let currentOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length + 1; // +1 for newline
      if (currentOffset + lineLen > pos || i === lines.length - 1) {
        const col = Math.max(1, pos - currentOffset + 1);
        return {
          line: lineOffset + i + 1,
          column: col,
          message: errorMessage,
          lineContent: lines[i] ?? "",
        };
      }
      currentOffset += lineLen;
    }
  }

  return {
    line: lineOffset + 1,
    column: null,
    message: errorMessage,
    lineContent: lines[0] ?? "",
  };
}

/**
 * Recursively transforms parsed JSON values (sorting keys, stripping nulls/empty strings).
 */
export function transformJsonValue(
  value: unknown,
  options: Pick<JsonFormatterOptions, "sortKeys" | "removeNulls" | "removeEmptyStrings">,
): unknown {
  if (Array.isArray(value)) {
    const mapped = value
      .map((item) => transformJsonValue(item, options))
      .filter((item) => {
        if (options.removeNulls && item === null) return false;
        if (options.removeEmptyStrings && item === "") return false;
        return true;
      });
    return mapped;
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (options.sortKeys) {
      entries.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    }

    const result: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      if (options.removeNulls && v === null) continue;
      if (options.removeEmptyStrings && v === "") continue;
      result[k] = transformJsonValue(v, options);
    }
    return result;
  }

  return value;
}

function escapeNonAsciiUnicode(str: string): string {
  return str.replace(/[\u007F-\uFFFF]/g, (ch) => {
    return `\\u${`0000${ch.charCodeAt(0).toString(16)}`.slice(-4)}`;
  });
}

function computeJsonStructureStats(data: unknown): { maxDepth: number; totalKeys: number } {
  let maxDepth = 0;
  let totalKeys = 0;

  function walk(node: unknown, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item, depth + 1);
      }
    } else if (typeof node === "object" && node !== null) {
      const keys = Object.keys(node);
      totalKeys += keys.length;
      for (const k of keys) {
        walk((node as Record<string, unknown>)[k], depth + 1);
      }
    }
  }

  walk(data, 0);
  return { maxDepth, totalKeys };
}

/**
 * Auto-detects whether the input text is standard JSON or multi-line JSONL (NDJSON).
 */
export function detectJsonOrJsonl(input: string): "json" | "jsonl" {
  const trimmed = input.trim();
  if (!trimmed) return "json";

  // First check if the entire string parses as a single JSON value
  try {
    JSON.parse(trimmed);
    return "json";
  } catch {
    // Check if there are multiple non-empty lines where at least the first line looks like a JSON record
    const nonEmptyLines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (nonEmptyLines.length > 1) {
      const firstLine = nonEmptyLines[0].trim();
      const secondLine = nonEmptyLines[1].trim();
      try {
        JSON.parse(firstLine);
        return "jsonl";
      } catch {
        if (
          firstLine.startsWith("{") &&
          firstLine.endsWith("}") &&
          secondLine.startsWith("{")
        ) {
          return "jsonl";
        }
      }
    }
  }

  return "json";
}

function resolveIndentValue(indent: JsonIndentOption): string | number {
  if (indent === "tab") return "\t";
  return Number.parseInt(indent, 10) || 2;
}

// ============================================================================
// Main Formatter & Validator Entry Point
// ============================================================================

export function processJsonOrJsonl(
  rawInput: string,
  options: JsonFormatterOptions = DEFAULT_JSON_FORMATTER_OPTIONS,
): JsonFormatterResult {
  const trimmed = rawInput.trim();
  const inputBytes = new Blob([rawInput]).size;

  if (!trimmed) {
    return {
      isValid: true,
      detectedMode: options.mode === "auto" ? "json" : options.mode,
      output: "",
      parsedData: null,
      errors: [],
      canAutoRepair: false,
      stats: {
        inputBytes: 0,
        outputBytes: 0,
        sizeDeltaPercent: 0,
        lineCount: 0,
        recordCount: 0,
        maxDepth: 0,
        totalKeys: 0,
      },
    };
  }

  const resolvedMode = options.mode === "auto" ? detectJsonOrJsonl(rawInput) : options.mode;
  const indentSpace = resolveIndentValue(options.indent);

  // -------------------------------------------------------------------------
  // MODE 1: JSONL (NDJSON)
  // -------------------------------------------------------------------------
  if (resolvedMode === "jsonl") {
    const rawLines = rawInput.split(/\r?\n/);
    const parsedRecords: unknown[] = [];
    const errors: JsonLineValidationError[] = [];
    let canAutoRepair = false;

    for (let idx = 0; idx < rawLines.length; idx++) {
      const lineText = rawLines[idx].trim();
      if (!lineText) continue;

      try {
        const parsedLine = JSON.parse(lineText);
        parsedRecords.push(transformJsonValue(parsedLine, options));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid JSON on this line";
        const errPos = extractJsonErrorPosition(msg, lineText, idx);
        errors.push({
          ...errPos,
          line: idx + 1,
          lineContent: rawLines[idx],
        });

        // Check if relaxed JSON repair can fix this line
        try {
          JSON.parse(normalizeRelaxedJson(lineText));
          canAutoRepair = true;
        } catch {
          // Not auto-repairable
        }
      }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        detectedMode: "jsonl",
        output: "",
        parsedData: parsedRecords,
        errors,
        canAutoRepair,
        stats: {
          inputBytes,
          outputBytes: 0,
          sizeDeltaPercent: 0,
          lineCount: rawLines.length,
          recordCount: parsedRecords.length,
          maxDepth: 0,
          totalKeys: 0,
        },
      };
    }

    let output = "";
    if (options.action === "to_json_array") {
      output = JSON.stringify(parsedRecords, null, indentSpace);
    } else if (options.action === "minify" || options.action === "to_jsonl") {
      output = parsedRecords.map((rec) => JSON.stringify(rec)).join("\n");
    } else {
      // Beautify each JSONL record separated by a newline
      output = parsedRecords.map((rec) => JSON.stringify(rec, null, indentSpace)).join("\n\n");
    }

    if (options.escapeUnicode) {
      output = escapeNonAsciiUnicode(output);
    }

    const outputBytes = new Blob([output]).size;
    const sizeDeltaPercent =
      inputBytes > 0 ? Math.round(((outputBytes - inputBytes) / inputBytes) * 1000) / 10 : 0;
    const { maxDepth, totalKeys } = computeJsonStructureStats(parsedRecords);

    return {
      isValid: true,
      detectedMode: "jsonl",
      output,
      parsedData: parsedRecords,
      errors: [],
      canAutoRepair: false,
      stats: {
        inputBytes,
        outputBytes,
        sizeDeltaPercent,
        lineCount: output.split(/\r?\n/).length,
        recordCount: parsedRecords.length,
        maxDepth,
        totalKeys,
      },
    };
  }

  // -------------------------------------------------------------------------
  // MODE 2: Standard JSON
  // -------------------------------------------------------------------------
  try {
    const parsedRaw = JSON.parse(trimmed);
    const transformed = transformJsonValue(parsedRaw, options);

    let output = "";
    if (options.action === "minify") {
      output = JSON.stringify(transformed);
    } else if (options.action === "to_jsonl") {
      if (Array.isArray(transformed)) {
        output = transformed.map((item) => JSON.stringify(item)).join("\n");
      } else {
        output = JSON.stringify(transformed);
      }
    } else if (options.action === "to_json_array") {
      const asArray = Array.isArray(transformed) ? transformed : [transformed];
      output = JSON.stringify(asArray, null, indentSpace);
    } else {
      output = JSON.stringify(transformed, null, indentSpace);
    }

    if (options.escapeUnicode) {
      output = escapeNonAsciiUnicode(output);
    }

    const outputBytes = new Blob([output]).size;
    const sizeDeltaPercent =
      inputBytes > 0 ? Math.round(((outputBytes - inputBytes) / inputBytes) * 1000) / 10 : 0;
    const { maxDepth, totalKeys } = computeJsonStructureStats(transformed);
    const recordCount = Array.isArray(transformed) ? transformed.length : 1;

    return {
      isValid: true,
      detectedMode: "json",
      output,
      parsedData: transformed,
      errors: [],
      canAutoRepair: false,
      stats: {
        inputBytes,
        outputBytes,
        sizeDeltaPercent,
        lineCount: output.split(/\r?\n/).length,
        recordCount,
        maxDepth,
        totalKeys,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid JSON syntax";
    const errDetail = extractJsonErrorPosition(msg, rawInput, 0);

    let canAutoRepair = false;
    try {
      JSON.parse(normalizeRelaxedJson(trimmed));
      canAutoRepair = true;
    } catch {
      canAutoRepair = false;
    }

    return {
      isValid: false,
      detectedMode: "json",
      output: "",
      parsedData: null,
      errors: [errDetail],
      canAutoRepair,
      stats: {
        inputBytes,
        outputBytes: 0,
        sizeDeltaPercent: 0,
        lineCount: rawInput.split(/\r?\n/).length,
        recordCount: 0,
        maxDepth: 0,
        totalKeys: 0,
      },
    };
  }
}

/**
 * Attempts to auto-repair relaxed JSON / JSONL (trailing commas, unquoted keys, single quotes, comments).
 */
export function attemptAutoRepairJson(rawInput: string, mode: "json" | "jsonl"): string {
  if (mode === "jsonl") {
    return rawInput
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0)
      .map((line) => {
        const repaired = normalizeRelaxedJson(line.trim());
        return JSON.stringify(JSON.parse(repaired));
      })
      .join("\n");
  }

  const repaired = normalizeRelaxedJson(rawInput.trim());
  const parsed = JSON.parse(repaired);
  return JSON.stringify(parsed, null, 2);
}
