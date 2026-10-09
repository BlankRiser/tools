import { Marked } from "marked";

const markedInstance = new Marked({
  gfm: true,
  breaks: true,
});

export interface MarkdownConversionResult {
  html: string;
  clipboardHtml: string;
  plainText: string;
  wordCount: number;
  charCount: number;
}

const UNSAFE_TAGS_REGEX = /<(script|iframe|object|embed|form|style|meta|link)\b[^>]*>([\s\S]*?)<\/\1>|<(script|iframe|object|embed|form|style|meta|link)\b[^>]*\/?>/gi;
const EVENT_HANDLER_ATTR_REGEX = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_HREF_REGEX = /(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi;

export function sanitizeHtml(rawHtml: string): string {
  return rawHtml
    .replace(UNSAFE_TAGS_REGEX, "")
    .replace(EVENT_HANDLER_ATTR_REGEX, "")
    .replace(JAVASCRIPT_HREF_REGEX, '$1="#"');
}

/**
 * Adds inline styles to semantic HTML tags so pasting into Google Docs, Word,
 * Gmail, Notion, and Slack preserves visual formatting (tables, code, quotes).
 */
export function buildClipboardHtml(cleanHtml: string): string {
  if (typeof DOMParser === "undefined") {
    return cleanHtml;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="rt-root">${cleanHtml}</div>`, "text/html");
  const root = doc.getElementById("rt-root");

  if (!root) {
    return cleanHtml;
  }

  const applyStyle = (selector: string, style: string) => {
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const existing = el.getAttribute("style");
      el.setAttribute("style", existing ? `${style}; ${existing}` : style);
    });
  };

  applyStyle(
    "h1",
    "font-size: 1.75em; font-weight: 700; margin: 0.75em 0 0.4em; line-height: 1.25;",
  );
  applyStyle(
    "h2",
    "font-size: 1.4em; font-weight: 700; margin: 0.75em 0 0.4em; line-height: 1.3;",
  );
  applyStyle(
    "h3",
    "font-size: 1.17em; font-weight: 600; margin: 0.65em 0 0.35em; line-height: 1.35;",
  );
  applyStyle(
    "h4, h5, h6",
    "font-size: 1em; font-weight: 600; margin: 0.6em 0 0.3em; line-height: 1.4;",
  );
  applyStyle("p", "margin: 0 0 0.75em; line-height: 1.6;");
  applyStyle("ul, ol", "margin: 0 0 0.75em; padding-left: 1.5em; line-height: 1.6;");
  applyStyle("li", "margin: 0.2em 0;");
  applyStyle(
    "blockquote",
    "margin: 0.75em 0; padding: 0.25em 0 0.25em 0.9em; border-left: 3px solid #94a3b8; color: #475569;",
  );
  applyStyle(
    "pre",
    "font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.875em; background-color: #f1f5f9; color: #0f172a; padding: 0.85em 1em; border-radius: 6px; overflow-x: auto; margin: 0.75em 0; line-height: 1.5;",
  );
  root.querySelectorAll<HTMLElement>("code").forEach((codeEl) => {
    const isInsidePre = codeEl.parentElement?.tagName === "PRE";
    if (isInsidePre) {
      codeEl.setAttribute(
        "style",
        "font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: transparent; padding: 0;",
      );
    } else {
      codeEl.setAttribute(
        "style",
        "font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.875em; background-color: #f1f5f9; color: #0f172a; padding: 0.15em 0.35em; border-radius: 4px;",
      );
    }
  });
  applyStyle(
    "table",
    "border-collapse: collapse; width: 100%; margin: 0.85em 0; font-size: 0.925em;",
  );
  applyStyle(
    "th",
    "border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-weight: 600; background-color: #f8fafc;",
  );
  applyStyle("td", "border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;");
  applyStyle("hr", "border: none; border-top: 1px solid #cbd5e1; margin: 1.25em 0;");
  applyStyle("a", "color: #16a34a; text-decoration: underline;");

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">${root.innerHTML}</div>`;
}

export function extractPlainText(cleanHtml: string): string {
  if (typeof DOMParser === "undefined") {
    return cleanHtml.replace(/<[^>]+>/g, "");
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${cleanHtml}</div>`, "text/html");
  return (doc.body.innerText || doc.body.textContent || "").trim();
}

export function convertMarkdown(markdown: string): MarkdownConversionResult {
  const charCount = markdown.length;
  const trimmed = markdown.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  if (!trimmed) {
    return {
      html: "",
      clipboardHtml: "",
      plainText: "",
      wordCount: 0,
      charCount,
    };
  }

  const rawHtml = markedInstance.parse(markdown, { async: false }) as string;
  const html = sanitizeHtml(rawHtml).trim();
  const clipboardHtml = buildClipboardHtml(html);
  const plainText = extractPlainText(html);

  return {
    html,
    clipboardHtml,
    plainText,
    wordCount,
    charCount,
  };
}

export async function copyRichTextToClipboard(
  clipboardHtml: string,
  plainText: string,
): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof ClipboardItem !== "undefined"
  ) {
    const htmlBlob = new Blob([clipboardHtml], { type: "text/html" });
    const textBlob = new Blob([plainText], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob,
      }),
    ]);
    return;
  }

  // Fallback for environments without ClipboardItem support
  const container = document.createElement("div");
  container.innerHTML = clipboardHtml;
  container.style.position = "fixed";
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  document.body.appendChild(container);

  const range = document.createRange();
  range.selectNodeContents(container);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  document.execCommand("copy");
  selection?.removeAllRanges();
  document.body.removeChild(container);
}
