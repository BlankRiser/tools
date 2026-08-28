export type CodecMode = "encode" | "decode";

export type ParsedImagePayload = {
  mime: string;
  dataUrl: string;
  rawBase64: string;
  bytes: Uint8Array;
};

export type ParseResult = { ok: true; value: ParsedImagePayload } | { ok: false; error: string };

const DATA_URL_RE = /^data:([^;,]+)?(;charset=[^;,]+)?(;base64)?,(.*)$/i;

const MIME_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatCount(value: number): string {
  return value.toLocaleString();
}

export function extensionForMime(mime: string): string {
  return MIME_EXTENSION[mime] ?? "img";
}

export function downloadFilename(mime: string): string {
  return `decoded.${extensionForMime(mime)}`;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function decodeBase64(raw: string): Uint8Array | null {
  try {
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }
  if (bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) {
    return "image/x-icon";
  }
  if (bytes.length >= 12) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (ftyp === "ftyp" && (brand === "avif" || brand === "avis")) return "image/avif";
  }

  const head = new TextDecoder().decode(bytes.slice(0, 256)).trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) {
    return "image/svg+xml";
  }

  return null;
}

export function toDataUrl(mime: string, rawBase64: string): string {
  return `data:${mime};base64,${rawBase64}`;
}

export function parseBase64Input(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste a Base64 string or data URL." };

  let mimeHint: string | null = null;
  let raw = trimmed.replace(/\s/g, "");

  const dataUrlMatch = trimmed.match(DATA_URL_RE);
  if (dataUrlMatch) {
    const mime = dataUrlMatch[1]?.trim() || null;
    const isBase64 = Boolean(dataUrlMatch[3]);
    const payload = (dataUrlMatch[4] ?? "").replace(/\s/g, "");
    if (!isBase64) {
      return { ok: false, error: "Expected a Base64 data URL (data:image/...;base64,...)." };
    }
    mimeHint = mime;
    raw = payload;
  }

  if (!raw) return { ok: false, error: "The Base64 payload is empty." };

  const bytes = decodeBase64(raw);
  if (!bytes || bytes.length === 0) {
    return { ok: false, error: "Could not decode this string as Base64." };
  }

  const sniffed = sniffMime(bytes);
  const mime = mimeHint && mimeHint.startsWith("image/") ? mimeHint : sniffed;
  if (!mime || !mime.startsWith("image/")) {
    return { ok: false, error: "This payload is not a valid image." };
  }

  return {
    ok: true,
    value: {
      mime,
      rawBase64: raw,
      bytes,
      dataUrl: toDataUrl(mime, raw),
    },
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read this file."));
    };
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

export function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("The browser could not render this image."));
    image.src = src;
  });
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function imageFileFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  const files = event.clipboardData?.files;
  if (files && files[0]?.type.startsWith("image/")) return files[0];
  return null;
}
