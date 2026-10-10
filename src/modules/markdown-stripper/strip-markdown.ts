import { marked, type Token, type Tokens } from "marked";

export interface StripMarkdownOptions {
  keepListBullets: boolean;
  includeLinkUrls: boolean;
  keepCodeBlocks: boolean;
  stripHtmlTags: boolean;
  collapseBlankLines: boolean;
}

export const DEFAULT_STRIP_OPTIONS: StripMarkdownOptions = {
  keepListBullets: false,
  includeLinkUrls: false,
  keepCodeBlocks: true,
  stripHtmlTags: true,
  collapseBlankLines: true,
};

export interface StripMarkdownResult {
  text: string;
  originalChars: number;
  cleanedChars: number;
  removedChars: number;
  wordCount: number;
  lineCount: number;
}

function cleanTextFragment(raw: string, options: StripMarkdownOptions): string {
  let text = raw;
  // Highlight ==text==
  text = text.replace(/==(?=\S)([\s\S]*?\S)==/g, "$1");
  // Footnote references [^1]
  text = text.replace(/\[\^[^\]]+\]/g, "");
  if (options.stripHtmlTags) {
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<\/?[a-z][^>]*>/gi, "");
  }
  return text;
}

function renderInlineTokens(tokens: Token[] | undefined, options: StripMarkdownOptions): string {
  if (!tokens || tokens.length === 0) return "";

  let out = "";
  for (const token of tokens) {
    switch (token.type) {
      case "strong":
      case "em":
      case "del": {
        const t = token as Tokens.Strong | Tokens.Em | Tokens.Del;
        out += renderInlineTokens(t.tokens, options);
        break;
      }
      case "codespan": {
        const t = token as Tokens.Codespan;
        out += t.text;
        break;
      }
      case "link": {
        const t = token as Tokens.Link;
        const label = renderInlineTokens(t.tokens, options) || t.text;
        if (options.includeLinkUrls && t.href && t.href !== label) {
          out += `${label} (${t.href})`;
        } else {
          out += label;
        }
        break;
      }
      case "image": {
        const t = token as Tokens.Image;
        out += t.text || "";
        break;
      }
      case "br": {
        out += "\n";
        break;
      }
      case "checkbox": {
        break;
      }
      case "escape": {
        const t = token as Tokens.Escape;
        out += t.text;
        break;
      }
      case "html": {
        const t = token as Tokens.HTML | Tokens.Tag;
        if (/^<br\s*\/?>$/i.test(t.raw.trim())) {
          out += "\n";
        } else if (options.stripHtmlTags) {
          out += t.raw.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[a-z][^>]*>/gi, "");
        } else {
          out += t.raw;
        }
        break;
      }
      case "text": {
        const t = token as Tokens.Text;
        if (t.tokens && t.tokens.length > 0) {
          out += renderInlineTokens(t.tokens, options);
        } else {
          out += cleanTextFragment(t.raw, options);
        }
        break;
      }
      default: {
        if ("tokens" in token && Array.isArray(token.tokens)) {
          out += renderInlineTokens(token.tokens, options);
        } else if ("text" in token && typeof token.text === "string") {
          out += cleanTextFragment(token.text, options);
        }
        break;
      }
    }
  }

  return out;
}

function renderList(list: Tokens.List, options: StripMarkdownOptions, depth = 0): string {
  const startNum = typeof list.start === "number" ? list.start : 1;
  const indent = "  ".repeat(depth);

  const renderedItems = list.items.map((item, idx) => {
    const bullet = options.keepListBullets ? (list.ordered ? `${indent}${startNum + idx}. ` : `${indent}• `) : depth > 0 ? indent : "";

    const childParts: string[] = [];
    for (const child of item.tokens) {
      if (child.type === "checkbox") {
        continue;
      }
      if (child.type === "list") {
        const nested = renderList(child as Tokens.List, options, depth + 1);
        if (nested) childParts.push(nested);
      } else if (child.type === "text" || child.type === "paragraph") {
        const inline = renderInlineTokens((child as Tokens.Text | Tokens.Paragraph).tokens ?? [child], options).trim();
        if (inline) childParts.push(inline);
      } else {
        const block = renderBlockTokens([child], options, depth + 1);
        if (block) childParts.push(block);
      }
    }

    const body = childParts.join("\n");
    return `${bullet}${body}`;
  });

  return renderedItems.filter(Boolean).join(list.loose ? "\n\n" : "\n");
}

function renderTable(table: Tokens.Table, options: StripMarkdownOptions): string {
  const headerCells = table.header.map((cell) => renderInlineTokens(cell.tokens, options).trim());
  const bodyRows = table.rows.map((row) => row.map((cell) => renderInlineTokens(cell.tokens, options).trim()));

  const colCount = headerCells.length;
  if (colCount === 0) return "";

  const colWidths = headerCells.map((headerText, colIdx) => {
    let max = headerText.length;
    for (const row of bodyRows) {
      const cellLen = (row[colIdx] ?? "").length;
      if (cellLen > max) max = cellLen;
    }
    return Math.max(max, 1);
  });

  const formatRow = (cells: string[]) =>
    cells
      .map((cell, colIdx) => (colIdx === colCount - 1 ? cell : cell.padEnd(colWidths[colIdx], " ")))
      .join("  ")
      .trimEnd();

  const separatorRow = colWidths.map((w) => "-".repeat(w)).join("  ");

  return [formatRow(headerCells), separatorRow, ...bodyRows.map(formatRow)].join("\n");
}

function renderBlockTokens(tokens: Token[], options: StripMarkdownOptions, listDepth = 0): string {
  const blocks: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "space":
      case "hr":
      case "def":
        break;
      case "heading": {
        const t = token as Tokens.Heading;
        const text = renderInlineTokens(t.tokens, options).trim();
        if (text) blocks.push(text);
        break;
      }
      case "paragraph": {
        const t = token as Tokens.Paragraph;
        const text = renderInlineTokens(t.tokens, options).trim();
        if (text) blocks.push(text);
        break;
      }
      case "text": {
        const t = token as Tokens.Text;
        const text = (t.tokens && t.tokens.length > 0 ? renderInlineTokens(t.tokens, options) : cleanTextFragment(t.raw, options)).trim();
        if (text) blocks.push(text);
        break;
      }
      case "blockquote": {
        const t = token as Tokens.Blockquote;
        const inner = renderBlockTokens(t.tokens, options, listDepth).trim();
        if (inner) blocks.push(inner);
        break;
      }
      case "list": {
        const t = token as Tokens.List;
        const rendered = renderList(t, options, listDepth);
        if (rendered) blocks.push(rendered);
        break;
      }
      case "table": {
        const t = token as Tokens.Table;
        const rendered = renderTable(t, options);
        if (rendered) blocks.push(rendered);
        break;
      }
      case "code": {
        const t = token as Tokens.Code;
        if (options.keepCodeBlocks && t.text.trim()) {
          blocks.push(t.text.replace(/\n$/, ""));
        }
        break;
      }
      case "html": {
        const t = token as Tokens.HTML;
        const content = options.stripHtmlTags
          ? t.raw
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<\/?[a-z][^>]*>/gi, "")
              .trim()
          : t.raw.trim();
        if (content) blocks.push(content);
        break;
      }
      default: {
        if ("tokens" in token && Array.isArray(token.tokens)) {
          const inner = renderBlockTokens(token.tokens, options, listDepth).trim();
          if (inner) blocks.push(inner);
        }
        break;
      }
    }
  }

  return blocks.join("\n\n");
}

export function stripMarkdown(input: string, options: StripMarkdownOptions = DEFAULT_STRIP_OPTIONS): StripMarkdownResult {
  const originalChars = input.length;

  if (!input.trim()) {
    return {
      text: "",
      originalChars,
      cleanedChars: 0,
      removedChars: originalChars,
      wordCount: 0,
      lineCount: 0,
    };
  }

  let normalized = input.replace(/\r\n/g, "\n");

  // Strip YAML frontmatter at start of document
  normalized = normalized.replace(/^---\n[\s\S]*?\n---\n*/, "");

  const tokens = marked.lexer(normalized, { gfm: true });
  let output = renderBlockTokens(tokens, options);

  output = output
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n");

  if (options.collapseBlankLines) {
    output = output.replace(/\n{3,}/g, "\n\n");
  }

  output = output.trim();

  const cleanedChars = output.length;
  const removedChars = Math.max(0, originalChars - cleanedChars);
  const wordCount = output ? output.split(/\s+/).length : 0;
  const lineCount = output ? output.split("\n").length : 0;

  return {
    text: output,
    originalChars,
    cleanedChars,
    removedChars,
    wordCount,
    lineCount,
  };
}
