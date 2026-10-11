import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { CopyButton } from "#/components/ui/copy-button";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useTheme } from "#/hooks/use-theme";
import { cn } from "#/lib/utils";
import {
  ArrowsLeftRightIcon,
  BellRingingIcon,
  CheckCircleIcon,
  CodeIcon,
  CompassIcon,
  CreditCardIcon,
  CrosshairIcon,
  CubeTransparentIcon,
  EyeIcon,
  FadersIcon,
  MusicNotesIcon,
  PaletteIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShuffleIcon,
  SparkleIcon,
  SwatchesIcon,
  TrashIcon,
  TrendUpIcon,
  WifiHighIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as React from "react";
import { codeToTokens, type BundledTheme, type ThemedToken } from "shiki/bundle/web";
import { toast } from "sonner";
import {
  hslaToRgba,
  parseAnyColorInput,
  rgbaToCmyk,
  rgbaToHex,
  rgbaToHsla,
  rgbaToHsva,
  rgbaToOklch,
  type ColorFormatId,
} from "../color-converter/color-engine";
import {
  formatColorInConvention,
  GRADIENT_ANIMATION_MODES,
  GRADIENT_CATEGORIES,
  GRADIENT_PRESETS,
  synthesizeGradient,
  type GradientAnimationConfig,
  type GradientAnimationDirection,
  type GradientAnimationEasing,
  type GradientBaseType,
  type GradientCategoryId,
  type GradientConfig,
  type GradientInterpolationSpace,
  type GradientPreset,
  type GradientStop,
} from "./gradient-engine";

function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
}: {
  min?: number;
  max?: number;
  step?: number;
  value: number[];
  onValueChange: (val: number[]) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0] ?? min}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
    />
  );
}

// ============================================================================
// Shiki Code Block (Catppuccin Theme)
// ============================================================================

function ShikiCodeBox({ code, lang }: { code: string; lang: "css" | "html" }) {
  const { theme: appTheme } = useTheme();
  const shikiTheme: BundledTheme =
    appTheme === "dark" ? "catppuccin-mocha" : "catppuccin-latte";

  const [tokenState, setTokenState] = React.useState<{
    lines: ThemedToken[][];
    bg?: string;
    fg?: string;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    codeToTokens(code, {
      lang,
      theme: shikiTheme,
    })
      .then((res) => {
        if (!cancelled) {
          setTokenState({
            lines: res.tokens,
            bg: res.bg,
            fg: res.fg,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setTokenState(null);
      });

    return () => {
      cancelled = true;
    };
  }, [code, lang, shikiTheme]);

  return (
    <div
      className="overflow-x-auto rounded-xl border border-border/70 p-4 text-left font-mono text-xs leading-relaxed"
      style={{
        backgroundColor: tokenState?.bg,
        color: tokenState?.fg,
      }}
    >
      {tokenState ? (
        tokenState.lines.map((lineTokens, idx) => (
          <div key={idx} className="flex items-baseline">
            <span
              aria-hidden="true"
              className="mr-4 inline-block w-6 shrink-0 text-right font-mono text-[10px] opacity-35 select-none"
            >
              {idx + 1}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre">
              {lineTokens.length === 0
                ? "\u00A0"
                : lineTokens.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        color: t.color,
                        fontStyle: t.fontStyle && t.fontStyle & 1 ? "italic" : undefined,
                        fontWeight: t.fontStyle && t.fontStyle & 2 ? "bold" : undefined,
                      }}
                    >
                      {t.content}
                    </span>
                  ))}
            </span>
          </div>
        ))
      ) : (
        <pre className="whitespace-pre">{code}</pre>
      )}
    </div>
  );
}

// ============================================================================
// Polar Color Wheel & Stop Harmony Visualizer
// ============================================================================

function PolarColorWheelVisualizer({
  stops,
  selectedStopId,
  onSelectStop,
}: {
  stops: GradientStop[];
  selectedStopId: string;
  onSelectStop: (id: string) => void;
}) {
  const size = 180;
  const center = size / 2;
  const radius = size / 2 - 14;

  const points = React.useMemo(() => {
    return stops.map((s) => {
      const hsla = rgbaToHsla(s.color);
      const angleRad = ((hsla.h - 90) * Math.PI) / 180;
      const dist = (hsla.s / 100) * radius;
      return {
        stop: s,
        x: center + Math.cos(angleRad) * dist,
        y: center + Math.sin(angleRad) * dist,
        hex: rgbaToHex(s.color, false),
        hsla,
      };
    });
  }, [stops, center, radius]);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* Conic Hue Wheel Background */}
        <div
          className="rounded-full border border-border/80 shadow-inner"
          style={{
            width: size,
            height: size,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.92) 0%, transparent 72%), conic-gradient(from 0deg, hsl(0,95%,55%), hsl(60,95%,55%), hsl(120,95%,55%), hsl(180,95%,55%), hsl(240,95%,55%), hsl(300,95%,55%), hsl(360,95%,55%))",
          }}
        />
        <svg
          width={size}
          height={size}
          className=" absolute inset-0 overflow-visible"
        >
          {points.length > 1 && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
          )}
          {points.map((pt, idx) => {
            const isSelected = pt.stop.id === selectedStopId;
            return (
              <g
                key={pt.stop.id}
                className="cursor-pointer"
                onClick={() => onSelectStop(pt.stop.id)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 8 : 6}
                  fill={pt.hex}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.5 : 1.8}
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className="fill-foreground font-mono text-[9px] font-bold drop-shadow-xs select-none"
                >
                  #{idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <span className="text-[11px] text-muted-foreground">
        Polar Hue / Saturation Trajectory
      </span>
    </div>
  );
}

// ============================================================================
// Miniature Preset Card
// ============================================================================

function PresetPreviewCard({
  preset,
  isActive,
  onSelect,
}: {
  preset: GradientPreset;
  isActive: boolean;
  onSelect: () => void;
}) {
  const synth = React.useMemo(
    () =>
      synthesizeGradient(preset.config, {
        variablePrefix: "preview",
        colorFormat: "hex",
      }),
    [preset.config],
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        isActive
          ? "border-primary ring-2 ring-primary/25"
          : "border-border/70 bg-card/60 hover:border-border",
      )}
    >
      <div className="relative h-24 w-full overflow-hidden">
        <div className="absolute inset-0" style={synth.surfaceStyle} />
        {synth.overlayStyle && (
          <div className="absolute inset-0" style={synth.overlayStyle} />
        )}
        <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-xs">
          {preset.config.stops.map((s) => (
            <span
              key={s.id}
              className="size-2 rounded-full border border-white/40"
              style={{ backgroundColor: rgbaToHex(s.color, false) }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-2.5">
        <div>
          <p className="line-clamp-1 text-xs font-semibold text-foreground group-hover:text-primary">
            {preset.name}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {preset.subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Supported Color Convention Options for Stop Input & CSS Variables
// ============================================================================

const STOP_COLOR_FORMATS: Array<{ id: ColorFormatId; label: string; tag: string }> = [
  { id: "hex", label: "HEX", tag: "#RRGGBB" },
  { id: "rgb", label: "RGB", tag: "rgb(r, g, b)" },
  { id: "rgba", label: "RGBA", tag: "rgba(r, g, b, a)" },
  { id: "hsl", label: "HSL", tag: "hsl(h, s%, l%)" },
  { id: "hsla", label: "HSLA", tag: "hsla(h, s%, l%, a)" },
  { id: "hsv", label: "HSV / HSB", tag: "hsv(h, s%, v%)" },
  { id: "hwb", label: "HWB", tag: "hwb(h w% b%)" },
  { id: "cmyk", label: "CMYK", tag: "cmyk(c%, m%, y%, k%)" },
  { id: "oklch", label: "OKLCH", tag: "oklch(l% c h)" },
  { id: "oklab", label: "OKLAB", tag: "oklab(l a b)" },
  { id: "lab", label: "CIE LAB", tag: "lab(l% a b)" },
  { id: "lch", label: "CIE LCH", tag: "lch(l% c h)" },
];

// ============================================================================
// Main Gradient Generator Page
// ============================================================================

export function GradientGeneratorPage() {
  const initialPreset = GRADIENT_PRESETS[0];
  const [activePresetId, setActivePresetId] = React.useState<string>(initialPreset.id);
  const [config, setConfig] = React.useState<GradientConfig>(initialPreset.config);
  const [selectedCategory, setSelectedCategory] = React.useState<GradientCategoryId | "all">(
    initialPreset.category,
  );
  const [selectedStopId, setSelectedStopId] = React.useState<string>(
    initialPreset.config.stops[0]?.id ?? "stop-1",
  );
  const [colorFormat, setColorFormat] = React.useState<ColorFormatId>("oklch");
  const [variablePrefix, setVariablePrefix] = React.useState<string>("gradient");
  const [codeTab, setCodeTab] = React.useState<"css" | "tailwind">("css");
  const [visualizerMode, setVisualizerMode] = React.useState<
    "canvas" | "showcase" | "harmony"
  >("canvas");
  const [showCanvasHandles, setShowCanvasHandles] = React.useState<boolean>(true);
  const [canvasHandleMode, setCanvasHandleMode] = React.useState<
    "auto" | "crosshair" | "orbs" | "both"
  >("both");
  const [stopInputText, setStopInputText] = React.useState<string>("");

  // Animation studio state
  const [animation, setAnimation] = React.useState<GradientAnimationConfig>({
    enabled: false,
    isPlaying: true,
    type: "flow-pan",
    duration: 8,
    easing: "ease-in-out",
    direction: "alternate",
    bgScale: 240,
    intensity: 65,
  });

  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const [draggingHandleId, setDraggingHandleId] = React.useState<string | null>(null);
  const [draggingRailStopId, setDraggingRailStopId] = React.useState<string | null>(null);

  const selectedStop = React.useMemo(
    () =>
      config.stops.find((s) => s.id === selectedStopId) ?? config.stops[0],
    [config.stops, selectedStopId],
  );

  const selectedStopIndex = React.useMemo(
    () => Math.max(0, config.stops.findIndex((s) => s.id === selectedStop?.id)),
    [config.stops, selectedStop],
  );

  // Sync text input when selected stop or format changes
  React.useEffect(() => {
    if (selectedStop) {
      setStopInputText(formatColorInConvention(selectedStop.color, colorFormat));
    }
  }, [selectedStop, colorFormat]);

  const synthesized = React.useMemo(
    () =>
      synthesizeGradient(config, {
        variablePrefix,
        colorFormat,
        animation,
      }),
    [config, variablePrefix, colorFormat, animation],
  );

  // Static version for side-by-side comparison in the Animation Studio
  const staticSynthesized = React.useMemo(
    () =>
      synthesizeGradient(config, {
        variablePrefix: "static-preview",
        colorFormat,
      }),
    [config, colorFormat],
  );

  // Dragging 2D spatial nodes or focal crosshair on the canvas stage
  React.useEffect(() => {
    if (!draggingHandleId) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)),
      );
      const y = Math.max(
        0,
        Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)),
      );

      if (draggingHandleId === "__center__") {
        setConfig((prev) => {
          const distFromCenter = Math.hypot(x - 50, y - 50);
          // For linear gradients, dragging the crosshair also steers the gradient angle intuitively!
          const nextAngle =
            prev.baseType === "linear" && distFromCenter > 4
              ? Math.round(((Math.atan2(y - 50, x - 50) * 180) / Math.PI + 90 + 360) % 360)
              : prev.angle;
          return {
            ...prev,
            centerX: x,
            centerY: y,
            angle: nextAngle,
          };
        });
      } else {
        setConfig((prev) => {
          // Project (x, y) onto the gradient angle vector so dragging an orb also updates stop position on linear/radial gradients
          const rad = ((prev.angle - 90) * Math.PI) / 180;
          const proj = (x - 50) * Math.cos(rad) + (y - 50) * Math.sin(rad);
          const projectedPos = Math.max(0, Math.min(100, Math.round(50 + proj)));
          const isMeshLike =
            prev.baseType === "mesh" ||
            prev.category === "blobs" ||
            prev.category === "blurry";
          return {
            ...prev,
            stops: prev.stops.map((s) =>
              s.id === draggingHandleId
                ? {
                    ...s,
                    x,
                    y,
                    position: isMeshLike ? s.position : projectedPos,
                  }
                : s,
            ),
          };
        });
      }
    };

    const handlePointerUp = () => {
      setDraggingHandleId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingHandleId]);

  // Dragging stop markers along the 0-100% gradient rail
  React.useEffect(() => {
    if (!draggingRailStopId) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!railRef.current) return;
      const rect = railRef.current.getBoundingClientRect();
      const pos = Math.max(
        0,
        Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)),
      );
      setConfig((prev) => ({
        ...prev,
        stops: prev.stops.map((s) =>
          s.id === draggingRailStopId ? { ...s, position: pos } : s,
        ),
      }));
    };

    const handlePointerUp = () => {
      setDraggingRailStopId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingRailStopId]);

  const handleSelectPreset = (preset: GradientPreset) => {
    setActivePresetId(preset.id);
    setConfig({
      ...preset.config,
      stops: preset.config.stops.map((s) => ({ ...s, color: { ...s.color } })),
    });
    setSelectedStopId(preset.config.stops[0]?.id ?? "stop-1");
  };

  const handleCategorySwitch = (catId: GradientCategoryId | "all") => {
    setSelectedCategory(catId);
    if (catId !== "all") {
      const firstInCat = GRADIENT_PRESETS.find((p) => p.category === catId);
      if (firstInCat) {
        handleSelectPreset(firstInCat);
      } else {
        setConfig((prev) => ({ ...prev, category: catId }));
      }
    }
  };

  const handleUpdateSelectedStopColor = (rawText: string) => {
    setStopInputText(rawText);
    const parsed = parseAnyColorInput(rawText);
    if (parsed && selectedStop) {
      setConfig((prev) => ({
        ...prev,
        stops: prev.stops.map((s) =>
          s.id === selectedStop.id ? { ...s, color: parsed.rgba } : s,
        ),
      }));
    }
  };

  const handleAddStop = (positionPct?: number) => {
    const newId = `stop-${Date.now()}`;
    const pos = positionPct ?? 50;
    const baseHue = Math.floor(Math.random() * 360);
    const newColor = hslaToRgba({ h: baseHue, s: 85, l: 60, a: 1 });
    const newStop: GradientStop = {
      id: newId,
      color: newColor,
      position: pos,
      x: Math.max(15, Math.min(85, pos)),
      y: Math.floor(20 + Math.random() * 60),
    };
    setConfig((prev) => ({
      ...prev,
      stops: [...prev.stops, newStop],
    }));
    setSelectedStopId(newId);
    toast.success(`Added Color Stop #${config.stops.length + 1} at ${pos}%`);
  };

  const handleRemoveStop = (stopId: string) => {
    if (config.stops.length <= 2) {
      toast.error("A gradient requires at least 2 color stops.");
      return;
    }
    const targetIdx = config.stops.findIndex((s) => s.id === stopId);
    const remaining = config.stops.filter((s) => s.id !== stopId);
    setConfig((prev) => ({ ...prev, stops: remaining }));
    if (selectedStopId === stopId) {
      const nextStop = remaining[Math.max(0, targetIdx - 1)] ?? remaining[0];
      setSelectedStopId(nextStop.id);
    }
    toast.success(`Removed Color Stop #${targetIdx + 1}`);
  };

  const handleReverseStops = () => {
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => ({
        ...s,
        position: 100 - s.position,
        x: 100 - s.x,
      })),
    }));
  };

  const handleDistributeStops = () => {
    setConfig((prev) => {
      const sorted = [...prev.stops].sort((a, b) => a.position - b.position);
      const count = sorted.length;
      return {
        ...prev,
        stops: sorted.map((s, idx) => ({
          ...s,
          position: count === 1 ? 50 : Math.round((idx / (count - 1)) * 100),
        })),
      };
    });
    toast.success("Distributed stops evenly across 0% – 100%");
  };

  const handleRandomizeHarmonious = () => {
    const seedHue = Math.floor(Math.random() * 360);
    const stepHue = 32 + Math.floor(Math.random() * 45);
    setConfig((prev) => {
      const count = prev.stops.length;
      const nextStops = prev.stops.map((s, idx) => {
        const h = (seedHue + idx * stepHue) % 360;
        const sat = 75 + Math.floor(Math.random() * 20);
        const light = 30 + Math.round((idx / Math.max(1, count - 1)) * 52);
        return {
          ...s,
          color: hslaToRgba({ h, s: sat, l: light, a: 1 }),
          x: Math.floor(15 + Math.random() * 70),
          y: Math.floor(15 + Math.random() * 70),
        };
      });
      return {
        ...prev,
        angle: Math.floor(Math.random() * 360),
        stops: nextStops,
      };
    });
  };

  const filteredPresets = React.useMemo(() => {
    if (selectedCategory === "all") return GRADIENT_PRESETS;
    return GRADIENT_PRESETS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const activeCategoryMeta = React.useMemo(
    () =>
      GRADIENT_CATEGORIES.find((c) => c.id === config.category) ??
      GRADIENT_CATEGORIES[0],
    [config.category],
  );

  // Precompute all convention representations for the currently selected stop
  const selectedStopConventions = React.useMemo(() => {
    if (!selectedStop) return null;
    const rgba = selectedStop.color;
    const hsla = rgbaToHsla(rgba);
    const hsva = rgbaToHsva(rgba);
    const cmyk = rgbaToCmyk(rgba);
    const oklch = rgbaToOklch(rgba);
    return {
      hex: rgbaToHex(rgba, false),
      rgbaStr: `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${Number(rgba.a.toFixed(2))})`,
      hslStr: `hsl(${hsla.h}, ${hsla.s}%, ${hsla.l}%)`,
      hsvStr: `hsv(${hsva.h}, ${hsva.s}%, ${hsva.v}%)`,
      cmykStr: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      oklchStr: `oklch(${oklch.l}% ${oklch.c} ${oklch.h})`,
    };
  }, [selectedStop]);

  const isMeshLike =
    config.baseType === "mesh" ||
    config.category === "blobs" ||
    config.category === "blurry";

  const showCrosshairOnStage =
    showCanvasHandles &&
    (canvasHandleMode === "crosshair" ||
      canvasHandleMode === "both" ||
      (canvasHandleMode === "auto" && !isMeshLike));

  const showOrbsOnStage =
    showCanvasHandles &&
    (canvasHandleMode === "orbs" ||
      canvasHandleMode === "both" ||
      (canvasHandleMode === "auto" && isMeshLike));

  return (
    <GlobalErrorBoundary>
      {/* Dynamic Keyframes for Live Gradient Animation */}
      {synthesized.keyframesCss && <style>{synthesized.keyframesCss}</style>}

      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        {/* Header (matching all other tools) */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gradient & Texture Studio
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Design eye-pleasing static and animated gradients across{" "}
              {GRADIENT_CATEGORIES.length} texture families ({GRADIENT_PRESETS.length}{" "}
              curated presets)—with full multi-color-space support, live UI component
              previews, and CSS / Tailwind variable export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={animation.enabled ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setAnimation((prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                  isPlaying: true,
                }))
              }
            >
              {animation.enabled ? (
                <PauseIcon data-icon="inline-start" />
              ) : (
                <PlayIcon data-icon="inline-start" />
              )}
              {animation.enabled ? "Animation Active" : "Animate Gradient"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomizeHarmonious}
            >
              <ShuffleIcon data-icon="inline-start" />
              Harmonious Random
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReverseStops}
            >
              <ArrowsLeftRightIcon data-icon="inline-start" />
              Reverse Stops
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDistributeStops}
            >
              Distribute Evenly
            </Button>
          </div>
        </div>

        {/* 24 Texture & Gradient Style Categories Bar */}
        <div className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SwatchesIcon className="size-4 text-primary" />
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {GRADIENT_CATEGORIES.length} Gradient & Texture Families (
                {GRADIENT_PRESETS.length} Curated Presets)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCategorySwitch("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              View All ({GRADIENT_PRESETS.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GRADIENT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySwitch(cat.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/70 bg-background/70 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <span>{cat.label}</span>
                  <span
                    className={cn(
                      "rounded px-1 py-0.2 font-mono text-[10px]",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    5
                  </span>
                </button>
              );
            })}
          </div>

          {/* Presets Grid for Selected Category */}
          <div className="pt-1">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {selectedCategory === "all"
                    ? "All Curated Gradients"
                    : activeCategoryMeta.label}
                </span>
                {" — "}
                {selectedCategory === "all"
                  ? `Browse all ${GRADIENT_PRESETS.length} handcrafted gradients across every texture family`
                  : activeCategoryMeta.shortDesc}
              </p>
            </div>
            <div className="grid max-h-[290px] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-5">
              {filteredPresets.map((preset) => (
                <PresetPreviewCard
                  key={preset.id}
                  preset={preset}
                  isActive={activePresetId === preset.id}
                  onSelect={() => handleSelectPreset(preset)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Studio Workspace: Left Live Visualizer Stage + Right Multi-Format Inspector */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Columns: Live Gradient Stage & Visualization Modes */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            {/* Visualizer Mode Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/60 px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setVisualizerMode("canvas")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    visualizerMode === "canvas"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CrosshairIcon className="size-3.5" />
                  2D Interactive Stage
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizerMode("showcase")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    visualizerMode === "showcase"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CubeTransparentIcon className="size-3.5" />
                  UI, Orbs & Typography (8)
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizerMode("harmony")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    visualizerMode === "harmony"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CompassIcon className="size-3.5" />
                  Color Wheel & Swatches
                </button>
              </div>

              {visualizerMode === "canvas" && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5 text-[11px]">
                    {(
                      [
                        { id: "both", label: "Crosshair + Orbs" },
                        { id: "crosshair", label: "Crosshair" },
                        { id: "orbs", label: "Stop Orbs" },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setShowCanvasHandles(true);
                          setCanvasHandleMode(mode.id);
                        }}
                        className={cn(
                          "rounded px-2 py-0.5 font-medium transition-colors",
                          showCanvasHandles && canvasHandleMode === mode.id
                            ? "bg-background text-foreground shadow-2xs"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  {(config.centerX !== 50 || config.centerY !== 50) && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, centerX: 50, centerY: 50 }))
                      }
                      className="rounded-lg border border-border/70 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      title="Reset focal crosshair to center (50%, 50%)"
                    >
                      Reset Center
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCanvasHandles((prev) => !prev)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors",
                      showCanvasHandles
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <EyeIcon className="size-3.5" />
                    {showCanvasHandles ? "Hide" : "Show"}
                  </button>
                </div>
              )}
            </div>

            {/* Primary Live Gradient Canvas / Visualizer */}
            {visualizerMode === "canvas" && (
              <div
                ref={stageRef}
                className="relative h-[430px] w-full overflow-hidden rounded-2xl border border-border/80 shadow-lg select-none"
              >
                <div className="absolute inset-0" style={synthesized.surfaceStyle} />
                {synthesized.overlayStyle && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={synthesized.overlayStyle}
                  />
                )}

                {/* SVG Vector Guide Line for Crosshair Focal Direction */}
                {showCrosshairOnStage && (
                  <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${config.centerX}%`}
                      y2={`${config.centerY}%`}
                      stroke="rgba(255,255,255,0.65)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="3.5"
                      fill="rgba(255,255,255,0.65)"
                    />
                  </svg>
                )}

                {/* Draggable 2D Spatial Stop Handles & Focal Crosshair */}
                {showCanvasHandles && (
                  <>
                    {showOrbsOnStage &&
                      config.stops.map((stop, idx) => {
                        const isSelected = stop.id === selectedStopId;
                        return (
                          <div
                            key={stop.id}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setSelectedStopId(stop.id);
                              setDraggingHandleId(stop.id);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStop(stop.id);
                            }}
                            style={{
                              left: `${stop.x}%`,
                              top: `${stop.y}%`,
                            }}
                            className={cn(
                              "group/orb absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow-lg transition-transform active:scale-110 active:cursor-grabbing",
                              isSelected ? "z-20 size-7 ring-4 ring-white/40" : "z-10 size-5.5",
                            )}
                            title={`Drag Stop #${idx + 1} (${stop.x}%, ${stop.y}%) • Double-click to remove`}
                          >
                            <div
                              className="h-full w-full rounded-full"
                              style={{ backgroundColor: rgbaToHex(stop.color, false) }}
                            />
                            <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-black/75 px-1.5 py-0.2 font-mono text-[9px] font-bold whitespace-nowrap text-white">
                              #{idx + 1}
                            </span>
                            {config.stops.length > 2 && (
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveStop(stop.id);
                                }}
                                className="absolute -top-2 -right-2 hidden size-4 items-center justify-center rounded-full bg-destructive text-white shadow-sm group-hover/orb:flex"
                                title={`Remove Stop #${idx + 1}`}
                              >
                                <XIcon className="size-2.5" weight="bold" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                    {showCrosshairOnStage && (
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setDraggingHandleId("__center__");
                        }}
                        style={{
                          left: `${config.centerX}%`,
                          top: `${config.centerY}%`,
                        }}
                        className="absolute z-30 flex size-9 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-black/60 text-white shadow-xl ring-4 ring-white/25 backdrop-blur-xs transition-transform active:scale-110 active:cursor-grabbing"
                        title={`Drag Focal Crosshair (${config.centerX}%, ${config.centerY}%) to steer angle & focal origin`}
                      >
                        <CrosshairIcon className="size-4.5" weight="bold" />
                        <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold whitespace-nowrap text-white shadow-xs">
                          {config.centerX}%, {config.centerY}% • {config.angle}°
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Bottom Floating Info Pill */}
                <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs text-white backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <SparkleIcon className="size-4 text-amber-300" weight="fill" />
                    <span className="font-semibold">{activeCategoryMeta.label}</span>
                    <span className="text-white/65">•</span>
                    <span className="font-mono text-[11px] text-white/85">
                      {config.baseType.toUpperCase()} ({config.angle}° @ {config.centerX}%,{" "}
                      {config.centerY}%)
                    </span>
                    {animation.enabled && (
                      <span className="rounded-full bg-emerald-500/30 px-2 py-0.2 font-mono text-[10px] font-semibold text-emerald-200">
                        ANIMATED ({animation.type})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/80">
                    Drag crosshair to steer angle & focal glow • Drag #orbs to sculpt stops
                  </span>
                </div>
              </div>
            )}

            {/* Mode 2: 8-Component UI, Orbs & Typography Showcase */}
            {visualizerMode === "showcase" && (
              <div className="grid max-h-[540px] grid-cols-1 gap-4 overflow-y-auto rounded-2xl border border-border/80 bg-card p-4 sm:grid-cols-2">
                {/* 1. Glassmorphic Hero Banner Card */}
                <div className="relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-xl border border-border/60 p-5 text-white shadow-md">
                  <div className="absolute inset-0" style={synthesized.surfaceStyle} />
                  {synthesized.overlayStyle && (
                    <div className="absolute inset-0" style={synthesized.overlayStyle} />
                  )}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-md">
                      <SparkleIcon className="size-3" />
                      {activeCategoryMeta.badge} Surface
                    </span>
                    <span className="font-mono text-[10px] text-white/80">01 / HERO</span>
                  </div>
                  <div className="relative z-10 mt-4 rounded-xl border border-white/20 bg-black/40 p-3.5 backdrop-blur-md">
                    <p className="text-sm font-bold tracking-tight">
                      Atmospheric Hero Card
                    </p>
                    <p className="mt-0.5 text-xs text-white/80">
                      Frosted glass container layered over your {activeCategoryMeta.label.toLowerCase()} preset.
                    </p>
                  </div>
                </div>

                {/* 2. Display Typography, Gradient Borders & Badges */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/85 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        02 / Display Typography & Pills
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        bg-clip-text
                      </span>
                    </div>
                    <p
                      className="bg-clip-text text-2xl leading-tight font-black tracking-tight text-transparent"
                      style={{
                        backgroundImage: synthesized.surfaceStyle.backgroundImage,
                      }}
                    >
                      Chromatic Design System
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seamless perceptual gradients for hero headlines and interactive tokens.
                    </p>
                  </div>

                  {/* Gradient Bordered Badges & CTA Button */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div
                      className="rounded-full p-[1.5px]"
                      style={{
                        backgroundImage: synthesized.surfaceStyle.backgroundImage,
                      }}
                    >
                      <span className="block rounded-full bg-background px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                        v4.2 Release
                      </span>
                    </div>
                    <div
                      className="rounded-full p-[1.5px]"
                      style={{
                        backgroundImage: synthesized.surfaceStyle.backgroundImage,
                      }}
                    >
                      <span className="block rounded-full bg-background px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        OKLCH Ready
                      </span>
                    </div>
                    <div className="relative ml-auto overflow-hidden rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm">
                      <div className="absolute inset-0" style={synthesized.surfaceStyle} />
                      {synthesized.overlayStyle && (
                        <div className="absolute inset-0" style={synthesized.overlayStyle} />
                      )}
                      <span className="relative z-10 drop-shadow-xs">Get Started →</span>
                    </div>
                  </div>
                </div>

                {/* 3. 3D Shaded Spheres & Sculpted Torus Ring */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/85 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      03 / 3D Shaded Orbs & Torus Ring
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Specular Lit
                    </span>
                  </div>
                  <div className="flex items-center justify-around py-2">
                    {[62, 46].map((sz, i) => (
                      <div
                        key={sz}
                        className="relative overflow-hidden rounded-full shadow-xl"
                        style={{ width: sz, height: sz }}
                      >
                        <div className="absolute inset-0" style={synthesized.surfaceStyle} />
                        {synthesized.overlayStyle && (
                          <div className="absolute inset-0" style={synthesized.overlayStyle} />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.7) 0%, transparent 45%, rgba(0,0,0,0.6) 100%)",
                          }}
                        />
                        <span className="sr-only">Orb {i + 1}</span>
                      </div>
                    ))}
                    {/* 3D Torus / Donut Ring */}
                    <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-full shadow-xl">
                      <div className="absolute inset-0" style={synthesized.surfaceStyle} />
                      {synthesized.overlayStyle && (
                        <div className="absolute inset-0" style={synthesized.overlayStyle} />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55) 0%, transparent 55%, rgba(0,0,0,0.55) 100%)",
                        }}
                      />
                      <div className="relative z-10 size-7 rounded-full border border-white/25 bg-card shadow-inner" />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                     Spheres and hollow torus rings with 3D radial specular shading.
                  </p>
                </div>

                {/* 4. Fintech Virtual Metallic / Gradient Credit Card */}
                <div className="relative flex min-h-[185px] flex-col justify-between overflow-hidden rounded-xl border border-white/20 p-4 text-white shadow-lg">
                  <div className="absolute inset-0" style={synthesized.surfaceStyle} />
                  {synthesized.overlayStyle && (
                    <div className="absolute inset-0" style={synthesized.overlayStyle} />
                  )}
                  <div className="absolute inset-0 bg-black/15" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="size-4.5 text-white/90" />
                      <span className="text-xs font-bold tracking-wider uppercase">
                        DevHaven Titanium
                      </span>
                    </div>
                    <WifiHighIcon className="size-4 rotate-90 text-white/85" />
                  </div>

                  {/* EMV Gold Chip + Card Number */}
                  <div className="relative z-10 my-2 space-y-2">
                    <div className="h-6 w-8 rounded-md border border-amber-200/60 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 opacity-90 shadow-xs" />
                    <p className="font-mono text-sm tracking-[0.2em] text-white drop-shadow-xs">
                      4921 •••• •••• 8042
                    </p>
                  </div>

                  <div className="relative z-10 flex items-end justify-between text-[10px]">
                    <div>
                      <p className="text-white/65 uppercase">Cardholder</p>
                      <p className="font-mono font-semibold">ALEXANDER STUDIO</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/65 uppercase">Expires</p>
                      <p className="font-mono font-semibold">09/29</p>
                    </div>
                  </div>
                </div>

                {/* 5. SaaS Pro Tier Pricing Card (Gradient Border + Checklist) */}
                <div
                  className="rounded-xl p-[1.5px] shadow-md"
                  style={{
                    backgroundImage: synthesized.surfaceStyle.backgroundImage,
                  }}
                >
                  <div className="flex h-full flex-col justify-between rounded-[10.5px] bg-card p-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          05 / Studio Pro Plan
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                          style={{
                            backgroundImage: synthesized.surfaceStyle.backgroundImage,
                          }}
                        >
                          POPULAR
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span
                          className="bg-clip-text text-2xl font-black text-transparent"
                          style={{
                            backgroundImage: synthesized.surfaceStyle.backgroundImage,
                          }}
                        >
                          $29
                        </span>
                        <span className="text-xs text-muted-foreground">/ month</span>
                      </div>
                      <ul className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
                        {[
                          "Unlimited OKLCH & CMYK exports",
                          "60fps GPU keyframe animations",
                          "Custom SVG noise & caustic filters",
                        ].map((feat) => (
                          <li key={feat} className="flex items-center gap-1.5">
                            <CheckCircleIcon
                              className="size-3.5 shrink-0 text-primary"
                              weight="fill"
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className="relative mt-3 w-full overflow-hidden rounded-lg py-1.5 text-xs font-semibold text-white shadow-xs"
                    >
                      <span
                        className="absolute inset-0"
                        style={synthesized.surfaceStyle}
                      />
                      <span className="relative z-10 drop-shadow-xs">
                        Upgrade Workspace
                      </span>
                    </button>
                  </div>
                </div>

                {/* 6. Music / Audio Equalizer Widget */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/85 p-4">
                  <div className="flex items-center gap-3">
                    {/* Vinyl Disc with Gradient Cover */}
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border shadow-md">
                      <div className="absolute inset-0" style={synthesized.surfaceStyle} />
                      {synthesized.overlayStyle && (
                        <div className="absolute inset-0" style={synthesized.overlayStyle} />
                      )}
                      <div className="relative z-10 flex size-5 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-xs">
                        <MusicNotesIcon className="size-3" weight="fill" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        06 / Audio Visualizer
                      </span>
                      <p className="truncate text-xs font-bold text-foreground">
                        {activeCategoryMeta.label} Resonance
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        12-Band Chromatic Spectrum
                      </p>
                    </div>
                  </div>

                  {/* 12-Bar Gradient Equalizer */}
                  <div className="flex h-12 items-end justify-between gap-1 px-1">
                    {[42, 78, 56, 95, 68, 88, 50, 92, 74, 60, 84, 48].map(
                      (heightPct, idx) => (
                        <div
                          key={idx}
                          className="w-full overflow-hidden rounded-t-sm"
                          style={{ height: `${heightPct}%` }}
                        >
                          <div
                            className="h-full w-full"
                            style={synthesized.surfaceStyle}
                          />
                        </div>
                      ),
                    )}
                  </div>

                  {/* Progress Scrubber */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full w-[68%] rounded-full"
                        style={synthesized.surfaceStyle}
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                      <span>02:18</span>
                      <span>03:42</span>
                    </div>
                  </div>
                </div>

                {/* 7. Analytics KPI & Progress Meters */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/85 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        07 / Analytics & Meters
                      </span>
                      <p className="mt-0.5 text-lg font-extrabold tracking-tight text-foreground">
                        98.4%{" "}
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
                          <TrendUpIcon className="size-3.5" weight="bold" />
                          +14.2%
                        </span>
                      </p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                      GPU Render
                    </span>
                  </div>

                  {/* Multi-Meter Progress Bars */}
                  <div className="space-y-2">
                    {[
                      { label: "Perceptual Gamut Coverage", pct: 92 },
                      { label: "Shader Frame Stability", pct: 78 },
                      { label: "Contrast Harmonics", pct: 64 },
                    ].map((meter) => (
                      <div key={meter.label} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">{meter.label}</span>
                          <span className="font-mono font-semibold">{meter.pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${meter.pct}%`,
                              ...synthesized.surfaceStyle,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8. Social Profile Banner, Story Avatar Rings & Notification Toast */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/85 p-4">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    08 / Avatar Story Rings & Toast Banner
                  </span>

                  {/* Avatar Rings Row */}
                  <div className="flex items-center gap-3">
                    {["AS", "MK", "JL", "RD"].map((initials) => (
                      <div
                        key={initials}
                        className="rounded-full p-[2.5px] shadow-xs"
                        style={{
                          backgroundImage: synthesized.surfaceStyle.backgroundImage,
                        }}
                      >
                        <div className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-card font-mono text-xs font-bold text-foreground">
                          {initials}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notification Callout Toast */}
                  <div className="relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-border/70 bg-card p-2.5 shadow-2xs">
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
                      style={synthesized.surfaceStyle}
                    >
                      <BellRingingIcon className="size-4" weight="fill" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        Design Tokens Synced
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {config.stops.length} stops exported as --{variablePrefix}-*
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Polar Color Wheel & Multi-Format Stop Matrix */}
            {visualizerMode === "harmony" && (
              <div className="flex h-[430px] flex-col justify-between gap-4 overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 sm:flex-row sm:items-center">
                <div className="flex flex-1 justify-center">
                  <PolarColorWheelVisualizer
                    stops={config.stops}
                    selectedStopId={selectedStopId}
                    onSelectStop={setSelectedStopId}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">
                      Stop Color Space Breakdown ({colorFormat.toUpperCase()})
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={() => handleAddStop()}
                    >
                      <PlusIcon className="size-3" />
                      Add Stop
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {config.stops.map((stop, idx) => {
                      const formatted = formatColorInConvention(
                        stop.color,
                        colorFormat,
                      );
                      const isSel = stop.id === selectedStopId;
                      return (
                        <div
                          key={stop.id}
                          onClick={() => setSelectedStopId(stop.id)}
                          className={cn(
                            "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-xs transition-colors",
                            isSel
                              ? "border-primary bg-primary/5"
                              : "border-border/60 bg-background/60 hover:border-border",
                          )}
                        >
                          <span
                            className="size-5 shrink-0 rounded-md border border-border/80 shadow-2xs"
                            style={{
                              backgroundColor: rgbaToHex(stop.color, false),
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                Stop #{idx + 1}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {stop.position}% • ({stop.x}%, {stop.y}%)
                              </span>
                            </div>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                              {formatted}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStop(stop.id);
                            }}
                            disabled={config.stops.length <= 2}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                            title={
                              config.stops.length <= 2
                                ? "Minimum 2 stops required"
                                : `Remove Stop #${idx + 1}`
                            }
                          >
                            <TrashIcon className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Multi-Stop Gradient Rail (0% - 100%) + Direct Stop Removal Bar */}
            <div className="space-y-2.5 rounded-xl border border-border/70 bg-card/60 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-foreground">
                  Gradient Stop Rail{" "}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    (Click rail to insert • Drag to move • Double-click handle or click × to remove)
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedStop && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={config.stops.length <= 2}
                      className="h-6 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleRemoveStop(selectedStop.id)}
                    >
                      <TrashIcon className="size-3" />
                      Remove Stop #{selectedStopIndex + 1}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => handleAddStop()}
                  >
                    <PlusIcon className="size-3" />
                    Add Stop
                  </Button>
                </div>
              </div>

              <div
                ref={railRef}
                onClick={(e) => {
                  if (!railRef.current) return;
                  const rect = railRef.current.getBoundingClientRect();
                  const pct = Math.max(
                    0,
                    Math.min(
                      100,
                      Math.round(((e.clientX - rect.left) / rect.width) * 100),
                    ),
                  );
                  handleAddStop(pct);
                }}
                className="relative h-8 w-full cursor-copy rounded-lg border border-border/80 shadow-inner"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${[...config.stops]
                    .sort((a, b) => a.position - b.position)
                    .map((s) => `${rgbaToHex(s.color, false)} ${s.position}%`)
                    .join(", ")})`,
                }}
              >
                {config.stops.map((stop, idx) => {
                  const isSelected = stop.id === selectedStopId;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStopId(stop.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStop(stop.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveStop(stop.id);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setSelectedStopId(stop.id);
                        setDraggingRailStopId(stop.id);
                      }}
                      style={{ left: `${stop.position}%` }}
                      className={cn(
                        "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow-md transition-transform active:cursor-grabbing",
                        isSelected
                          ? "z-20 size-6 ring-3 ring-primary"
                          : "z-10 size-4.5 hover:scale-110",
                      )}
                      title={`Stop #${idx + 1} (${stop.position}%) • Double-click or right-click to remove`}
                    >
                      <span
                        className="block h-full w-full rounded-full"
                        style={{ backgroundColor: rgbaToHex(stop.color, false) }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Quick Stop Chips with One-Click × Delete */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {config.stops.map((stop, idx) => {
                  const isSelected = stop.id === selectedStopId;
                  return (
                    <div
                      key={stop.id}
                      onClick={() => setSelectedStopId(stop.id)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10 font-semibold text-foreground"
                          : "border-border/60 bg-background/70 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className="size-2.5 rounded-full border border-border/80"
                        style={{ backgroundColor: rgbaToHex(stop.color, false) }}
                      />
                      <span>#{idx + 1}</span>
                      <span className="font-mono text-[10px] opacity-75">
                        {stop.position}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStop(stop.id);
                        }}
                        disabled={config.stops.length <= 2}
                        className="ml-0.5 rounded-xs p-0.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:pointer-events-none disabled:opacity-25"
                        title={
                          config.stops.length <= 2
                            ? "At least 2 stops required"
                            : `Remove Stop #${idx + 1}`
                        }
                      >
                        <XIcon className="size-2.5" weight="bold" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Geometry, Texture Effect & Multi-Convention Color Stop Inspector */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            {/* Geometry & Texture Parameters Card */}
            <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FadersIcon className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold">
                    Geometry & Texture Controls
                  </h2>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  {activeCategoryMeta.label}
                </span>
              </div>

              {/* Base Gradient Architecture + Interpolation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Base Geometry
                  </label>
                  <Select
                    value={config.baseType}
                    onValueChange={(val) =>
                      setConfig((prev) => ({
                        ...prev,
                        baseType: val as GradientBaseType,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear Gradient</SelectItem>
                      <SelectItem value="radial">Radial Gradient</SelectItem>
                      <SelectItem value="conic">Conic / Spun Gradient</SelectItem>
                      <SelectItem value="mesh">Multi-Blob Mesh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Color Interpolation
                  </label>
                  <Select
                    value={config.interpolation}
                    onValueChange={(val) =>
                      setConfig((prev) => ({
                        ...prev,
                        interpolation: val as GradientInterpolationSpace,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in oklch">in oklch (Perceptual)</SelectItem>
                      <SelectItem value="in oklch longer hue">
                        in oklch longer hue (Rainbow)
                      </SelectItem>
                      <SelectItem value="in oklab">in oklab</SelectItem>
                      <SelectItem value="in srgb">in srgb (Classic)</SelectItem>
                      <SelectItem value="in hsl">in hsl</SelectItem>
                      <SelectItem value="default">Browser Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Angle, Focal Center & Effect Intensity / Scale Sliders */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Direction Angle</span>
                    <span className="font-mono font-medium">{config.angle}°</span>
                  </div>
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[config.angle]}
                    onValueChange={(val) => {
                      const next = Array.isArray(val) ? val[0] : val;
                      setConfig((prev) => ({ ...prev, angle: next ?? 135 }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Focal Center X</span>
                      <span className="font-mono">{config.centerX}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[config.centerX]}
                      onValueChange={(val) => {
                        const next = Array.isArray(val) ? val[0] : val;
                        setConfig((prev) => ({ ...prev, centerX: next ?? 50 }));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Focal Center Y</span>
                      <span className="font-mono">{config.centerY}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[config.centerY]}
                      onValueChange={(val) => {
                        const next = Array.isArray(val) ? val[0] : val;
                        setConfig((prev) => ({ ...prev, centerY: next ?? 50 }));
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Texture / Effect Intensity ({activeCategoryMeta.badge})
                    </span>
                    <span className="font-mono font-medium">
                      {config.effectIntensity}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[config.effectIntensity]}
                    onValueChange={(val) => {
                      const next = Array.isArray(val) ? val[0] : val;
                      setConfig((prev) => ({
                        ...prev,
                        effectIntensity: next ?? 65,
                      }));
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Pattern Scale / Blob Spread / Flute Width
                    </span>
                    <span className="font-mono font-medium">
                      {config.effectScale}%
                    </span>
                  </div>
                  <Slider
                    min={10}
                    max={100}
                    step={1}
                    value={[config.effectScale]}
                    onValueChange={(val) => {
                      const next = Array.isArray(val) ? val[0] : val;
                      setConfig((prev) => ({
                        ...prev,
                        effectScale: next ?? 50,
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Multi-Convention Color Stop Inspector Card */}
            <div className="space-y-3.5 rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <PaletteIcon className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold">
                    Color Stops ({config.stops.length}) & Convention
                  </h2>
                </div>

                {/* Active Color Format Selector */}
                <Select
                  value={colorFormat}
                  onValueChange={(val) => setColorFormat(val as ColorFormatId)}
                >
                  <SelectTrigger className="h-7 w-[140px] font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOP_COLOR_FORMATS.map((fmt) => (
                      <SelectItem key={fmt.id} value={fmt.id}>
                        {fmt.label} ({fmt.tag})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stop Pills Row with Direct × Delete Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {config.stops.map((stop, idx) => {
                  const isSel = stop.id === selectedStopId;
                  return (
                    <div
                      key={stop.id}
                      onClick={() => setSelectedStopId(stop.id)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-all",
                        isSel
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className="size-3.5 rounded-full border border-border/80"
                        style={{ backgroundColor: rgbaToHex(stop.color, false) }}
                      />
                      <span>#{idx + 1}</span>
                      <span className="font-mono text-[10px] opacity-75">
                        {stop.position}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStop(stop.id);
                        }}
                        disabled={config.stops.length <= 2}
                        className="ml-0.5 rounded-xs p-0.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:pointer-events-none disabled:opacity-25"
                        title={
                          config.stops.length <= 2
                            ? "A gradient requires at least 2 stops"
                            : `Remove Stop #${idx + 1}`
                        }
                      >
                        <XIcon className="size-3" weight="bold" />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handleAddStop()}
                  className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <PlusIcon className="size-3.5" />
                  Add Stop
                </button>
              </div>

              {/* Selected Stop Editor */}
              {selectedStop && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Editing Stop #{selectedStopIndex + 1} of {config.stops.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveStop(selectedStop.id)}
                      disabled={config.stops.length <= 2}
                      className="h-6 gap-1 px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title={
                        config.stops.length <= 2
                          ? "A gradient requires at least 2 color stops"
                          : `Remove Stop #${selectedStopIndex + 1}`
                      }
                    >
                      <TrashIcon className="size-3.5" />
                      Remove Stop #{selectedStopIndex + 1}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border shadow-2xs">
                      <input
                        type="color"
                        value={rgbaToHex(selectedStop.color, false)}
                        onChange={(e) =>
                          handleUpdateSelectedStopColor(e.target.value)
                        }
                        className="absolute inset-0 size-12 -translate-x-1 -translate-y-1 cursor-pointer opacity-0"
                      />
                      <span
                        className="h-full w-full"
                        style={{
                          backgroundColor: rgbaToHex(selectedStop.color, false),
                        }}
                      />
                    </label>

                    <div className="flex-1">
                      <Input
                        value={stopInputText}
                        onChange={(e) =>
                          handleUpdateSelectedStopColor(e.target.value)
                        }
                        placeholder="Type HEX, RGB, HSL, HSV, CMYK, OKLCH..."
                        className="h-9 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Stop Position & Alpha Sliders */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Stop Position</span>
                        <span className="font-mono">{selectedStop.position}%</span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[selectedStop.position]}
                        onValueChange={(val) => {
                          const next = Array.isArray(val) ? val[0] : val;
                          setConfig((prev) => ({
                            ...prev,
                            stops: prev.stops.map((s) =>
                              s.id === selectedStop.id
                                ? { ...s, position: next ?? 50 }
                                : s,
                            ),
                          }));
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Opacity (Alpha)</span>
                        <span className="font-mono">
                          {Math.round(selectedStop.color.a * 100)}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[Math.round(selectedStop.color.a * 100)]}
                        onValueChange={(val) => {
                          const next = Array.isArray(val) ? val[0] : val;
                          const alpha = (next ?? 100) / 100;
                          setConfig((prev) => ({
                            ...prev,
                            stops: prev.stops.map((s) =>
                              s.id === selectedStop.id
                                ? { ...s, color: { ...s.color, a: alpha } }
                                : s,
                            ),
                          }));
                        }}
                      />
                    </div>
                  </div>

                  {/* Multi-Convention Instant Readout Pills (Click to Load Format) */}
                  {selectedStopConventions && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                      {(
                        [
                          { id: "hex", label: "HEX", val: selectedStopConventions.hex },
                          { id: "rgba", label: "RGBA", val: selectedStopConventions.rgbaStr },
                          { id: "hsl", label: "HSL", val: selectedStopConventions.hslStr },
                          { id: "hsv", label: "HSV", val: selectedStopConventions.hsvStr },
                          { id: "cmyk", label: "CMYK", val: selectedStopConventions.cmykStr },
                          { id: "oklch", label: "OKLCH", val: selectedStopConventions.oklchStr },
                        ] as Array<{ id: ColorFormatId; label: string; val: string }>
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setColorFormat(item.id)}
                          className={cn(
                            "flex items-center justify-between gap-1 rounded border px-2 py-1 text-left font-mono transition-colors",
                            colorFormat === item.id
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground",
                          )}
                          title={`Switch output format to ${item.label}`}
                        >
                          <span className="font-bold">{item.label}</span>
                          <span className="truncate">{item.val}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section 1: Gradient Animation Studio */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SparkleIcon className="size-5" weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight">
                    Gradient Animation Studio
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                      animation.enabled
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {animation.enabled
                      ? animation.isPlaying
                        ? "LIVE • PLAYING"
                        : "PAUSED"
                      : "STATIC"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Animate your gradient with hardware-accelerated CSS{" "}
                  <code className="font-mono">@keyframes</code> and custom property
                  timing controls—exported directly into your CSS & Tailwind code below.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Speed Presets */}
              <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs">
                {[
                  { label: "3s Fast", sec: 3 },
                  { label: "6s Smooth", sec: 6 },
                  { label: "10s Ambient", sec: 10 },
                  { label: "18s Zen", sec: 18 },
                ].map((sp) => (
                  <button
                    key={sp.sec}
                    type="button"
                    onClick={() =>
                      setAnimation((prev) => ({
                        ...prev,
                        enabled: true,
                        isPlaying: true,
                        duration: sp.sec,
                      }))
                    }
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                      animation.enabled && animation.duration === sp.sec
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>

              {animation.enabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAnimation((prev) => ({
                      ...prev,
                      isPlaying: !prev.isPlaying,
                    }))
                  }
                >
                  {animation.isPlaying ? (
                    <>
                      <PauseIcon data-icon="inline-start" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayIcon data-icon="inline-start" />
                      Resume
                    </>
                  )}
                </Button>
              )}

              <Button
                variant={animation.enabled ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setAnimation((prev) => ({
                    ...prev,
                    enabled: !prev.enabled,
                    isPlaying: true,
                  }))
                }
              >
                <SparkleIcon data-icon="inline-start" />
                {animation.enabled ? "Disable Animation" : "Enable Animation"}
              </Button>
            </div>
          </div>

          {/* 6 Animation Mode Selector Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {GRADIENT_ANIMATION_MODES.map((mode) => {
              const isSelected = animation.type === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() =>
                    setAnimation((prev) => ({
                      ...prev,
                      enabled: true,
                      isPlaying: true,
                      type: mode.id,
                    }))
                  }
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-3 text-left transition-all",
                    animation.enabled && isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/70 bg-background/60 hover:border-border",
                  )}
                >
                  <div>
                    <span className="inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground">
                      {mode.badge}
                    </span>
                    <p className="mt-1.5 text-xs font-semibold text-foreground">
                      {mode.label}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                    {mode.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Animation Parameters & Live Side-by-Side Preview */}
          <div className="grid grid-cols-1 gap-4 pt-1 lg:grid-cols-12">
            {/* Sliders & Timing Controls (7 cols) */}
            <div className="grid grid-cols-1 gap-3.5 rounded-xl border border-border/60 bg-background/50 p-4 sm:grid-cols-3 lg:col-span-7">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cycle Duration</span>
                  <span className="font-mono font-semibold">{animation.duration}s</span>
                </div>
                <Slider
                  min={1}
                  max={30}
                  step={1}
                  value={[animation.duration]}
                  onValueChange={(val) => {
                    const next = Array.isArray(val) ? val[0] : val;
                    setAnimation((prev) => ({
                      ...prev,
                      enabled: true,
                      duration: next ?? 8,
                    }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Canvas Overscan</span>
                  <span className="font-mono font-semibold">{animation.bgScale}%</span>
                </div>
                <Slider
                  min={120}
                  max={400}
                  step={10}
                  value={[animation.bgScale]}
                  onValueChange={(val) => {
                    const next = Array.isArray(val) ? val[0] : val;
                    setAnimation((prev) => ({
                      ...prev,
                      enabled: true,
                      bgScale: next ?? 240,
                    }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Motion Intensity</span>
                  <span className="font-mono font-semibold">{animation.intensity}%</span>
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={[animation.intensity]}
                  onValueChange={(val) => {
                    const next = Array.isArray(val) ? val[0] : val;
                    setAnimation((prev) => ({
                      ...prev,
                      enabled: true,
                      intensity: next ?? 65,
                    }));
                  }}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Easing Timing Function
                </label>
                <Select
                  value={animation.easing}
                  onValueChange={(val) =>
                    setAnimation((prev) => ({
                      ...prev,
                      enabled: true,
                      easing: val as GradientAnimationEasing,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ease-in-out">ease-in-out (Smooth Sine)</SelectItem>
                    <SelectItem value="linear">linear (Continuous Constant)</SelectItem>
                    <SelectItem value="ease">ease (Natural Drift)</SelectItem>
                    <SelectItem value="cubic-bezier(0.4, 0, 0.2, 1)">
                      cubic-bezier(0.4, 0, 0.2, 1) (Material Fluid)
                    </SelectItem>
                    <SelectItem value="cubic-bezier(0.68, -0.55, 0.27, 1.55)">
                      cubic-bezier(0.68, -0.55, 0.27, 1.55) (Spring Overshoot)
                    </SelectItem>
                    <SelectItem value="steps(12, end)">
                      steps(12, end) (Retro Frame Stepped)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Loop Direction
                </label>
                <Select
                  value={animation.direction}
                  onValueChange={(val) =>
                    setAnimation((prev) => ({
                      ...prev,
                      enabled: true,
                      direction: val as GradientAnimationDirection,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alternate">alternate (Ping-Pong)</SelectItem>
                    <SelectItem value="normal">normal (Forward Loop)</SelectItem>
                    <SelectItem value="reverse">reverse (Backward Loop)</SelectItem>
                    <SelectItem value="alternate-reverse">
                      alternate-reverse
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Static vs Animated Live Comparison Strip (5 cols) */}
            <div className="grid grid-cols-2 gap-3 lg:col-span-5">
              <div className="relative flex h-32 flex-col justify-between overflow-hidden rounded-xl border border-border/70 p-3 text-white shadow-xs">
                <div className="absolute inset-0" style={staticSynthesized.surfaceStyle} />
                {staticSynthesized.overlayStyle && (
                  <div className="absolute inset-0" style={staticSynthesized.overlayStyle} />
                )}
                <span className="relative z-10 w-fit rounded bg-black/55 px-2 py-0.5 font-mono text-[10px] backdrop-blur-xs">
                  Static Reference
                </span>
                <span className="relative z-10 font-mono text-[10px] text-white/80">
                  100% × 100% Fixed
                </span>
              </div>

              <div
                onClick={() =>
                  setAnimation((prev) => ({
                    ...prev,
                    enabled: true,
                    isPlaying: !prev.isPlaying,
                  }))
                }
                className="relative flex h-32 cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-primary/50 p-3 text-white shadow-md"
              >
                <div
                  className="absolute inset-0"
                  style={
                    animation.enabled
                      ? synthesized.surfaceStyle
                      : {
                          ...staticSynthesized.surfaceStyle,
                          backgroundSize: `${animation.bgScale}% ${animation.bgScale}%`,
                        }
                  }
                />
                {synthesized.overlayStyle && (
                  <div className="absolute inset-0" style={synthesized.overlayStyle} />
                )}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 backdrop-blur-xs">
                    {animation.enabled ? `Animated (${animation.type})` : "Click to Animate"}
                  </span>
                </div>
                <span className="relative z-10 font-mono text-[10px] text-white/90">
                  {animation.duration}s • {animation.bgScale}% • {animation.direction}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section 2: CSS (with CSS Variables) & Tailwind (using CSS Variables) Code Output */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CodeIcon className="size-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Export Gradient Code (CSS Variables & Tailwind CSS)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Uses <code className="font-mono">:root</code> CSS custom properties formatted in{" "}
                  <span className="font-semibold text-foreground">
                    {colorFormat.toUpperCase()}
                  </span>
                  {animation.enabled && (
                    <span className="ml-1 text-emerald-500">
                      • Includes @{variablePrefix}-{animation.type} keyframes
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Variable Prefix Input */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Variable Name:
                </span>
                <Input
                  value={variablePrefix}
                  onChange={(e) => setVariablePrefix(e.target.value)}
                  placeholder="gradient"
                  className="h-8 w-36 font-mono text-xs"
                />
              </div>

              {/* CSS vs Tailwind Switcher */}
              <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setCodeTab("css")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    codeTab === "css"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  CSS (with Variables)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab("tailwind")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    codeTab === "tailwind"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Tailwind (with Variables)
                </button>
              </div>

              <CopyButton
                value={
                  codeTab === "css"
                    ? synthesized.cssCode
                    : synthesized.tailwindCode
                }
                label={codeTab === "css" ? "Copy CSS" : "Copy Tailwind"}
              />
            </div>
          </div>

          <ShikiCodeBox
            code={
              codeTab === "css"
                ? synthesized.cssCode
                : synthesized.tailwindCode
            }
            lang="css"
          />
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
