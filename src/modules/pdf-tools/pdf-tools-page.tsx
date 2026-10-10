import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { cn } from "#/lib/utils";
import {
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsDownUpIcon,
  ArrowsOutSimpleIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  CopyIcon,
  DownloadSimpleIcon,
  EraserIcon,
  EyeIcon,
  EyeSlashIcon,
  FileArchiveIcon,
  FilePdfIcon,
  FilePlusIcon,
  ImageIcon,
  KeyIcon,
  LockKeyIcon,
  LockKeyOpenIcon,
  MagnifyingGlassPlusIcon,
  PenNibIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  ShieldWarningIcon,
  SignatureIcon,
  SparkleIcon,
  SquareIcon,
  StampIcon,
  TextAaIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FILE_COLOR_TAGS,
  type PasswordProtectionConfig,
  type PdfPageItem,
  type SignatureConfig,
  type SignaturePlacementPreset,
  type SignatureTargetPages,
  type SplitConfig,
  type SplitOutputFile,
  type UploadedPdfFile,
  type WatermarkConfig,
  type WatermarkPosition,
  buildFinalPdf,
  buildSplitPdfs,
  bundleSplitFilesToZip,
  checkPdfEncryption,
  extractPdfPageMetadata,
  generateDemoPdfs,
  getSignatureTargetPageSet,
  processUploadedSignatureImage,
  renderAllPageThumbnails,
  renderPageThumbnail,
  renderTypedSignatureToDataUrl,
  triggerFileDownload,
  unlockPdfBytes,
} from "./pdf-engine";

type ActiveToolTab = "merge" | "split" | "watermark" | "sign" | "security";
type SignatureCreationMode = "draw" | "type" | "upload";
type SignatureFontStyle = "script" | "serif" | "bold" | "mono";

interface ActivePageDrag {
  idx: number;
  pageItem: PdfPageItem;
  rect: { left: number; top: number; width: number; height: number };
  dx: number;
  dy: number;
}

const WATERMARK_PRESETS = ["CONFIDENTIAL", "DRAFT", "DO NOT COPY", "SAMPLE", "INTERNAL USE ONLY", "APPROVED"];

const WATERMARK_COLORS = [
  { label: "Crimson", value: "#dc2626" },
  { label: "Slate", value: "#475569" },
  { label: "Royal Blue", value: "#2563eb" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#d97706" },
  { label: "Black", value: "#111827" },
];

const SIGNATURE_INK_COLORS = [
  { label: "Ink Black", value: "#0f172a" },
  { label: "Fountain Blue", value: "#1d4ed8" },
  { label: "Royal Navy", value: "#1e3a8a" },
  { label: "Crimson", value: "#b91c1c" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PdfToolsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sigImageInputRef = useRef<HTMLInputElement | null>(null);
  const sigPadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingSigRef = useRef(false);

  // Uploaded PDF files state
  const [files, setFiles] = useState<UploadedPdfFile[]>([]);
  // Ordered workspace pages across all unlocked PDFs
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  // Password inputs per locked file ID
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [unlockingFileId, setUnlockingFileId] = useState<string | null>(null);

  // Drag & drop state for file upload & pointer-based page reordering
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [draggedPageIdx, setDraggedPageIdx] = useState<number | null>(null);
  const [dragOverPageIdx, setDragOverPageIdx] = useState<number | null>(null);
  const [activePageDrag, setActivePageDrag] = useState<ActivePageDrag | null>(null);
  const pendingDragRef = useRef<{
    idx: number;
    pageItem: PdfPageItem;
    startX: number;
    startY: number;
    rect: { left: number; top: number; width: number; height: number };
    isDragging: boolean;
    currentOverIdx: number | null;
  } | null>(null);
  const suppressClickRef = useRef(false);

  // Active configuration tab
  const [activeTab, setActiveTab] = useState<ActiveToolTab>("merge");

  // Output filename state
  const [outputFilename, setOutputFilename] = useState("edited-document.pdf");

  // Watermark settings
  const [watermark, setWatermark] = useState<WatermarkConfig>({
    enabled: false,
    text: "CONFIDENTIAL",
    fontSize: 48,
    opacity: 0.25,
    rotation: -45,
    color: "#dc2626",
    position: "center-diagonal",
    targetPages: "all",
    customRange: "1-3",
  });

  // Digital Signature settings
  const [sigMode, setSigMode] = useState<SignatureCreationMode>("draw");
  const [sigInkColor, setSigInkColor] = useState("#1d4ed8");
  const [sigPenWidth, setSigPenWidth] = useState(3.5);
  const [sigTypedText, setSigTypedText] = useState("Alex Rivera");
  const [sigFontStyle, setSigFontStyle] = useState<SignatureFontStyle>("script");
  const [sigUploadedFile, setSigUploadedFile] = useState<File | null>(null);
  const [sigRemoveWhiteBg, setSigRemoveWhiteBg] = useState(true);
  const [signature, setSignature] = useState<SignatureConfig>({
    enabled: false,
    dataUrl: "",
    aspectRatio: 640 / 240,
    placement: "bottom-right",
    customXPercent: 75,
    customYPercent: 85,
    widthPercent: 26,
    targetPages: "last",
    customRange: "1",
    includeMetadataStamp: true,
    signerName: "Alex Rivera",
    signerReason: "Approved & Verified",
    includeTimestamp: true,
  });

  // Password protection settings for exported PDF
  const [protection, setProtection] = useState<PasswordProtectionConfig>({
    enabled: false,
    userPassword: "",
    ownerPassword: "",
    algorithm: "AES-256",
    allowPrinting: true,
    allowCopying: false,
    allowModifying: false,
    allowAnnotating: false,
  });
  const [showOutputUserPass, setShowOutputUserPass] = useState(false);
  const [showOutputOwnerPass, setShowOutputOwnerPass] = useState(false);

  // Split settings & generated split results
  const [splitConfig, setSplitConfig] = useState<SplitConfig>({
    mode: "ranges",
    rangesInput: "1-2, 3",
    everyNPages: 2,
  });
  const [splitResults, setSplitResults] = useState<SplitOutputFile[]>([]);

  // Processing states
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zoomedPage, setZoomedPage] = useState<{
    pageItem: PdfPageItem;
    index: number;
    highResUrl?: string;
  } | null>(null);

  const filesMap = useMemo(() => {
    const map = new Map<string, UploadedPdfFile>();
    for (const f of files) {
      map.set(f.id, f);
    }
    return map;
  }, [files]);

  const signedPageIndices = useMemo(
    () => getSignatureTargetPageSet(signature, pages.length),
    [signature, pages.length],
  );

  const lockedFiles = useMemo(() => files.filter((f) => f.isEncrypted && !f.isUnlocked), [files]);

  const selectedPagesCount = useMemo(() => pages.filter((p) => p.selected).length, [pages]);

  /**
   * Renders thumbnails asynchronously for newly added page items.
   */
  const populateThumbnailsForFile = useCallback(async (fileId: string, unlockedBytes: Uint8Array) => {
    await renderAllPageThumbnails(
      unlockedBytes,
      (pageIdx, thumbUrl) => {
        setPages((prev) =>
          prev.map((p) => (p.fileId === fileId && p.originalPageIndex === pageIdx ? { ...p, thumbnailUrl: thumbUrl } : p)),
        );
      },
      260,
    );
  }, []);

  /**
   * Loads an unlocked PDF's pages into the workspace.
   */
  const loadUnlockedFilePages = useCallback(
    async (fileId: string, fileName: string, fileColor: string, unlockedBytes: Uint8Array): Promise<number> => {
      const meta = await extractPdfPageMetadata(unlockedBytes);
      const newPageItems: PdfPageItem[] = meta.pages.map((p, idx) => ({
        id: `${fileId}_p${idx}_${Math.random().toString(36).slice(2, 7)}`,
        fileId,
        fileName,
        fileColor,
        originalPageIndex: idx,
        rotation: 0,
        width: p.width,
        height: p.height,
        selected: false,
      }));

      setPages((prev) => [...prev, ...newPageItems]);
      // Trigger background thumbnail rendering
      void populateThumbnailsForFile(fileId, unlockedBytes);
      return meta.pageCount;
    },
    [populateThumbnailsForFile],
  );

  /**
   * Ingests an array of raw PDF files ({ name, bytes }).
   */
  const ingestPdfPayloads = useCallback(
    async (payloads: Array<{ name: string; bytes: Uint8Array }>) => {
      if (payloads.length === 0) return;
      setIsProcessingUpload(true);

      try {
        let addedUnlockedCount = 0;
        let addedLockedCount = 0;

        for (let idx = 0; idx < payloads.length; idx++) {
          const { name, bytes } = payloads[idx];
          const fileId = `pdf_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
          const colorTag = FILE_COLOR_TAGS[(files.length + idx) % FILE_COLOR_TAGS.length];

          const encStatus = await checkPdfEncryption(bytes);

          if (encStatus.encrypted) {
            // Check if an empty user password unlocks it (owner-only password)
            let autoUnlocked: Uint8Array | null = null;
            try {
              autoUnlocked = await unlockPdfBytes(bytes, "");
            } catch {
              autoUnlocked = null;
            }

            if (autoUnlocked) {
              const pageCount = await loadUnlockedFilePages(fileId, name, colorTag, autoUnlocked);
              setFiles((prev) => [
                ...prev,
                {
                  id: fileId,
                  name,
                  size: bytes.byteLength,
                  rawBytes: bytes,
                  unlockedBytes: autoUnlocked,
                  isEncrypted: true,
                  encryptionAlgorithm: encStatus.algorithm,
                  isUnlocked: true,
                  passwordUsed: "",
                  pageCount,
                  colorTag,
                },
              ]);
              addedUnlockedCount++;
            } else {
              // Requires user password
              setFiles((prev) => [
                ...prev,
                {
                  id: fileId,
                  name,
                  size: bytes.byteLength,
                  rawBytes: bytes,
                  unlockedBytes: null,
                  isEncrypted: true,
                  encryptionAlgorithm: encStatus.algorithm,
                  isUnlocked: false,
                  pageCount: 0,
                  colorTag,
                },
              ]);
              addedLockedCount++;
            }
          } else {
            // Unprotected PDF
            const pageCount = await loadUnlockedFilePages(fileId, name, colorTag, bytes);
            setFiles((prev) => [
              ...prev,
              {
                id: fileId,
                name,
                size: bytes.byteLength,
                rawBytes: bytes,
                unlockedBytes: bytes,
                isEncrypted: false,
                isUnlocked: true,
                pageCount,
                colorTag,
              },
            ]);
            addedUnlockedCount++;
          }
        }

        // Set default output filename based on first uploaded PDF if still default
        if (files.length === 0 && payloads.length > 0) {
          const firstBase = payloads[0].name.replace(/\.pdf$/i, "");
          setOutputFilename(payloads.length > 1 ? `${firstBase}-merged.pdf` : `${firstBase}-edited.pdf`);
        }

        if (addedLockedCount > 0) {
          toast.warning(`${addedLockedCount} PDF${addedLockedCount > 1 ? "s are" : " is"} password-protected. Please enter the password to unlock.`);
        } else if (addedUnlockedCount > 0) {
          toast.success(`Loaded ${addedUnlockedCount} PDF${addedUnlockedCount > 1 ? "s" : ""} into workspace.`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to read one or more PDF files.");
      } finally {
        setIsProcessingUpload(false);
      }
    },
    [files.length, loadUnlockedFilePages],
  );

  /**
   * Handles browser FileList selection or drop.
   */
  const handleUploadFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const payloads: Array<{ name: string; bytes: Uint8Array }> = [];
      for (const file of Array.from(fileList)) {
        if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
          toast.error(`Skipped "${file.name}" — only PDF files are supported.`);
          continue;
        }
        const buffer = await file.arrayBuffer();
        payloads.push({ name: file.name, bytes: new Uint8Array(buffer) });
      }

      await ingestPdfPayloads(payloads);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [ingestPdfPayloads],
  );

  /**
   * Handles unlocking a password-protected PDF file.
   */
  const handleUnlockFile = useCallback(
    async (file: UploadedPdfFile) => {
      const enteredPassword = passwordInputs[file.id] ?? "";
      if (!enteredPassword) {
        toast.error("Please enter the password for this PDF.");
        return;
      }

      setUnlockingFileId(file.id);
      try {
        const unlockedBytes = await unlockPdfBytes(file.rawBytes, enteredPassword);
        const pageCount = await loadUnlockedFilePages(file.id, file.name, file.colorTag, unlockedBytes);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  unlockedBytes,
                  isUnlocked: true,
                  passwordUsed: enteredPassword,
                  unlockError: undefined,
                  pageCount,
                }
              : f,
          ),
        );

        toast.success(`Unlocked "${file.name}" (${pageCount} pages loaded)!`);
      } catch (err) {
        const msg =
          err instanceof Error && err.message.toLowerCase().includes("password")
            ? "Incorrect password. Please verify and try again."
            : "Failed to unlock PDF with the provided password.";

        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, unlockError: msg } : f)));
        toast.error(msg);
      } finally {
        setUnlockingFileId(null);
      }
    },
    [loadUnlockedFilePages, passwordInputs],
  );

  /**
   * Removes an uploaded file and all its associated pages from the workspace.
   */
  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setPages((prev) => prev.filter((p) => p.fileId !== fileId));
    setSplitResults([]);
  }, []);

  /**
   * Clears the entire workspace.
   */
  const handleClearAll = useCallback(() => {
    setFiles([]);
    setPages([]);
    setPasswordInputs({});
    setSplitResults([]);
    setOutputFilename("edited-document.pdf");
    toast.info("Cleared all PDFs and pages.");
  }, []);

  /**
   * Loads built-in demo PDFs (1 unprotected 3-page PDF + 1 password-protected 2-page PDF).
   */
  const handleLoadDemoPdfs = useCallback(async () => {
    setIsProcessingUpload(true);
    try {
      const demos = await generateDemoPdfs();
      await ingestPdfPayloads(demos);
    } finally {
      setIsProcessingUpload(false);
    }
  }, [ingestPdfPayloads]);

  // Page manipulation handlers
  const handleMovePage = useCallback((fromIdx: number, toIdx: number) => {
    setPages((prev) => {
      if (toIdx < 0 || toIdx >= prev.length || fromIdx === toIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const pending = pendingDragRef.current;
      if (!pending) return;

      const dx = e.clientX - pending.startX;
      const dy = e.clientY - pending.startY;

      if (!pending.isDragging) {
        if (Math.hypot(dx, dy) < 5) return;
        pending.isDragging = true;
        setDraggedPageIdx(pending.idx);
        setDragOverPageIdx(pending.idx);
      }

      setActivePageDrag({
        idx: pending.idx,
        pageItem: pending.pageItem,
        rect: pending.rect,
        dx,
        dy,
      });

      const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-page-idx]");
      if (hit) {
        const overIdx = Number.parseInt(hit.getAttribute("data-page-idx") ?? "", 10);
        if (!Number.isNaN(overIdx) && overIdx !== pending.currentOverIdx) {
          pending.currentOverIdx = overIdx;
          setDragOverPageIdx(overIdx);
        }
      }
    };

    const onPointerUp = () => {
      const pending = pendingDragRef.current;
      if (!pending) return;
      pendingDragRef.current = null;

      if (pending.isDragging) {
        suppressClickRef.current = true;
        setTimeout(() => {
          suppressClickRef.current = false;
        }, 80);

        if (pending.currentOverIdx !== null && pending.currentOverIdx !== pending.idx) {
          handleMovePage(pending.idx, pending.currentOverIdx);
        }
      }

      setActivePageDrag(null);
      setDraggedPageIdx(null);
      setDragOverPageIdx(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [handleMovePage]);

  const handleRotatePage = useCallback((pageId: string, deltaDegrees: number) => {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, rotation: (p.rotation + deltaDegrees + 360) % 360 } : p)));
  }, []);

  const handleDuplicatePage = useCallback((index: number) => {
    setPages((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const copy: PdfPageItem = {
        ...target,
        id: `${target.fileId}_p${target.originalPageIndex}_dup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        selected: false,
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    toast.success(`Duplicated page #${index + 1}`);
  }, []);

  const handleDeletePage = useCallback((pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  }, []);

  const handleToggleSelectPage = useCallback((pageId: string) => {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, selected: !p.selected } : p)));
  }, []);

  const handleSelectAllPages = useCallback((select: boolean) => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: select })));
  }, []);

  const handleRotateSelectedPages = useCallback((deltaDegrees: number) => {
    setPages((prev) => prev.map((p) => (p.selected ? { ...p, rotation: (p.rotation + deltaDegrees + 360) % 360 } : p)));
  }, []);

  const handleDeleteSelectedPages = useCallback(() => {
    setPages((prev) => prev.filter((p) => !p.selected));
    toast.info("Removed selected pages.");
  }, []);

  const handleReversePages = useCallback(() => {
    setPages((prev) => [...prev].reverse());
  }, []);

  /**
   * Opens high-res zoom modal for a specific page.
   */
  const handleInspectPage = useCallback(
    async (pageItem: PdfPageItem, index: number) => {
      setZoomedPage({ pageItem, index, highResUrl: pageItem.thumbnailUrl });
      const srcFile = filesMap.get(pageItem.fileId);
      if (srcFile?.unlockedBytes) {
        const hiRes = await renderPageThumbnail(srcFile.unlockedBytes, pageItem.originalPageIndex, 900);
        if (hiRes) {
          setZoomedPage((prev) => (prev && prev.pageItem.id === pageItem.id ? { ...prev, highResUrl: hiRes } : prev));
        }
      }
    },
    [filesMap],
  );

  const lastSigPointRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Captures current signature pad canvas into signature.dataUrl
   */
  const syncCanvasSignature = useCallback(() => {
    const canvas = sigPadCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignature((prev) => ({
      ...prev,
      enabled: true,
      dataUrl,
      aspectRatio: canvas.width / canvas.height,
    }));
  }, []);

  const getCanvasPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleSigPadPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const canvas = e.currentTarget;
      canvas.setPointerCapture(e.pointerId);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pt = getCanvasPoint(e);
      isDrawingSigRef.current = true;
      lastSigPointRef.current = pt;

      ctx.strokeStyle = sigInkColor;
      ctx.fillStyle = sigInkColor;
      ctx.lineWidth = sigPenWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, sigPenWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [getCanvasPoint, sigInkColor, sigPenWidth],
  );

  const handleSigPadPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingSigRef.current) return;
      const canvas = e.currentTarget;
      const ctx = canvas.getContext("2d");
      const lastPt = lastSigPointRef.current;
      if (!ctx || !lastPt) return;

      const pt = getCanvasPoint(e);
      ctx.strokeStyle = sigInkColor;
      ctx.lineWidth = sigPenWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(lastPt.x, lastPt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();

      lastSigPointRef.current = pt;
    },
    [getCanvasPoint, sigInkColor, sigPenWidth],
  );

  const handleSigPadPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingSigRef.current) return;
      isDrawingSigRef.current = false;
      lastSigPointRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture was already released
      }
      syncCanvasSignature();
    },
    [syncCanvasSignature],
  );

  const handleClearSigPad = useCallback(() => {
    const canvas = sigPadCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature((prev) => ({
      ...prev,
      dataUrl: "",
    }));
  }, []);

  /**
   * Generates a transparent PNG signature from typed text and updates signature state.
   */
  const handleUpdateTypedSignature = useCallback(
    (text: string, fontStyle: SignatureFontStyle, colorHex: string) => {
      setSigTypedText(text);
      setSigFontStyle(fontStyle);
      setSigInkColor(colorHex);
      if (!text.trim()) {
        setSignature((prev) => ({ ...prev, dataUrl: "" }));
        return;
      }
      const rendered = renderTypedSignatureToDataUrl(text, fontStyle, colorHex);
      setSignature((prev) => ({
        ...prev,
        enabled: true,
        dataUrl: rendered.dataUrl,
        aspectRatio: rendered.aspectRatio,
        signerName: prev.signerName.trim() ? prev.signerName : text.trim(),
      }));
    },
    [],
  );

  /**
   * Processes an uploaded signature image (PNG/JPG/WebP) with optional white background removal.
   */
  const handleProcessSignatureUpload = useCallback(
    async (file: File | null, removeWhiteBg: boolean) => {
      if (!file) return;
      try {
        const result = await processUploadedSignatureImage(file, removeWhiteBg);
        setSigUploadedFile(file);
        setSignature((prev) => ({
          ...prev,
          enabled: true,
          dataUrl: result.dataUrl,
          aspectRatio: result.aspectRatio,
        }));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load signature image.");
      }
    },
    [],
  );

  /**
   * Normalizes the user's custom output filename to ensure it ends with .pdf
   */
  const normalizedFilename = useMemo(() => {
    const trimmed = outputFilename.trim() || "edited-document";
    return trimmed.toLowerCase().endsWith(".pdf") ? trimmed : `${trimmed}.pdf`;
  }, [outputFilename]);

  /**
   * Exports and downloads the final merged/edited PDF.
   */
  const handleExportMergedPdf = useCallback(
    async (openInNewTab = false) => {
      if (pages.length === 0) {
        toast.error("No unlocked pages in workspace to export.");
        return;
      }
      if (signature.enabled && !signature.dataUrl) {
        toast.error("Digital signature is enabled — please draw, type, or upload your signature in the Sign tab.");
        setActiveTab("sign");
        return;
      }
      if (protection.enabled && !protection.userPassword && !protection.ownerPassword) {
        toast.error("Password protection is enabled — please enter a password in the Protect tab.");
        setActiveTab("security");
        return;
      }

      setIsExporting(true);
      try {
        const pdfBytes = await buildFinalPdf(pages, filesMap, watermark, protection, normalizedFilename, signature);

        if (openInNewTab) {
          const blob = new Blob([pdfBytes as unknown as BlobPart], {
            type: "application/pdf",
          });
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank", "noopener,noreferrer");
          setTimeout(() => URL.revokeObjectURL(url), 30000);
          toast.success("Opened edited PDF in a new tab.");
        } else {
          triggerFileDownload(pdfBytes, normalizedFilename, "application/pdf");
          toast.success(`Downloaded "${normalizedFilename}" (${formatBytes(pdfBytes.byteLength)})!`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate PDF.");
      } finally {
        setIsExporting(false);
      }
    },
    [filesMap, normalizedFilename, pages, protection, signature, watermark],
  );

  /**
   * Generates split PDF files based on current SplitConfig.
   */
  const handleGenerateSplitPdfs = useCallback(async () => {
    if (pages.length === 0) {
      toast.error("No unlocked pages available to split.");
      return;
    }
    if (signature.enabled && !signature.dataUrl) {
      toast.error("Digital signature is enabled — please create a signature in the Sign tab or disable it.");
      setActiveTab("sign");
      return;
    }
    if (protection.enabled && !protection.userPassword && !protection.ownerPassword) {
      toast.error("Please enter a password in the Protect tab or disable protection.");
      return;
    }

    setIsExporting(true);
    try {
      const outputs = await buildSplitPdfs(pages, filesMap, splitConfig, watermark, protection, normalizedFilename, signature);
      setSplitResults(outputs);
      toast.success(`Split into ${outputs.length} PDF file${outputs.length > 1 ? "s" : ""}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to split PDF.");
    } finally {
      setIsExporting(false);
    }
  }, [filesMap, normalizedFilename, pages, protection, signature, splitConfig, watermark]);

  /**
   * Downloads all split PDFs bundled as a ZIP archive.
   */
  const handleDownloadSplitZip = useCallback(() => {
    if (splitResults.length === 0) return;
    try {
      const zipBytes = bundleSplitFilesToZip(splitResults);
      const zipName = `${normalizedFilename.replace(/\.pdf$/i, "")}-split-files.zip`;
      triggerFileDownload(zipBytes, zipName, "application/zip");
      toast.success(`Downloaded "${zipName}"`);
    } catch {
      toast.error("Failed to create ZIP archive.");
    }
  }, [normalizedFilename, splitResults]);

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PDF Organizer & Security</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Upload multiple PDFs to unlock protected files, merge, reorder, rotate, split pages, add watermarks, and encrypt with AES-256.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="sr-only"
              onChange={(e) => void handleUploadFiles(e.target.files)}
            />
            <Button variant="default" onClick={() => fileInputRef.current?.click()} disabled={isProcessingUpload}>
              <UploadSimpleIcon data-icon="inline-start" weight="bold" />
              Add PDF Files
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleLoadDemoPdfs()}
              disabled={isProcessingUpload}
              title="Load 2 sample PDFs (one standard, one password-protected with password '1234')"
            >
              <SparkleIcon data-icon="inline-start" className="text-amber-500" weight="fill" />
              Load Demo PDFs
            </Button>
            {files.length > 0 && (
              <Button variant="ghost" onClick={handleClearAll}>
                <TrashIcon data-icon="inline-start" className="text-destructive" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Locked PDF Alert Banner */}
        {lockedFiles.length > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <LockKeyIcon className="mt-0.5 size-5 shrink-0 text-amber-500" weight="fill" />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Password-Protected PDF{lockedFiles.length > 1 ? "s" : ""} Detected ({lockedFiles.length})
                  </h3>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-300">
                    Unlock required to view & edit pages
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the password below for each encrypted PDF to unlock its pages and include them in your workspace.
                  {lockedFiles.some((f) => f.name === "Protected-Financials.pdf") && (
                    <span className="ml-1 font-medium text-foreground">
                      (Demo password for Protected-Financials.pdf is{" "}
                      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-amber-500">1234</code>)
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-1 gap-2.5 pt-1 md:grid-cols-2">
                  {lockedFiles.map((file) => {
                    const showPass = !!showPasswordMap[file.id];
                    return (
                      <div key={file.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <LockKeyIcon className="size-4 shrink-0 text-amber-500" weight="bold" />
                            <span className="truncate text-xs font-semibold text-foreground">{file.name}</span>
                          </div>
                          <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            {file.encryptionAlgorithm ?? "Encrypted"}
                          </span>
                        </div>

                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void handleUnlockFile(file);
                          }}
                        >
                          <div className="relative flex-1">
                            <Input
                              type={showPass ? "text" : "password"}
                              placeholder="Enter PDF password..."
                              value={passwordInputs[file.id] ?? ""}
                              onChange={(e) =>
                                setPasswordInputs((prev) => ({
                                  ...prev,
                                  [file.id]: e.target.value,
                                }))
                              }
                              className="h-8 pr-8 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswordMap((prev) => ({
                                  ...prev,
                                  [file.id]: !prev[file.id],
                                }))
                              }
                              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              title={showPass ? "Hide password" : "Show password"}
                            >
                              {showPass ? <EyeSlashIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                            </button>
                          </div>
                          <Button type="submit" size="xs" disabled={unlockingFileId === file.id} className="shrink-0">
                            <LockKeyOpenIcon className="mr-1 size-3.5" weight="bold" />
                            {unlockingFileId === file.id ? "Unlocking..." : "Unlock"}
                          </Button>
                          <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRemoveFile(file.id)} title="Remove file">
                            <XIcon className="size-3.5" />
                          </Button>
                        </form>

                        {file.unlockError && (
                          <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                            <WarningCircleIcon className="size-3.5 shrink-0" weight="fill" />
                            {file.unlockError}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State Dropzone when no files uploaded */}
        {files.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFiles(true);
            }}
            onDragLeave={() => setIsDraggingFiles(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFiles(false);
              void handleUploadFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all",
              isDraggingFiles ? "border-primary bg-primary/5" : "border-border/70 bg-card/40 hover:border-primary/50 hover:bg-muted/30",
            )}
          >
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <FilePlusIcon className="size-8" weight="duotone" />
            </div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Drop one or multiple PDF files here, or click to browse</h2>
            <p className="mt-1.5 max-w-md text-xs text-muted-foreground sm:text-sm">
              Merge multiple PDFs, drag to reorder pages, remove or rotate pages, split by ranges, stamp custom watermarks, and unlock or
              password-protect PDFs.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <UploadSimpleIcon className="mr-1.5 size-4" weight="bold" />
                Select PDF Files
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleLoadDemoPdfs();
                }}
              >
                <SparkleIcon className="mr-1.5 size-4 text-amber-500" weight="fill" />
                Try with Sample PDFs (Includes Protected PDF)
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left / Center Column: Uploaded Files Bar + Visual Page Organizer Grid */}
            <div className="flex flex-col gap-4 lg:col-span-8">
              {/* Uploaded Source PDFs Strip */}
              <Card size="sm">
                <CardHeader className="border-b border-border/50 pb-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      <FilePdfIcon className="size-4 text-primary" weight="bold" />
                      Uploaded Source PDFs ({files.length})
                    </CardTitle>
                    <Button variant="outline" size="xs" onClick={() => fileInputRef.current?.click()}>
                      <FilePlusIcon className="mr-1 size-3.5" weight="bold" />
                      Add More PDFs
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-2.5">
                  <div className="flex flex-wrap gap-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                          file.isEncrypted && !file.isUnlocked ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-muted/30",
                        )}
                      >
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: file.colorTag }} />
                        <span className="max-w-44 truncate font-medium text-foreground" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">({formatBytes(file.size)})</span>

                        {/* Protection Status Badge */}
                        {file.isEncrypted ? (
                          file.isUnlocked ? (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                              title="This PDF was password-protected and has been unlocked"
                            >
                              <LockKeyOpenIcon className="size-3" weight="bold" />
                              Unlocked • {file.pageCount}p
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                              title="Password required to unlock this PDF"
                            >
                              <LockKeyIcon className="size-3" weight="fill" />
                              Protected (Locked)
                            </span>
                          )
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            title="This PDF is not password-protected"
                          >
                            <CheckCircleIcon className="size-3 text-emerald-500" weight="fill" />
                            Unprotected • {file.pageCount}p
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="ml-0.5 rounded p-0.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                          title={`Remove ${file.name}`}
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Page Organizer Card */}
              <Card className="flex-1">
                <CardHeader className="border-b border-border/60 pb-3">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <span>Page Organizer & Sequence</span>
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                          {pages.length} {pages.length === 1 ? "Page" : "Pages"}
                        </span>
                        {selectedPagesCount > 0 && (
                          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            {selectedPagesCount} selected
                          </span>
                        )}
                      </CardTitle>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Drag and drop cards or use arrow buttons to reorder pages. Click any thumbnail to inspect.
                      </p>
                    </div>

                    {/* Bulk Page Toolbar */}
                    {pages.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button variant="outline" size="xs" onClick={() => handleSelectAllPages(selectedPagesCount < pages.length)}>
                          {selectedPagesCount === pages.length && pages.length > 0 ? (
                            <>
                              <SquareIcon className="mr-1 size-3.5" />
                              Deselect All
                            </>
                          ) : (
                            <>
                              <CheckSquareIcon className="mr-1 size-3.5" />
                              Select All
                            </>
                          )}
                        </Button>

                        {selectedPagesCount > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleRotateSelectedPages(90)}
                              title="Rotate selected pages 90° clockwise"
                            >
                              <ArrowClockwiseIcon className="mr-1 size-3.5" />
                              Rotate Selected
                            </Button>
                            <Button variant="destructive" size="xs" onClick={handleDeleteSelectedPages} title="Remove selected pages">
                              <TrashIcon className="mr-1 size-3.5" />
                              Remove ({selectedPagesCount})
                            </Button>
                          </>
                        )}

                        <Button variant="outline" size="xs" onClick={handleReversePages} title="Reverse entire page order">
                          <ArrowsDownUpIcon className="mr-1 size-3.5" />
                          Reverse Order
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {pages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <LockKeyIcon className="mb-2 size-8 text-amber-500" weight="duotone" />
                      <p className="text-sm font-medium text-foreground">No unlocked pages in workspace yet</p>
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Unlock the password-protected PDF above or upload another PDF file to organize its pages.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
                      {pages.map((pageItem, idx) => {
                        const isDragging = draggedPageIdx === idx;
                        const isDragOver = dragOverPageIdx === idx && draggedPageIdx !== idx;

                        return (
                          <div
                            key={pageItem.id}
                            data-page-idx={idx}
                            onPointerDown={(e) => {
                              if (e.button !== 0) return;
                              const target = e.target as HTMLElement;
                              if (target.closest("button, input, [role='checkbox'], [data-no-drag]")) {
                                return;
                              }
                              const r = e.currentTarget.getBoundingClientRect();
                              pendingDragRef.current = {
                                idx,
                                pageItem,
                                startX: e.clientX,
                                startY: e.clientY,
                                rect: { left: r.left, top: r.top, width: r.width, height: r.height },
                                isDragging: false,
                                currentOverIdx: idx,
                              };
                            }}
                            className={cn(
                              "group relative flex cursor-grab flex-col rounded-xl border bg-card p-2 transition-colors select-none touch-none active:cursor-grabbing",
                              pageItem.selected ? "border-primary ring-2 ring-primary/20" : "border-border/70 hover:border-primary/40",
                              isDragging && "opacity-30 border-dashed",
                              isDragOver && "border-primary bg-primary/5 ring-2 ring-primary/40",
                            )}
                          >
                            {/* Top Bar: Checkbox, Page Number, Source Dot */}
                            <div className="mb-1.5 flex items-center justify-between gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleSelectPage(pageItem.id)}
                                className="flex items-center gap-1.5 text-left"
                              >
                                <Checkbox checked={pageItem.selected} onCheckedChange={() => handleToggleSelectPage(pageItem.id)} />
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">#{idx + 1}</span>
                              </button>

                              <div
                                className="flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                                title={`${pageItem.fileName} (Original Page ${pageItem.originalPageIndex + 1})`}
                              >
                                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: pageItem.fileColor }} />
                                <span className="max-w-20 truncate">{pageItem.fileName}</span>
                                <span className="shrink-0 font-mono">p.{pageItem.originalPageIndex + 1}</span>
                              </div>
                            </div>

                            {/* Page Thumbnail Container */}
                            <div
                              onClick={() => {
                                if (suppressClickRef.current) return;
                                void handleInspectPage(pageItem, idx);
                              }}
                              className="relative flex aspect-[1/1.38] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted/40"
                            >
                              {pageItem.thumbnailUrl ? (
                                <img
                                  src={pageItem.thumbnailUrl}
                                  alt={`Page ${idx + 1}`}
                                  draggable={false}
                                  className="pointer-events-none max-h-full max-w-full object-contain shadow-xs transition-transform duration-200 select-none"
                                  style={{
                                    transform: `rotate(${pageItem.rotation}deg)`,
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                  <FilePdfIcon className="size-8 animate-pulse" />
                                  <span className="text-[10px]">Rendering...</span>
                                </div>
                              )}

                              {/* Live Watermark Visual Indicator Overlay */}
                              {watermark.enabled && watermark.text.trim() && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden p-2">
                                  <span
                                    className="truncate font-bold tracking-wider uppercase"
                                    style={{
                                      color: watermark.color,
                                      opacity: Math.max(0.18, watermark.opacity),
                                      transform:
                                        watermark.position === "header" || watermark.position === "footer"
                                          ? "rotate(0deg)"
                                          : `rotate(${watermark.rotation}deg)`,
                                      fontSize: `${Math.max(9, Math.min(20, Math.round(watermark.fontSize / 3.5)))}px`,
                                      alignSelf:
                                        watermark.position === "header" ? "flex-start" : watermark.position === "footer" ? "flex-end" : "center",
                                    }}
                                  >
                                    {watermark.text}
                                  </span>
                                </div>
                              )}

                              {/* Live Digital Signature Overlay on Targeted Pages */}
                              {signature.enabled && Boolean(signature.dataUrl) && signedPageIndices.has(idx) && (
                                <>
                                  <span className="pointer-events-none absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-2xs">
                                    <SignatureIcon className="size-2.5" weight="bold" />
                                    Signed
                                  </span>
                                  <div
                                    className={cn(
                                      "pointer-events-none absolute flex flex-col items-center rounded border border-emerald-500/50 bg-white/85 px-1 py-0.5 shadow-2xs",
                                      signature.placement === "bottom-right" && "right-2 bottom-2",
                                      signature.placement === "bottom-left" && "bottom-2 left-2",
                                      signature.placement === "bottom-center" && "bottom-2 left-1/2 -translate-x-1/2",
                                      signature.placement === "top-right" && "top-2 right-2",
                                    )}
                                    style={{
                                      width: `${Math.min(58, Math.max(18, signature.widthPercent))}%`,
                                      ...(signature.placement === "custom"
                                        ? {
                                            left: `${signature.customXPercent}%`,
                                            top: `${signature.customYPercent}%`,
                                            transform: "translate(-50%, -50%)",
                                          }
                                        : {}),
                                    }}
                                  >
                                    <img
                                      src={signature.dataUrl}
                                      alt="Digital signature preview"
                                      draggable={false}
                                      className="max-h-7 w-full object-contain"
                                    />
                                    {signature.includeMetadataStamp && (
                                      <span className="w-full truncate border-t border-slate-300 pt-0.5 text-center font-mono text-[6px] leading-tight text-slate-600">
                                        ✓ {signature.signerName.trim() || "Digitally Signed"}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}

                              {/* Rotation Badge */}
                              {pageItem.rotation !== 0 && (
                                <span className="absolute top-1.5 right-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary shadow-2xs">
                                  {pageItem.rotation}°
                                </span>
                              )}

                              {/* Hover Zoom Hint */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1 rounded-md bg-background/95 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm">
                                  <MagnifyingGlassPlusIcon className="size-3.5" weight="bold" />
                                  Inspect
                                </span>
                              </div>
                            </div>

                            {/* Bottom Page Action Controls */}
                            <div className="mt-2 flex items-center justify-between gap-0.5 border-t border-border/40 pt-1.5">
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  disabled={idx === 0}
                                  onClick={() => handleMovePage(idx, idx - 1)}
                                  title="Move page earlier"
                                >
                                  <ArrowLeftIcon className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  disabled={idx === pages.length - 1}
                                  onClick={() => handleMovePage(idx, idx + 1)}
                                  title="Move page later"
                                >
                                  <ArrowRightIcon className="size-3.5" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleRotatePage(pageItem.id, -90)}
                                  title="Rotate 90° counter-clockwise"
                                >
                                  <ArrowCounterClockwiseIcon className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" onClick={() => handleRotatePage(pageItem.id, 90)} title="Rotate 90° clockwise">
                                  <ArrowClockwiseIcon className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" onClick={() => handleDuplicatePage(idx)} title="Duplicate page">
                                  <CopyIcon className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleDeletePage(pageItem.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                  title="Remove page"
                                >
                                  <TrashIcon className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Operations & Export Panel */}
            <div className="flex flex-col gap-4 lg:col-span-4">
              {/* Output Filename & Quick Export Card */}
              <Card className="border-primary/30 bg-card shadow-xs">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    <span>Output File & Export</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {signature.enabled && Boolean(signature.dataUrl) && (
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Signed
                        </span>
                      )}
                      {watermark.enabled && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Watermarked</span>
                      )}
                      {protection.enabled && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          Encrypted
                        </span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 pt-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="pdf-output-filename" className="text-xs font-medium">
                      Final PDF File Name
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        id="pdf-output-filename"
                        value={outputFilename}
                        onChange={(e) => setOutputFilename(e.target.value)}
                        placeholder="my-merged-document.pdf"
                        className="pr-12 font-mono text-xs"
                      />
                      <span className="pointer-events-none absolute right-2.5 font-mono text-[11px] text-muted-foreground">.pdf</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Will be saved as <code className="font-mono text-foreground">{normalizedFilename}</code>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      variant="default"
                      className="w-full"
                      disabled={pages.length === 0 || isExporting}
                      onClick={() => void handleExportMergedPdf(false)}
                    >
                      <DownloadSimpleIcon className="mr-1.5 size-4" weight="bold" />
                      {isExporting ? "Building PDF..." : `Download PDF (${pages.length} ${pages.length === 1 ? "Page" : "Pages"})`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={pages.length === 0 || isExporting}
                      onClick={() => void handleExportMergedPdf(true)}
                    >
                      <ArrowsOutSimpleIcon className="mr-1.5 size-3.5" />
                      Preview Edited PDF in New Tab
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tool Modes Tabbed Card: Merge Info / Split / Watermark / Digital Signature / Password Protection */}
              <Card>
                <CardHeader className="border-b border-border/60 pb-2.5">
                  <div className="grid grid-cols-5 gap-1 rounded-lg bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("merge")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all",
                        activeTab === "merge" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <FilePdfIcon className="size-4" weight="duotone" />
                      <span>Summary</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("split")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all",
                        activeTab === "split" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <ScissorsIcon className="size-4" weight="duotone" />
                      <span>Split</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("watermark")}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all",
                        activeTab === "watermark" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <StampIcon className="size-4" weight="duotone" />
                      <span>Watermark</span>
                      {watermark.enabled && <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-primary" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("sign")}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all",
                        activeTab === "sign" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <SignatureIcon className="size-4" weight="duotone" />
                      <span>Sign</span>
                      {signature.enabled && Boolean(signature.dataUrl) && (
                        <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("security")}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all",
                        activeTab === "security" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <KeyIcon className="size-4" weight="duotone" />
                      <span>Protect</span>
                      {protection.enabled && <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-amber-500" />}
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* TAB 1: SUMMARY & MERGE INFO */}
                  {activeTab === "merge" && (
                    <div className="space-y-4">
                      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                        <h4 className="text-xs font-semibold text-foreground">Workspace Overview</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md border border-border/50 bg-background p-2">
                            <span className="block text-[11px] text-muted-foreground">Uploaded Files</span>
                            <span className="font-mono text-sm font-bold text-foreground">
                              {files.length} ({lockedFiles.length} locked)
                            </span>
                          </div>
                          <div className="rounded-md border border-border/50 bg-background p-2">
                            <span className="block text-[11px] text-muted-foreground">Active Pages</span>
                            <span className="font-mono text-sm font-bold text-primary">{pages.length}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Quick Tips:</p>
                        <ul className="list-disc space-y-1.5 pl-4">
                          <li>
                            <strong>Merge & Reorder:</strong> Drag any page card in the grid to change its sequence across uploaded PDFs.
                          </li>
                          <li>
                            <strong>Remove or Duplicate:</strong> Hover a page card to duplicate or delete individual pages, or select multiple pages
                            for bulk actions.
                          </li>
                          <li>
                            <strong>Split PDF:</strong> Switch to the <em>Split</em> tab to extract ranges or individual pages into separate PDFs.
                          </li>
                          <li>
                            <strong>Digital Signature:</strong> Switch to the <em>Sign</em> tab to draw, type, or upload a signature with a verification
                            stamp.
                          </li>
                          <li>
                            <strong>Watermark & Password:</strong> Enable stamps or AES-256 password encryption before downloading.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SPLIT PDF */}
                  {activeTab === "split" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Split Method</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "ranges", label: "Custom Ranges" },
                            { id: "every-page", label: "Every Single Page" },
                            { id: "every-n", label: "Every N Pages" },
                            {
                              id: "selected",
                              label: `Selected (${selectedPagesCount})`,
                            },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setSplitConfig((prev) => ({
                                  ...prev,
                                  mode: item.id as SplitConfig["mode"],
                                }));
                                setSplitResults([]);
                              }}
                              className={cn(
                                "rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                                splitConfig.mode === item.id
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {splitConfig.mode === "ranges" && (
                        <div className="space-y-1.5">
                          <Label htmlFor="split-ranges" className="text-xs">
                            Page Ranges (comma-separated)
                          </Label>
                          <Input
                            id="split-ranges"
                            value={splitConfig.rangesInput}
                            onChange={(e) =>
                              setSplitConfig((prev) => ({
                                ...prev,
                                rangesInput: e.target.value,
                              }))
                            }
                            placeholder="e.g. 1-2, 3-5, 6"
                            className="font-mono text-xs"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Each comma-separated range creates a separate PDF file (1 to {pages.length}).
                          </p>
                        </div>
                      )}

                      {splitConfig.mode === "every-n" && (
                        <div className="space-y-1.5">
                          <Label htmlFor="split-every-n" className="text-xs">
                            Pages per Split File
                          </Label>
                          <Input
                            id="split-every-n"
                            type="number"
                            min={1}
                            max={Math.max(1, pages.length)}
                            value={splitConfig.everyNPages}
                            onChange={(e) =>
                              setSplitConfig((prev) => ({
                                ...prev,
                                everyNPages: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                              }))
                            }
                            className="font-mono text-xs"
                          />
                        </div>
                      )}

                      {splitConfig.mode === "selected" && (
                        <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                          {selectedPagesCount > 0 ? (
                            <span>
                              Extracts the <strong>{selectedPagesCount}</strong> currently checked page{selectedPagesCount > 1 ? "s" : ""} into a
                              standalone PDF.
                            </span>
                          ) : (
                            <span>Check the box on one or more page cards in the organizer grid to extract them.</span>
                          )}
                        </div>
                      )}

                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        disabled={pages.length === 0 || isExporting}
                        onClick={() => void handleGenerateSplitPdfs()}
                      >
                        <ScissorsIcon className="mr-1.5 size-4" weight="bold" />
                        {isExporting ? "Splitting PDF..." : "Split PDF Now"}
                      </Button>

                      {/* Generated Split Files List */}
                      {splitResults.length > 0 && (
                        <div className="space-y-2.5 border-t border-border/60 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">Split Files ({splitResults.length})</span>
                            {splitResults.length > 1 && (
                              <Button variant="outline" size="xs" onClick={handleDownloadSplitZip}>
                                <FileArchiveIcon className="mr-1 size-3.5 text-primary" weight="bold" />
                                Download All (.ZIP)
                              </Button>
                            )}
                          </div>

                          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                            {splitResults.map((item) => (
                              <div
                                key={item.filename}
                                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-mono text-[11px] font-medium text-foreground">{item.filename}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    Pages: {item.pageNumbers.join(", ")} • {formatBytes(item.bytes.byteLength)}
                                  </p>
                                </div>
                                <Button variant="ghost" size="xs" onClick={() => triggerFileDownload(item.bytes, item.filename)}>
                                  <DownloadSimpleIcon className="size-3.5" weight="bold" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: WATERMARK */}
                  {activeTab === "watermark" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                        <div>
                          <Label htmlFor="watermark-toggle" className="text-xs font-semibold">
                            Add Text Watermark
                          </Label>
                          <p className="text-[11px] text-muted-foreground">Stamp custom text onto exported pages</p>
                        </div>
                        <Switch
                          id="watermark-toggle"
                          checked={watermark.enabled}
                          onCheckedChange={(checked) => setWatermark((prev) => ({ ...prev, enabled: checked }))}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="watermark-text" className="text-xs">
                            Watermark Text
                          </Label>
                          <Input
                            id="watermark-text"
                            value={watermark.text}
                            onChange={(e) =>
                              setWatermark((prev) => ({
                                ...prev,
                                enabled: true,
                                text: e.target.value,
                              }))
                            }
                            placeholder="CONFIDENTIAL"
                            className="text-xs font-medium"
                          />
                          <div className="flex flex-wrap gap-1 pt-1">
                            {WATERMARK_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  setWatermark((prev) => ({
                                    ...prev,
                                    enabled: true,
                                    text: preset,
                                  }))
                                }
                                className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Placement Style</Label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(
                              [
                                { id: "center-diagonal", label: "Center Diagonal" },
                                { id: "tile", label: "Repeated Tile Grid" },
                                { id: "header", label: "Top Header" },
                                { id: "footer", label: "Bottom Footer" },
                              ] as Array<{ id: WatermarkPosition; label: string }>
                            ).map((pos) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() =>
                                  setWatermark((prev) => ({
                                    ...prev,
                                    enabled: true,
                                    position: pos.id,
                                  }))
                                }
                                className={cn(
                                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                                  watermark.position === pos.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <Label className="text-xs">Font Size</Label>
                              <span className="font-mono text-muted-foreground">{watermark.fontSize}pt</span>
                            </div>
                            <input
                              type="range"
                              min={14}
                              max={110}
                              value={watermark.fontSize}
                              onChange={(e) =>
                                setWatermark((prev) => ({
                                  ...prev,
                                  enabled: true,
                                  fontSize: Number(e.target.value),
                                }))
                              }
                              className="w-full accent-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <Label className="text-xs">Opacity</Label>
                              <span className="font-mono text-muted-foreground">{Math.round(watermark.opacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={90}
                              value={Math.round(watermark.opacity * 100)}
                              onChange={(e) =>
                                setWatermark((prev) => ({
                                  ...prev,
                                  enabled: true,
                                  opacity: Number(e.target.value) / 100,
                                }))
                              }
                              className="w-full accent-primary"
                            />
                          </div>
                        </div>

                        {(watermark.position === "center-diagonal" || watermark.position === "tile") && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <Label className="text-xs">Rotation Angle</Label>
                              <span className="font-mono text-muted-foreground">{watermark.rotation}°</span>
                            </div>
                            <input
                              type="range"
                              min={-90}
                              max={90}
                              step={5}
                              value={watermark.rotation}
                              onChange={(e) =>
                                setWatermark((prev) => ({
                                  ...prev,
                                  enabled: true,
                                  rotation: Number(e.target.value),
                                }))
                              }
                              className="w-full accent-primary"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label className="text-xs">Watermark Color</Label>
                          <div className="flex flex-wrap items-center gap-2">
                            {WATERMARK_COLORS.map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() =>
                                  setWatermark((prev) => ({
                                    ...prev,
                                    enabled: true,
                                    color: c.value,
                                  }))
                                }
                                className={cn(
                                  "size-6 rounded-full border-2 transition-transform",
                                  watermark.color.toLowerCase() === c.value.toLowerCase() ? "scale-110 border-foreground" : "border-transparent",
                                )}
                                style={{ backgroundColor: c.value }}
                                title={c.label}
                              />
                            ))}
                            <input
                              type="color"
                              value={watermark.color}
                              onChange={(e) =>
                                setWatermark((prev) => ({
                                  ...prev,
                                  enabled: true,
                                  color: e.target.value,
                                }))
                              }
                              className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
                              title="Custom color"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 border-t border-border/50 pt-2.5">
                          <Label className="text-xs">Apply To Pages</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setWatermark((prev) => ({ ...prev, targetPages: "all" }))}
                              className={cn(
                                "flex-1 rounded-md border py-1 text-xs font-medium",
                                watermark.targetPages === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                              )}
                            >
                              All Pages
                            </button>
                            <button
                              type="button"
                              onClick={() => setWatermark((prev) => ({ ...prev, targetPages: "custom" }))}
                              className={cn(
                                "flex-1 rounded-md border py-1 text-xs font-medium",
                                watermark.targetPages === "custom"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground",
                              )}
                            >
                              Specific Range
                            </button>
                          </div>
                          {watermark.targetPages === "custom" && (
                            <Input
                              value={watermark.customRange}
                              onChange={(e) =>
                                setWatermark((prev) => ({
                                  ...prev,
                                  customRange: e.target.value,
                                }))
                              }
                              placeholder="e.g. 1, 3-5"
                              className="mt-1.5 font-mono text-xs"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: DIGITAL SIGNATURE */}
                  {activeTab === "sign" && (
                    <div className="space-y-4">
                      {/* Master Enable Toggle */}
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                        <div>
                          <Label htmlFor="signature-toggle" className="text-xs font-semibold">
                            Include Digital Signature
                          </Label>
                          <p className="text-[11px] text-muted-foreground">Stamp your handwritten, typed, or image signature</p>
                        </div>
                        <Switch
                          id="signature-toggle"
                          checked={signature.enabled}
                          onCheckedChange={(checked) => {
                            if (checked && !signature.dataUrl && sigMode === "type" && sigTypedText.trim()) {
                              const rendered = renderTypedSignatureToDataUrl(sigTypedText, sigFontStyle, sigInkColor);
                              setSignature((prev) => ({
                                ...prev,
                                enabled: true,
                                dataUrl: rendered.dataUrl,
                                aspectRatio: rendered.aspectRatio,
                              }));
                            } else {
                              setSignature((prev) => ({ ...prev, enabled: checked }));
                            }
                          }}
                        />
                      </div>

                      {/* Signature Creation Mode Tabs: Draw | Type | Upload */}
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/50 p-1">
                          <button
                            type="button"
                            onClick={() => setSigMode("draw")}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                              sigMode === "draw" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <PenNibIcon className="size-3.5" weight="duotone" />
                            <span>Draw</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSigMode("type");
                              if (sigTypedText.trim()) {
                                handleUpdateTypedSignature(sigTypedText, sigFontStyle, sigInkColor);
                              }
                            }}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                              sigMode === "type" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <TextAaIcon className="size-3.5" weight="duotone" />
                            <span>Type</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSigMode("upload")}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                              sigMode === "upload" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <ImageIcon className="size-3.5" weight="duotone" />
                            <span>Upload</span>
                          </button>
                        </div>

                        {/* MODE 1: DRAW SIGNATURE PAD */}
                        {sigMode === "draw" && (
                          <div className="space-y-2">
                            <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-2xs">
                              <canvas
                                ref={sigPadCanvasRef}
                                width={520}
                                height={190}
                                onPointerDown={handleSigPadPointerDown}
                                onPointerMove={handleSigPadPointerMove}
                                onPointerUp={handleSigPadPointerUp}
                                onPointerCancel={handleSigPadPointerUp}
                                className="h-36 w-full cursor-crosshair touch-none"
                              />
                              {/* Baseline guide */}
                              <div className="pointer-events-none absolute right-5 bottom-6 left-5 border-b border-dashed border-slate-300" />
                              <span className="pointer-events-none absolute bottom-1.5 left-5 font-mono text-[9px] text-slate-400 select-none">
                                Sign above line
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={handleClearSigPad}
                                className="absolute top-2 right-2 h-6 bg-white/90 px-2 text-[10px] text-slate-700 hover:bg-slate-100"
                              >
                                <EraserIcon className="mr-1 size-3" />
                                Clear
                              </Button>
                            </div>

                            {/* Pen Color & Width */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-muted-foreground">Ink:</span>
                                {SIGNATURE_INK_COLORS.map((c) => (
                                  <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setSigInkColor(c.value)}
                                    className={cn(
                                      "size-5 rounded-full border-2 transition-transform",
                                      sigInkColor.toLowerCase() === c.value.toLowerCase()
                                        ? "scale-110 border-foreground"
                                        : "border-transparent",
                                    )}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                  />
                                ))}
                                <input
                                  type="color"
                                  value={sigInkColor}
                                  onChange={(e) => setSigInkColor(e.target.value)}
                                  className="h-5 w-6 cursor-pointer rounded border border-border bg-transparent"
                                  title="Custom ink color"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-muted-foreground">Stroke:</span>
                                <input
                                  type="range"
                                  min={1.5}
                                  max={7}
                                  step={0.5}
                                  value={sigPenWidth}
                                  onChange={(e) => setSigPenWidth(Number(e.target.value))}
                                  className="w-20 accent-primary"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* MODE 2: TYPE SIGNATURE */}
                        {sigMode === "type" && (
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <Label htmlFor="sig-typed-input" className="text-xs">
                                Type Full Name or Initials
                              </Label>
                              <Input
                                id="sig-typed-input"
                                value={sigTypedText}
                                onChange={(e) => handleUpdateTypedSignature(e.target.value, sigFontStyle, sigInkColor)}
                                placeholder="Alex Rivera"
                                className="text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-1.5">
                              {(
                                [
                                  { id: "script", label: "Script", previewClass: "italic font-serif" },
                                  { id: "serif", label: "Formal", previewClass: "italic font-serif font-semibold" },
                                  { id: "mono", label: "Technical", previewClass: "font-mono font-bold" },
                                ] as Array<{ id: SignatureFontStyle; label: string; previewClass: string }>
                              ).map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => handleUpdateTypedSignature(sigTypedText, st.id, sigInkColor)}
                                  className={cn(
                                    "flex flex-col items-center rounded-lg border px-2 py-1.5 text-center transition-colors",
                                    sigFontStyle === st.id
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  <span className={cn("max-w-full truncate text-sm", st.previewClass)}>
                                    {sigTypedText.trim() || "Sign"}
                                  </span>
                                  <span className="mt-0.5 text-[10px] opacity-80">{st.label}</span>
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[11px] text-muted-foreground">Ink Color:</span>
                              {SIGNATURE_INK_COLORS.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => handleUpdateTypedSignature(sigTypedText, sigFontStyle, c.value)}
                                  className={cn(
                                    "size-5 rounded-full border-2 transition-transform",
                                    sigInkColor.toLowerCase() === c.value.toLowerCase()
                                      ? "scale-110 border-foreground"
                                      : "border-transparent",
                                  )}
                                  style={{ backgroundColor: c.value }}
                                  title={c.label}
                                />
                              ))}
                              <input
                                type="color"
                                value={sigInkColor}
                                onChange={(e) => handleUpdateTypedSignature(sigTypedText, sigFontStyle, e.target.value)}
                                className="h-5 w-6 cursor-pointer rounded border border-border bg-transparent"
                                title="Custom ink color"
                              />
                            </div>
                          </div>
                        )}

                        {/* MODE 3: UPLOAD SIGNATURE IMAGE */}
                        {sigMode === "upload" && (
                          <div className="space-y-2.5">
                            <input
                              ref={sigImageInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                void handleProcessSignatureUpload(file, sigRemoveWhiteBg);
                                e.target.value = "";
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => sigImageInputRef.current?.click()}
                            >
                              <UploadSimpleIcon className="mr-1.5 size-4" weight="bold" />
                              {sigUploadedFile ? `Replace Image (${sigUploadedFile.name})` : "Upload Signature Image (PNG / JPG)"}
                            </Button>

                            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
                              <span className="text-muted-foreground">Auto-remove white paper background</span>
                              <Checkbox
                                checked={sigRemoveWhiteBg}
                                onCheckedChange={(checked) => {
                                  const nextVal = Boolean(checked);
                                  setSigRemoveWhiteBg(nextVal);
                                  if (sigUploadedFile) {
                                    void handleProcessSignatureUpload(sigUploadedFile, nextVal);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}

                        {/* Active Signature Preview Strip */}
                        {signature.dataUrl && (
                          <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-9 w-20 shrink-0 items-center justify-center rounded border border-border/60 bg-white p-1">
                                <img
                                  src={signature.dataUrl}
                                  alt="Active signature"
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Signature Ready</p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                  Stamping on {signedPageIndices.size} {signedPageIndices.size === 1 ? "page" : "pages"}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={handleClearSigPad}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <TrashIcon className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Placement & Sizing Controls */}
                      <div className="space-y-3 border-t border-border/50 pt-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Position on Page</Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(
                              [
                                { id: "bottom-right", label: "Bottom Right" },
                                { id: "bottom-left", label: "Bottom Left" },
                                { id: "bottom-center", label: "Bottom Center" },
                                { id: "top-right", label: "Top Right" },
                                { id: "custom", label: "Custom X / Y" },
                              ] as Array<{ id: SignaturePlacementPreset; label: string }>
                            ).map((pos) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() =>
                                  setSignature((prev) => ({
                                    ...prev,
                                    enabled: true,
                                    placement: pos.id,
                                  }))
                                }
                                className={cn(
                                  "rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                                  signature.placement === pos.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {signature.placement === "custom" && (
                          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <Label className="text-xs">Horizontal (X)</Label>
                                <span className="font-mono text-muted-foreground">{signature.customXPercent}%</span>
                              </div>
                              <input
                                type="range"
                                min={10}
                                max={90}
                                value={signature.customXPercent}
                                onChange={(e) =>
                                  setSignature((prev) => ({
                                    ...prev,
                                    customXPercent: Number(e.target.value),
                                  }))
                                }
                                className="w-full accent-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <Label className="text-xs">Vertical (Y)</Label>
                                <span className="font-mono text-muted-foreground">{signature.customYPercent}%</span>
                              </div>
                              <input
                                type="range"
                                min={10}
                                max={92}
                                value={signature.customYPercent}
                                onChange={(e) =>
                                  setSignature((prev) => ({
                                    ...prev,
                                    customYPercent: Number(e.target.value),
                                  }))
                                }
                                className="w-full accent-primary"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <Label className="text-xs">Signature Scale</Label>
                            <span className="font-mono text-muted-foreground">{signature.widthPercent}% of page width</span>
                          </div>
                          <input
                            type="range"
                            min={12}
                            max={55}
                            value={signature.widthPercent}
                            onChange={(e) =>
                              setSignature((prev) => ({
                                ...prev,
                                enabled: true,
                                widthPercent: Number(e.target.value),
                              }))
                            }
                            className="w-full accent-primary"
                          />
                        </div>

                        {/* Target Pages */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Sign Pages</Label>
                          <div className="grid grid-cols-4 gap-1">
                            {(
                              [
                                { id: "last", label: "Last Page" },
                                { id: "first", label: "First Page" },
                                { id: "all", label: "All Pages" },
                                { id: "custom", label: "Range" },
                              ] as Array<{ id: SignatureTargetPages; label: string }>
                            ).map((tp) => (
                              <button
                                key={tp.id}
                                type="button"
                                onClick={() =>
                                  setSignature((prev) => ({
                                    ...prev,
                                    enabled: true,
                                    targetPages: tp.id,
                                  }))
                                }
                                className={cn(
                                  "rounded-md border py-1 text-[11px] font-medium transition-colors",
                                  signature.targetPages === tp.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {tp.label}
                              </button>
                            ))}
                          </div>
                          {signature.targetPages === "custom" && (
                            <Input
                              value={signature.customRange}
                              onChange={(e) =>
                                setSignature((prev) => ({
                                  ...prev,
                                  customRange: e.target.value,
                                }))
                              }
                              placeholder="e.g. 1, 3-5"
                              className="mt-1.5 font-mono text-xs"
                            />
                          )}
                        </div>
                      </div>

                      {/* Digital Verification Stamp Metadata */}
                      <div className="space-y-2.5 border-t border-border/50 pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="sig-stamp-toggle" className="text-xs font-semibold">
                              Digital Verification Stamp
                            </Label>
                            <p className="text-[10px] text-muted-foreground">
                              Embed signer name, reason, UTC timestamp & SHA-256 ID under signature
                            </p>
                          </div>
                          <Switch
                            id="sig-stamp-toggle"
                            checked={signature.includeMetadataStamp}
                            onCheckedChange={(checked) =>
                              setSignature((prev) => ({
                                ...prev,
                                includeMetadataStamp: checked,
                              }))
                            }
                          />
                        </div>

                        {signature.includeMetadataStamp && (
                          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                            <div className="space-y-1">
                              <Label htmlFor="signer-name-input" className="text-[11px]">
                                Signer Name
                              </Label>
                              <Input
                                id="signer-name-input"
                                value={signature.signerName}
                                onChange={(e) =>
                                  setSignature((prev) => ({
                                    ...prev,
                                    signerName: e.target.value,
                                  }))
                                }
                                placeholder="e.g. Alex Rivera"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="signer-reason-input" className="text-[11px]">
                                Reason / Role (Optional)
                              </Label>
                              <Input
                                id="signer-reason-input"
                                value={signature.signerReason}
                                onChange={(e) =>
                                  setSignature((prev) => ({
                                    ...prev,
                                    signerReason: e.target.value,
                                  }))
                                }
                                placeholder="e.g. Approved & Verified"
                                className="h-7 text-xs"
                              />
                            </div>
                            <label className="flex cursor-pointer items-center justify-between pt-1 text-xs">
                              <span className="text-[11px] text-muted-foreground">Include UTC Date & Verification Hash</span>
                              <Checkbox
                                checked={signature.includeTimestamp}
                                onCheckedChange={(checked) =>
                                  setSignature((prev) => ({
                                    ...prev,
                                    includeTimestamp: Boolean(checked),
                                  }))
                                }
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: PASSWORD PROTECTION (ENCRYPTION) */}
                  {activeTab === "security" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                        <div>
                          <Label htmlFor="protect-toggle" className="text-xs font-semibold">
                            Password-Protect Output PDF
                          </Label>
                          <p className="text-[11px] text-muted-foreground">Encrypt exported PDF so it requires a password to open</p>
                        </div>
                        <Switch
                          id="protect-toggle"
                          checked={protection.enabled}
                          onCheckedChange={(checked) => setProtection((prev) => ({ ...prev, enabled: checked }))}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="user-pass-input" className="text-xs">
                            Document Open Password (User Password)
                          </Label>
                          <div className="relative">
                            <Input
                              id="user-pass-input"
                              type={showOutputUserPass ? "text" : "password"}
                              value={protection.userPassword}
                              onChange={(e) =>
                                setProtection((prev) => ({
                                  ...prev,
                                  enabled: true,
                                  userPassword: e.target.value,
                                }))
                              }
                              placeholder="Enter password required to open PDF..."
                              className="pr-8 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOutputUserPass((v) => !v)}
                              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showOutputUserPass ? <EyeSlashIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="owner-pass-input" className="text-xs">
                            Permissions / Owner Password (Optional)
                          </Label>
                          <div className="relative">
                            <Input
                              id="owner-pass-input"
                              type={showOutputOwnerPass ? "text" : "password"}
                              value={protection.ownerPassword}
                              onChange={(e) =>
                                setProtection((prev) => ({
                                  ...prev,
                                  enabled: true,
                                  ownerPassword: e.target.value,
                                }))
                              }
                              placeholder="Defaults to user password if left blank"
                              className="pr-8 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOutputOwnerPass((v) => !v)}
                              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showOutputOwnerPass ? <EyeSlashIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Encryption Standard</Label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setProtection((prev) => ({
                                  ...prev,
                                  algorithm: "AES-256",
                                }))
                              }
                              className={cn(
                                "rounded-md border px-2.5 py-1.5 text-left text-xs font-medium",
                                protection.algorithm === "AES-256"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground",
                              )}
                            >
                              <div className="font-semibold">AES-256</div>
                              <div className="text-[10px] opacity-80">Modern PDF 2.0</div>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setProtection((prev) => ({
                                  ...prev,
                                  algorithm: "RC4",
                                }))
                              }
                              className={cn(
                                "rounded-md border px-2.5 py-1.5 text-left text-xs font-medium",
                                protection.algorithm === "RC4" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                              )}
                            >
                              <div className="font-semibold">RC4 128-bit</div>
                              <div className="text-[10px] opacity-80">Legacy Readers</div>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-border/50 pt-2.5">
                          <Label className="text-xs font-semibold">Allowed Permissions</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              {
                                key: "allowPrinting" as const,
                                label: "Allow Printing Document",
                              },
                              {
                                key: "allowCopying" as const,
                                label: "Allow Copying Text & Graphics",
                              },
                              {
                                key: "allowModifying" as const,
                                label: "Allow Modifying Pages & Forms",
                              },
                              {
                                key: "allowAnnotating" as const,
                                label: "Allow Adding Annotations",
                              },
                            ].map((perm) => (
                              <label key={perm.key} className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                                <Checkbox
                                  checked={protection[perm.key]}
                                  onCheckedChange={(checked) =>
                                    setProtection((prev) => ({
                                      ...prev,
                                      [perm.key]: Boolean(checked),
                                    }))
                                  }
                                />
                                <span>{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {protection.enabled && (
                          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
                            <span>
                              Your exported PDF will be encrypted with <strong>{protection.algorithm}</strong> before downloading.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Privacy & Security Guarantee Note */}
              <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground">
                <ShieldWarningIcon className="size-4 shrink-0 text-primary" weight="duotone" />
                <span>
                  All PDF decryption, merging, watermarking, and encryption happen locally in your browser via WebAssembly & Web Crypto. Your files
                  never leave your device.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Pointer Drag Preview Card */}
        {activePageDrag && (
          <div
            style={{
              position: "fixed",
              left: activePageDrag.rect.left,
              top: activePageDrag.rect.top,
              width: activePageDrag.rect.width,
              height: activePageDrag.rect.height,
              transform: `translate3d(${activePageDrag.dx}px, ${activePageDrag.dy}px, 0) scale(1.03)`,
              zIndex: 60,
              pointerEvents: "none",
            }}
            className="flex flex-col rounded-xl border-2 border-primary bg-card/95 p-2 shadow-2xl ring-4 ring-primary/20 backdrop-blur-xs"
          >
            <div className="mb-1.5 flex items-center justify-between gap-1">
              <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary-foreground">
                #{activePageDrag.idx + 1}
              </span>
              <div className="flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: activePageDrag.pageItem.fileColor }} />
                <span className="max-w-20 truncate">{activePageDrag.pageItem.fileName}</span>
                <span className="shrink-0 font-mono">p.{activePageDrag.pageItem.originalPageIndex + 1}</span>
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted/40">
              {activePageDrag.pageItem.thumbnailUrl ? (
                <img
                  src={activePageDrag.pageItem.thumbnailUrl}
                  alt=""
                  draggable={false}
                  className="max-h-full max-w-full object-contain"
                  style={{
                    transform: `rotate(${activePageDrag.pageItem.rotation}deg)`,
                  }}
                />
              ) : (
                <FilePdfIcon className="size-8 text-muted-foreground" />
              )}
            </div>
          </div>
        )}

        {/* High-Resolution Page Inspection Modal */}
        {zoomedPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs" onClick={() => setZoomedPage(null)}>
            <div
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">Page #{zoomedPage.index + 1}</span>
                  <span className="text-xs font-medium text-foreground">
                    {zoomedPage.pageItem.fileName} (Original Page {zoomedPage.pageItem.originalPageIndex + 1})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      handleRotatePage(zoomedPage.pageItem.id, 90);
                      setZoomedPage((prev) =>
                        prev
                          ? {
                              ...prev,
                              pageItem: {
                                ...prev.pageItem,
                                rotation: (prev.pageItem.rotation + 90) % 360,
                              },
                            }
                          : null,
                      );
                    }}
                  >
                    <ArrowClockwiseIcon className="mr-1 size-3.5" />
                    Rotate 90°
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => setZoomedPage(null)}>
                    <XIcon className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/40 p-6">
                {zoomedPage.highResUrl ? (
                  <img
                    src={zoomedPage.highResUrl}
                    alt={`Page ${zoomedPage.index + 1} Preview`}
                    className="max-h-[72vh] max-w-full rounded border border-border bg-white object-contain shadow-md transition-transform"
                    style={{
                      transform: `rotate(${zoomedPage.pageItem.rotation}deg)`,
                    }}
                  />
                ) : (
                  <div className="py-20 text-xs text-muted-foreground">Rendering high-resolution preview...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </GlobalErrorBoundary>
  );
}
