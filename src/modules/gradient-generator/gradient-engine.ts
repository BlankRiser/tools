import {
  COLOR_FORMAT_DEFINITIONS,
  parseAnyColorInput,
  rgbaToHex,
  type ColorFormatId,
  type RgbaColor,
} from "../color-converter/color-engine";

export type GradientBaseType = "linear" | "radial" | "conic" | "mesh";

export type GradientInterpolationSpace =
  | "default"
  | "in oklch"
  | "in oklab"
  | "in srgb"
  | "in hsl"
  | "in oklch longer hue";

export type GradientCategoryId =
  | "grainy-folds"
  | "soft"
  | "hard"
  | "vintage"
  | "spun"
  | "ribbon"
  | "blobs"
  | "mixing"
  | "halftone"
  | "contours"
  | "mask"
  | "blurry"
  | "fractal-glass"
  | "fractal-noise"
  | "groovy"
  | "liquid"
  | "grain"
  | "woven"
  | "ocean"
  | "aurora"
  | "hologram"
  | "cyber-grid"
  | "chrome"
  | "sacred-geo"
  | "watercolor";

export type GradientAnimationType =
  | "flow-pan"
  | "lava-morph"
  | "hue-cycle"
  | "spin-vortex"
  | "pulse-breathe"
  | "shimmer-sweep";

export type GradientAnimationEasing =
  | "ease-in-out"
  | "linear"
  | "ease"
  | "cubic-bezier(0.4, 0, 0.2, 1)"
  | "cubic-bezier(0.68, -0.55, 0.27, 1.55)"
  | "steps(12, end)";

export type GradientAnimationDirection =
  | "alternate"
  | "normal"
  | "reverse"
  | "alternate-reverse";

export interface GradientAnimationConfig {
  enabled: boolean;
  isPlaying: boolean;
  type: GradientAnimationType;
  /** Duration in seconds (1 - 30) */
  duration: number;
  easing: GradientAnimationEasing;
  direction: GradientAnimationDirection;
  /** Background overscan percentage (120 - 400) */
  bgScale: number;
  /** Motion amplitude / intensity (10 - 100) */
  intensity: number;
}

export const GRADIENT_ANIMATION_MODES: Array<{
  id: GradientAnimationType;
  label: string;
  badge: string;
  desc: string;
}> = [
  {
    id: "flow-pan",
    label: "Infinite Flow Pan",
    badge: "Position Sweep",
    desc: "Smoothly glides an oversized gradient canvas across X & Y axes",
  },
  {
    id: "lava-morph",
    label: "Organic Lava Morph",
    badge: "Multi-Axis Drift",
    desc: "Figure-8 multi-point drift paired with subtle chromatic morphing",
  },
  {
    id: "hue-cycle",
    label: "Spectrum Hue Shift",
    badge: "Color Cycle",
    desc: "Continuously rotates hues and saturation across the color wheel",
  },
  {
    id: "spin-vortex",
    label: "Orbital Spin & Vortex",
    badge: "360° Orbit",
    desc: "Orbits the gradient field in a seamless 360° circular vortex with zero clipping",
  },
  {
    id: "pulse-breathe",
    label: "Atmospheric Breathe",
    badge: "Aura Pulse",
    desc: "Gently expands focal scale, luminance, and bloom like a living aura",
  },
  {
    id: "shimmer-sweep",
    label: "Specular Shimmer",
    badge: "Light Sheen",
    desc: "Sweeps a diagonal prismatic light wave across the gradient surface",
  },
];

export interface GradientStop {
  id: string;
  color: RgbaColor;
  /** 0 - 100 (%) along the gradient axis */
  position: number;
  /** 0 - 100 (%) X coordinate for mesh / blob / multi-point visualization */
  x: number;
  /** 0 - 100 (%) Y coordinate for mesh / blob / multi-point visualization */
  y: number;
}

export interface GradientConfig {
  baseType: GradientBaseType;
  category: GradientCategoryId;
  angle: number;
  centerX: number;
  centerY: number;
  stops: GradientStop[];
  /** 0 - 100 intensity of the texture / effect overlay */
  effectIntensity: number;
  /** 10 - 100 scale / frequency of pattern, flutes, halftone, contours, or blobs */
  effectScale: number;
  /** Color space interpolation modifier */
  interpolation: GradientInterpolationSpace;
  /** Dark base background color for mesh / blobs / masks */
  backdropColor: string;
}

export interface GradientPreset {
  id: string;
  name: string;
  subtitle: string;
  category: GradientCategoryId;
  config: GradientConfig;
}

export interface GradientCategoryMeta {
  id: GradientCategoryId;
  label: string;
  shortDesc: string;
  badge: string;
}

export const GRADIENT_CATEGORIES: GradientCategoryMeta[] = [
  {
    id: "grainy-folds",
    label: "Risograph Orbs & Noir Folds",
    shortDesc: "Emerald-rimmed cobalt poster orbs & monochrome 35mm silver-halide silk drapery folds",
    badge: "Studio Grain",
  },
  {
    id: "soft",
    label: "Soft Gradients",
    shortDesc: "Silky atmospheric transitions with gentle perceptual stops",
    badge: "Smooth",
  },
  {
    id: "hard",
    label: "Hard Gradients",
    shortDesc: "Crisp stepped color bands with zero-feathering boundaries",
    badge: "Stepped",
  },
  {
    id: "vintage",
    label: "Vintage Gradients",
    shortDesc: "Analog sun-faded palettes with warm Kodak & 70s film tone curves",
    badge: "Retro",
  },
  {
    id: "spun",
    label: "Spun / Spanked Disc",
    shortDesc: "High-sheen conic brushed metal & radial specular bursts",
    badge: "Conic",
  },
  {
    id: "ribbon",
    label: "Abstract Ribbons",
    shortDesc: "Multi-layered sweeping silk ribbons & translucent light folds",
    badge: "Layered",
  },
  {
    id: "blobs",
    label: "Blurred Blobs",
    shortDesc: "Organic floating color orbs with deep Gaussian diffusion",
    badge: "Mesh Orbs",
  },
  {
    id: "mixing",
    label: "Mixing Colors",
    shortDesc: "Perceptual OKLCH & multi-axis chromatic blending without muddy midtones",
    badge: "OKLCH Mix",
  },
  {
    id: "halftone",
    label: "Noise Halftone",
    shortDesc: "Risograph & screenprint dot-matrix halftone pattern overlays",
    badge: "Dot Matrix",
  },
  {
    id: "contours",
    label: "Contours",
    shortDesc: "Topographic elevation rings & bathymetric isobar line interference",
    badge: "Topographic",
  },
  {
    id: "mask",
    label: "Mask Gradients",
    shortDesc: "Geometric louver blinds, lattice cutouts, and radial spotlight masks",
    badge: "CSS Mask",
  },
  {
    id: "blurry",
    label: "Blurry Textures",
    shortDesc: "Dreamy bokeh haze and frosted atmospheric color clouds",
    badge: "Diffused",
  },
  {
    id: "fractal-glass",
    label: "Fractal Glass",
    shortDesc: "Fluted architectural reed glass with chromatic refraction ridges",
    badge: "Fluted",
  },
  {
    id: "fractal-noise",
    label: "Fractal Noise",
    shortDesc: "Procedural Perlin/Simplex SVG feTurbulence atmospheric fields",
    badge: "Turbulence",
  },
  {
    id: "groovy",
    label: "Groovy",
    shortDesc: "Psychedelic 70s wave interference & hypnotic multi-ring warps",
    badge: "Psychedelic",
  },
  {
    id: "liquid",
    label: "Liquid",
    shortDesc: "Fluid marble swirls and warped dichromatic liquid metal",
    badge: "Fluid",
  },
  {
    id: "grain",
    label: "Gradient with Grains",
    shortDesc: "Tactile 35mm analog film grain and fine risograph noise stipple",
    badge: "Film Grain",
  },
  {
    id: "woven",
    label: "Cloth Woven Pattern",
    shortDesc: "Interlaced warp-and-weft silk, jacquard, and carbon twill textures",
    badge: "Textile",
  },
  {
    id: "ocean",
    label: "Ocean Texture",
    shortDesc: "Subsurface water caustics, abyssal swells, and sunlit ripples",
    badge: "Caustics",
  },
  {
    id: "aurora",
    label: "Aurora Borealis",
    shortDesc: "Sweeping polar light curtains with vertical magnetic luminescence",
    badge: "Northern Lights",
  },
  {
    id: "hologram",
    label: "Iridescent Hologram",
    shortDesc: "Prismatic rainbow foil dispersion and pearlescent dichroic sheen",
    badge: "Prismatic",
  },
  {
    id: "cyber-grid",
    label: "Neon Synth Grid",
    shortDesc: "Retrowave laser horizon grids and phosphor CRT scanline glow",
    badge: "Synthwave",
  },
  {
    id: "chrome",
    label: "Liquid Chrome",
    shortDesc: "High-contrast specular metallic reflections and anodized titanium",
    badge: "Metallic",
  },
  {
    id: "sacred-geo",
    label: "Sacred Geometry",
    shortDesc: "Architectural isometric lattices, honeycomb matrices, and mandalas",
    badge: "Isometric",
  },
  {
    id: "watercolor",
    label: "Watercolor & Paper",
    shortDesc: "Soft pigment bleed pooled across tactile cold-press cotton paper",
    badge: "Pigment Wash",
  },
];

// ============================================================================
// Helper to build stops concisely from hex strings
// ============================================================================

const BLOB_COORDS: Array<[number, number]> = [
  [18, 22],
  [82, 24],
  [50, 52],
  [22, 80],
  [78, 78],
  [50, 18],
];

function makeStops(
  hexes: string[],
  customCoords?: Array<[number, number]>,
): GradientStop[] {
  const count = hexes.length;
  return hexes.map((hex, i) => {
    const rgba = parseAnyColorInput(hex)?.rgba ?? { r: 99, g: 102, b: 241, a: 1 };
    const position = count === 1 ? 50 : Math.round((i / (count - 1)) * 100);
    const [x, y] =
      customCoords?.[i] ?? BLOB_COORDS[i % BLOB_COORDS.length];
    return {
      id: `stop-${i + 1}`,
      color: rgba,
      position,
      x,
      y,
    };
  });
}

function makePreset(
  id: string,
  category: GradientCategoryId,
  name: string,
  subtitle: string,
  hexes: string[],
  overrides: Partial<GradientConfig> & {
    coords?: Array<[number, number]>;
  } = {},
): GradientPreset {
  return {
    id,
    name,
    subtitle,
    category,
    config: {
      baseType: overrides.baseType ?? "linear",
      category,
      angle: overrides.angle ?? 135,
      centerX: overrides.centerX ?? 50,
      centerY: overrides.centerY ?? 50,
      stops: makeStops(hexes, overrides.coords),
      effectIntensity: overrides.effectIntensity ?? 65,
      effectScale: overrides.effectScale ?? 50,
      interpolation: overrides.interpolation ?? "in oklch",
      backdropColor: overrides.backdropColor ?? "#090b10",
    },
  };
}

// ============================================================================
// 125 Handcrafted Eye-Pleasing Presets (5 per Category across 25 Categories)
// ============================================================================

export const GRADIENT_PRESETS: GradientPreset[] = [
  // 0. RISOGRAPH ORBS & NOIR FOLDS (5 — Direct from Reference Screenshots)
  makePreset(
    "risograph-cobalt-emerald-orbs",
    "grainy-folds",
    "Cobalt & Emerald Risograph Orbs",
    "Emerald-rimmed cobalt sphere, ultramarine wash, and mint-aqua orbs on warm cream paper",
    ["#0057D9", "#059E75", "#2648C4", "#005A8D", "#36D3B4", "#2B4BC8"],
    {
      baseType: "mesh",
      backdropColor: "#EFE3D6",
      effectIntensity: 82,
      effectScale: 52,
      coords: [
        [22, 21],
        [23, 22],
        [54, 39],
        [72, 50],
        [73, 84],
        [44, 98],
      ],
    },
  ),
  makePreset(
    "noir-silver-halide-shafts",
    "grainy-folds",
    "Noir Silver-Halide Light Shafts",
    "Matte charcoal shadows and diagonal silver-white light beams with dense 35mm darkroom grain",
    ["#141414", "#1E1E1E", "#D9D9D9", "#282828", "#E6E6E6", "#545454"],
    {
      baseType: "linear",
      angle: 62,
      centerX: 46,
      centerY: 18,
      backdropColor: "#141414",
      effectIntensity: 88,
      effectScale: 42,
      interpolation: "in srgb",
    },
  ),
  makePreset(
    "noir-pinched-pewter-drapery",
    "grainy-folds",
    "Pinched Pewter Silk Drapery",
    "Radiating monochrome satin folds pinched at the upper-right with heavy silver stipple grain",
    ["#2B2B2B", "#E2E2E2", "#1A1A1A", "#D4D4D4", "#202020", "#EBEBEB", "#181818"],
    {
      baseType: "conic",
      angle: 232,
      centerX: 96,
      centerY: 22,
      backdropColor: "#181818",
      effectIntensity: 86,
      effectScale: 45,
      interpolation: "in srgb",
    },
  ),
  makePreset(
    "risograph-cerulean-cream-poster",
    "grainy-folds",
    "Swiss Gallery Risograph Poster",
    "Diffused cerulean, jade green, and warm alabaster orbs with tactile print grain",
    ["#0062E6", "#10B981", "#1D4ED8", "#0D9488", "#5EEAD4", "#3B82F6"],
    {
      baseType: "mesh",
      backdropColor: "#F5EBE0",
      effectIntensity: 78,
      effectScale: 56,
      coords: [
        [20, 24],
        [22, 25],
        [60, 44],
        [75, 52],
        [70, 82],
        [38, 95],
      ],
    },
  ),
  makePreset(
    "noir-graphite-velvet-crease",
    "grainy-folds",
    "Graphite Velvet Curtain Crease",
    "Sculptural darkroom platinum and obsidian folds with coarse ISO 3200 grain",
    ["#121316", "#CFD4DC", "#1E2026", "#E5E7EB", "#262930", "#9CA3AF"],
    {
      baseType: "conic",
      angle: 215,
      centerX: 92,
      centerY: 28,
      backdropColor: "#121316",
      effectIntensity: 84,
      effectScale: 44,
      interpolation: "in srgb",
    },
  ),

  // 1. SOFT GRADIENTS (5)
  makePreset(
    "soft-silk-peach",
    "soft",
    "Silk Peach & Mist",
    "Warm apricot melting into pastel lavender and porcelain blue",
    ["#FFDDD2", "#F3C4FB", "#CDB4DB", "#BDE0FE"],
    { angle: 135, effectIntensity: 30 },
  ),
  makePreset(
    "soft-nordic-dawn",
    "soft",
    "Nordic Glacier Dawn",
    "Serene arctic sky transitioning from pale rose to fjord mist",
    ["#FDE2E4", "#E2ECE9", "#BEE1E6", "#A9DEF9"],
    { angle: 120, effectIntensity: 25 },
  ),
  makePreset(
    "soft-matcha-cream",
    "soft",
    "Matcha Oat Latte",
    "Earthy ceremonial green softened with warm vanilla cream",
    ["#CCD5AE", "#E9EDC9", "#FEFAE0", "#FAEDCD"],
    { angle: 145, effectIntensity: 25 },
  ),
  makePreset(
    "soft-twilight-velvet",
    "soft",
    "Twilight Velvet",
    "Deep dusk indigo easing into dusty mauve and coral blush",
    ["#1D1E4E", "#4A3F78", "#9A6D9A", "#F2A6A6"],
    { angle: 160, effectIntensity: 35 },
  ),
  makePreset(
    "soft-rosewater-opal",
    "soft",
    "Rosewater Opal",
    "Iridescent pearl pink and soft aquamarine whisper",
    ["#FFD6E0", "#FFEF9F", "#C1FBA4", "#7BF1A8"],
    { baseType: "radial", centerX: 30, centerY: 30, effectIntensity: 30 },
  ),

  // 2. HARD GRADIENTS (5)
  makePreset(
    "hard-bauhaus-step",
    "hard",
    "Bauhaus Stepped Primary",
    "Crisp architectural color blocks with zero feathering",
    ["#1D3557", "#457B9D", "#A8DADC", "#F1FAEE", "#E63946"],
    { angle: 135, effectIntensity: 80 },
  ),
  makePreset(
    "hard-retro-sun-bands",
    "hard",
    "70s Sunset Horizon Bands",
    "Iconic cassette-tape stepped sunset stripes",
    ["#2B0938", "#6A040F", "#D00000", "#F48C06", "#FFBA08"],
    { angle: 180, effectIntensity: 85 },
  ),
  makePreset(
    "hard-miami-vice",
    "hard",
    "Miami Neon Cut",
    "Razor-sharp electric cyan, magenta, and deep midnight bands",
    ["#0B0928", "#7209B7", "#F72585", "#4CC9F0", "#80FFDB"],
    { angle: 115, effectIntensity: 80 },
  ),
  makePreset(
    "hard-forest-terraces",
    "hard",
    "Emerald Rice Terraces",
    "Stepped botanical greens from deep pine to sunlit lime",
    ["#081C15", "#1B4332", "#2D6A4F", "#52B788", "#95D5B2"],
    { angle: 150, effectIntensity: 80 },
  ),
  makePreset(
    "hard-radial-bullseye",
    "hard",
    "Chromatic Target Rings",
    "Concentric hard-edge radial rings with high contrast",
    ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"],
    { baseType: "radial", centerX: 50, centerY: 50, effectIntensity: 85 },
  ),

  // 3. VINTAGE GRADIENTS (5)
  makePreset(
    "vintage-polaroid-77",
    "vintage",
    "1977 Polaroid Sunfade",
    "Sun-bleached amber, dusty teal, and warm analog vignette",
    ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
    { angle: 140, effectIntensity: 70 },
  ),
  makePreset(
    "vintage-kodak-portra",
    "vintage",
    "Kodak Portra 400",
    "Golden-hour skin tones and warm sepia shadow roll-off",
    ["#3D2622", "#8C4A32", "#D98A56", "#F2C695", "#F7E5C8"],
    { angle: 125, effectIntensity: 65 },
  ),
  makePreset(
    "vintage-vinyl-sleeve",
    "vintage",
    "Jazz Vinyl Sleeve",
    "Smoky Blue Note indigo paired with aged parchment gold",
    ["#141B29", "#2C4969", "#69879B", "#D9B26F", "#EBD8B2"],
    { angle: 155, effectIntensity: 75 },
  ),
  makePreset(
    "vintage-botanical-press",
    "vintage",
    "Victorian Herbarium",
    "Pressed olive leaf, faded burgundy, and antique linen",
    ["#3B2F2F", "#6B444B", "#8F7A54", "#C4B793", "#EAE0C8"],
    { angle: 130, effectIntensity: 65 },
  ),
  makePreset(
    "vintage-grand-hotel",
    "vintage",
    "Grand Budapest Lobby",
    "Nostalgic dusty rose, mauve plum, and warm lobby brass",
    ["#4A1C40", "#82365C", "#C96A7B", "#F2A699", "#F7D6BF"],
    { angle: 145, effectIntensity: 60 },
  ),

  // 4. SPUN / SPANKED CONIC GRADIENTS (5)
  makePreset(
    "spun-titanium-disc",
    "spun",
    "Spun Titanium Disc",
    "Machined brushed metallic reflections around a central axis",
    ["#1E2229", "#9BA3B0", "#2A303C", "#E2E8F0", "#1E2229"],
    { baseType: "conic", angle: 45, centerX: 50, centerY: 50, effectIntensity: 75 },
  ),
  makePreset(
    "spun-cd-rom-sheen",
    "spun",
    "Iridescent Optical Disc",
    "Prismatic rainbow diffraction spun across a dark polycarbonate surface",
    ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#06B6D4", "#6366F1"],
    { baseType: "conic", angle: 0, centerX: 50, centerY: 50, effectIntensity: 80 },
  ),
  makePreset(
    "spun-anodized-gold",
    "spun",
    "Anodized Champagne Dial",
    "Luxury watch-dial sunburst with warm gold specular lobes",
    ["#45280C", "#D4AF37", "#FFF3C4", "#8A5A19", "#F5D061", "#45280C"],
    { baseType: "conic", angle: 90, centerX: 50, centerY: 50, effectIntensity: 70 },
  ),
  makePreset(
    "spun-cyber-radar",
    "spun",
    "Chromatic Radar Sweep",
    "Neon emerald and electric violet rotational energy beam",
    ["#050816", "#10B981", "#38BDF8", "#8B5CF6", "#050816"],
    { baseType: "conic", angle: 210, centerX: 50, centerY: 50, effectIntensity: 85 },
  ),
  makePreset(
    "spun-copper-vortex",
    "spun",
    "Spun Rose Copper",
    "Warm rose-gold and obsidian specular conic reflection",
    ["#2B1216", "#B85D57", "#FFD1C9", "#6E2B2A", "#E88D84", "#2B1216"],
    { baseType: "conic", angle: 135, centerX: 50, centerY: 50, effectIntensity: 75 },
  ),

  // 5. ABSTRACT RIBBON GRADIENTS (5)
  makePreset(
    "ribbon-silk-aurora",
    "ribbon",
    "Silk Aurora Ribbon",
    "Flowing translucent light ribbons folding across deep space",
    ["#0F172A", "#3B82F6", "#A855F7", "#EC4899", "#F97316"],
    { angle: 125, effectIntensity: 80, effectScale: 55 },
  ),
  makePreset(
    "ribbon-velvet-crimson",
    "ribbon",
    "Velvet Crimson Fold",
    "Sculptural ruby and magenta satin folds with bright rim lighting",
    ["#1A0510", "#7F1D1D", "#E11D48", "#FB7185", "#FDE047"],
    { angle: 140, effectIntensity: 85, effectScale: 60 },
  ),
  makePreset(
    "ribbon-fiber-optic",
    "ribbon",
    "Fiber Optic Streamline",
    "Sweeping cyan, cobalt, and mint light bands in motion",
    ["#040D1A", "#0284C7", "#06B6D4", "#10B981", "#A7F3D0"],
    { angle: 110, effectIntensity: 75, effectScale: 50 },
  ),
  makePreset(
    "ribbon-holographic-mobius",
    "ribbon",
    "Holographic Möbius",
    "Iridescent pastel ribbons twisting through lavender and aqua",
    ["#312E81", "#818CF8", "#F472B6", "#FBBF24", "#34D399"],
    { angle: 150, effectIntensity: 80, effectScale: 65 },
  ),
  makePreset(
    "ribbon-solar-wind",
    "ribbon",
    "Solar Wind Arcs",
    "Luminous gold, tangerine, and violet plasma ribbons",
    ["#180A29", "#6D28D9", "#DB2777", "#F97316", "#FACC15"],
    { angle: 135, effectIntensity: 85, effectScale: 55 },
  ),

  // 6. BLURRED BLOBS (5)
  makePreset(
    "blobs-bioluminescent",
    "blobs",
    "Bioluminescent Jellyfish",
    "Glowing cyan, electric indigo, and magenta orbs in deep water",
    ["#06B6D4", "#6366F1", "#D946EF", "#3B82F6", "#10B981"],
    { baseType: "mesh", backdropColor: "#060818", effectIntensity: 85, effectScale: 65 },
  ),
  makePreset(
    "blobs-lava-magma",
    "blobs",
    "Lava Lamp Magma Orbs",
    "Warm floating molten coral, amber, and plum blobs",
    ["#FF4D6D", "#FF8FA3", "#FF9E00", "#7209B7", "#F72585"],
    { baseType: "mesh", backdropColor: "#14051A", effectIntensity: 80, effectScale: 60 },
  ),
  makePreset(
    "blobs-pastel-clouds",
    "blobs",
    "Cotton Candy Orbs",
    "Soft floating pastel spheres of peach, sky, and lilac",
    ["#FFAFCC", "#BDE0FE", "#CDB4DB", "#FFC8DD", "#A2D2FF"],
    { baseType: "mesh", backdropColor: "#F8F7FF", effectIntensity: 75, effectScale: 70 },
  ),
  makePreset(
    "blobs-northern-lights",
    "blobs",
    "Aurora Borealis Blobs",
    "Sub-arctic emerald, teal, and violet atmospheric pockets",
    ["#10B981", "#06B6D4", "#8B5CF6", "#34D399", "#3B82F6"],
    { baseType: "mesh", backdropColor: "#041014", effectIntensity: 85, effectScale: 65 },
  ),
  makePreset(
    "blobs-citrus-nectar",
    "blobs",
    "Mango & Blood Orange",
    "Vibrant tropical fruit orbs diffusing in warm light",
    ["#FB5607", "#FFBE0B", "#FF006E", "#8338EC", "#FF9F1C"],
    { baseType: "mesh", backdropColor: "#1B0B14", effectIntensity: 80, effectScale: 60 },
  ),

  // 7. MIXING COLORS (5)
  makePreset(
    "mixing-oklch-hyper",
    "mixing",
    "Hyper-Chroma OKLCH Fusion",
    "Perceptually uniform color mixing with zero gray dead-zones",
    ["#4F46E5", "#EC4899", "#F59E0B", "#10B981"],
    { angle: 135, interpolation: "in oklch", effectIntensity: 75 },
  ),
  makePreset(
    "mixing-oil-slick",
    "mixing",
    "Iridescent Oil Slick",
    "Multi-angle screen-blended cyan, violet, gold, and rose",
    ["#0EA5E9", "#8B5CF6", "#EC4899", "#EAB308", "#14B8A6"],
    { angle: 120, interpolation: "in oklch", effectIntensity: 85 },
  ),
  makePreset(
    "mixing-longer-hue",
    "mixing",
    "Prismatic Longer-Hue Spectrum",
    "Full 360° chromatic traversal using OKLCH longer-hue interpolation",
    ["#EF4444", "#8B5CF6", "#06B6D4"],
    { angle: 135, interpolation: "in oklch longer hue", effectIntensity: 80 },
  ),
  makePreset(
    "mixing-thermal-ir",
    "mixing",
    "Thermal Infrared Camera",
    "Scientific FLIR heat-map palette from cobalt to white-hot gold",
    ["#0F0C29", "#4C1D95", "#BE185D", "#F97316", "#FEF08A"],
    { angle: 150, interpolation: "in oklch", effectIntensity: 75 },
  ),
  makePreset(
    "mixing-opalescent-pearl",
    "mixing",
    "Opalescent Mother of Pearl",
    "Delicate nacreous color shifts across mint, blush, and periwinkle",
    ["#E0E7FF", "#FCE7F3", "#FEF3C7", "#D1FAE5", "#E0F2FE"],
    { angle: 130, interpolation: "in oklch", effectIntensity: 70 },
  ),

  // 8. NOISE HALFTONE (5)
  makePreset(
    "halftone-risograph-coral",
    "halftone",
    "Risograph Coral & Indigo",
    "Classic screenprinted halftone dot matrix over warm coral",
    ["#1E1B4B", "#4338CA", "#E11D48", "#FB7185", "#FDE047"],
    { angle: 135, effectIntensity: 75, effectScale: 40 },
  ),
  makePreset(
    "halftone-pop-art-cyan",
    "halftone",
    "Pop-Art CMYK Screen",
    "Comic-book Ben-Day halftone dots over electric cyan and magenta",
    ["#06B6D4", "#3B82F6", "#EC4899", "#FACC15"],
    { angle: 120, effectIntensity: 80, effectScale: 45 },
  ),
  makePreset(
    "halftone-acid-lime",
    "halftone",
    "Acid Club Poster",
    "High-contrast rave flyer halftone over electric lime and obsidian",
    ["#090D16", "#065F46", "#10B981", "#A3E635", "#ECFCCB"],
    { angle: 145, effectIntensity: 80, effectScale: 38 },
  ),
  makePreset(
    "halftone-cyber-matrix",
    "halftone",
    "Cyberpunk LED Matrix",
    "Micro-dot halftone array glowing with neon violet and cyan",
    ["#090514", "#4C1D95", "#9333EA", "#EC4899", "#22D3EE"],
    { angle: 160, effectIntensity: 75, effectScale: 35 },
  ),
  makePreset(
    "halftone-newsprint-duotone",
    "halftone",
    "Editorial Duotone Press",
    "Warm terracotta and charcoal lithographic dot screen",
    ["#1C1917", "#57534E", "#EA580C", "#FDBA74", "#FEF3C7"],
    { angle: 130, effectIntensity: 70, effectScale: 42 },
  ),

  // 9. CONTOURS (5)
  makePreset(
    "contours-alpine-elevation",
    "contours",
    "Alpine Topographic Ridge",
    "Elevation contour rings carved across emerald and glacier peaks",
    ["#064E3B", "#059669", "#34D399", "#A7F3D0", "#F0FDF4"],
    { angle: 135, effectIntensity: 75, effectScale: 50 },
  ),
  makePreset(
    "contours-bathymetric-abyss",
    "contours",
    "Bathymetric Ocean Trench",
    "Nautical depth contours descending into midnight sapphire",
    ["#020617", "#1E3A8A", "#0284C7", "#38BDF8", "#BAE6FD"],
    { angle: 150, effectIntensity: 80, effectScale: 48 },
  ),
  makePreset(
    "contours-mars-canyon",
    "contours",
    "Valles Marineris Topo",
    "Martian red-rock canyon elevation lines and rust sandstone",
    ["#2A0800", "#7C2D12", "#C2410C", "#FB923C", "#FED7AA"],
    { angle: 125, effectIntensity: 75, effectScale: 55 },
  ),
  makePreset(
    "contours-obsidian-gold",
    "contours",
    "Obsidian & Gold Isobars",
    "Luxury metallic contour lines over dark volcanic slate",
    ["#09090B", "#27272A", "#854D0E", "#EAB308", "#FEF08A"],
    { angle: 140, effectIntensity: 80, effectScale: 45 },
  ),
  makePreset(
    "contours-amethyst-geode",
    "contours",
    "Amethyst Agate Bands",
    "Crystalline mineral ring contours in royal purple and rose",
    ["#1E1B4B", "#581C87", "#9333EA", "#E879F9", "#FAE8FF"],
    { angle: 130, effectIntensity: 75, effectScale: 52 },
  ),

  // 10. MASK GRADIENTS (5)
  makePreset(
    "mask-venetian-louvers",
    "mask",
    "Venetian Louver Blinds",
    "Architectural slatted shadow mask revealing a luminous gradient",
    ["#4F46E5", "#9333EA", "#EC4899", "#F97316"],
    { angle: 135, backdropColor: "#090B10", effectIntensity: 80, effectScale: 45 },
  ),
  makePreset(
    "mask-radial-spotlight",
    "mask",
    "Stage Vignette Spotlight",
    "Dramatic radial aperture mask fading into deep obsidian",
    ["#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899"],
    { baseType: "radial", backdropColor: "#05070B", effectIntensity: 85, effectScale: 60 },
  ),
  makePreset(
    "mask-diamond-lattice",
    "mask",
    "Diamond Lattice Cutout",
    "Geometric cross-masked grid over a vibrant sunset spectrum",
    ["#F43F5E", "#FB923C", "#FACC15", "#2DD4BF"],
    { angle: 120, backdropColor: "#0F1117", effectIntensity: 75, effectScale: 40 },
  ),
  makePreset(
    "mask-concentric-ripples",
    "mask",
    "Concentric Sonic Mask",
    "Expanding acoustic ring mask over electric emerald and cyan",
    ["#10B981", "#06B6D4", "#6366F1", "#A855F7"],
    { baseType: "radial", backdropColor: "#060911", effectIntensity: 80, effectScale: 50 },
  ),
  makePreset(
    "mask-diagonal-dissolve",
    "mask",
    "Diagonal Shimmer Louvers",
    "Angled kinetic louver mask with warm gold and crimson glow",
    ["#7C2D12", "#DC2626", "#F59E0B", "#FEF08A"],
    { angle: 145, backdropColor: "#0C0A09", effectIntensity: 75, effectScale: 50 },
  ),

  // 11. BLURRY TEXTURES (5)
  makePreset(
    "blurry-arctic-frost",
    "blurry",
    "Frosted Arctic Diffusion",
    "Sub-zero glacial blue and soft violet behind diffused matte glass",
    ["#38BDF8", "#818CF8", "#C084FC", "#F472B6"],
    { baseType: "mesh", backdropColor: "#0B1120", effectIntensity: 80, effectScale: 70 },
  ),
  makePreset(
    "blurry-bokeh-nightlight",
    "blurry",
    "Tokyo Rain Bokeh",
    "Out-of-focus neon streetlamps glowing through rain-streaked glass",
    ["#F43F5E", "#F59E0B", "#06B6D4", "#8B5CF6", "#10B981"],
    { baseType: "mesh", backdropColor: "#090A10", effectIntensity: 85, effectScale: 75 },
  ),
  makePreset(
    "blurry-vaporwave-haze",
    "blurry",
    "Vaporwave Dream Haze",
    "Ultra-softmagenta, turquoise, and lavender cloud diffusion",
    ["#FF6B9D", "#C44569", "#786FA6", "#63CDDA", "#CF6A87"],
    { baseType: "mesh", backdropColor: "#191326", effectIntensity: 80, effectScale: 65 },
  ),
  makePreset(
    "blurry-smoked-quartz",
    "blurry",
    "Smoked Amber Quartz",
    "Warm diffused honey, bronze, and espresso atmospheric mist",
    ["#451A03", "#92400E", "#D97706", "#FBBF24", "#FEF3C7"],
    { baseType: "mesh", backdropColor: "#120B05", effectIntensity: 75, effectScale: 65 },
  ),
  makePreset(
    "blurry-orchid-cloud",
    "blurry",
    "Soft Focus Orchid",
    "ethereal botanical pink, sage, and cream diffused light",
    ["#FBCFE8", "#E9D5FF", "#BBF7D0", "#BAE6FD"],
    { baseType: "mesh", backdropColor: "#FAF5FF", effectIntensity: 75, effectScale: 70 },
  ),

  // 12. FRACTAL GLASS (5)
  makePreset(
    "glass-fluted-prism",
    "fractal-glass",
    "Fluted Architectural Glass",
    "Ribbed vertical glass columns refracting indigo, rose, and amber",
    ["#312E81", "#6366F1", "#EC4899", "#F97316", "#FACC15"],
    { angle: 135, effectIntensity: 80, effectScale: 45 },
  ),
  makePreset(
    "glass-cathedral-reeds",
    "fractal-glass",
    "Cathedral Reeded Prism",
    "Luminous stained-glass colors diffused through narrow glass reeds",
    ["#0F172A", "#0284C7", "#10B981", "#F59E0B", "#E11D48"],
    { angle: 120, effectIntensity: 85, effectScale: 38 },
  ),
  makePreset(
    "glass-cryo-ice",
    "fractal-glass",
    "Cryogenic Ribbed Ice",
    "Glacial cyan and sapphire refracting through vertical ice flutes",
    ["#082F49", "#0369A1", "#38BDF8", "#A5F3FC", "#ECFEFF"],
    { angle: 150, effectIntensity: 75, effectScale: 42 },
  ),
  makePreset(
    "glass-amber-decant",
    "fractal-glass",
    "Cut Crystal Whiskey Flute",
    "Warm bourbon gold and mahogany through faceted crystal ribs",
    ["#1C0D06", "#7C2D12", "#D97706", "#FBBF24", "#FEF9C3"],
    { angle: 135, effectIntensity: 80, effectScale: 48 },
  ),
  makePreset(
    "glass-fresnel-cyber",
    "fractal-glass",
    "Cybernetic Fresnel Lens",
    "Neon magenta and electric teal behind micro-ribbed optical glass",
    ["#090514", "#701A75", "#D946EF", "#06B6D4", "#67E8F9"],
    { angle: 115, effectIntensity: 85, effectScale: 35 },
  ),

  // 13. FRACTAL NOISE (5)
  makePreset(
    "fractal-cosmic-nebula",
    "fractal-noise",
    "Cosmic Nebula Turbulence",
    "Multi-octave Perlin fractal clouds over deep space violet and gold",
    ["#090518", "#3B0764", "#9333EA", "#EC4899", "#FBBF24"],
    { angle: 135, effectIntensity: 75, effectScale: 55 },
  ),
  makePreset(
    "fractal-malachite-vein",
    "fractal-noise",
    "Malachite Mineral Swirl",
    "Organic geological fractal noise across rich emerald and jade",
    ["#022C22", "#065F46", "#10B981", "#6EE7B7", "#D1FAE5"],
    { angle: 140, effectIntensity: 75, effectScale: 60 },
  ),
  makePreset(
    "fractal-solar-plasma",
    "fractal-noise",
    "Solar Convection Plasma",
    "Turbulent stellar surface granulation in crimson, orange, and gold",
    ["#450A0A", "#991B1B", "#EA580C", "#FACC15", "#FEF9C3"],
    { angle: 125, effectIntensity: 80, effectScale: 50 },
  ),
  makePreset(
    "fractal-storm-atmosphere",
    "fractal-noise",
    "Jovian Storm Bands",
    "Planetary atmospheric turbulence in slate, cobalt, and ivory",
    ["#0F172A", "#1E3A8A", "#3B82F6", "#93C5FD", "#F8FAFC"],
    { angle: 160, effectIntensity: 70, effectScale: 65 },
  ),
  makePreset(
    "fractal-aurora-mist",
    "fractal-noise",
    "Ionosphere Fractal Mist",
    "High-altitude fractal aurora clouds in teal and electric magenta",
    ["#0F172A", "#0D9488", "#2DD4BF", "#C084FC", "#F472B6"],
    { angle: 130, effectIntensity: 75, effectScale: 55 },
  ),

  // 14. GROOVY (5)
  makePreset(
    "groovy-woodstock-tangerine",
    "groovy",
    "Woodstock Acid Tangerine",
    "Psychedelic 1969 concentric wave interference in orange, magenta, and gold",
    ["#7C2D12", "#EA580C", "#FACC15", "#EC4899", "#8B5CF6"],
    { angle: 135, effectIntensity: 85, effectScale: 55 },
  ),
  makePreset(
    "groovy-disco-boogie",
    "groovy",
    "Disco Lava Boogie",
    "Hypnotic groovy dancefloor rings in electric purple, cyan, and hot pink",
    ["#2E1065", "#7E22CE", "#EC4899", "#06B6D4", "#FDE047"],
    { angle: 120, effectIntensity: 85, effectScale: 50 },
  ),
  makePreset(
    "groovy-kool-aid-swirl",
    "groovy",
    "Electric Lime & Cherry Groove",
    "Retro pop-wave psychedelic ripples with bold saturated hues",
    ["#881337", "#E11D48", "#FB923C", "#A3E635", "#2DD4BF"],
    { angle: 145, effectIntensity: 80, effectScale: 60 },
  ),
  makePreset(
    "groovy-flower-power",
    "groovy",
    "Sunshine Daydream",
    "Warm 70s flower-power waves in marigold, coral, and turquoise",
    ["#B45309", "#F59E0B", "#F43F5E", "#FB7185", "#14B8A6"],
    { angle: 130, effectIntensity: 80, effectScale: 52 },
  ),
  makePreset(
    "groovy-velvet-funk",
    "groovy",
    "Midnight Funkadelic",
    "Deep cosmic funk wave interference in indigo, plum, and neon mint",
    ["#090D16", "#312E81", "#701A75", "#DB2777", "#10B981"],
    { angle: 155, effectIntensity: 85, effectScale: 48 },
  ),

  // 15. LIQUID (5)
  makePreset(
    "liquid-mercury-chrome",
    "liquid",
    "Liquid Mercury Chrome",
    "Molten reflective silver, cobalt, and lavender fluid ripples",
    ["#0F172A", "#475569", "#E2E8F0", "#6366F1", "#EC4899"],
    { angle: 135, effectIntensity: 85, effectScale: 60 },
  ),
  makePreset(
    "liquid-dichroic-glass",
    "liquid",
    "Molten Dichroic Glass",
    "Warped fluid bands of cyan, magenta, and liquid gold",
    ["#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"],
    { angle: 125, effectIntensity: 85, effectScale: 55 },
  ),
  makePreset(
    "liquid-biomorphic-emerald",
    "liquid",
    "Biomorphic Jade Fluid",
    "Viscous swirling emerald, chartreuse, and deep abyssal teal",
    ["#022C22", "#0D9488", "#10B981", "#A3E635", "#FEF08A"],
    { angle: 140, effectIntensity: 80, effectScale: 58 },
  ),
  makePreset(
    "liquid-satin-berry",
    "liquid",
    "Satin Boysenberry Swirl",
    "Rich velvety berry cream and plum folded into liquid silk",
    ["#2E1065", "#701A75", "#BE185D", "#FB7185", "#FDE68A"],
    { angle: 150, effectIntensity: 80, effectScale: 62 },
  ),
  makePreset(
    "liquid-soap-film",
    "liquid",
    "Iridescent Soap Film",
    "Thin-film interference swirls in pastel aqua, pink, and lemon",
    ["#38BDF8", "#818CF8", "#F472B6", "#FACC15", "#4ADE80"],
    { angle: 115, effectIntensity: 85, effectScale: 52 },
  ),

  // 16. GRADIENT WITH GRAINS (5)
  makePreset(
    "grain-ilford-35mm",
    "grain",
    "35mm Analog Film Grain",
    "Cinematic sunset gradient textured with authentic fine silver halide grain",
    ["#1E1B4B", "#6D28D9", "#DB2777", "#EA580C", "#FACC15"],
    { angle: 135, effectIntensity: 70, effectScale: 55 },
  ),
  makePreset(
    "grain-sandstone-dune",
    "grain",
    "Sahara Sandstone Grain",
    "Tactile desert terracotta, ochre, and warm mineral speckle",
    ["#431407", "#9A3412", "#EA580C", "#FDBA74", "#FFEDD5"],
    { angle: 140, effectIntensity: 75, effectScale: 60 },
  ),
  makePreset(
    "grain-midnight-velvet",
    "grain",
    "Midnight Risograph Stipple",
    "Deep indigo, electric cobalt, and mint with tactile matte grain",
    ["#020617", "#1E3A8A", "#2563EB", "#06B6D4", "#6EE7B7"],
    { angle: 125, effectIntensity: 75, effectScale: 50 },
  ),
  makePreset(
    "grain-matcha-ceramic",
    "grain",
    "Artisan Matcha Stoneware",
    "Organic ceramic glaze gradient with fine stoneware speckle",
    ["#14532D", "#15803D", "#4ADE80", "#BBF7D0", "#FEF9C3"],
    { angle: 150, effectIntensity: 65, effectScale: 55 },
  ),
  makePreset(
    "grain-cinema-teal-orange",
    "grain",
    "Anamorphic Teal & Amber",
    "Blockbuster color grade finished with 16mm celluloid grain",
    ["#042F2E", "#0F766E", "#1E293B", "#C2410C", "#F59E0B"],
    { angle: 130, effectIntensity: 75, effectScale: 52 },
  ),

  // 17. CLOTH-LIKE WOVEN PATTERN (5)
  makePreset(
    "woven-silk-taffeta",
    "woven",
    "Shot-Silk Taffeta Weave",
    "Two-tone warp and weft threads shimmering between magenta and gold",
    ["#3B0764", "#9D174D", "#E11D48", "#F59E0B", "#FEF08A"],
    { angle: 135, effectIntensity: 75, effectScale: 45 },
  ),
  makePreset(
    "woven-royal-jacquard",
    "woven",
    "Royal Indigo Jacquard",
    "Fine interlaced textile threads in sapphire, periwinkle, and silver",
    ["#0F172A", "#1E3A8A", "#3B82F6", "#818CF8", "#E0E7FF"],
    { angle: 120, effectIntensity: 75, effectScale: 40 },
  ),
  makePreset(
    "woven-cashmere-herringbone",
    "woven",
    "Warm Cashmere Weave",
    "Softly interlaced camel, espresso, and ivory wool fibers",
    ["#291D12", "#5C4028", "#9C6F44", "#D4A373", "#FAEDCD"],
    { angle: 140, effectIntensity: 70, effectScale: 48 },
  ),
  makePreset(
    "woven-holographic-carbon",
    "woven",
    "Chromatic Carbon Twill",
    "High-tech woven carbon-fiber matrix with iridescent teal and violet sheen",
    ["#090D16", "#1E293B", "#0D9488", "#6366F1", "#EC4899"],
    { angle: 135, effectIntensity: 80, effectScale: 38 },
  ),
  makePreset(
    "woven-emerald-brocade",
    "woven",
    "Emerald & Gold Brocade",
    "Rich renaissance tapestry weave in forest green and burnished gold",
    ["#052E16", "#166534", "#15803D", "#CA8A04", "#FEF08A"],
    { angle: 150, effectIntensity: 75, effectScale: 42 },
  ),

  // 18. OCEAN-LIKE TEXTURE (5)
  makePreset(
    "ocean-maldives-caustics",
    "ocean",
    "Maldives Lagoon Caustics",
    "Sunlit shallow turquoise water with dancing seafloor light caustics",
    ["#083344", "#0891B2", "#06B6D4", "#22D3EE", "#A5F3FC"],
    { angle: 165, effectIntensity: 80, effectScale: 55 },
  ),
  makePreset(
    "ocean-mariana-biolum",
    "ocean",
    "Abyssal Bioluminescence",
    "Deep ocean trench indigo illuminated by glowing plankton swells",
    ["#020617", "#0F172A", "#1E3A8A", "#0284C7", "#38BDF8"],
    { angle: 180, effectIntensity: 85, effectScale: 50 },
  ),
  makePreset(
    "ocean-pacific-golden-swell",
    "ocean",
    "Pacific Sunset Swell",
    "Rippling ocean surface reflecting crimson, coral, and deep ultramarine",
    ["#0B132B", "#1C2541", "#3A506B", "#F43F5E", "#FBBF24"],
    { angle: 170, effectIntensity: 75, effectScale: 60 },
  ),
  makePreset(
    "ocean-coral-reef",
    "ocean",
    "Great Barrier Reef Shallows",
    "Tropical aquamarine, seafoamjade, and warm coral sand ripples",
    ["#064E3B", "#0D9488", "#2DD4BF", "#99F6E4", "#FDE68A"],
    { angle: 155, effectIntensity: 75, effectScale: 52 },
  ),
  makePreset(
    "ocean-arctic-glacial",
    "ocean",
    "Arctic Fjord Ripples",
    "Crisp icy blue-white surface waves over deep Nordic slate water",
    ["#090D16", "#1E293B", "#334155", "#38BDF8", "#E0F2FE"],
    { angle: 175, effectIntensity: 70, effectScale: 48 },
  ),

  // 19. AURORA BOREALIS (5)
  makePreset(
    "aurora-tromso-curtain",
    "aurora",
    "Tromsø Emerald Curtain",
    "Sweeping Arctic green and teal magnetic ribbons over midnight polar sky",
    ["#020617", "#064E3B", "#10B981", "#2DD4BF", "#A7F3D0"],
    { angle: 165, effectIntensity: 80, effectScale: 55, backdropColor: "#020617" },
  ),
  makePreset(
    "aurora-solar-storm-magenta",
    "aurora",
    "Solar Storm Corona",
    "Rare geomagnetic violet, crimson, and electric lime northern lights",
    ["#090418", "#4C1D95", "#DB2777", "#10B981", "#FDE047"],
    { angle: 150, effectIntensity: 85, effectScale: 60, backdropColor: "#090418" },
  ),
  makePreset(
    "aurora-icelandic-veil",
    "aurora",
    "Reykjavik Violet Veil",
    "Ethereal cyan and amethyst curtains shimmering across subzero twilight",
    ["#030712", "#1E1B4B", "#6366F1", "#06B6D4", "#67E8F9"],
    { angle: 170, effectIntensity: 75, effectScale: 50, backdropColor: "#030712" },
  ),
  makePreset(
    "aurora-subzero-cyan",
    "aurora",
    "Svalbard Ionosphere",
    "High-altitude bioluminescent aqua and charteuse polar light pillars",
    ["#041019", "#0F3F4C", "#0891B2", "#34D399", "#D9F99D"],
    { angle: 160, effectIntensity: 78, effectScale: 48, backdropColor: "#041019" },
  ),
  makePreset(
    "aurora-geomagnetic-gold",
    "aurora",
    "Yukon Gold & Jade",
    "Warm amber horizon meeting turquoise and emerald ionospheric bands",
    ["#080711", "#134E4A", "#14B8A6", "#F59E0B", "#FEF08A"],
    { angle: 145, effectIntensity: 75, effectScale: 52, backdropColor: "#080711" },
  ),

  // 20. IRIDESCENT HOLOGRAM (5)
  makePreset(
    "holo-cyber-foil",
    "hologram",
    "Cyber Foil Sticker",
    "Prismatic rainbow diffraction foil with high-gloss pearlescent sheen",
    ["#EC4899", "#8B5CF6", "#3B82F6", "#10B981", "#FDE047"],
    { angle: 125, effectIntensity: 80, effectScale: 55, interpolation: "in oklch longer hue" },
  ),
  makePreset(
    "holo-mother-of-pearl",
    "hologram",
    "Opaline Mother of Pearl",
    "Nacre shell iridescence shifting between blush pink, mint, and ice blue",
    ["#FDF2F8", "#FCE7F3", "#E0E7FF", "#CCFBF1", "#FEF9C3"],
    { angle: 135, effectIntensity: 70, effectScale: 45 },
  ),
  makePreset(
    "holo-dichroic-titanium",
    "hologram",
    "Dichroic Glass Prism",
    "Vacuum-coated optical glass reflecting cyan, magenta, and solar gold",
    ["#06B6D4", "#6366F1", "#D946EF", "#F43F5E", "#FBBF24"],
    { angle: 115, effectIntensity: 85, effectScale: 62 },
  ),
  makePreset(
    "holo-cd-rom-vapor",
    "hologram",
    "Y2K Optical Disc",
    "Polycarbonate CD-ROM rainbow reflection rings with metallic silver",
    ["#94A3B8", "#38BDF8", "#A855F7", "#EC4899", "#4ADE80", "#FACC15"],
    { baseType: "conic", angle: 40, effectIntensity: 78, effectScale: 50 },
  ),
  makePreset(
    "holo-mythic-card",
    "hologram",
    "Mythic Edition Foil",
    "Collector trading card holographic diagonal laser sheen",
    ["#1E1B4B", "#7C3AED", "#EC4899", "#22D3EE", "#FDE047"],
    { angle: 140, effectIntensity: 82, effectScale: 58 },
  ),

  // 21. NEON SYNTH GRID (5)
  makePreset(
    "cyber-outrun-1984",
    "cyber-grid",
    "Outrun Sunset 1984",
    "Retrowave magenta and solar orange horizon with laser wireframe grid",
    ["#09031B", "#3B0764", "#BE185D", "#F97316", "#FDE047"],
    { angle: 180, effectIntensity: 80, effectScale: 50, backdropColor: "#09031B" },
  ),
  makePreset(
    "cyber-matrix-terminal",
    "cyber-grid",
    "Mainframe Phosphor Grid",
    "High-voltage emerald and chartreuse cybernetic coordinate matrix",
    ["#020A06", "#064E3B", "#059669", "#10B981", "#A7F3D0"],
    { angle: 165, effectIntensity: 85, effectScale: 42, backdropColor: "#020A06" },
  ),
  makePreset(
    "cyber-akira-tokyo",
    "cyber-grid",
    "Neo-Tokyo Tail Light",
    "Cyberpunk crimson laser streaks over deep midnight cobalt",
    ["#050714", "#1E1B4B", "#881337", "#E11D48", "#FB923C"],
    { angle: 145, effectIntensity: 78, effectScale: 48, backdropColor: "#050714" },
  ),
  makePreset(
    "cyber-tron-legacy",
    "cyber-grid",
    "Lightcycle Arena Cyan",
    "Electric ice-blue digital grid lines over obsidian glass",
    ["#020617", "#0C4A6E", "#0284C7", "#22D3EE", "#E0F2FE"],
    { angle: 175, effectIntensity: 82, effectScale: 46, backdropColor: "#020617" },
  ),
  makePreset(
    "cyber-arcade-violet",
    "cyber-grid",
    "Laser Tag UV Arena",
    "Blacklight ultraviolet purple and hot pink vector grid",
    ["#0A041A", "#2E1065", "#7E22CE", "#D946EF", "#38BDF8"],
    { angle: 155, effectIntensity: 80, effectScale: 52, backdropColor: "#0A041A" },
  ),

  // 22. LIQUID CHROME & METAL (5)
  makePreset(
    "chrome-y2k-molten",
    "chrome",
    "Y2K Molten Mercury",
    "High-contrast specular liquid silver with sky-blue skybox reflections",
    ["#0F172A", "#64748B", "#F8FAFC", "#38BDF8", "#1E293B", "#E2E8F0"],
    { angle: 130, effectIntensity: 85, effectScale: 55 },
  ),
  makePreset(
    "chrome-titanium-exhaust",
    "chrome",
    "Heat-Treated Titanium",
    "Anodized exhaust pipe tempering from gold to violet and burnt cobalt",
    ["#1E293B", "#F59E0B", "#EC4899", "#6366F1", "#06B6D4", "#E2E8F0"],
    { angle: 115, effectIntensity: 80, effectScale: 50 },
  ),
  makePreset(
    "chrome-rose-gold-ingot",
    "chrome",
    "Polished Rose Gold",
    "Mirror-finished copper champagne with warm specular highlights",
    ["#2A1215", "#9D4E55", "#FBCFE8", "#FDE68A", "#883940", "#FFF1F2"],
    { angle: 140, effectIntensity: 75, effectScale: 48 },
  ),
  makePreset(
    "chrome-damascus-steel",
    "chrome",
    "Damascus Gunmetal",
    "Folded carbon steel and platinum bands with razor-sharp sheen",
    ["#090D16", "#334155", "#94A3B8", "#F1F5F9", "#1E293B", "#CBD5E1"],
    { angle: 150, effectIntensity: 82, effectScale: 42 },
  ),
  makePreset(
    "chrome-bismuth-crystal",
    "chrome",
    "Iridescent Bismuth",
    "Geometric metallic oxide sheen across teal, magenta, and gold",
    ["#0F172A", "#14B8A6", "#F43F5E", "#FBBF24", "#8B5CF6", "#F8FAFC"],
    { angle: 120, effectIntensity: 88, effectScale: 60 },
  ),

  // 23. SACRED GEOMETRY (5)
  makePreset(
    "geo-golden-sol",
    "sacred-geo",
    "Golden Ratio Astrolabe",
    "Warm imperial gold and obsidian with concentric geometric rings",
    ["#0C0A09", "#451A03", "#B45309", "#F59E0B", "#FEF08A"],
    { baseType: "radial", effectIntensity: 80, effectScale: 52, backdropColor: "#0C0A09" },
  ),
  makePreset(
    "geo-emerald-matrix",
    "sacred-geo",
    "Emerald Isometric Lattice",
    "Precision architectural diamond tessellation over deep jade",
    ["#022C22", "#065F46", "#059669", "#34D399", "#A7F3D0"],
    { angle: 135, effectIntensity: 75, effectScale: 45, backdropColor: "#022C22" },
  ),
  makePreset(
    "geo-amethyst-mandala",
    "sacred-geo",
    "Amethyst Celestial Dome",
    "Royal violet and rose-quartz radial geometry with fine linework",
    ["#1E1B4B", "#4C1D95", "#7C3AED", "#EC4899", "#FBCFE8"],
    { baseType: "radial", effectIntensity: 78, effectScale: 50, backdropColor: "#1E1B4B" },
  ),
  makePreset(
    "geo-nordic-blueprint",
    "sacred-geo",
    "Cyan Blueprint Tessellation",
    "Drafting table Prussian blue and cyan technical grid intersections",
    ["#082F49", "#0369A1", "#0284C7", "#38BDF8", "#BAE6FD"],
    { angle: 120, effectIntensity: 75, effectScale: 48, backdropColor: "#082F49" },
  ),
  makePreset(
    "geo-terracotta-zellige",
    "sacred-geo",
    "Moroccan Zellige Mosaic",
    "Sunlit terracotta, saffron, and cobalt geometric tile lattice",
    ["#431407", "#9A3412", "#EA580C", "#F59E0B", "#2DD4BF"],
    { angle: 145, effectIntensity: 80, effectScale: 55, backdropColor: "#431407" },
  ),

  // 24. WATERCOLOR & PAPER (5)
  makePreset(
    "water-kyoto-sakura",
    "watercolor",
    "Kyoto Sakura Wash",
    "Delicate cherry blossom blush and warm ivory pooled on cotton paper",
    ["#FFF1F2", "#FECDD3", "#FDA4AF", "#F472B6", "#FEF3C7"],
    { angle: 130, effectIntensity: 75, effectScale: 55 },
  ),
  makePreset(
    "water-tuscan-ochre",
    "watercolor",
    "Tuscan Ochre & Ultramarine",
    "Sun-drenched raw sienna pigment bleeding into Mediterranean blue",
    ["#FEF3C7", "#F59E0B", "#EA580C", "#3B82F6", "#1D4ED8"],
    { angle: 145, effectIntensity: 80, effectScale: 60 },
  ),
  makePreset(
    "water-botanical-sage",
    "watercolor",
    "Botanical Eucalyptus Wash",
    "Soft celadon, misty sage green, and warm parchment paper grain",
    ["#F8FAFC", "#DCFCE7", "#86EFAC", "#10B981", "#065F46"],
    { angle: 125, effectIntensity: 72, effectScale: 50 },
  ),
  makePreset(
    "water-indigo-shibori",
    "watercolor",
    "Indigo Shibori Dye",
    "Japanese natural indigo dye blooming across textured mulberry paper",
    ["#F1F5F9", "#BAE6FD", "#38BDF8", "#1D4ED8", "#1E1B4B"],
    { angle: 155, effectIntensity: 78, effectScale: 52 },
  ),
  makePreset(
    "water-sunset-gouache",
    "watercolor",
    "Amalfi Sunset Gouache",
    "Hand-painted coral, tangerine, and violet wash on cold-press stock",
    ["#FEF9C3", "#FDBA74", "#FB7185", "#C084FC", "#818CF8"],
    { angle: 135, effectIntensity: 76, effectScale: 58 },
  ),
];

// ============================================================================
// Color Formatting Helpers (Supports all 12+ conventions)
// ============================================================================

export function formatColorInConvention(rgba: RgbaColor, formatId: ColorFormatId): string {
  const def = COLOR_FORMAT_DEFINITIONS.find((d) => d.id === formatId);
  if (!def) return rgbaToHex(rgba, rgba.a < 1);
  return def.format(rgba);
}

/**
 * Returns a valid CSS color string for browser rendering.
 * For conventions that CSS natively supports (`hex`, `hex8`, `rgb`, `rgba`, `rgb-modern`,
 * `hsl`, `hsla`, `hwb`, `oklch`, `oklab`, `lab`, `lch`), returns that exact syntax!
 * For non-CSS conventions (`hsv`, `cmyk`, `glsl`, `argb-int`), returns `rgba(...)` or `hex`
 * so the browser renders the exact color while the code output also documents the target convention.
 */
export function formatCssRenderableColor(rgba: RgbaColor, formatId: ColorFormatId): string {
  const cssNativeFormats: Set<ColorFormatId> = new Set([
    "hex",
    "hex8",
    "rgb",
    "rgba",
    "rgb-modern",
    "hsl",
    "hsla",
    "hwb",
    "oklch",
    "oklab",
    "lab",
    "lch",
  ]);

  if (cssNativeFormats.has(formatId)) {
    if (formatId === "hex" && rgba.a < 1) {
      return formatColorInConvention(rgba, "hex8");
    }
    return formatColorInConvention(rgba, formatId);
  }

  return rgba.a < 1
    ? formatColorInConvention(rgba, "rgba")
    : formatColorInConvention(rgba, "hex");
}

// ============================================================================
// SVG Data URI Generators for Fractal Noise, Liquid, Grain, Ocean & Watercolor
// ============================================================================

export function createSvgNoiseDataUri(options: {
  type: "grain" | "grainy-folds" | "fractal-noise" | "liquid" | "ocean" | "watercolor";
  scale: number;
  intensity: number;
}): string {
  const { type, scale } = options;

  if (type === "grain" || type === "grainy-folds") {
    const freq = (0.62 + ((100 - scale) / 100) * 0.42).toFixed(2);
    const slope = type === "grainy-folds" ? "2.45" : "1.85";
    const intercept = type === "grainy-folds" ? "-0.68" : "-0.38";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="${slope}" intercept="${intercept}"/><feFuncG type="linear" slope="${slope}" intercept="${intercept}"/><feFuncB type="linear" slope="${slope}" intercept="${intercept}"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#g)" opacity="0.64"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  if (type === "fractal-noise") {
    const freq = (0.008 + ((100 - scale) / 100) * 0.025).toFixed(4);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><filter id="fn"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="5" seed="11" stitchTiles="stitch"/><feColorMatrix type="matrix" values="1.4 0 0 0 -0.15  0 1.4 0 0 -0.15  0 0 1.5 0 -0.1  0 0 0 0.65 0"/></filter><rect width="100%" height="100%" filter="url(#fn)"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  if (type === "liquid") {
    const freqX = (0.006 + ((100 - scale) / 100) * 0.015).toFixed(4);
    const freqY = (0.012 + ((100 - scale) / 100) * 0.022).toFixed(4);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><filter id="lq"><feTurbulence type="turbulence" baseFrequency="${freqX} ${freqY}" numOctaves="3" seed="7" result="turb"/><feSpecularLighting in="turb" surfaceScale="6" specularConstant="1.1" specularExponent="22" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="135" elevation="55"/></feSpecularLighting><feComposite in="spec" in2="SourceGraphic" operator="in"/></filter><rect width="100%" height="100%" filter="url(#lq)" opacity="0.72"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  if (type === "watercolor") {
    const freq = (0.018 + ((100 - scale) / 100) * 0.03).toFixed(4);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360"><filter id="wc"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="23" result="paper"/><feDiffuseLighting in="paper" lighting-color="#fff8ee" surfaceScale="2.2" result="lit"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting><feComposite in="lit" in2="SourceGraphic" operator="in"/></filter><rect width="100%" height="100%" filter="url(#wc)" opacity="0.65"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  // Ocean caustics
  const freq = (0.014 + ((100 - scale) / 100) * 0.024).toFixed(4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><filter id="oc"><feTurbulence type="turbulence" baseFrequency="${freq} ${Number(freq) * 1.8}" numOctaves="3" seed="19" result="t"/><feColorMatrix in="t" type="luminanceToAlpha" result="a"/><feComponentTransfer in="a"><feFuncA type="discrete" tableValues="0 0 0.18 0.55 0.12 0"/></feComponentTransfer></filter><rect width="100%" height="100%" fill="#ffffff" filter="url(#oc)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// ============================================================================
// CSS Style, Animation Keyframes & Variable Code Synthesis
// ============================================================================

export interface SynthesizedGradientStyles {
  /** Inline React style object for the primary preview surface */
  surfaceStyle: React.CSSProperties;
  /** Optional secondary overlay style (for fractal glass, grain, halftone, woven, etc.) */
  overlayStyle: React.CSSProperties | null;
  /** Dynamic @keyframes CSS string to inject into the page for live animation preview */
  keyframesCss: string;
  /** Complete CSS code with :root CSS variables (and @keyframes when animated) */
  cssCode: string;
  /** Complete Tailwind v4 code with :root CSS variables (and @keyframes when animated) */
  tailwindCode: string;
}

export function synthesizeGradient(
  config: GradientConfig,
  options: {
    variablePrefix: string;
    colorFormat: ColorFormatId;
    animation?: GradientAnimationConfig;
  },
): SynthesizedGradientStyles {
  const cleanPrefix =
    options.variablePrefix
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/^-+|-+$/g, "") || "gradient";

  const sortedStops = [...config.stops].sort((a, b) => a.position - b.position);
  const interpToken =
    config.interpolation === "default" ? "" : ` ${config.interpolation}`;

  // Build CSS variables for each color stop
  const stopVars: Array<{
    varName: string;
    cssValue: string;
    displayComment: string | null;
    stop: GradientStop;
  }> = sortedStops.map((stop, idx) => {
    const varName = `--${cleanPrefix}-stop-${idx + 1}`;
    const cssValue = formatCssRenderableColor(stop.color, options.colorFormat);
    const formattedInSelected = formatColorInConvention(
      stop.color,
      options.colorFormat,
    );
    const displayComment =
      formattedInSelected !== cssValue
        ? `${options.colorFormat.toUpperCase()}: ${formattedInSelected}`
        : null;
    return {
      varName,
      cssValue,
      displayComment,
      stop,
    };
  });

  // Calculate focal bias from (centerX, centerY) so dragging the crosshair affects linear gradients too
  const dx = (config.centerX - 50) / 50; // -1 to +1
  const dy = (config.centerY - 50) / 50; // -1 to +1
  const angleRad = ((config.angle - 90) * Math.PI) / 180;
  const axisShiftPct = Math.round((dx * Math.cos(angleRad) + dy * Math.sin(angleRad)) * 28);
  const isFocalMoved = config.centerX !== 50 || config.centerY !== 50;

  // 1. Construct Base Gradient Expression (using var(--...)) and Resolved Expression (for inline style)
  let baseGradientVarExpr = "";
  let baseGradientInlineExpr = "";

  const isHard = config.category === "hard";

  if (isHard && sortedStops.length >= 2) {
    // Hard stepped bands (shifted by focal crosshair along axis)
    const varSegments: string[] = [];
    const inlineSegments: string[] = [];
    const count = sortedStops.length;
    for (let i = 0; i < count; i++) {
      const rawStart = Math.round((i / count) * 100);
      const rawEnd = Math.round(((i + 1) / count) * 100);
      const startPct =
        i === 0 ? 0 : Math.max(2, Math.min(98, rawStart + axisShiftPct));
      const endPct =
        i === count - 1 ? 100 : Math.max(2, Math.min(98, rawEnd + axisShiftPct));
      varSegments.push(`var(${stopVars[i].varName}) ${startPct}% ${endPct}%`);
      inlineSegments.push(`${stopVars[i].cssValue} ${startPct}% ${endPct}%`);
    }
    if (config.baseType === "radial") {
      baseGradientVarExpr = `radial-gradient(circle at ${config.centerX}% ${config.centerY}%, ${varSegments.join(", ")})`;
      baseGradientInlineExpr = `radial-gradient(circle at ${config.centerX}% ${config.centerY}%, ${inlineSegments.join(", ")})`;
    } else if (config.baseType === "conic") {
      baseGradientVarExpr = `conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%, ${varSegments.join(", ")})`;
      baseGradientInlineExpr = `conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%, ${inlineSegments.join(", ")})`;
    } else {
      baseGradientVarExpr = `linear-gradient(${config.angle}deg, ${varSegments.join(", ")})`;
      baseGradientInlineExpr = `linear-gradient(${config.angle}deg, ${inlineSegments.join(", ")})`;
    }
  } else if (
    config.baseType === "mesh" ||
    config.category === "blobs" ||
    config.category === "blurry"
  ) {
    const radius = Math.round(42 + (config.effectScale / 100) * 38);
    if (config.category === "grainy-folds" && stopVars.length >= 2) {
      // Screenshot 1 style: dual-ring halo orb (cobalt core + emerald outer ring) + diffused pools
      const sv0 = stopVars[0];
      const sv1 = stopVars[1];
      const haloVarOrb = `radial-gradient(circle at ${sv0.stop.x}% ${sv0.stop.y}%, var(${sv0.varName}) 0%, var(${sv0.varName}) 18%, var(${sv1.varName}) 27%, transparent 39%)`;
      const haloInlineOrb = `radial-gradient(circle at ${sv0.stop.x}% ${sv0.stop.y}%, ${sv0.cssValue} 0%, ${sv0.cssValue} 18%, ${sv1.cssValue} 27%, transparent 39%)`;

      const restVars = stopVars.slice(2).map(
        (sv, idx) =>
          `radial-gradient(circle at ${sv.stop.x}% ${sv.stop.y}%, var(${sv.varName}) 0%, transparent ${idx === 1 ? 26 : radius - 8}%)`,
      );
      const restInlines = stopVars.slice(2).map(
        (sv, idx) =>
          `radial-gradient(circle at ${sv.stop.x}% ${sv.stop.y}%, ${sv.cssValue} 0%, transparent ${idx === 1 ? 26 : radius - 8}%)`,
      );
      baseGradientVarExpr = [haloVarOrb, ...restVars].join(",\n    ");
      baseGradientInlineExpr = [haloInlineOrb, ...restInlines].join(", ");
    } else {
      const varBlobs = stopVars.map(
        (sv) =>
          `radial-gradient(circle at ${sv.stop.x}% ${sv.stop.y}%, var(${sv.varName}) 0%, transparent ${radius}%)`,
      );
      const inlineBlobs = stopVars.map(
        (sv) =>
          `radial-gradient(circle at ${sv.stop.x}% ${sv.stop.y}%, ${sv.cssValue} 0%, transparent ${radius}%)`,
      );
      baseGradientVarExpr = varBlobs.join(",\n    ");
      baseGradientInlineExpr = inlineBlobs.join(", ");
    }
  } else if (config.baseType === "conic" || config.category === "spun") {
    const varStopList = stopVars
      .map((sv) => `var(${sv.varName}) ${sv.stop.position}%`)
      .join(", ");
    const inlineStopList = stopVars
      .map((sv) => `${sv.cssValue} ${sv.stop.position}%`)
      .join(", ");

    if (config.category === "spun") {
      const specularRayInline = `repeating-conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%, rgba(255,255,255,0.14) 0deg 6deg, transparent 6deg 18deg)`;
      baseGradientVarExpr = `${specularRayInline},\n    conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%${interpToken}, ${varStopList})`;
      baseGradientInlineExpr = `${specularRayInline}, conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%${interpToken}, ${inlineStopList})`;
    } else if (config.category === "grainy-folds") {
      // Screenshot 3 style: Pinched silk drapery folds converging at (centerX%, centerY%)
      const foldShadowVar = `radial-gradient(120% 90% at ${100 - config.centerX}% ${100 - config.centerY}%, var(${stopVars[1]?.varName ?? stopVars[0].varName}) 0%, transparent 70%)`;
      const foldShadowInline = `radial-gradient(120% 90% at ${100 - config.centerX}% ${100 - config.centerY}%, ${stopVars[1]?.cssValue ?? stopVars[0].cssValue} 0%, transparent 70%)`;
      baseGradientVarExpr = `${foldShadowVar},\n    conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%${interpToken}, ${varStopList})`;
      baseGradientInlineExpr = `${foldShadowInline}, conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%${interpToken}, ${inlineStopList})`;
    } else {
      baseGradientVarExpr = `conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%${interpToken}, ${varStopList})`;
      baseGradientInlineExpr = `conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%${interpToken}, ${inlineStopList})`;
    }
  } else if (config.baseType === "radial") {
    const varStopList = stopVars
      .map((sv) => `var(${sv.varName}) ${sv.stop.position}%`)
      .join(", ");
    const inlineStopList = stopVars
      .map((sv) => `${sv.cssValue} ${sv.stop.position}%`)
      .join(", ");
    baseGradientVarExpr = `radial-gradient(circle at ${config.centerX}% ${config.centerY}%${interpToken}, ${varStopList})`;
    baseGradientInlineExpr = `radial-gradient(circle at ${config.centerX}% ${config.centerY}%${interpToken}, ${inlineStopList})`;
  } else {
    // Linear gradient — shifts stops along focal axis and casts a focal spotlight when crosshair moves
    const shiftedStopVars = stopVars.map((sv, idx) => {
      if (!isFocalMoved || idx === 0 || idx === stopVars.length - 1) {
        return sv.stop.position;
      }
      return Math.max(2, Math.min(98, sv.stop.position + axisShiftPct));
    });

    const varStopList = stopVars
      .map((sv, idx) => `var(${sv.varName}) ${shiftedStopVars[idx]}%`)
      .join(", ");
    const inlineStopList = stopVars
      .map((sv, idx) => `${sv.cssValue} ${shiftedStopVars[idx]}%`)
      .join(", ");

    if (config.category === "grainy-folds" && stopVars.length >= 3) {
      // Screenshot 2 style: Diagonal darkroom light shafts & shadow crease
      const creaseVar = `radial-gradient(85% 65% at ${config.centerX}% ${config.centerY}%, var(${stopVars[0].varName}) 0%, transparent 58%), radial-gradient(90% 85% at ${Math.min(95, config.centerX + 24)}% ${Math.min(95, config.centerY + 54)}%, var(${stopVars[2].varName}) 0%, transparent 62%)`;
      const creaseInline = `radial-gradient(85% 65% at ${config.centerX}% ${config.centerY}%, ${stopVars[0].cssValue} 0%, transparent 58%), radial-gradient(90% 85% at ${Math.min(95, config.centerX + 24)}% ${Math.min(95, config.centerY + 54)}%, ${stopVars[2].cssValue} 0%, transparent 62%)`;
      baseGradientVarExpr = `${creaseVar},\n    linear-gradient(${config.angle}deg${interpToken}, ${varStopList})`;
      baseGradientInlineExpr = `${creaseInline}, linear-gradient(${config.angle}deg${interpToken}, ${inlineStopList})`;
    } else if (isFocalMoved && stopVars.length > 0) {
      const focalVarSpot = `radial-gradient(circle at ${config.centerX}% ${config.centerY}%${interpToken}, var(${stopVars[0].varName}) 0%, transparent 68%)`;
      const focalInlineSpot = `radial-gradient(circle at ${config.centerX}% ${config.centerY}%${interpToken}, ${stopVars[0].cssValue} 0%, transparent 68%)`;
      baseGradientVarExpr = `${focalVarSpot},\n    linear-gradient(${config.angle}deg${interpToken}, ${varStopList})`;
      baseGradientInlineExpr = `${focalInlineSpot}, linear-gradient(${config.angle}deg${interpToken}, ${inlineStopList})`;
    } else {
      baseGradientVarExpr = `linear-gradient(${config.angle}deg${interpToken}, ${varStopList})`;
      baseGradientInlineExpr = `linear-gradient(${config.angle}deg${interpToken}, ${inlineStopList})`;
    }
  }

  // 2. Build Category-Specific Overlay / Pattern / Mask / Filter Layers
  let overlayStyle: React.CSSProperties | null = null;
  const extraCssVariables: Array<{ name: string; value: string }> = [];
  const extraCssRules: string[] = [];

  const intensityAlpha = Number(((config.effectIntensity / 100) * 0.65).toFixed(2));
  const cx = config.centerX;
  const cy = config.centerY;

  switch (config.category) {
    case "ribbon": {
      const s1 = stopVars[1]?.cssValue ?? stopVars[0]?.cssValue ?? "#6366f1";
      const s2 = stopVars[2]?.cssValue ?? stopVars[0]?.cssValue ?? "#ec4899";
      const s3 = stopVars[3]?.cssValue ?? stopVars[1]?.cssValue ?? "#f59e0b";
      const r1x = Math.max(5, Math.min(95, cx - 30));
      const r1y = Math.max(5, Math.min(95, cy - 25));
      const r2x = Math.max(5, Math.min(95, cx + 30));
      const r2y = Math.max(5, Math.min(95, cy + 5));
      const ribbonImg = [
        `radial-gradient(120% 38% at ${r1x}% ${r1y}%, transparent 44%, ${s1} 48%, rgba(255,255,255,0.45) 50%, transparent 54%)`,
        `radial-gradient(130% 42% at ${r2x}% ${r2y}%, transparent 45%, ${s2} 49%, rgba(255,255,255,0.35) 51%, transparent 55%)`,
        `radial-gradient(110% 35% at ${cx}% ${Math.min(95, cy + 30)}%, transparent 43%, ${s3} 47%, rgba(255,255,255,0.3) 49%, transparent 53%)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: ribbonImg,
        mixBlendMode: "screen",
        opacity: Math.max(0.35, config.effectIntensity / 100),
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-ribbon-layer`,
        value: ribbonImg,
      });
      break;
    }

    case "mixing": {
      const cA = stopVars[0]?.cssValue ?? "#4f46e5";
      const cB = stopVars[stopVars.length - 1]?.cssValue ?? "#10b981";
      const cMid = stopVars[Math.floor(stopVars.length / 2)]?.cssValue ?? "#ec4899";
      const crossLayer = `radial-gradient(circle at ${cx}% ${cy}%, ${cB} 0%, transparent 62%), radial-gradient(circle at ${100 - cx}% ${100 - cy}%, ${cA} 0%, transparent 62%), linear-gradient(${(config.angle + 90) % 360}deg in oklch, ${cMid}, transparent)`;
      overlayStyle = {
        backgroundImage: crossLayer,
        mixBlendMode: "color-dodge",
        opacity: Number(((config.effectIntensity / 100) * 0.7).toFixed(2)),
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-mix-overlay`,
        value: crossLayer,
      });
      break;
    }

    case "halftone": {
      const dotSpacing = Math.max(4, Math.round(4 + (config.effectScale / 100) * 14));
      const dotRadius = Math.max(1, Math.round(dotSpacing * 0.28));
      const halftonePattern = `radial-gradient(rgba(0, 0, 0, ${intensityAlpha}) ${dotRadius}px, transparent ${dotRadius + 0.8}px), radial-gradient(rgba(255, 255, 255, ${(intensityAlpha * 0.45).toFixed(2)}) ${dotRadius}px, transparent ${dotRadius + 0.8}px)`;
      overlayStyle = {
        backgroundImage: halftonePattern,
        backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
        backgroundPosition: `0 0, ${dotSpacing / 2}px ${dotSpacing / 2}px`,
        mixBlendMode: "overlay",
      };
      extraCssVariables.push(
        { name: `--${cleanPrefix}-halftone-pattern`, value: halftonePattern },
        { name: `--${cleanPrefix}-halftone-size`, value: `${dotSpacing}px ${dotSpacing}px` },
      );
      break;
    }

    case "contours": {
      const ringStep = Math.max(12, Math.round(10 + (config.effectScale / 100) * 28));
      const contourPattern = [
        `repeating-radial-gradient(circle at ${cx}% ${cy}%, transparent 0px, transparent ${ringStep - 1.5}px, rgba(255, 255, 255, ${intensityAlpha}) ${ringStep - 1.5}px, rgba(255, 255, 255, ${intensityAlpha}) ${ringStep}px)`,
        `repeating-radial-gradient(circle at ${100 - cx}% ${100 - cy}%, transparent 0px, transparent ${Math.round(ringStep * 1.35) - 1}px, rgba(0, 0, 0, ${(intensityAlpha * 0.6).toFixed(2)}) ${Math.round(ringStep * 1.35) - 1}px, rgba(0, 0, 0, ${(intensityAlpha * 0.6).toFixed(2)}) ${Math.round(ringStep * 1.35)}px)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: contourPattern,
        mixBlendMode: "soft-light",
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-contour-pattern`,
        value: contourPattern,
      });
      break;
    }

    case "mask": {
      const blindSize = Math.max(8, Math.round(6 + (config.effectScale / 100) * 26));
      const maskPattern =
        config.baseType === "radial"
          ? `radial-gradient(circle at ${cx}% ${cy}%, #000 25%, rgba(0,0,0,0.45) 58%, transparent 85%), repeating-radial-gradient(circle at ${cx}% ${cy}%, #000 0px, #000 ${Math.round(blindSize * 0.6)}px, transparent ${Math.round(blindSize * 0.6)}px, transparent ${blindSize}px)`
          : `repeating-linear-gradient(${config.angle}deg, #000 0px, #000 ${Math.round(blindSize * 0.62)}px, rgba(0,0,0,${(1 - config.effectIntensity / 115).toFixed(2)}) ${Math.round(blindSize * 0.62)}px, rgba(0,0,0,${(1 - config.effectIntensity / 115).toFixed(2)}) ${blindSize}px)`;
      overlayStyle = {
        backgroundImage: `repeating-linear-gradient(${config.angle}deg, transparent 0px, transparent ${Math.round(blindSize * 0.6)}px, ${config.backdropColor} ${Math.round(blindSize * 0.6)}px, ${config.backdropColor} ${blindSize}px)`,
        opacity: Number(((config.effectIntensity / 100) * 0.85).toFixed(2)),
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-mask-image`,
        value: maskPattern,
      });
      extraCssRules.push(
        `-webkit-mask-image: var(--${cleanPrefix}-mask-image);`,
        `mask-image: var(--${cleanPrefix}-mask-image);`,
      );
      break;
    }

    case "fractal-glass": {
      const fluteWidth = Math.max(8, Math.round(6 + (config.effectScale / 100) * 28));
      const flutePattern = `repeating-linear-gradient(90deg, rgba(255, 255, 255, ${(intensityAlpha * 0.65).toFixed(2)}) 0px, rgba(255, 255, 255, 0.04) ${Math.round(fluteWidth * 0.35)}px, rgba(0, 0, 0, ${(intensityAlpha * 0.7).toFixed(2)}) ${Math.round(fluteWidth * 0.75)}px, rgba(255, 255, 255, ${(intensityAlpha * 0.45).toFixed(2)}) ${fluteWidth}px)`;
      overlayStyle = {
        backgroundImage: flutePattern,
        backdropFilter: "blur(10px) saturate(140%)",
        WebkitBackdropFilter: "blur(10px) saturate(140%)",
        mixBlendMode: "overlay",
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-fluted-glass`,
        value: flutePattern,
      });
      break;
    }

    case "fractal-noise":
    case "liquid":
    case "grain":
    case "grainy-folds":
    case "ocean":
    case "watercolor": {
      const svgUri = createSvgNoiseDataUri({
        type: config.category,
        scale: config.effectScale,
        intensity: config.effectIntensity,
      });
      const blendMode: React.CSSProperties["mixBlendMode"] =
        config.category === "grain" ||
        config.category === "grainy-folds" ||
        config.category === "watercolor"
          ? "overlay"
          : config.category === "ocean"
            ? "soft-light"
            : "color-dodge";
      overlayStyle = {
        backgroundImage: svgUri,
        backgroundRepeat: "repeat",
        backgroundSize:
          config.category === "grain" || config.category === "grainy-folds"
            ? `${Math.max(110, Math.round(90 + config.effectScale * 1.6))}px`
            : "cover",
        mixBlendMode: blendMode,
        opacity: Number(((config.effectIntensity / 100) * 0.92).toFixed(2)),
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-texture-svg`,
        value: svgUri,
      });
      break;
    }

    case "groovy": {
      const waveStep = Math.max(16, Math.round(14 + (config.effectScale / 100) * 34));
      const c1 = stopVars[0]?.cssValue ?? "#ea580c";
      const c2 = stopVars[stopVars.length - 1]?.cssValue ?? "#8b5cf6";
      const groovyPattern = [
        `repeating-radial-gradient(circle at ${cx}% ${cy}%, ${c1} 0px, transparent ${waveStep}px, ${c2} ${waveStep * 2}px)`,
        `repeating-radial-gradient(circle at ${100 - cx}% ${100 - cy}%, ${c2} 0px, transparent ${waveStep}px, ${c1} ${waveStep * 2}px)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: groovyPattern,
        mixBlendMode: "overlay",
        opacity: Number(((config.effectIntensity / 100) * 0.72).toFixed(2)),
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-groovy-waves`,
        value: groovyPattern,
      });
      break;
    }

    case "woven": {
      const threadPitch = Math.max(4, Math.round(4 + (config.effectScale / 100) * 12));
      const halfPitch = Math.max(2, Math.round(threadPitch / 2));
      const wovenPattern = [
        `repeating-linear-gradient(45deg, rgba(255,255,255,${(intensityAlpha * 0.42).toFixed(2)}) 0px, rgba(255,255,255,${(intensityAlpha * 0.42).toFixed(2)}) ${halfPitch}px, rgba(0,0,0,${(intensityAlpha * 0.48).toFixed(2)}) ${halfPitch}px, rgba(0,0,0,${(intensityAlpha * 0.48).toFixed(2)}) ${threadPitch}px)`,
        `repeating-linear-gradient(-45deg, rgba(0,0,0,${(intensityAlpha * 0.42).toFixed(2)}) 0px, rgba(0,0,0,${(intensityAlpha * 0.42).toFixed(2)}) ${halfPitch}px, rgba(255,255,255,${(intensityAlpha * 0.38).toFixed(2)}) ${halfPitch}px, rgba(255,255,255,${(intensityAlpha * 0.38).toFixed(2)}) ${threadPitch}px)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: wovenPattern,
        mixBlendMode: "overlay",
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-woven-threads`,
        value: wovenPattern,
      });
      break;
    }

    case "vintage": {
      const vintageOverlay = `radial-gradient(circle at ${cx}% ${cy}%, rgba(255, 214, 153, 0.22) 0%, rgba(28, 18, 12, ${(intensityAlpha * 0.85).toFixed(2)}) 100%)`;
      overlayStyle = {
        backgroundImage: vintageOverlay,
        mixBlendMode: "multiply",
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-vintage-vignette`,
        value: vintageOverlay,
      });
      break;
    }

    case "aurora": {
      const pillarWidth = Math.max(14, Math.round(12 + (config.effectScale / 100) * 32));
      const cA = stopVars[2]?.cssValue ?? stopVars[1]?.cssValue ?? "#10b981";
      const cB = stopVars[3]?.cssValue ?? stopVars[0]?.cssValue ?? "#2dd4bf";
      const auroraCurtain = [
        `radial-gradient(130% 55% at ${cx}% ${cy}%, ${cA} 0%, transparent 65%)`,
        `repeating-linear-gradient(95deg, transparent 0px, rgba(255,255,255,${(intensityAlpha * 0.35).toFixed(2)}) ${Math.round(pillarWidth * 0.4)}px, ${cB} ${Math.round(pillarWidth * 0.55)}px, transparent ${pillarWidth}px)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: auroraCurtain,
        mixBlendMode: "screen",
        opacity: Number(((config.effectIntensity / 100) * 0.82).toFixed(2)),
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-aurora-curtain`,
        value: auroraCurtain,
      });
      break;
    }

    case "hologram": {
      const bandWidth = Math.max(18, Math.round(16 + (config.effectScale / 100) * 36));
      const holoFoil = [
        `radial-gradient(circle at ${cx}% ${cy}%, rgba(255,255,255,0.65) 0%, transparent 55%)`,
        `repeating-linear-gradient(${(config.angle + 45) % 360}deg, rgba(255,0,128,${(intensityAlpha * 0.45).toFixed(2)}) 0px, rgba(0,255,255,${(intensityAlpha * 0.45).toFixed(2)}) ${bandWidth}px, rgba(255,255,0,${(intensityAlpha * 0.4).toFixed(2)}) ${bandWidth * 2}px, rgba(168,85,247,${(intensityAlpha * 0.45).toFixed(2)}) ${bandWidth * 3}px)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: holoFoil,
        mixBlendMode: "color-dodge",
        opacity: Number(((config.effectIntensity / 100) * 0.78).toFixed(2)),
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-holo-foil`,
        value: holoFoil,
      });
      break;
    }

    case "cyber-grid": {
      const cell = Math.max(16, Math.round(14 + (config.effectScale / 100) * 36));
      const neonColor = stopVars[stopVars.length - 1]?.cssValue ?? "#22d3ee";
      const gridPattern = [
        `radial-gradient(circle at ${cx}% ${cy}%, ${neonColor} 0%, transparent 65%)`,
        `linear-gradient(rgba(255,255,255,${(intensityAlpha * 0.45).toFixed(2)}) 1px, transparent 1px)`,
        `linear-gradient(90deg, rgba(255,255,255,${(intensityAlpha * 0.45).toFixed(2)}) 1px, transparent 1px)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: gridPattern,
        backgroundSize: `100% 100%, ${cell}px ${cell}px, ${cell}px ${cell}px`,
        mixBlendMode: "screen",
        opacity: Number(((config.effectIntensity / 100) * 0.85).toFixed(2)),
      };
      extraCssVariables.push(
        { name: `--${cleanPrefix}-cyber-grid`, value: gridPattern },
        { name: `--${cleanPrefix}-cyber-grid-size`, value: `100% 100%, ${cell}px ${cell}px, ${cell}px ${cell}px` },
      );
      break;
    }

    case "chrome": {
      const ridge = Math.max(24, Math.round(20 + (config.effectScale / 100) * 45));
      const chromePattern = [
        `radial-gradient(circle at ${cx}% ${cy}%, rgba(255,255,255,0.85) 0%, rgba(15,23,42,0.5) 42%, transparent 72%)`,
        `repeating-linear-gradient(${(config.angle + 90) % 360}deg, rgba(255,255,255,${(intensityAlpha * 0.75).toFixed(2)}) 0px, rgba(15,23,42,${(intensityAlpha * 0.65).toFixed(2)}) ${Math.round(ridge * 0.45)}px, rgba(255,255,255,${(intensityAlpha * 0.85).toFixed(2)}) ${ridge}px)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: chromePattern,
        mixBlendMode: "hard-light",
        opacity: Number(((config.effectIntensity / 100) * 0.75).toFixed(2)),
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-chrome-specular`,
        value: chromePattern,
      });
      break;
    }

    case "sacred-geo": {
      const step = Math.max(18, Math.round(14 + (config.effectScale / 100) * 34));
      const geoPattern = [
        `repeating-radial-gradient(circle at ${cx}% ${cy}%, transparent 0px, transparent ${step - 1.5}px, rgba(255,255,255,${(intensityAlpha * 0.65).toFixed(2)}) ${step - 1.5}px, rgba(255,255,255,${(intensityAlpha * 0.65).toFixed(2)}) ${step}px)`,
        `repeating-linear-gradient(60deg, transparent 0px, transparent ${step - 1}px, rgba(255,255,255,${(intensityAlpha * 0.35).toFixed(2)}) ${step - 1}px, rgba(255,255,255,${(intensityAlpha * 0.35).toFixed(2)}) ${step}px)`,
        `repeating-linear-gradient(-60deg, transparent 0px, transparent ${step - 1}px, rgba(255,255,255,${(intensityAlpha * 0.35).toFixed(2)}) ${step - 1}px, rgba(255,255,255,${(intensityAlpha * 0.35).toFixed(2)}) ${step}px)`,
      ].join(", ");
      overlayStyle = {
        backgroundImage: geoPattern,
        mixBlendMode: "overlay",
      };
      extraCssVariables.push({
        name: `--${cleanPrefix}-sacred-geo`,
        value: geoPattern,
      });
      break;
    }

    default:
      break;
  }

  const isMeshOrBlobs =
    config.baseType === "mesh" ||
    config.category === "blobs" ||
    config.category === "blurry" ||
    config.category === "grainy-folds";

  const baseFilter =
    config.category === "vintage"
      ? "sepia(18%) contrast(104%) saturate(92%)"
      : undefined;

  // 3. Synthesize Animation Styles & Keyframes (when enabled)
  const anim = options.animation;
  const animKeyframesName = `${cleanPrefix}-${anim?.type ?? "flow-pan"}`;
  let keyframesCss = "";
  let animSurfaceProps: React.CSSProperties = {};
  const animCssVars: Array<{ name: string; value: string }> = [];
  const animCssClassLines: string[] = [];

  if (anim?.enabled) {
    const dur = `${anim.duration}s`;
    const ease = anim.easing;
    const dir = anim.direction;
    const scalePct = `${anim.bgScale}% ${anim.bgScale}%`;
    const hueDeg = Math.round((anim.intensity / 100) * 360);
    const playState = anim.isPlaying ? "running" : "paused";

    animCssVars.push(
      { name: `--${cleanPrefix}-anim-duration`, value: dur },
      { name: `--${cleanPrefix}-anim-easing`, value: ease },
      { name: `--${cleanPrefix}-bg-size`, value: scalePct },
    );

    switch (anim.type) {
      case "flow-pan": {
        keyframesCss = `@keyframes ${animKeyframesName} {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 50% 100%; }
}`;
        animSurfaceProps = {
          backgroundSize: scalePct,
          animation: `${animKeyframesName} ${dur} ${ease} infinite ${dir}`,
          animationPlayState: playState,
        };
        animCssClassLines.push(
          `  background-size: var(--${cleanPrefix}-bg-size);`,
          `  animation: ${animKeyframesName} var(--${cleanPrefix}-anim-duration) var(--${cleanPrefix}-anim-easing) infinite ${dir};`,
        );
        break;
      }

      case "lava-morph": {
        const shiftDeg = Math.round((anim.intensity / 100) * 65);
        keyframesCss = `@keyframes ${animKeyframesName} {
  0% { background-position: 0% 20%; filter: hue-rotate(0deg) saturate(105%); }
  33% { background-position: 100% 80%; filter: hue-rotate(${shiftDeg}deg) saturate(130%); }
  66% { background-position: 25% 100%; filter: hue-rotate(-${shiftDeg}deg) saturate(118%); }
  100% { background-position: 85% 10%; filter: hue-rotate(${Math.round(shiftDeg * 0.5)}deg) saturate(105%); }
}`;
        animSurfaceProps = {
          backgroundSize: scalePct,
          animation: `${animKeyframesName} ${dur} ${ease} infinite ${dir}`,
          animationPlayState: playState,
        };
        animCssClassLines.push(
          `  background-size: var(--${cleanPrefix}-bg-size);`,
          `  animation: ${animKeyframesName} var(--${cleanPrefix}-anim-duration) var(--${cleanPrefix}-anim-easing) infinite ${dir};`,
        );
        break;
      }

      case "hue-cycle": {
        keyframesCss = `@keyframes ${animKeyframesName} {
  0% { filter: hue-rotate(0deg) saturate(105%); }
  50% { filter: hue-rotate(${Math.round(hueDeg * 0.5)}deg) saturate(125%); }
  100% { filter: hue-rotate(${hueDeg}deg) saturate(105%); }
}`;
        animSurfaceProps = {
          animation: `${animKeyframesName} ${dur} ${ease} infinite ${dir}`,
          animationPlayState: playState,
        };
        animCssClassLines.push(
          `  animation: ${animKeyframesName} var(--${cleanPrefix}-anim-duration) var(--${cleanPrefix}-anim-easing) infinite ${dir};`,
        );
        break;
      }

      case "spin-vortex": {
        // Seamless 360° circular orbital background-position trajectory (zero element rotation clipping / zero black bars!)
        const orbitHue = Math.round((anim.intensity / 100) * 180);
        keyframesCss = `@keyframes ${animKeyframesName} {
  0% { background-position: 50% 0%; filter: hue-rotate(0deg); }
  25% { background-position: 100% 50%; filter: hue-rotate(${Math.round(orbitHue * 0.5)}deg); }
  50% { background-position: 50% 100%; filter: hue-rotate(${orbitHue}deg); }
  75% { background-position: 0% 50%; filter: hue-rotate(${Math.round(orbitHue * 0.5)}deg); }
  100% { background-position: 50% 0%; filter: hue-rotate(0deg); }
}`;
        animSurfaceProps = {
          backgroundSize: scalePct,
          animation: `${animKeyframesName} ${dur} ${ease} infinite ${dir}`,
          animationPlayState: playState,
        };
        animCssClassLines.push(
          `  background-size: var(--${cleanPrefix}-bg-size);`,
          `  animation: ${animKeyframesName} var(--${cleanPrefix}-anim-duration) var(--${cleanPrefix}-anim-easing) infinite ${dir};`,
        );
        break;
      }

      case "pulse-breathe": {
        const brightPeak = (1 + (anim.intensity / 100) * 0.28).toFixed(2);
        const satPeak = Math.round(105 + (anim.intensity / 100) * 45);
        keyframesCss = `@keyframes ${animKeyframesName} {
  0%, 100% { background-size: 115% 115%; filter: brightness(1) saturate(100%); }
  50% { background-size: ${scalePct}; filter: brightness(${brightPeak}) saturate(${satPeak}%); }
}`;
        animSurfaceProps = {
          backgroundPosition: "center center",
          animation: `${animKeyframesName} ${dur} ${ease} infinite ${dir}`,
          animationPlayState: playState,
        };
        animCssClassLines.push(
          `  background-position: center center;`,
          `  animation: ${animKeyframesName} var(--${cleanPrefix}-anim-duration) var(--${cleanPrefix}-anim-easing) infinite ${dir};`,
        );
        break;
      }

      case "shimmer-sweep": {
        keyframesCss = `@keyframes ${animKeyframesName} {
  0% { background-position: 0% 0%; filter: brightness(1) contrast(100%); }
  50% { background-position: 100% 100%; filter: brightness(1.16) contrast(108%); }
  100% { background-position: 0% 100%; filter: brightness(1) contrast(100%); }
}`;
        animSurfaceProps = {
          backgroundSize: scalePct,
          animation: `${animKeyframesName} ${dur} ${ease} infinite ${dir}`,
          animationPlayState: playState,
        };
        animCssClassLines.push(
          `  background-size: var(--${cleanPrefix}-bg-size);`,
          `  animation: ${animKeyframesName} var(--${cleanPrefix}-anim-duration) var(--${cleanPrefix}-anim-easing) infinite ${dir};`,
        );
        break;
      }
    }
  }

  const surfaceStyle: React.CSSProperties = {
    backgroundColor:
      isMeshOrBlobs || config.category === "mask" ? config.backdropColor : undefined,
    backgroundImage: baseGradientInlineExpr,
    filter: baseFilter,
    ...animSurfaceProps,
  };

  // 4. Build CSS Code Output (with CSS Variables)
  const rootVarLines = stopVars.map((sv) => {
    const commentSuffix = sv.displayComment ? ` /* ${sv.displayComment} */` : "";
    return `  ${sv.varName}: ${sv.cssValue};${commentSuffix}`;
  });

  if (isMeshOrBlobs || config.category === "mask") {
    rootVarLines.push(`  --${cleanPrefix}-backdrop: ${config.backdropColor};`);
  }

  for (const extra of extraCssVariables) {
    rootVarLines.push(`  ${extra.name}: ${extra.value};`);
  }

  const combinedBgVarValue =
    extraCssVariables.length > 0 && config.category !== "mask"
      ? `var(${extraCssVariables[0].name}),\n    ${baseGradientVarExpr}`
      : baseGradientVarExpr;

  rootVarLines.push(`  --${cleanPrefix}-bg: ${combinedBgVarValue};`);

  for (const animVar of animCssVars) {
    rootVarLines.push(`  ${animVar.name}: ${animVar.value};`);
  }

  const cssClassProps: string[] = [];
  if (isMeshOrBlobs || config.category === "mask") {
    cssClassProps.push(`  background-color: var(--${cleanPrefix}-backdrop);`);
  }
  cssClassProps.push(`  background-image: var(--${cleanPrefix}-bg);`);

  if (config.category === "halftone") {
    cssClassProps.push(
      `  background-size: var(--${cleanPrefix}-halftone-size), 100% 100%;`,
      `  background-blend-mode: overlay, normal;`,
    );
  } else if (config.category === "cyber-grid") {
    cssClassProps.push(
      `  background-size: var(--${cleanPrefix}-cyber-grid-size), 100% 100%;`,
      `  background-blend-mode: screen, normal;`,
    );
  } else if (overlayStyle?.mixBlendMode) {
    cssClassProps.push(`  background-blend-mode: ${overlayStyle.mixBlendMode}, normal;`);
  }
  for (const rule of extraCssRules) {
    cssClassProps.push(`  ${rule}`);
  }
  for (const animLine of animCssClassLines) {
    cssClassProps.push(animLine);
  }

  const cssCode = `:root {
  /* ${config.category.toUpperCase()} Gradient Color Stops (${options.colorFormat.toUpperCase()}) */
${rootVarLines.join("\n")}
}${keyframesCss ? `\n\n${keyframesCss}` : ""}

.${cleanPrefix}-surface {
${cssClassProps.join("\n")}
}`;

  // 5. Build Tailwind CSS (using CSS Variables) Code Output
  const twAnimClasses = anim?.enabled
    ? ` bg-[length:var(--${cleanPrefix}-bg-size)] animate-[${animKeyframesName}_var(--${cleanPrefix}-anim-duration)_var(--${cleanPrefix}-anim-easing)_infinite_${anim.direction}]`
    : "";

  const tailwindCode = `/* 1. Add your CSS Variables${anim?.enabled ? " & Keyframes" : ""} to globals.css / styles.css */
:root {
${rootVarLines.join("\n")}
}${keyframesCss ? `\n\n${keyframesCss}` : ""}

/* 2. Use directly in Tailwind CSS v4 via CSS Variable arbitrary utilities */
<div class="${
    isMeshOrBlobs || config.category === "mask"
      ? `bg-[color:var(--${cleanPrefix}-backdrop)] `
      : ""
  }bg-[image:var(--${cleanPrefix}-bg)]${
    overlayStyle?.mixBlendMode ? ` bg-blend-${overlayStyle.mixBlendMode}` : ""
  }${twAnimClasses} rounded-2xl p-8">
  <!-- Your content -->
</div>`;

  return {
    surfaceStyle,
    overlayStyle,
    keyframesCss,
    cssCode,
    tailwindCode,
  };
}
