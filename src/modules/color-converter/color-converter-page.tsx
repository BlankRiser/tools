import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { CopyButton } from "#/components/ui/copy-button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { cn } from "#/lib/utils";
import {
  CheckCircleIcon,
  CodeIcon,
  EyedropperIcon,
  PaletteIcon,
  ShuffleIcon,
  SlidersHorizontalIcon,
  SparkleIcon,
  SwatchesIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  COLOR_FORMAT_DEFINITIONS,
  type ColorFormatId,
  type RgbaColor,
  clamp,
  cmykToRgba,
  findClosestNamedColor,
  findClosestTailwindColor,
  generateColorHarmonies,
  generateTintsAndShades,
  getContrastRatio,
  getRelativeLuminance,
  hslaToRgba,
  hsvaToRgba,
  hwbaToRgba,
  oklchToRgba,
  parseAnyColorInput,
  rgbaToCmyk,
  rgbaToHex,
  rgbaToHsla,
  rgbaToHsva,
  rgbaToHwba,
  rgbaToOklch,
  roundTo,
} from "./color-engine";

type SliderSpaceTab = "rgb" | "hsl" | "hsv" | "hwb" | "cmyk" | "oklch";

interface EyeDropperInstance {
  open: () => Promise<{ sRGBHex: string }>;
}

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperInstance;
  }
}

const SAMPLE_COLOR_PRESETS: Array<{ label: string; input: string }> = [
  { label: "Royal Blue (HEX)", input: "#2563EB" },
  { label: "Emerald (RGB)", input: "rgb(16, 185, 129)" },
  { label: "Sunset Coral (HSL)", input: "hsl(14, 90%, 58%)" },
  { label: "Violet Translucent (HSLA)", input: "hsla(262, 83%, 58%, 0.85)" },
  { label: "Cyan Process (CMYK)", input: "cmyk(88%, 12%, 0%, 6%)" },
  { label: "Amber Gold (HSV)", input: "hsv(38, 92%, 96%)" },
  { label: "Mint (HWB)", input: "hwb(160 12% 18%)" },
  { label: "Indigo (OKLCH)", input: "oklch(58.5% 0.233 277.1)" },
  { label: "RebeccaPurple (CSS)", input: "rebeccapurple" },
];

const VARIABLE_NAME_PRESETS = ["primary", "secondary", "accent", "brand", "surface", "destructive"] as const;

export function ColorConverterPage() {
  // Canonical source of truth: RGBA
  const [rgba, setRgba] = useState<RgbaColor>({ r: 37, g: 99, b: 235, a: 1 });
  // Universal omnibox input text
  const [universalInput, setUniversalInput] = useState<string>("#2563EB");
  const [detectedFormat, setDetectedFormat] = useState<string>("HEX");
  const [parseError, setParseError] = useState<string | null>(null);

  // Track which individual format card input is currently focused so user can type freely
  const [editingFormatId, setEditingFormatId] = useState<ColorFormatId | null>(null);
  const [editingFormatValue, setEditingFormatValue] = useState<string>("");

  // Active interactive slider color space tab
  const [sliderTab, setSliderTab] = useState<SliderSpaceTab>("rgb");

  // CSS variable name state (defaults to "primary")
  const [cssVarName, setCssVarName] = useState<string>("primary");

  // Derived color models
  const hex6 = useMemo(() => rgbaToHex(rgba, false), [rgba]);
  const hsla = useMemo(() => rgbaToHsla(rgba), [rgba]);
  const hsva = useMemo(() => rgbaToHsva(rgba), [rgba]);
  const hwba = useMemo(() => rgbaToHwba(rgba), [rgba]);
  const cmyk = useMemo(() => rgbaToCmyk(rgba), [rgba]);
  const oklch = useMemo(() => rgbaToOklch(rgba), [rgba]);

  // Derived metadata & accessibility
  const luminance = useMemo(() => roundTo(getRelativeLuminance(rgba) * 100, 1), [rgba]);
  const contrastWhite = useMemo(() => getContrastRatio(rgba, { r: 255, g: 255, b: 255, a: 1 }), [rgba]);
  const contrastBlack = useMemo(() => getContrastRatio(rgba, { r: 0, g: 0, b: 0, a: 1 }), [rgba]);
  const closestNamed = useMemo(() => findClosestNamedColor(rgba), [rgba]);
  const closestTailwind = useMemo(() => findClosestTailwindColor(rgba), [rgba]);
  const tintsAndShades = useMemo(() => generateTintsAndShades(rgba), [rgba]);
  const harmonies = useMemo(() => generateColorHarmonies(rgba), [rgba]);

  const sanitizedVarName = useMemo(() => {
    const cleaned = cssVarName
      .trim()
      .replace(/^--+/, "")
      .replace(/^color-+/i, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return cleaned || "primary";
  }, [cssVarName]);

  const foregroundHex = contrastWhite >= contrastBlack ? "#FFFFFF" : "#000000";

  const cssVariablesCode = useMemo(() => {
    const prettyColorLabel = closestNamed.name.charAt(0).toUpperCase() + closestNamed.name.slice(1);
    const shadeLines = tintsAndShades
      .filter((s) => s.step <= 900)
      .map((s) => {
        const pad = s.step < 100 ? "  " : " ";
        return `  --color-${sanitizedVarName}-${s.step}:${pad}${s.hex.toLowerCase()};`;
      })
      .join("\n");

    return `:root {
  /* ${prettyColorLabel} Base */
  --color-${sanitizedVarName}: ${hex6};
  --color-${sanitizedVarName}-rgb: ${Math.round(rgba.r)} ${Math.round(rgba.g)} ${Math.round(rgba.b)};
  --color-${sanitizedVarName}-hsl: ${Math.round(hsla.h)} ${Math.round(hsla.s)}% ${Math.round(hsla.l)}%;

  /* Foreground text color based on contrast */
  --color-${sanitizedVarName}-foreground: ${foregroundHex};

  /* Shades */
${shadeLines}
}`;
  }, [closestNamed.name, foregroundHex, hex6, hsla.h, hsla.l, hsla.s, rgba.b, rgba.g, rgba.r, sanitizedVarName, tintsAndShades]);

  const supportsEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  /**
   * Updates the canonical RGBA state and syncs the universal input string
   */
  const applyNewRgba = useCallback((nextRgba: RgbaColor, sourceLabel = "Interactive Control", syncOmnibox = true) => {
    const normalized: RgbaColor = {
      r: clamp(Math.round(nextRgba.r), 0, 255),
      g: clamp(Math.round(nextRgba.g), 0, 255),
      b: clamp(Math.round(nextRgba.b), 0, 255),
      a: roundTo(clamp(nextRgba.a, 0, 1), 2),
    };
    setRgba(normalized);
    setDetectedFormat(sourceLabel);
    setParseError(null);
    if (syncOmnibox) {
      setUniversalInput(normalized.a < 1 ? rgbaToHex(normalized, true) : rgbaToHex(normalized, false));
    }
  }, []);

  /**
   * Handles typing in the top universal color input bar
   */
  const handleUniversalInputChange = useCallback((raw: string) => {
    setUniversalInput(raw);
    if (!raw.trim()) {
      setParseError(null);
      return;
    }
    const parsed = parseAnyColorInput(raw);
    if (parsed) {
      setRgba(parsed.rgba);
      setDetectedFormat(parsed.detectedFormat);
      setParseError(null);
    } else {
      setParseError("Unrecognized color syntax. Try #HEX, rgb(), hsl(), hsv(), hwb(), cmyk(), oklch(), lab(), or a CSS color name.");
    }
  }, []);

  /**
   * Handles editing directly inside any of the 16 format convention cards
   */
  const handleFormatCardInputChange = useCallback(
    (formatId: ColorFormatId, raw: string) => {
      setEditingFormatId(formatId);
      setEditingFormatValue(raw);
      const parsed = parseAnyColorInput(raw);
      if (parsed) {
        setRgba(parsed.rgba);
        setDetectedFormat(parsed.detectedFormat);
        setUniversalInput(raw);
        setParseError(null);
      }
    },
    [],
  );

  /**
   * Generates a random vibrant color
   */
  const handleRandomColor = useCallback(() => {
    const randomRgba = hslaToRgba({
      h: Math.floor(Math.random() * 360),
      s: Math.floor(60 + Math.random() * 35),
      l: Math.floor(42 + Math.random() * 25),
      a: 1,
    });
    applyNewRgba(randomRgba, "Random Generator", true);
  }, [applyNewRgba]);

  /**
   * Launches browser EyeDropper API if available
   */
  const handlePickScreenColor = useCallback(async () => {
    if (!window.EyeDropper) {
      toast.error("EyeDropper API is not supported in this browser.");
      return;
    }
    try {
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      handleUniversalInputChange(result.sRGBHex);
      toast.success(`Picked ${result.sRGBHex.toUpperCase()}`);
    } catch {
      // User canceled eyedropper
    }
  }, [handleUniversalInputChange]);

  const formattedOutputs = useMemo(
    () =>
      COLOR_FORMAT_DEFINITIONS.map((def) => ({
        ...def,
        value: def.format(rgba),
      })),
    [rgba],
  );

  const cssRgbaPreview = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Color Converter & Inspector</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Convert colors bidirectionally across HEX, HEX8, RGB, RGBA, HSL, HSLA, HSV/HSB, HWB, CMYK, OKLCH, OKLAB, CIE LAB, and GLSL with live
              channel sliders and WCAG contrast analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {supportsEyeDropper && (
              <Button variant="outline" onClick={() => void handlePickScreenColor()}>
                <EyedropperIcon data-icon="inline-start" weight="bold" />
                Pick from Screen
              </Button>
            )}
            <Button variant="outline" onClick={handleRandomColor}>
              <ShuffleIcon data-icon="inline-start" weight="bold" />
              Random Color
            </Button>
          </div>
        </div>

        {/* Universal Color Input Bar & Sample Presets */}
        <Card className="border-primary/25 shadow-xs">
          <CardContent className="space-y-3 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Native Color Picker Swatch */}
              <label
                className="relative flex h-11 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border shadow-xs transition-transform hover:scale-105"
                title="Click to open system color picker"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0",
                }}
              >
                <div className="absolute inset-0" style={{ backgroundColor: cssRgbaPreview }} />
                <input
                  type="color"
                  value={hex6}
                  onChange={(e) => {
                    const parsed = parseAnyColorInput(e.target.value);
                    if (parsed) {
                      applyNewRgba({ ...parsed.rgba, a: rgba.a }, "Color Picker", true);
                    }
                  }}
                  className="sr-only"
                />
              </label>

              {/* Universal Any-Convention Input */}
              <div className="relative flex-1">
                <Input
                  id="universal-color-input"
                  value={universalInput}
                  onChange={(e) => handleUniversalInputChange(e.target.value)}
                  spellCheck={false}
                  placeholder="Enter any color: #2563EB, rgb(37, 99, 235), hsl(221, 83%, 53%), cmyk(84%, 58%, 0%, 8%), hwb(221 15% 8%), oklch(...)..."
                  className={cn(
                    "h-11 pr-36 font-mono text-sm",
                    parseError && "border-destructive focus-visible:ring-destructive/30",
                  )}
                />
                <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
                  <span className="rounded-md bg-primary/12 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                    {detectedFormat}
                  </span>
                </div>
              </div>
            </div>

            {parseError && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <WarningCircleIcon className="size-4 shrink-0" weight="fill" />
                {parseError}
              </p>
            )}

            {/* Quick Format Preset Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <SparkleIcon className="size-3.5 text-amber-500" weight="fill" />
                Try input formats:
              </span>
              {SAMPLE_COLOR_PRESETS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => handleUniversalInputChange(sample.input)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
                >
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Two-Column Grid: Left (Swatch + Sliders + Contrast) | Right (All 16 Bidirectional Format Cards) */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column (5 cols): Live Swatch, Channel Sliders, WCAG Contrast */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            {/* Live Color Swatch & Metadata Card */}
            <Card className="overflow-hidden">
              <div
                className="relative flex h-40 w-full flex-col justify-between p-4 transition-colors"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  backgroundSize: "14px 14px",
                  backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0",
                }}
              >
                <div className="absolute inset-0 transition-colors" style={{ backgroundColor: cssRgbaPreview }} />

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-xs font-bold shadow-2xs backdrop-blur-xs",
                      contrastWhite >= contrastBlack ? "bg-black/35 text-white" : "bg-white/75 text-slate-900",
                    )}
                  >
                    {rgba.a < 1 ? rgbaToHex(rgba, true) : hex6}
                  </span>

                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-[11px] font-medium backdrop-blur-xs",
                      contrastWhite >= contrastBlack ? "bg-black/35 text-white/90" : "bg-white/75 text-slate-800",
                    )}
                  >
                    Luminance: {luminance}% • Opacity: {Math.round(rgba.a * 100)}%
                  </span>
                </div>

                <div className="relative z-10 flex flex-wrap items-end justify-between gap-2">
                  <div
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs backdrop-blur-xs",
                      contrastWhite >= contrastBlack ? "bg-black/40 text-white" : "bg-white/80 text-slate-900",
                    )}
                  >
                    <p className="text-[10px] opacity-80">
                      {closestNamed.exact ? "Exact CSS Named Color" : "Closest CSS Named Color"}
                    </p>
                    <p className="font-mono text-xs font-semibold">
                      {closestNamed.name} ({closestNamed.hex})
                    </p>
                  </div>

                  <div
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs backdrop-blur-xs",
                      contrastWhite >= contrastBlack ? "bg-black/40 text-white" : "bg-white/80 text-slate-900",
                    )}
                  >
                    <p className="text-[10px] opacity-80">
                      {closestTailwind.exact ? "Exact Tailwind Shade" : "Closest Tailwind Shade"}
                    </p>
                    <p className="font-mono text-xs font-semibold">
                      {closestTailwind.token} ({closestTailwind.hex})
                    </p>
                  </div>
                </div>
              </div>

              {/* WCAG 2.1 Contrast Ratios */}
              <CardContent className="grid grid-cols-2 gap-3 pt-3.5">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">vs White (#FFF)</p>
                    <p className="font-mono text-sm font-bold text-foreground">{contrastWhite}:1</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        contrastWhite >= 4.5
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : contrastWhite >= 3
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-destructive/15 text-destructive",
                      )}
                    >
                      <CheckCircleIcon className="size-3" weight="fill" />
                      {contrastWhite >= 7 ? "AAA" : contrastWhite >= 4.5 ? "AA" : contrastWhite >= 3 ? "AA Large" : "Fail"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">vs Black (#000)</p>
                    <p className="font-mono text-sm font-bold text-foreground">{contrastBlack}:1</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        contrastBlack >= 4.5
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : contrastBlack >= 3
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-destructive/15 text-destructive",
                      )}
                    >
                      <CheckCircleIcon className="size-3" weight="fill" />
                      {contrastBlack >= 7 ? "AAA" : contrastBlack >= 4.5 ? "AA" : contrastBlack >= 3 ? "AA Large" : "Fail"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Channel Sliders Card */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-2.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <SlidersHorizontalIcon className="size-4 text-primary" weight="bold" />
                    <span>Interactive Channel Sliders</span>
                  </CardTitle>
                </div>

                {/* Color Space Selector Tabs */}
                <div className="mt-2 grid grid-cols-6 gap-1 rounded-lg bg-muted p-1">
                  {(
                    [
                      { id: "rgb", label: "RGB" },
                      { id: "hsl", label: "HSL" },
                      { id: "hsv", label: "HSV" },
                      { id: "hwb", label: "HWB" },
                      { id: "cmyk", label: "CMYK" },
                      { id: "oklch", label: "OKLCH" },
                    ] as Array<{ id: SliderSpaceTab; label: string }>
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSliderTab(t.id)}
                      className={cn(
                        "rounded-md py-1 text-[11px] font-semibold transition-all",
                        sliderTab === t.id ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-4">
                {/* RGB SLIDERS */}
                {sliderTab === "rgb" && (
                  <>
                    {[
                      { label: "Red (R)", key: "r" as const, val: rgba.r, max: 255, color: "#ef4444" },
                      { label: "Green (G)", key: "g" as const, val: rgba.g, max: 255, color: "#22c55e" },
                      { label: "Blue (B)", key: "b" as const, val: rgba.b, max: 255, color: "#3b82f6" },
                    ].map((chan) => (
                      <div key={chan.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <Label className="text-xs font-medium">{chan.label}</Label>
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={chan.val}
                            onChange={(e) =>
                              applyNewRgba({ ...rgba, [chan.key]: Number(e.target.value) }, "RGB Sliders")
                            }
                            className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={chan.max}
                          value={chan.val}
                          onChange={(e) =>
                            applyNewRgba({ ...rgba, [chan.key]: Number(e.target.value) }, "RGB Sliders")
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    ))}
                  </>
                )}

                {/* HSL SLIDERS */}
                {sliderTab === "hsl" && (
                  <>
                    {[
                      { label: "Hue (H)", key: "h" as const, val: hsla.h, max: 360, unit: "°" },
                      { label: "Saturation (S)", key: "s" as const, val: hsla.s, max: 100, unit: "%" },
                      { label: "Lightness (L)", key: "l" as const, val: hsla.l, max: 100, unit: "%" },
                    ].map((chan) => (
                      <div key={chan.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <Label className="text-xs font-medium">
                            {chan.label} ({chan.unit})
                          </Label>
                          <input
                            type="number"
                            min={0}
                            max={chan.max}
                            step={1}
                            value={chan.val}
                            onChange={(e) =>
                              applyNewRgba(hslaToRgba({ ...hsla, [chan.key]: Number(e.target.value) }), "HSL Sliders")
                            }
                            className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={chan.max}
                          step={0.5}
                          value={chan.val}
                          onChange={(e) =>
                            applyNewRgba(hslaToRgba({ ...hsla, [chan.key]: Number(e.target.value) }), "HSL Sliders")
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    ))}
                  </>
                )}

                {/* HSV / HSB SLIDERS */}
                {sliderTab === "hsv" && (
                  <>
                    {[
                      { label: "Hue (H)", key: "h" as const, val: hsva.h, max: 360, unit: "°" },
                      { label: "Saturation (S)", key: "s" as const, val: hsva.s, max: 100, unit: "%" },
                      { label: "Value / Brightness (V)", key: "v" as const, val: hsva.v, max: 100, unit: "%" },
                    ].map((chan) => (
                      <div key={chan.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <Label className="text-xs font-medium">
                            {chan.label} ({chan.unit})
                          </Label>
                          <input
                            type="number"
                            min={0}
                            max={chan.max}
                            step={1}
                            value={chan.val}
                            onChange={(e) =>
                              applyNewRgba(hsvaToRgba({ ...hsva, [chan.key]: Number(e.target.value) }), "HSV Sliders")
                            }
                            className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={chan.max}
                          step={0.5}
                          value={chan.val}
                          onChange={(e) =>
                            applyNewRgba(hsvaToRgba({ ...hsva, [chan.key]: Number(e.target.value) }), "HSV Sliders")
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    ))}
                  </>
                )}

                {/* HWB SLIDERS */}
                {sliderTab === "hwb" && (
                  <>
                    {[
                      { label: "Hue (H)", key: "h" as const, val: hwba.h, max: 360, unit: "°" },
                      { label: "Whiteness (W)", key: "w" as const, val: hwba.w, max: 100, unit: "%" },
                      { label: "Blackness (B)", key: "b" as const, val: hwba.b, max: 100, unit: "%" },
                    ].map((chan) => (
                      <div key={chan.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <Label className="text-xs font-medium">
                            {chan.label} ({chan.unit})
                          </Label>
                          <input
                            type="number"
                            min={0}
                            max={chan.max}
                            step={1}
                            value={chan.val}
                            onChange={(e) =>
                              applyNewRgba(hwbaToRgba({ ...hwba, [chan.key]: Number(e.target.value) }), "HWB Sliders")
                            }
                            className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={chan.max}
                          step={0.5}
                          value={chan.val}
                          onChange={(e) =>
                            applyNewRgba(hwbaToRgba({ ...hwba, [chan.key]: Number(e.target.value) }), "HWB Sliders")
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    ))}
                  </>
                )}

                {/* CMYK SLIDERS */}
                {sliderTab === "cmyk" && (
                  <>
                    {[
                      { label: "Cyan (C)", key: "c" as const, val: cmyk.c, max: 100 },
                      { label: "Magenta (M)", key: "m" as const, val: cmyk.m, max: 100 },
                      { label: "Yellow (Y)", key: "y" as const, val: cmyk.y, max: 100 },
                      { label: "Key / Black (K)", key: "k" as const, val: cmyk.k, max: 100 },
                    ].map((chan) => (
                      <div key={chan.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <Label className="text-xs font-medium">{chan.label} (%)</Label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={chan.val}
                            onChange={(e) =>
                              applyNewRgba(cmykToRgba({ ...cmyk, [chan.key]: Number(e.target.value) }, rgba.a), "CMYK Sliders")
                            }
                            className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.5}
                          value={chan.val}
                          onChange={(e) =>
                            applyNewRgba(cmykToRgba({ ...cmyk, [chan.key]: Number(e.target.value) }, rgba.a), "CMYK Sliders")
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    ))}
                  </>
                )}

                {/* OKLCH SLIDERS */}
                {sliderTab === "oklch" && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Label className="text-xs font-medium">Perceived Lightness (L %)</Label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={oklch.l}
                          onChange={(e) =>
                            applyNewRgba(oklchToRgba({ ...oklch, l: Number(e.target.value) }), "OKLCH Sliders")
                          }
                          className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={oklch.l}
                        onChange={(e) =>
                          applyNewRgba(oklchToRgba({ ...oklch, l: Number(e.target.value) }), "OKLCH Sliders")
                        }
                        className="w-full accent-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Label className="text-xs font-medium">Chroma (C 0–0.37)</Label>
                        <input
                          type="number"
                          min={0}
                          max={0.4}
                          step={0.005}
                          value={oklch.c}
                          onChange={(e) =>
                            applyNewRgba(oklchToRgba({ ...oklch, c: Number(e.target.value) }), "OKLCH Sliders")
                          }
                          className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={0.37}
                        step={0.002}
                        value={oklch.c}
                        onChange={(e) =>
                          applyNewRgba(oklchToRgba({ ...oklch, c: Number(e.target.value) }), "OKLCH Sliders")
                        }
                        className="w-full accent-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Label className="text-xs font-medium">Hue Angle (H °)</Label>
                        <input
                          type="number"
                          min={0}
                          max={360}
                          step={1}
                          value={oklch.h}
                          onChange={(e) =>
                            applyNewRgba(oklchToRgba({ ...oklch, h: Number(e.target.value) }), "OKLCH Sliders")
                          }
                          className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        step={0.5}
                        value={oklch.h}
                        onChange={(e) =>
                          applyNewRgba(oklchToRgba({ ...oklch, h: Number(e.target.value) }), "OKLCH Sliders")
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                  </>
                )}

                {/* SHARED ALPHA / OPACITY SLIDER */}
                <div className="space-y-1 border-t border-border/50 pt-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-xs font-medium">Alpha / Opacity (%)</Label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(rgba.a * 100)}
                      onChange={(e) =>
                        applyNewRgba({ ...rgba, a: clamp(Number(e.target.value) / 100, 0, 1) }, "Alpha Slider")
                      }
                      className="h-6 w-16 rounded border border-border bg-background px-1.5 text-right font-mono text-xs"
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(rgba.a * 100)}
                    onChange={(e) =>
                      applyNewRgba({ ...rgba, a: clamp(Number(e.target.value) / 100, 0, 1) }, "Alpha Slider")
                    }
                    className="w-full accent-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (7 cols): All 16 Bidirectional Color Convention Cards */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Card>
              <CardHeader className="border-b border-border/60 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <PaletteIcon className="size-4 text-primary" weight="bold" />
                      <span>Bidirectional Color Conventions ({formattedOutputs.length})</span>
                    </CardTitle>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Edit any value below directly to convert from that format into all other conventions.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-2.5 pt-4 sm:grid-cols-2">
                {formattedOutputs.map((item) => {
                  const isEditingThis = editingFormatId === item.id;
                  const displayValue = isEditingThis ? editingFormatValue : item.value;

                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col gap-1.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors focus-within:border-primary/60 focus-within:bg-background"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor={`fmt-${item.id}`} className="font-mono text-xs font-bold text-foreground">
                            {item.label}
                          </Label>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {item.badge}
                          </span>
                        </div>
                        <CopyButton value={item.value} className="size-6 opacity-75 group-hover:opacity-100" />
                      </div>

                      <Input
                        id={`fmt-${item.id}`}
                        value={displayValue}
                        onFocus={() => {
                          setEditingFormatId(item.id);
                          setEditingFormatValue(item.value);
                        }}
                        onBlur={() => {
                          setEditingFormatId(null);
                        }}
                        onChange={(e) => handleFormatCardInputChange(item.id, e.target.value)}
                        spellCheck={false}
                        placeholder={item.placeholder}
                        className="h-8 bg-background/80 font-mono text-xs"
                      />

                      <p className="truncate text-[10px] text-muted-foreground" title={item.description}>
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section: Tints & Shades Scale (50-950) + Color Harmonies */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 11-Step Tints & Shades Palette */}
          <Card className="lg:col-span-7">
            <CardHeader className="border-b border-border/60 pb-2.5">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <SwatchesIcon className="size-4 text-primary" weight="bold" />
                  Tints & Shades Scale (50 – 950)
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">Click any shade to load</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-11">
                {tintsAndShades.map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      applyNewRgba(s.rgba, `Shade ${s.step}`, true);
                      toast.info(`Loaded shade ${s.step} (${s.hex})`);
                    }}
                    className="group flex flex-col items-center gap-1 text-center"
                    title={`Click to load ${s.hex}`}
                  >
                    <div
                      className="h-12 w-full rounded-lg border border-border/60 shadow-2xs transition-transform group-hover:scale-105"
                      style={{ backgroundColor: s.hex }}
                    />
                    <span className="font-mono text-[10px] font-semibold text-foreground">{s.step}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{s.hex}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Harmonies */}
          <Card className="lg:col-span-5">
            <CardHeader className="border-b border-border/60 pb-2.5">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span>Color Harmonies</span>
                <span className="text-[11px] font-normal text-muted-foreground">Click any swatch to inspect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-4">
              {harmonies.map((hGroup) => (
                <div key={hGroup.name} className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <p className="text-[11px] font-semibold text-foreground">{hGroup.name}</p>
                  <div className="flex gap-1.5">
                    {hGroup.swatches.map((sw, i) => (
                      <button
                        key={`${hGroup.name}_${i}`}
                        type="button"
                        onClick={() => applyNewRgba(sw.rgba, `${hGroup.name} Harmony`, true)}
                        className="group flex flex-1 flex-col items-center gap-1"
                        title={`Load ${sw.hex}`}
                      >
                        <div
                          className="h-8 w-full rounded-md border border-border/60 shadow-2xs transition-transform group-hover:scale-105"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <span className="font-mono text-[9px] text-muted-foreground group-hover:text-foreground">
                          {sw.hex}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CSS Custom Properties (:root) Code Block */}
        <Card>
          <CardHeader className="border-b border-border/60 pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CodeIcon className="size-4 text-primary" weight="bold" />
                  <span>CSS Variables (`:root`)</span>
                </CardTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Ready-to-paste CSS custom properties with base formats, contrast-aware foreground, and 50–900 shades.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="css-variable-name" className="shrink-0 text-xs font-medium text-muted-foreground">
                    Variable Name
                  </Label>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-2.5 font-mono text-xs text-muted-foreground">
                      --color-
                    </span>
                    <Input
                      id="css-variable-name"
                      value={cssVarName}
                      onChange={(e) => setCssVarName(e.target.value)}
                      placeholder="primary"
                      spellCheck={false}
                      className="h-8 w-44 pl-16 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {VARIABLE_NAME_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCssVarName(preset)}
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-[10px] font-medium transition-colors",
                        sanitizedVarName === preset
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/50 px-3.5 py-2">
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  variables.css • --color-{sanitizedVarName}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Copy CSS</span>
                  <CopyButton value={cssVariablesCode} variant="outline" size="icon-xs" />
                </div>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground select-all">
                <code>{cssVariablesCode}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </GlobalErrorBoundary>
  );
}
