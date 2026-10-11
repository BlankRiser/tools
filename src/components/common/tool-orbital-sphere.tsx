import { type ToolItem, toolsList } from "#/data/tools-list";
import { cn } from "#/lib/utils";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { DevHavenLogo } from "./devhaven-logo";

interface OrbitRingConfig {
  id: string;
  radiusPct: number;
  svgRadius: number;
  durationSec: number;
  direction: "cw" | "ccw";
  tools: ToolItem[];
}

export function ToolOrbitalSphere({
  tools: providedTools,
  className,
}: {
  tools?: ToolItem[];
  className?: string;
}) {
  const tools = React.useMemo(
    () => providedTools ?? toolsList.filter((t) => !t.comingSoon),
    [providedTools],
  );

  const [hoveredTool, setHoveredTool] = React.useState<ToolItem | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  const rings = React.useMemo<OrbitRingConfig[]>(() => {
    const inner = tools.slice(0, 6);
    const middle = tools.slice(6, 14);
    const outer = tools.slice(14, 24);

    return [
      {
        id: "inner-orbit",
        radiusPct: 16.5,
        svgRadius: 76,
        durationSec: 36,
        direction: "cw",
        tools: inner,
      },
      {
        id: "middle-orbit",
        radiusPct: 29.5,
        svgRadius: 136,
        durationSec: 54,
        direction: "ccw",
        tools: middle,
      },
      {
        id: "outer-orbit",
        radiusPct: 42.5,
        svgRadius: 196,
        durationSec: 76,
        direction: "cw",
        tools: outer,
      },
    ];
  }, [tools]);

  const activePreviewTool = hoveredTool ?? tools[0];

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-115 flex-col items-center select-none",
        className,
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        setHoveredTool(null);
      }}
    >
      {/* Square Orbital Canvas */}
      <div className="relative aspect-square w-full">
        {/* Background Wireframe Sphere & Concentric SVG Tracks */}
        <svg
          viewBox="0 0 460 460"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="orbital-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
              <stop offset="55%" stopColor="var(--primary)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle Radial Core Glow */}
          <circle cx="230" cy="230" r="215" fill="url(#orbital-core-glow)" />

          {/* Spherical Astrolabe Meridian Ellipses */}
          <g
            stroke="currentColor"
            className="text-border/60 dark:text-border/80"
            fill="none"
            strokeWidth="1"
          >
            <ellipse
              cx="230"
              cy="230"
              rx="196"
              ry="68"
              strokeDasharray="3 5"
              transform="rotate(-28 230 230)"
            />
            <ellipse
              cx="230"
              cy="230"
              rx="196"
              ry="68"
              strokeDasharray="3 5"
              transform="rotate(28 230 230)"
            />
            <ellipse
              cx="230"
              cy="230"
              rx="136"
              ry="46"
              strokeDasharray="2 6"
              transform="rotate(62 230 230)"
            />
            {/* Axial Hairlines */}
            <line x1="230" y1="18" x2="230" y2="442" strokeDasharray="2 6" opacity="0.6" />
            <line x1="18" y1="230" x2="442" y2="230" strokeDasharray="2 6" opacity="0.6" />
          </g>

          {/* Outer Compass Bezel Degree Ticks */}
          <g stroke="currentColor" className="text-border">
            {Array.from({ length: 36 }).map((_, idx) => {
              const deg = idx * 10;
              const isMajor = deg % 30 === 0;
              const r1 = isMajor ? 212 : 215;
              const r2 = 220;
              const rad = (deg * Math.PI) / 180;
              const x1 = 230 + Math.cos(rad) * r1;
              const y1 = 230 + Math.sin(rad) * r1;
              const x2 = 230 + Math.cos(rad) * r2;
              const y2 = 230 + Math.sin(rad) * r2;
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeWidth={isMajor ? "1.25" : "0.75"}
                  opacity={isMajor ? "0.7" : "0.35"}
                />
              );
            })}
          </g>

          {/* Concentric Orbital Rings */}
          {rings.map((ring, idx) => (
            <circle
              key={ring.id}
              cx="230"
              cy="230"
              r={ring.svgRadius}
              fill="none"
              stroke="currentColor"
              className={cn(
                idx === 1 ? "text-primary/30" : "text-border",
              )}
              strokeWidth={idx === 1 ? "1.25" : "1"}
              strokeDasharray={idx === 0 ? "none" : idx === 1 ? "5 5" : "2 4"}
            />
          ))}

          {/* Inner Core Halo */}
          <circle
            cx="230"
            cy="230"
            r="38"
            fill="none"
            stroke="currentColor"
            className="text-primary/35"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Central Sun: DevHaven Emblem */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex size-16 items-center justify-center rounded-full border border-primary/40 bg-card shadow-md ring-4 ring-primary/10">
            <DevHavenLogo className="size-8 text-primary" />
          </div>
        </div>

        {/* 3 Revolving Concentric Tool Rings */}
        {rings.map((ring) => {
          const ringAnimName =
            ring.direction === "cw" ? "devhaven-orbit-cw" : "devhaven-orbit-ccw";
          const counterAnimName =
            ring.direction === "cw" ? "devhaven-orbit-ccw" : "devhaven-orbit-cw";

          return (
            <div
              key={ring.id}
              className="pointer-events-none absolute inset-0"
              style={{
                animationName: ringAnimName,
                animationDuration: `${ring.durationSec}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationPlayState: isPaused ? "paused" : "running",
              }}
            >
              {ring.tools.map((tool, idx) => {
                const angleRad = (idx / ring.tools.length) * Math.PI * 2 - Math.PI / 2;
                const xPct = 50 + Math.cos(angleRad) * ring.radiusPct;
                const yPct = 50 + Math.sin(angleRad) * ring.radiusPct;
                const Icon = tool.icon;
                const isSelected = hoveredTool?.params.toolID === tool.params.toolID;

                return (
                  <div
                    key={tool.params.toolID}
                    className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                    }}
                  >
                    <Link
                      to={tool.to}
                      params={tool.params}
                      aria-label={tool.title}
                      onMouseEnter={() => setHoveredTool(tool)}
                      onFocus={() => {
                        setIsPaused(true);
                        setHoveredTool(tool);
                      }}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border bg-card text-foreground shadow-xs transition-transform duration-150 outline-none sm:size-10",
                        isSelected
                          ? "z-30 scale-125 border-primary bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "border-border/90 hover:scale-115 hover:border-primary/60 hover:text-primary",
                      )}
                      style={{
                        animationName: counterAnimName,
                        animationDuration: `${ring.durationSec}s`,
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                        animationPlayState: isPaused ? "paused" : "running",
                      }}
                    >
                      <Icon className="size-4 sm:size-4.5" weight="duotone" />
                    </Link>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Interactive Orbital Readout Bar below the Sphere */}
      {activePreviewTool && (
        <Link
          to={activePreviewTool.to}
          params={activePreviewTool.params}
          className="group mt-2 flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/90 px-3.5 py-2.5 text-left shadow-2xs backdrop-blur-xs transition-colors hover:border-primary/50"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <activePreviewTool.icon className="size-4" weight="duotone" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">
                  {activePreviewTool.title}
                </p>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                {hoveredTool
                  ? activePreviewTool.description
                  : "Hover or click any orbiting node to launch tool"}
              </p>
            </div>
          </div>
          <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </Link>
      )}
    </div>
  );
}
