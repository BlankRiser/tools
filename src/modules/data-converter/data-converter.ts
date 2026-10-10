import * as toml from "smol-toml";
import yaml from "yaml";

export type DataFormat = "json" | "jsonl" | "csv" | "tsv" | "yaml" | "toml" | "xml";

export interface DataConverterOptions {
  jsonIndent: 2 | 4 | 0;
  yamlIndent: 2 | 4;
  csvHasHeader: boolean;
  csvDelimiter: string;
}

export const DEFAULT_CONVERTER_OPTIONS: DataConverterOptions = {
  jsonIndent: 2,
  yamlIndent: 2,
  csvHasHeader: true,
  csvDelimiter: ",",
};

export interface ConversionResult {
  output: string;
  recordCount: number;
  detectedFormat?: DataFormat;
  error?: string;
}

// -------------------------------------------------------------
// CSV / TSV Parsing & Stringifying (RFC-4180 compliant)
// -------------------------------------------------------------

export function parseDelimitedText(
  text: string,
  delimiter: string,
  hasHeader: boolean,
): any[] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // skip \r\n
      }
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) return [];

  const parseValue = (val: string): any => {
    const trimmed = val.trim();
    if (trimmed === "") return "";
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!Number.isNaN(num)) return num;
    }
    // Attempt parsing JSON objects/arrays in CSV cell
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // Fall through
      }
    }
    return val;
  };

  if (!hasHeader) {
    return lines.map((row) => row.map(parseValue));
  }

  const headers = lines[0].map((h, idx) => h.trim() || `column_${idx + 1}`);
  const result: Record<string, any>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const row = lines[r];
    const obj: Record<string, any> = {};
    for (let c = 0; c < headers.length; c++) {
      const colName = headers[c];
      obj[colName] = c < row.length ? parseValue(row[c]) : "";
    }
    result.push(obj);
  }

  return result;
}

export function stringifyDelimitedText(data: any, delimiter: string): string {
  let rows: any[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (typeof data === "object" && data !== null) {
    rows = [data];
  } else {
    rows = [{ value: data }];
  }

  if (rows.length === 0) return "";

  // Collect all unique column headers across all objects
  const headerSet = new Set<string>();
  const isAllObjects = rows.every((r) => typeof r === "object" && r !== null && !Array.isArray(r));

  if (!isAllObjects) {
    // Array of primitives or arrays
    return rows
      .map((row) => {
        if (Array.isArray(row)) {
          return row.map((cell) => formatCell(cell, delimiter)).join(delimiter);
        }
        return formatCell(row, delimiter);
      })
      .join("\n");
  }

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      headerSet.add(key);
    }
  }

  const headers = Array.from(headerSet);

  function formatCell(val: any, delim: string): string {
    if (val === null || val === undefined) return "";
    let str = "";
    if (typeof val === "object") {
      str = JSON.stringify(val);
    } else {
      str = String(val);
    }

    if (str.includes(delim) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const headerLine = headers.map((h) => formatCell(h, delimiter)).join(delimiter);
  const dataLines = rows.map((row) =>
    headers.map((h) => formatCell(row[h], delimiter)).join(delimiter),
  );

  return [headerLine, ...dataLines].join("\n");
}

// -------------------------------------------------------------
// XML Parsing & Stringifying
// -------------------------------------------------------------

export function stringifyXml(data: any, rootTag = "root"): string {
  function serializeNode(key: string, val: any, indent: string): string {
    const cleanKey = key.replace(/[^\w-]/g, "_") || "item";
    if (val === null || val === undefined) {
      return `${indent}<${cleanKey}/>`;
    }
    if (Array.isArray(val)) {
      return val.map((item) => serializeNode(cleanKey, item, indent)).join("\n");
    }
    if (typeof val === "object") {
      const childEntries = Object.entries(val);
      if (childEntries.length === 0) {
        return `${indent}<${cleanKey}/>`;
      }
      const children = childEntries
        .map(([k, v]) => serializeNode(k, v, `${indent}  `))
        .join("\n");
      return `${indent}<${cleanKey}>\n${children}\n${indent}</${cleanKey}>`;
    }
    const escaped = String(val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `${indent}<${cleanKey}>${escaped}</${cleanKey}>`;
  }

  if (Array.isArray(data)) {
    const items = data.map((item) => serializeNode("item", item, "  ")).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n${items}\n</${rootTag}>`;
  }
  if (typeof data === "object" && data !== null) {
    const entries = Object.entries(data);
    const children = entries.map(([k, v]) => serializeNode(k, v, "  ")).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n${children}\n</${rootTag}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>${String(data)}</${rootTag}>`;
}

export function parseXml(xmlText: string): any {
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser is not available in this environment.");
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(`XML Parse Error: ${parserError.textContent?.trim() || "Invalid XML"}`);
  }

  function nodeToJs(node: Element): any {
    const childElements = Array.from(node.children);
    if (childElements.length === 0) {
      const text = node.textContent?.trim() ?? "";
      if (text === "true") return true;
      if (text === "false") return false;
      if (/^-?\d+(\.\d+)?$/.test(text)) {
        const num = Number(text);
        if (!Number.isNaN(num)) return num;
      }
      return text;
    }

    const obj: Record<string, any> = {};
    for (const child of childElements) {
      const tag = child.tagName;
      const childVal = nodeToJs(child);
      if (tag in obj) {
        if (Array.isArray(obj[tag])) {
          obj[tag].push(childVal);
        } else {
          obj[tag] = [obj[tag], childVal];
        }
      } else {
        obj[tag] = childVal;
      }
    }
    return obj;
  }

  const root = doc.documentElement;
  // If root has children that are all "item", return as array
  const children = Array.from(root.children);
  if (children.length > 0 && children.every((c) => c.tagName.toLowerCase() === "item")) {
    return children.map((c) => nodeToJs(c));
  }
  return nodeToJs(root);
}

// -------------------------------------------------------------
// Auto-Detection
// -------------------------------------------------------------

export function detectFormat(text: string): DataFormat {
  const trimmed = text.trim();
  if (!trimmed) return "json";

  // XML detection
  if (trimmed.startsWith("<?xml") || (trimmed.startsWith("<") && trimmed.endsWith(">"))) {
    return "xml";
  }

  // JSON detection
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // Might be JSONL or malformed
    }
  }

  // JSONL detection (multiple lines, each valid JSON)
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length > 1 && lines.every((l) => l.trim().startsWith("{") && l.trim().endsWith("}"))) {
    try {
      JSON.parse(lines[0]);
      return "jsonl";
    } catch {
      // not JSONL
    }
  }

  // TSV detection (tab characters present in rows)
  if (trimmed.includes("\t") && lines.length > 1) {
    const tabCounts = lines.map((l) => (l.match(/\t/g) || []).length);
    if (tabCounts[0] > 0 && tabCounts.every((c) => c === tabCounts[0])) {
      return "tsv";
    }
  }

  // CSV detection (commas in rows)
  if (trimmed.includes(",") && lines.length > 1) {
    return "csv";
  }

  // TOML detection (key = value syntax or [section])
  if (/^\s*\[[^\]]+\]\s*$/m.test(trimmed) || /^\s*[A-Za-z0-9_-]+\s*=\s*/m.test(trimmed)) {
    try {
      toml.parse(trimmed);
      return "toml";
    } catch {
      // fall back to yaml
    }
  }

  // YAML default for key: value or indented blocks
  return "yaml";
}

// -------------------------------------------------------------
// Main Parse and Stringify Handlers
// -------------------------------------------------------------

export function parseData(input: string, format: DataFormat, options: DataConverterOptions): any {
  const trimmed = input.trim();
  if (!trimmed) return null;

  switch (format) {
    case "json": {
      return JSON.parse(trimmed);
    }
    case "jsonl": {
      const lines = trimmed.split("\n").filter((line) => line.trim().length > 0);
      return lines.map((line, idx) => {
        try {
          return JSON.parse(line);
        } catch (e: any) {
          throw new Error(`JSONL Parse Error on line ${idx + 1}: ${e.message}`);
        }
      });
    }
    case "csv": {
      return parseDelimitedText(trimmed, options.csvDelimiter || ",", options.csvHasHeader);
    }
    case "tsv": {
      return parseDelimitedText(trimmed, "\t", options.csvHasHeader);
    }
    case "yaml": {
      return yaml.parse(trimmed);
    }
    case "toml": {
      return toml.parse(trimmed);
    }
    case "xml": {
      return parseXml(trimmed);
    }
    default:
      throw new Error(`Unsupported source format: ${format}`);
  }
}

export function stringifyData(data: any, format: DataFormat, options: DataConverterOptions): string {
  if (data === null || data === undefined) return "";

  switch (format) {
    case "json": {
      const space = options.jsonIndent === 0 ? undefined : options.jsonIndent;
      return JSON.stringify(data, null, space);
    }
    case "jsonl": {
      if (Array.isArray(data)) {
        return data.map((item) => JSON.stringify(item)).join("\n");
      }
      return JSON.stringify(data);
    }
    case "csv": {
      return stringifyDelimitedText(data, options.csvDelimiter || ",");
    }
    case "tsv": {
      return stringifyDelimitedText(data, "\t");
    }
    case "yaml": {
      return yaml.stringify(data, { indent: options.yamlIndent });
    }
    case "toml": {
      // TOML requires the root value to be a table (an object).
      // If data is an array, wrap it in a table { items: data } so it serializes cleanly.
      if (Array.isArray(data)) {
        return toml.stringify({ items: data });
      }
      if (typeof data !== "object" || data === null) {
        return toml.stringify({ value: data });
      }
      return toml.stringify(data);
    }
    case "xml": {
      return stringifyXml(data);
    }
    default:
      throw new Error(`Unsupported target format: ${format}`);
  }
}

export function convertData(
  input: string,
  sourceFormat: DataFormat,
  targetFormat: DataFormat,
  options: DataConverterOptions = DEFAULT_CONVERTER_OPTIONS,
): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: "", recordCount: 0 };
  }

  try {
    const parsed = parseData(trimmed, sourceFormat, options);
    const output = stringifyData(parsed, targetFormat, options);

    let recordCount = 1;
    if (Array.isArray(parsed)) {
      recordCount = parsed.length;
    } else if (typeof parsed === "object" && parsed !== null) {
      recordCount = Object.keys(parsed).length;
    }

    return {
      output,
      recordCount,
    };
  } catch (err: any) {
    return {
      output: "",
      recordCount: 0,
      error: err.message || "Failed to convert data",
    };
  }
}
