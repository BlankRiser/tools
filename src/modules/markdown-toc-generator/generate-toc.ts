import { marked, type Token, type Tokens } from "marked";

export type TocListStyle = "hierarchical" | "bullet" | "ordered";

export interface TocGeneratorOptions {
  listStyle: TocListStyle;
  minDepth: number;
  maxDepth: number;
  indentSize: 2 | 4;
  includeLinks: boolean;
}

export const DEFAULT_TOC_OPTIONS: TocGeneratorOptions = {
  listStyle: "hierarchical",
  minDepth: 1,
  maxDepth: 2,
  indentSize: 2,
  includeLinks: true,
};

export interface TocHeadingItem {
  depth: number;
  level: number;
  text: string;
  slug: string;
  numberLabel: string;
  orderedNumber: number;
}

export interface TocGenerationResult {
  tocMarkdown: string;
  items: TocHeadingItem[];
  totalHeadingsInDoc: number;
}

function extractHeadingPlainText(tokens: Token[] | undefined, fallback: string): string {
  if (!tokens || tokens.length === 0) {
    return fallback.replace(/<[^>]+>/g, "").trim();
  }

  let out = "";
  for (const token of tokens) {
    switch (token.type) {
      case "strong":
      case "em":
      case "del":
      case "link": {
        const t = token as Tokens.Strong | Tokens.Em | Tokens.Del | Tokens.Link;
        out += extractHeadingPlainText(t.tokens, t.text);
        break;
      }
      case "codespan":
      case "escape": {
        const t = token as Tokens.Codespan | Tokens.Escape;
        out += t.text;
        break;
      }
      case "image": {
        const t = token as Tokens.Image;
        out += t.text || "";
        break;
      }
      case "html": {
        break;
      }
      case "text": {
        const t = token as Tokens.Text;
        if (t.tokens && t.tokens.length > 0) {
          out += extractHeadingPlainText(t.tokens, t.text);
        } else {
          out += t.raw;
        }
        break;
      }
      default: {
        if ("text" in token && typeof token.text === "string") {
          out += token.text;
        }
        break;
      }
    }
  }

  return out.replace(/<[^>]+>/g, "").trim();
}

/**
 * Generates a GitHub-compatible anchor slug and deduplicates repeated headings
 * with `-1`, `-2`, etc.
 */
export function createGitHubSlugger() {
  const seen = new Map<string, number>();

  return (headingText: string): string => {
    const base = headingText
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s\-_]/gu, "")
      .replace(/\s+/g, "-");

    const slugBase = base || "section";
    const count = seen.get(slugBase) ?? 0;
    seen.set(slugBase, count + 1);

    return count === 0 ? slugBase : `${slugBase}-${count}`;
  };
}

export function generateMarkdownToc(
  markdown: string,
  options: TocGeneratorOptions = DEFAULT_TOC_OPTIONS,
): TocGenerationResult {
  if (!markdown.trim()) {
    return {
      tocMarkdown: "",
      items: [],
      totalHeadingsInDoc: 0,
    };
  }

  const normalized = markdown
    .replace(/\r\n/g, "\n")
    .replace(/^---\n[\s\S]*?\n---\n*/, "");

  const tokens = marked.lexer(normalized, { gfm: true });
  const slugger = createGitHubSlugger();

  const allHeadings: Array<{ depth: number; text: string; slug: string }> = [];

  for (const token of tokens) {
    if (token.type === "heading") {
      const h = token as Tokens.Heading;
      const cleanText = extractHeadingPlainText(h.tokens, h.text);
      if (!cleanText) continue;
      const slug = slugger(cleanText);
      allHeadings.push({
        depth: h.depth,
        text: cleanText,
        slug,
      });
    }
  }

  const filtered = allHeadings.filter(
    (h) => h.depth >= options.minDepth && h.depth <= options.maxDepth,
  );

  if (filtered.length === 0) {
    return {
      tocMarkdown: "",
      items: [],
      totalHeadingsInDoc: allHeadings.length,
    };
  }

  const baseDepth = Math.min(...filtered.map((h) => h.depth));
  const counters: number[] = [];
  const items: TocHeadingItem[] = [];

  for (const heading of filtered) {
    const relativeLevel = Math.max(0, heading.depth - baseDepth);

    // Ensure parent counters are at least 1 if document skips a heading level
    for (let i = 0; i < relativeLevel; i++) {
      if (!counters[i]) {
        counters[i] = 1;
      }
    }

    counters[relativeLevel] = (counters[relativeLevel] ?? 0) + 1;
    counters.length = relativeLevel + 1;

    const orderedNumber = counters[relativeLevel];
    const numberLabel = `${counters.join(".")}.`;

    items.push({
      depth: heading.depth,
      level: relativeLevel,
      text: heading.text,
      slug: heading.slug,
      numberLabel,
      orderedNumber,
    });
  }

  const indentUnit = " ".repeat(options.indentSize);
  const lines = items.map((item) => {
    const indent = indentUnit.repeat(item.level);
    const label = options.includeLinks
      ? `[${item.text}](#${item.slug})`
      : item.text;

    let marker: string;
    if (options.listStyle === "hierarchical") {
      marker = item.numberLabel;
    } else if (options.listStyle === "ordered") {
      marker = `${item.orderedNumber}.`;
    } else {
      marker = "-";
    }

    return `${indent}${marker} ${label}`;
  });

  return {
    tocMarkdown: lines.join("\n"),
    items,
    totalHeadingsInDoc: allHeadings.length,
  };
}
