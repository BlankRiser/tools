/**
 * Sort Text Utilities
 * Line sorting, deduplication, number stripping, date extraction, and ordered list view formatters.
 */

export type SortAlgorithm =
  | "alphabetical-asc"
  | "alphabetical-desc"
  | "natural-asc"
  | "natural-desc"
  | "date-asc"
  | "date-desc"
  | "numeric-asc"
  | "numeric-desc"
  | "length-asc"
  | "length-desc"
  | "random"
  | "reverse";

export type NumberStripMode = "none" | "leading" | "all";

export type DuplicateFilterMode =
  | "all"
  | "remove"
  | "only-duplicates"
  | "count-occurrences";

export type OutputView =
  | "plain"
  | "ordered-decimal"
  | "ordered-padded"
  | "ordered-alpha-lower"
  | "ordered-alpha-upper"
  | "ordered-roman-lower"
  | "ordered-roman-upper"
  | "ordered-markdown"
  | "ordered-html"
  | "unordered-bullet"
  | "unordered-hyphen"
  | "unordered-html"
  | "delimited-comma"
  | "delimited-json";

export interface SortTextOptions {
  algorithm: SortAlgorithm;
  stripNumbers: NumberStripMode;
  duplicateMode: DuplicateFilterMode;
  caseSensitiveDuplicates: boolean;
  caseSensitiveSort: boolean;
  trimLines: boolean;
  ignoreEmptyLines: boolean;
  dateFormatPreference: "auto" | "us" | "eu";
  outputView: OutputView;
  orderedDelimiter: ". " | ") " | ": " | " - " | " ";
  randomSeed?: number;
}

export const DEFAULT_SORT_OPTIONS: SortTextOptions = {
  algorithm: "alphabetical-asc",
  stripNumbers: "none",
  duplicateMode: "all",
  caseSensitiveDuplicates: false,
  caseSensitiveSort: false,
  trimLines: true,
  ignoreEmptyLines: true,
  dateFormatPreference: "auto",
  outputView: "plain",
  orderedDelimiter: ". ",
};

export interface ProcessedItem {
  original: string;
  processed: string;
  extractedDate: Date | null;
  extractedNumber: number | null;
  occurrenceCount: number;
}

export interface SortTextResult {
  lines: string[];
  items: ProcessedItem[];
  formattedOutput: string;
  stats: {
    inputCount: number;
    outputCount: number;
    duplicatesRemoved: number;
    emptyLinesRemoved: number;
    datesDetected: number;
    charCount: number;
  };
}

/**
 * Strips leading list numbers, e.g. "1. ", "01) ", "[1] ", "1 - ", "(1) "
 */
export function stripLeadingNumbering(line: string): string {
  // Matches leading numbering with dot, parenthesis, bracket, colon, or hyphen
  const leadingNumRegex =
    /^(\s*)(?:(?:\d+|[ivxlcdm]+|[a-z])[.):\-\]]|\(?\d+\)|\[\d+\]|\d+\s*[-–—:]\s*)\s*/i;
  return line.replace(leadingNumRegex, "$1");
}

/**
 * Strips all numeric digits [0-9] from line
 */
export function stripAllNumbers(line: string): string {
  return line.replace(/[0-9]/g, "");
}

/**
 * Converts a positive number to Roman numerals (1 -> i, 4 -> iv, etc.)
 */
export function toRoman(n: number): string {
  if (n <= 0 || n > 3999) return String(n);
  const romanMap: [number, string][] = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let num = n;
  let result = "";
  for (const [val, sym] of romanMap) {
    while (num >= val) {
      result += sym;
      num -= val;
    }
  }
  return result;
}

/**
 * Converts a positive number to alphabetical letters (1 -> a, 26 -> z, 27 -> aa)
 */
export function toAlpha(n: number): string {
  if (n <= 0) return String(n);
  let result = "";
  let temp = n;
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    result = String.fromCharCode(97 + rem) + result;
    temp = Math.floor((temp - 1) / 26);
  }
  return result;
}

/**
 * Robust date extractor that scans a line for standard ISO, formatted, or textual dates.
 */
export function extractDateFromLine(
  line: string,
  preference: "auto" | "us" | "eu" = "auto",
): Date | null {
  const clean = line.trim();
  if (!clean) return null;

  // 1. ISO 8601 or YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  const isoMatch = clean.match(
    /\b(\d{4})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/i,
  );
  if (isoMatch) {
    const [, year, month, day, h = "0", m = "0", s = "0"] = isoMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(h),
      Number(m),
      Number(s),
    );
    if (!isNaN(date.getTime())) return date;
  }

  // 2. Textual month format: "Jan 15, 2024", "15 January 2024", "October 5 2023"
  const textMonthMatch = clean.match(
    /\b(?:(\d{1,2})(?:st|nd|rd|th)?[\s,-]+)?(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+(?:(\d{1,2})(?:st|nd|rd|th)?[,\s]+)?(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i,
  );
  if (textMonthMatch) {
    const parsed = Date.parse(textMonthMatch[0]);
    if (!isNaN(parsed)) return new Date(parsed);
  }

  // 3. Delimited Date: MM/DD/YYYY or DD/MM/YYYY
  const delimitedMatch = clean.match(
    /\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|[12]\d|3[01])[-/.](\d{2,4})\b/,
  );
  if (delimitedMatch) {
    const n1 = Number(delimitedMatch[1]);
    const n2 = Number(delimitedMatch[2]);
    let yr = Number(delimitedMatch[3]);
    if (yr < 100) yr += yr < 50 ? 2000 : 1900;

    let month: number;
    let day: number;

    if (preference === "eu") {
      day = n1;
      month = n2;
    } else if (preference === "us") {
      month = n1;
      day = n2;
    } else {
      // Auto:
      if (n1 > 12) {
        day = n1;
        month = n2;
      } else if (n2 > 12) {
        month = n1;
        day = n2;
      } else {
        // Default to US (month first)
        month = n1;
        day = n2;
      }
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(yr, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // 4. Fallback: try parsing whole string if short
  if (clean.length < 50) {
    const directParse = Date.parse(clean);
    if (!isNaN(directParse)) return new Date(directParse);
  }

  return null;
}

/**
 * Extracts the first numeric value from a line for numeric sorting.
 */
export function extractFirstNumber(line: string): number | null {
  const match = line.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = Number(match[0]);
  return isNaN(num) ? null : num;
}

/**
 * Escapes special HTML characters.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Pseudo-random generator for reproducible shuffling
 */
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Primary processor function for Sort Text
 */
export function processSortText(
  rawInput: string,
  options: SortTextOptions,
): SortTextResult {
  const rawLines = rawInput.split(/\r?\n/);
  const inputCount = rawLines.length;

  let emptyLinesRemoved = 0;
  let datesDetectedCount = 0;

  // 1. Initial line cleanup & number stripping
  const preppedItems: Array<{ original: string; text: string }> = [];

  for (const line of rawLines) {
    let t = options.trimLines ? line.trim() : line;

    if (options.ignoreEmptyLines && t.length === 0) {
      emptyLinesRemoved++;
      continue;
    }

    if (options.stripNumbers === "leading") {
      t = stripLeadingNumbering(t);
      if (options.trimLines) t = t.trim();
    } else if (options.stripNumbers === "all") {
      t = stripAllNumbers(t);
      if (options.trimLines) t = t.trim();
    }

    preppedItems.push({
      original: line,
      text: t,
    });
  }

  // 2. Count occurrences and handle duplicates
  const countsMap = new Map<string, number>();
  const firstSeenIndexMap = new Map<string, number>();

  for (let i = 0; i < preppedItems.length; i++) {
    const item = preppedItems[i];
    const key = options.caseSensitiveDuplicates
      ? item.text
      : item.text.toLowerCase();

    const currentCount = countsMap.get(key) || 0;
    countsMap.set(key, currentCount + 1);
    if (!firstSeenIndexMap.has(key)) {
      firstSeenIndexMap.set(key, i);
    }
  }

  // 3. Filter duplicates according to duplicateMode
  let filteredItems: typeof preppedItems = [];
  let duplicatesRemoved = 0;

  if (options.duplicateMode === "remove") {
    const seen = new Set<string>();
    for (const item of preppedItems) {
      const key = options.caseSensitiveDuplicates
        ? item.text
        : item.text.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        filteredItems.push(item);
      } else {
        duplicatesRemoved++;
      }
    }
  } else if (options.duplicateMode === "only-duplicates") {
    const seen = new Set<string>();
    for (const item of preppedItems) {
      const key = options.caseSensitiveDuplicates
        ? item.text
        : item.text.toLowerCase();
      if ((countsMap.get(key) || 0) > 1 && !seen.has(key)) {
        seen.add(key);
        filteredItems.push(item);
      }
    }
  } else {
    // "all" or "count-occurrences"
    filteredItems = [...preppedItems];
  }

  // 4. Enrich with extracted date & numeric values for sorting
  const enrichedItems: ProcessedItem[] = filteredItems.map((item) => {
    const key = options.caseSensitiveDuplicates
      ? item.text
      : item.text.toLowerCase();
    const count = countsMap.get(key) || 1;
    const extractedDate = extractDateFromLine(
      item.text,
      options.dateFormatPreference,
    );
    if (extractedDate) datesDetectedCount++;
    const extractedNumber = extractFirstNumber(item.text);

    return {
      original: item.original,
      processed:
        options.duplicateMode === "count-occurrences" && count > 1
          ? `${item.text} (x${count})`
          : item.text,
      extractedDate,
      extractedNumber,
      occurrenceCount: count,
    };
  });

  // If duplicateMode was count-occurrences, deduplicate so count isn't repeated
  let itemsToSort = enrichedItems;
  if (options.duplicateMode === "count-occurrences") {
    const seen = new Set<string>();
    itemsToSort = [];
    for (const it of enrichedItems) {
      const key = options.caseSensitiveDuplicates
        ? it.processed
        : it.processed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        itemsToSort.push(it);
      } else {
        duplicatesRemoved++;
      }
    }
  }

  // 5. Apply Sorting Algorithm
  const sorted = [...itemsToSort];

  switch (options.algorithm) {
    case "alphabetical-asc":
      sorted.sort((a, b) =>
        options.caseSensitiveSort
          ? a.processed.localeCompare(b.processed, undefined, {
              sensitivity: "case",
            })
          : a.processed.localeCompare(b.processed, undefined, {
              sensitivity: "base",
            }),
      );
      break;

    case "alphabetical-desc":
      sorted.sort((a, b) =>
        options.caseSensitiveSort
          ? b.processed.localeCompare(a.processed, undefined, {
              sensitivity: "case",
            })
          : b.processed.localeCompare(a.processed, undefined, {
              sensitivity: "base",
            }),
      );
      break;

    case "natural-asc":
      sorted.sort((a, b) =>
        a.processed.localeCompare(b.processed, undefined, {
          numeric: true,
          sensitivity: options.caseSensitiveSort ? "case" : "base",
        }),
      );
      break;

    case "natural-desc":
      sorted.sort((a, b) =>
        b.processed.localeCompare(a.processed, undefined, {
          numeric: true,
          sensitivity: options.caseSensitiveSort ? "case" : "base",
        }),
      );
      break;

    case "date-asc":
      sorted.sort((a, b) => {
        if (a.extractedDate && b.extractedDate) {
          return a.extractedDate.getTime() - b.extractedDate.getTime();
        }
        if (a.extractedDate && !b.extractedDate) return -1;
        if (!a.extractedDate && b.extractedDate) return 1;
        return a.processed.localeCompare(b.processed);
      });
      break;

    case "date-desc":
      sorted.sort((a, b) => {
        if (a.extractedDate && b.extractedDate) {
          return b.extractedDate.getTime() - a.extractedDate.getTime();
        }
        if (a.extractedDate && !b.extractedDate) return -1;
        if (!a.extractedDate && b.extractedDate) return 1;
        return b.processed.localeCompare(a.processed);
      });
      break;

    case "numeric-asc":
      sorted.sort((a, b) => {
        if (a.extractedNumber !== null && b.extractedNumber !== null) {
          return a.extractedNumber - b.extractedNumber;
        }
        if (a.extractedNumber !== null && b.extractedNumber === null) return -1;
        if (a.extractedNumber === null && b.extractedNumber !== null) return 1;
        return a.processed.localeCompare(b.processed);
      });
      break;

    case "numeric-desc":
      sorted.sort((a, b) => {
        if (a.extractedNumber !== null && b.extractedNumber !== null) {
          return b.extractedNumber - a.extractedNumber;
        }
        if (a.extractedNumber !== null && b.extractedNumber === null) return -1;
        if (a.extractedNumber === null && b.extractedNumber !== null) return 1;
        return b.processed.localeCompare(a.processed);
      });
      break;

    case "length-asc":
      sorted.sort((a, b) => a.processed.length - b.processed.length);
      break;

    case "length-desc":
      sorted.sort((a, b) => b.processed.length - a.processed.length);
      break;

    case "random": {
      const rng = pseudoRandom(options.randomSeed ?? 42);
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const temp = sorted[i];
        sorted[i] = sorted[j];
        sorted[j] = temp;
      }
      break;
    }

    case "reverse":
      sorted.reverse();
      break;
  }

  const resultLines = sorted.map((item) => item.processed);

  // 6. Format Output According to View
  const formattedOutput = formatOutputView(
    resultLines,
    options.outputView,
    options.orderedDelimiter,
  );

  return {
    lines: resultLines,
    items: sorted,
    formattedOutput,
    stats: {
      inputCount,
      outputCount: resultLines.length,
      duplicatesRemoved,
      emptyLinesRemoved,
      datesDetected: datesDetectedCount,
      charCount: formattedOutput.length,
    },
  };
}

/**
 * Formats a list of lines into the requested OutputView representation.
 */
export function formatOutputView(
  lines: string[],
  view: OutputView,
  delimiter: string = ". ",
): string {
  if (lines.length === 0) return "";

  const padLength = Math.max(2, String(lines.length).length);

  switch (view) {
    case "plain":
      return lines.join("\n");

    case "ordered-decimal":
      return lines.map((l, i) => `${i + 1}${delimiter}${l}`).join("\n");

    case "ordered-padded":
      return lines
        .map((l, i) => `${String(i + 1).padStart(padLength, "0")}${delimiter}${l}`)
        .join("\n");

    case "ordered-alpha-lower":
      return lines.map((l, i) => `${toAlpha(i + 1)}${delimiter}${l}`).join("\n");

    case "ordered-alpha-upper":
      return lines
        .map((l, i) => `${toAlpha(i + 1).toUpperCase()}${delimiter}${l}`)
        .join("\n");

    case "ordered-roman-lower":
      return lines.map((l, i) => `${toRoman(i + 1)}${delimiter}${l}`).join("\n");

    case "ordered-roman-upper":
      return lines
        .map((l, i) => `${toRoman(i + 1).toUpperCase()}${delimiter}${l}`)
        .join("\n");

    case "ordered-markdown":
      return lines.map((l, i) => `${i + 1}. ${l}`).join("\n");

    case "ordered-html":
      return `<ol>\n${lines
        .map((l) => `  <li>${escapeHtml(l)}</li>`)
        .join("\n")}\n</ol>`;

    case "unordered-bullet":
      return lines.map((l) => `• ${l}`).join("\n");

    case "unordered-hyphen":
      return lines.map((l) => `- ${l}`).join("\n");

    case "unordered-html":
      return `<ul>\n${lines
        .map((l) => `  <li>${escapeHtml(l)}</li>`)
        .join("\n")}\n</ul>`;

    case "delimited-comma":
      return lines.join(", ");

    case "delimited-json":
      return JSON.stringify(lines, null, 2);

    default:
      return lines.join("\n");
  }
}
