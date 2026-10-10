import { decryptPDF, isEncrypted } from "@pdfsmaller/pdf-decrypt";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { zipSync } from "fflate";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

export interface UploadedPdfFile {
  id: string;
  name: string;
  size: number;
  rawBytes: Uint8Array;
  unlockedBytes: Uint8Array | null;
  isEncrypted: boolean;
  encryptionAlgorithm?: "AES-256" | "RC4";
  isUnlocked: boolean;
  passwordUsed?: string;
  unlockError?: string;
  pageCount: number;
  colorTag: string;
}

export interface PdfPageItem {
  id: string;
  fileId: string;
  fileName: string;
  fileColor: string;
  originalPageIndex: number; // 0-based
  rotation: number; // 0, 90, 180, 270 added by user
  width: number;
  height: number;
  thumbnailUrl?: string;
  selected: boolean;
}

export type WatermarkPosition = "center-diagonal" | "header" | "footer" | "tile";

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  fontSize: number;
  opacity: number; // 0.05 to 1.0
  rotation: number; // -90 to 90
  color: string; // Hex e.g. "#ef4444"
  position: WatermarkPosition;
  targetPages: "all" | "custom";
  customRange: string; // e.g. "1, 3-5"
}

export interface PasswordProtectionConfig {
  enabled: boolean;
  userPassword: string;
  ownerPassword: string;
  algorithm: "AES-256" | "RC4";
  allowPrinting: boolean;
  allowCopying: boolean;
  allowModifying: boolean;
  allowAnnotating: boolean;
}

export type SplitMode = "ranges" | "every-page" | "every-n" | "selected";

export interface SplitConfig {
  mode: SplitMode;
  rangesInput: string; // e.g. "1-2, 3-5"
  everyNPages: number;
}

export interface SplitOutputFile {
  filename: string;
  bytes: Uint8Array;
  pageNumbers: number[]; // 1-based page indices from the current workspace
}

export type SignaturePlacementPreset =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "top-right"
  | "center"
  | "custom";

export type SignatureTargetPages = "last" | "first" | "all" | "custom";

export interface SignatureConfig {
  enabled: boolean;
  dataUrl: string; // PNG data URL
  aspectRatio: number; // width / height
  placement: SignaturePlacementPreset;
  customXPercent: number; // 0 to 100
  customYPercent: number; // 0 to 100 (from top)
  widthPercent: number; // 10 to 50 (% of page width)
  targetPages: SignatureTargetPages;
  customRange: string; // e.g. "1, 3"
  includeMetadataStamp: boolean;
  signerName: string;
  signerReason: string;
  includeTimestamp: boolean;
}

export const FILE_COLOR_TAGS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

/**
 * Checks whether a PDF byte array is password-protected.
 */
export async function checkPdfEncryption(bytes: Uint8Array): Promise<{
  encrypted: boolean;
  algorithm?: "AES-256" | "RC4";
  autoUnlockedBytes?: Uint8Array;
}> {
  try {
    const status = await isEncrypted(bytes);
    if (!status.encrypted) {
      return { encrypted: false };
    }
    return {
      encrypted: true,
      algorithm: status.algorithm,
    };
  } catch {
    return { encrypted: false };
  }
}

/**
 * Attempts to decrypt an encrypted PDF with the given password.
 */
export async function unlockPdfBytes(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  // Pass a copy of bytes so original buffer is never mutated
  const decrypted = await decryptPDF(bytes.slice(0), password);
  // Validate that pdf-lib can parse the resulting decrypted PDF
  await PDFDocument.load(decrypted, { ignoreEncryption: true });
  return decrypted;
}

/**
 * Loads an unlocked PDF and extracts its page metadata.
 */
export async function extractPdfPageMetadata(unlockedBytes: Uint8Array): Promise<{
  pageCount: number;
  pages: Array<{ width: number; height: number; rotation: number }>;
}> {
  const doc = await PDFDocument.load(unlockedBytes, { ignoreEncryption: true });
  const count = doc.getPageCount();
  const pages: Array<{ width: number; height: number; rotation: number }> = [];

  for (let i = 0; i < count; i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;
    pages.push({ width, height, rotation });
  }

  return { pageCount: count, pages };
}

/**
 * Renders a thumbnail data URL for a specific page (0-based index) using pdfjs-dist.
 */
export async function renderPageThumbnail(unlockedBytes: Uint8Array, pageIndex: number, maxDimension = 260): Promise<string> {
  if (typeof document === "undefined") {
    return "";
  }

  try {
    // Crucial: slice(0) so pdf.js worker does not detach our stored Uint8Array buffer
    const loadingTask = pdfjsLib.getDocument({
      data: unlockedBytes.slice(0),
    });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(pageIndex + 1);

    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(maxDimension / Math.max(baseViewport.width, 1), maxDimension / Math.max(baseViewport.height, 1), 2);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");

    await page.render({
      canvas,
      canvasContext: ctx ?? undefined,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    await loadingTask.destroy();
    return dataUrl;
  } catch {
    return "";
  }
}

/**
 * Renders thumbnails for all pages of a PDF using a single PDFDocument instance.
 */
export async function renderAllPageThumbnails(
  unlockedBytes: Uint8Array,
  onPageRendered: (pageIndex: number, dataUrl: string) => void,
  maxDimension = 260,
): Promise<void> {
  if (typeof document === "undefined") return;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: unlockedBytes.slice(0),
    });
    const pdfDoc = await loadingTask.promise;

    for (let i = 0; i < pdfDoc.numPages; i++) {
      try {
        const page = await pdfDoc.getPage(i + 1);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(maxDimension / Math.max(baseViewport.width, 1), maxDimension / Math.max(baseViewport.height, 1), 2);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const ctx = canvas.getContext("2d");

        await page.render({
          canvas,
          canvasContext: ctx ?? undefined,
          viewport,
        }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        if (dataUrl) {
          onPageRendered(i, dataUrl);
        }
      } catch {
        // Ignore single page render failure
      }
    }

    await loadingTask.destroy();
  } catch {
    // Ignore document render error
  }
}

/**
 * Converts a hex color (#RRGGBB) into pdf-lib rgb(r, g, b) values in [0, 1].
 */
function hexToPdfRgb(hex: string) {
  const cleaned = hex.replace(/^#/, "").trim();
  if (cleaned.length === 3) {
    const r = Number.parseInt(cleaned[0] + cleaned[0], 16) / 255;
    const g = Number.parseInt(cleaned[1] + cleaned[1], 16) / 255;
    const b = Number.parseInt(cleaned[2] + cleaned[2], 16) / 255;
    return rgb(Number.isNaN(r) ? 0 : r, Number.isNaN(g) ? 0 : g, Number.isNaN(b) ? 0 : b);
  }
  const r = Number.parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleaned.slice(4, 6), 16) / 255;
  return rgb(Number.isNaN(r) ? 0.5 : r, Number.isNaN(g) ? 0.5 : g, Number.isNaN(b) ? 0.5 : b);
}

/**
 * Parses a human page range string (1-based) like "1, 3-5, 8" into a Set of 0-based page indices.
 */
export function parsePageRangeSet(rangeStr: string, totalPages: number): Set<number> {
  const result = new Set<number>();
  const parts = rangeStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = Number.parseInt(startStr, 10);
      const end = Number.parseInt(endStr, 10);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        const low = Math.max(1, Math.min(start, end));
        const high = Math.min(totalPages, Math.max(start, end));
        for (let p = low; p <= high; p++) {
          result.add(p - 1);
        }
      }
    } else {
      const num = Number.parseInt(part, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
        result.add(num - 1);
      }
    }
  }
  return result;
}

/**
 * Parses split range groups (e.g. "1-2, 3-5, 6") into an array of 1-based page number arrays.
 */
export function parseSplitGroups(rangeStr: string, totalPages: number): { groups: number[][]; error?: string } {
  const segments = rangeStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return { groups: [], error: "Please enter at least one page number or range (e.g. 1-2, 3-5)." };
  }

  const groups: number[][] = [];
  for (const seg of segments) {
    if (seg.includes("-")) {
      const [aStr, bStr] = seg.split("-").map((s) => s.trim());
      const a = Number.parseInt(aStr, 10);
      const b = Number.parseInt(bStr, 10);
      if (Number.isNaN(a) || Number.isNaN(b) || a < 1 || b < 1 || a > totalPages || b > totalPages) {
        return {
          groups: [],
          error: `Invalid range "${seg}". Page numbers must be between 1 and ${totalPages}.`,
        };
      }
      const pages: number[] = [];
      const step = a <= b ? 1 : -1;
      for (let p = a; step > 0 ? p <= b : p >= b; p += step) {
        pages.push(p);
      }
      groups.push(pages);
    } else {
      const p = Number.parseInt(seg, 10);
      if (Number.isNaN(p) || p < 1 || p > totalPages) {
        return {
          groups: [],
          error: `Invalid page number "${seg}". Must be between 1 and ${totalPages}.`,
        };
      }
      groups.push([p]);
    }
  }

  return { groups };
}

/**
 * Applies watermark configuration onto an in-memory PDFDocument.
 */
async function applyWatermarkToPdfDoc(doc: PDFDocument, watermark: WatermarkConfig) {
  if (!watermark.enabled || !watermark.text.trim()) return;

  const text = watermark.text.trim();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const color = hexToPdfRgb(watermark.color);
  const opacity = Math.max(0.05, Math.min(1, watermark.opacity));
  const fontSize = Math.max(8, Math.min(160, watermark.fontSize));

  const targetIndices =
    watermark.targetPages === "all" ? new Set(pages.map((_, idx) => idx)) : parsePageRangeSet(watermark.customRange, pages.length);

  for (let idx = 0; idx < pages.length; idx++) {
    if (!targetIndices.has(idx)) continue;

    const page = pages[idx];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    if (watermark.position === "header") {
      page.drawText(text, {
        x: Math.max(20, (width - textWidth) / 2),
        y: height - textHeight - 28,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(0),
      });
    } else if (watermark.position === "footer") {
      page.drawText(text, {
        x: Math.max(20, (width - textWidth) / 2),
        y: 28,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(0),
      });
    } else if (watermark.position === "tile") {
      const angleDeg = watermark.rotation;
      const angleRad = (angleDeg * Math.PI) / 180;
      const cols = 3;
      const rows = 4;
      const cellW = width / cols;
      const cellH = height / rows;
      const tileFontSize = Math.max(12, Math.min(fontSize, 36));
      const tw = font.widthOfTextAtSize(text, tileFontSize);
      const th = font.heightAtSize(tileFontSize);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = cellW * (c + 0.5);
          const cy = cellH * (r + 0.5);
          const dx = (tw / 2) * Math.cos(angleRad) - (th / 2) * Math.sin(angleRad);
          const dy = (tw / 2) * Math.sin(angleRad) + (th / 2) * Math.cos(angleRad);
          page.drawText(text, {
            x: cx - dx,
            y: cy - dy,
            size: tileFontSize,
            font,
            color,
            opacity,
            rotate: degrees(angleDeg),
          });
        }
      }
    } else {
      // center-diagonal (or custom angle at center)
      const angleDeg = watermark.rotation;
      const angleRad = (angleDeg * Math.PI) / 180;
      const cx = width / 2;
      const cy = height / 2;
      const dx = (textWidth / 2) * Math.cos(angleRad) - (textHeight / 2) * Math.sin(angleRad);
      const dy = (textWidth / 2) * Math.sin(angleRad) + (textHeight / 2) * Math.cos(angleRad);

      page.drawText(text, {
        x: cx - dx,
        y: cy - dy,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(angleDeg),
      });
    }
  }
}

/**
 * Renders a typed signature string into a transparent PNG data URL.
 */
export function renderTypedSignatureToDataUrl(
  text: string,
  fontStyle: "script" | "serif" | "mono" | "bold",
  colorHex: string,
): { dataUrl: string; aspectRatio: number } {
  const cleanText = text.trim() || "Signature";
  if (typeof document === "undefined") {
    return { dataUrl: "", aspectRatio: 3 };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { dataUrl: "", aspectRatio: 3 };
  }

  const fontMap: Record<typeof fontStyle, string> = {
    script: "italic 64px 'Brush Script MT', 'Segoe Script', 'Apple Chancery', cursive",
    serif: "italic 600 58px Georgia, 'Times New Roman', serif",
    mono: "500 46px 'JetBrains Mono', monospace",
    bold: "italic 700 56px system-ui, -apple-system, sans-serif",
  };

  ctx.font = fontMap[fontStyle];
  const metrics = ctx.measureText(cleanText);
  const width = Math.max(280, Math.ceil(metrics.width) + 64);
  const height = 140;

  canvas.width = width;
  canvas.height = height;

  const ctx2 = canvas.getContext("2d");
  if (!ctx2) {
    return { dataUrl: "", aspectRatio: 3 };
  }

  ctx2.clearRect(0, 0, width, height);
  ctx2.font = fontMap[fontStyle];
  ctx2.fillStyle = colorHex;
  ctx2.textBaseline = "middle";
  ctx2.textAlign = "center";
  ctx2.fillText(cleanText, width / 2, height / 2);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    aspectRatio: width / height,
  };
}

/**
 * Converts an uploaded image File into a PNG data URL for PDF signing,
 * optionally stripping near-white paper backgrounds into transparency.
 */
export async function processUploadedSignatureImage(
  file: File,
  removeWhiteBg: boolean,
): Promise<{ dataUrl: string; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read signature image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid signature image format."));
      img.onload = () => {
        const maxDim = 900;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        if (removeWhiteBg) {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum > 235) {
              data[i + 3] = 0;
            } else if (lum > 200) {
              const factor = (235 - lum) / 35;
              data[i + 3] = Math.round(data[i + 3] * factor);
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          aspectRatio: width / height,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Computes which 0-based page indices should receive the signature.
 */
export function getSignatureTargetPageSet(
  signature: SignatureConfig,
  totalPages: number,
): Set<number> {
  if (!signature.enabled || !signature.dataUrl || totalPages <= 0) {
    return new Set();
  }
  if (signature.targetPages === "last") {
    return new Set([totalPages - 1]);
  }
  if (signature.targetPages === "first") {
    return new Set([0]);
  }
  if (signature.targetPages === "all") {
    return new Set(Array.from({ length: totalPages }, (_, i) => i));
  }
  return parsePageRangeSet(signature.customRange, totalPages);
}

/**
 * Generates a short cryptographic verification fingerprint using SHA-256.
 */
async function computeSignatureFingerprint(payload: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const encoded = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return hex.slice(0, 16).toUpperCase();
    }
  } catch {
    // Fallback
  }
  return Math.random().toString(16).slice(2, 10).toUpperCase() + Date.now().toString(16).toUpperCase();
}

/**
 * Stamps the user's digital signature (and optional verification metadata block) onto target pages.
 */
async function applySignatureToPdfDoc(doc: PDFDocument, signature: SignatureConfig) {
  if (!signature.enabled || !signature.dataUrl) return;

  const pages = doc.getPages();
  const targetIndices = getSignatureTargetPageSet(signature, pages.length);
  if (targetIndices.size === 0) return;

  const pngImage = await doc.embedPng(signature.dataUrl);
  const fontBold = signature.includeMetadataStamp
    ? await doc.embedFont(StandardFonts.HelveticaBold)
    : null;
  const fontRegular = signature.includeMetadataStamp
    ? await doc.embedFont(StandardFonts.Helvetica)
    : null;
  const fontMono = signature.includeMetadataStamp
    ? await doc.embedFont(StandardFonts.Courier)
    : null;

  const nowIso = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const fingerprint = signature.includeMetadataStamp
    ? await computeSignatureFingerprint(
        `${signature.signerName}|${signature.signerReason}|${nowIso}|${pages.length}`,
      )
    : "";

  for (let idx = 0; idx < pages.length; idx++) {
    if (!targetIndices.has(idx)) continue;

    const page = pages[idx];
    const { width, height } = page.getSize();
    const sigWidth = (width * Math.max(10, Math.min(60, signature.widthPercent))) / 100;
    const sigHeight = sigWidth / Math.max(0.25, signature.aspectRatio || 2.5);
    const metaHeight = signature.includeMetadataStamp ? 34 : 0;
    const totalBlockHeight = sigHeight + metaHeight;
    const margin = 36;

    let x = width - sigWidth - margin;
    let y = margin + metaHeight;

    switch (signature.placement) {
      case "bottom-right":
        x = width - sigWidth - margin;
        y = margin + metaHeight;
        break;
      case "bottom-left":
        x = margin;
        y = margin + metaHeight;
        break;
      case "bottom-center":
        x = (width - sigWidth) / 2;
        y = margin + metaHeight;
        break;
      case "top-right":
        x = width - sigWidth - margin;
        y = height - sigHeight - margin;
        break;
      case "center":
        x = (width - sigWidth) / 2;
        y = (height - sigHeight) / 2;
        break;
      case "custom": {
        const clampedX = Math.max(0, Math.min(100, signature.customXPercent));
        const clampedY = Math.max(0, Math.min(100, signature.customYPercent));
        x = ((width - sigWidth) * clampedX) / 100;
        y = ((height - totalBlockHeight) * (100 - clampedY)) / 100 + metaHeight;
        break;
      }
    }

    // Draw signature PNG
    page.drawImage(pngImage, {
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    });

    // Draw digital verification stamp block below the signature if enabled
    if (signature.includeMetadataStamp && fontBold && fontRegular && fontMono) {
      const lineY = y - 3;
      page.drawLine({
        start: { x, y: lineY },
        end: { x: x + sigWidth, y: lineY },
        thickness: 0.75,
        color: rgb(0.55, 0.6, 0.68),
        opacity: 0.8,
      });

      let textY = lineY - 10;
      const signerLabel = `Digitally signed by ${signature.signerName.trim() || "Authorized Signatory"}`;
      page.drawText(signerLabel, {
        x,
        y: textY,
        size: 7.5,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.28),
      });

      if (signature.signerReason.trim()) {
        textY -= 9;
        page.drawText(`Reason: ${signature.signerReason.trim()}`, {
          x,
          y: textY,
          size: 6.8,
          font: fontRegular,
          color: rgb(0.3, 0.35, 0.42),
        });
      }

      if (signature.includeTimestamp) {
        textY -= 9;
        page.drawText(`${nowIso} • ID:${fingerprint.slice(0, 10)}`, {
          x,
          y: textY,
          size: 6,
          font: fontMono,
          color: rgb(0.4, 0.45, 0.52),
        });
      }
    }
  }
}

/**
 * Builds a single PDF from the given ordered list of PdfPageItems, applying rotation, watermark, digital signature, and encryption.
 */
export async function buildFinalPdf(
  pages: PdfPageItem[],
  filesMap: Map<string, UploadedPdfFile>,
  watermark: WatermarkConfig,
  protection: PasswordProtectionConfig,
  documentTitle?: string,
  signature?: SignatureConfig,
): Promise<Uint8Array> {
  const outDoc = await PDFDocument.create();
  if (documentTitle) {
    outDoc.setTitle(documentTitle.replace(/\.pdf$/i, ""));
  }
  outDoc.setProducer("DevHaven PDF Tools");

  // Cache loaded source PDFDocuments so we only parse each source file once
  const srcDocsCache = new Map<string, PDFDocument>();

  for (const item of pages) {
    const srcFile = filesMap.get(item.fileId);
    if (!srcFile || !srcFile.unlockedBytes) {
      throw new Error(`File "${item.fileName}" is locked or missing. Please unlock it first.`);
    }

    let srcDoc = srcDocsCache.get(item.fileId);
    if (!srcDoc) {
      srcDoc = await PDFDocument.load(srcFile.unlockedBytes, { ignoreEncryption: true });
      srcDocsCache.set(item.fileId, srcDoc);
    }

    const [copiedPage] = await outDoc.copyPages(srcDoc, [item.originalPageIndex]);
    if (item.rotation !== 0) {
      const currentAngle = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentAngle + item.rotation) % 360));
    }
    outDoc.addPage(copiedPage);
  }

  // Apply watermark if enabled
  if (watermark.enabled && watermark.text.trim()) {
    await applyWatermarkToPdfDoc(outDoc, watermark);
  }

  // Apply digital signature if enabled
  if (signature?.enabled && signature.dataUrl) {
    await applySignatureToPdfDoc(outDoc, signature);
  }

  const savedBytes = await outDoc.save();

  // Apply password encryption if enabled
  if (protection.enabled && (protection.userPassword || protection.ownerPassword)) {
    const userPass = protection.userPassword;
    const ownerPass = protection.ownerPassword || protection.userPassword;
    const encryptedBytes = await encryptPDF(new Uint8Array(savedBytes), userPass, {
      ownerPassword: ownerPass,
      algorithm: protection.algorithm,
      allowPrinting: protection.allowPrinting,
      allowCopying: protection.allowCopying,
      allowModifying: protection.allowModifying,
      allowAnnotating: protection.allowAnnotating,
      allowFillingForms: protection.allowModifying,
      allowExtraction: protection.allowCopying,
      allowAssembly: protection.allowModifying,
      allowHighQualityPrint: protection.allowPrinting,
    });
    return encryptedBytes;
  }

  return new Uint8Array(savedBytes);
}

/**
 * Splits the current workspace pages into multiple PDF files according to SplitConfig.
 */
export async function buildSplitPdfs(
  pages: PdfPageItem[],
  filesMap: Map<string, UploadedPdfFile>,
  splitConfig: SplitConfig,
  watermark: WatermarkConfig,
  protection: PasswordProtectionConfig,
  baseFilename: string,
  signature?: SignatureConfig,
): Promise<SplitOutputFile[]> {
  const cleanBase = baseFilename.replace(/\.pdf$/i, "").trim() || "document";
  const outputs: SplitOutputFile[] = [];

  if (splitConfig.mode === "every-page") {
    for (let i = 0; i < pages.length; i++) {
      const singlePage = [pages[i]];
      const filename = `${cleanBase}-page-${i + 1}.pdf`;
      const bytes = await buildFinalPdf(singlePage, filesMap, watermark, protection, filename, signature);
      outputs.push({
        filename,
        bytes,
        pageNumbers: [i + 1],
      });
    }
    return outputs;
  }

  if (splitConfig.mode === "every-n") {
    const chunkSize = Math.max(1, splitConfig.everyNPages || 1);
    for (let i = 0; i < pages.length; i += chunkSize) {
      const chunk = pages.slice(i, i + chunkSize);
      const startPage = i + 1;
      const endPage = i + chunk.length;
      const label = startPage === endPage ? `page-${startPage}` : `pages-${startPage}-${endPage}`;
      const filename = `${cleanBase}-${label}.pdf`;
      const bytes = await buildFinalPdf(chunk, filesMap, watermark, protection, filename, signature);
      outputs.push({
        filename,
        bytes,
        pageNumbers: chunk.map((_, idx) => i + idx + 1),
      });
    }
    return outputs;
  }

  if (splitConfig.mode === "selected") {
    const selectedPages = pages.filter((p) => p.selected);
    const selectedIndices = pages.map((p, idx) => (p.selected ? idx + 1 : -1)).filter((idx) => idx !== -1);

    if (selectedPages.length === 0) {
      throw new Error("No pages are currently selected. Select at least one page to extract.");
    }

    const filename = `${cleanBase}-extracted.pdf`;
    const bytes = await buildFinalPdf(selectedPages, filesMap, watermark, protection, filename, signature);
    outputs.push({
      filename,
      bytes,
      pageNumbers: selectedIndices,
    });
    return outputs;
  }

  // mode === "ranges"
  const { groups, error } = parseSplitGroups(splitConfig.rangesInput, pages.length);
  if (error) {
    throw new Error(error);
  }

  for (let idx = 0; idx < groups.length; idx++) {
    const pageNums = groups[idx];
    const groupPages = pageNums.map((num) => pages[num - 1]).filter(Boolean);
    const label = pageNums.length === 1 ? `page-${pageNums[0]}` : `pages-${pageNums[0]}-${pageNums[pageNums.length - 1]}`;
    const filename = `${cleanBase}-part${idx + 1}-${label}.pdf`;
    const bytes = await buildFinalPdf(groupPages, filesMap, watermark, protection, filename, signature);
    outputs.push({
      filename,
      bytes,
      pageNumbers: pageNums,
    });
  }

  return outputs;
}

/**
 * Bundles multiple SplitOutputFiles into a single ZIP archive Uint8Array.
 */
export function bundleSplitFilesToZip(files: SplitOutputFile[]): Uint8Array {
  const archiveMap: Record<string, Uint8Array> = {};
  for (const file of files) {
    archiveMap[file.filename] = file.bytes;
  }
  return zipSync(archiveMap, { level: 6 });
}

/**
 * Triggers a browser download for a Uint8Array.
 */
export function triggerFileDownload(bytes: Uint8Array, filename: string, mimeType = "application/pdf") {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Generates sample PDFs (one standard 3-page document, one password-protected 2-page PDF with password "1234")
 * so users can immediately test merging, reordering, watermarking, splitting, and password unlocking.
 */
export async function generateDemoPdfs(): Promise<Array<{ name: string; bytes: Uint8Array }>> {
  // 1. Create a 3-page unprotected PDF ("Product-Roadmap.pdf")
  const doc1 = await PDFDocument.create();
  const fontBold = await doc1.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc1.embedFont(StandardFonts.Helvetica);

  const titles1 = ["Q1 Architecture Overview", "Q2 Infrastructure Milestones", "Q3 Security & Compliance"];

  for (let i = 0; i < titles1.length; i++) {
    const page = doc1.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Header bar
    page.drawRectangle({
      x: 40,
      y: height - 90,
      width: width - 80,
      height: 45,
      color: rgb(0.12, 0.25, 0.55),
    });

    page.drawText(`PRODUCT ROADMAP — PAGE ${i + 1}`, {
      x: 56,
      y: height - 73,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(titles1[i], {
      x: 40,
      y: height - 150,
      size: 26,
      font: fontBold,
      color: rgb(0.1, 0.12, 0.18),
    });

    page.drawText(`This is sample page ${i + 1} of 3 from Product-Roadmap.pdf. Use the organizer to drag,`, {
      x: 40,
      y: height - 195,
      size: 12,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    });
    page.drawText("re-order, rotate, watermark, split, or merge with other uploaded PDF documents.", {
      x: 40,
      y: height - 215,
      size: 12,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    });

    // Decorative wireframe card box
    page.drawRectangle({
      x: 40,
      y: height - 480,
      width: width - 80,
      height: 220,
      color: rgb(0.95, 0.96, 0.98),
      borderColor: rgb(0.8, 0.84, 0.9),
      borderWidth: 1.5,
    });

    page.drawText(`Section ${i + 1}.0 — Technical Specification Block`, {
      x: 65,
      y: height - 300,
      size: 15,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.35),
    });

    // Footer
    page.drawText(`Product-Roadmap.pdf • Page ${i + 1} of ${titles1.length}`, {
      x: 40,
      y: 40,
      size: 10,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.55),
    });
  }

  const bytes1 = new Uint8Array(await doc1.save());

  // 2. Create a 2-page password-protected PDF ("Protected-Financials.pdf", password: "1234")
  const doc2 = await PDFDocument.create();
  const fontBold2 = await doc2.embedFont(StandardFonts.HelveticaBold);
  const fontRegular2 = await doc2.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < 2; i++) {
    const page = doc2.addPage([595, 842]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 40,
      y: height - 90,
      width: width - 80,
      height: 45,
      color: rgb(0.65, 0.14, 0.18),
    });

    page.drawText(`LOCKED FINANCIAL REPORT — PAGE ${i + 1}`, {
      x: 56,
      y: height - 73,
      size: 14,
      font: fontBold2,
      color: rgb(1, 1, 1),
    });

    page.drawText(i === 0 ? "Annual Revenue Summary" : "Operating Expenses Breakdown", {
      x: 40,
      y: height - 150,
      size: 24,
      font: fontBold2,
      color: rgb(0.15, 0.1, 0.1),
    });

    page.drawText("This PDF was encrypted with AES-256 (Password: 1234) and unlocked in your browser.", {
      x: 40,
      y: height - 195,
      size: 12,
      font: fontRegular2,
      color: rgb(0.35, 0.3, 0.3),
    });

    page.drawRectangle({
      x: 40,
      y: height - 450,
      width: width - 80,
      height: 210,
      color: rgb(0.99, 0.95, 0.95),
      borderColor: rgb(0.9, 0.75, 0.75),
      borderWidth: 1.5,
    });

    page.drawText(`Protected-Financials.pdf • Page ${i + 1} of 2`, {
      x: 40,
      y: 40,
      size: 10,
      font: fontRegular2,
      color: rgb(0.5, 0.5, 0.55),
    });
  }

  const rawBytes2 = new Uint8Array(await doc2.save());
  const encryptedBytes2 = await encryptPDF(rawBytes2, "1234", {
    ownerPassword: "admin",
    algorithm: "AES-256",
  });

  return [
    { name: "Product-Roadmap.pdf", bytes: bytes1 },
    { name: "Protected-Financials.pdf", bytes: encryptedBytes2 },
  ];
}
