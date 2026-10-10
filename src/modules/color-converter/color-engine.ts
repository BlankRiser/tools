/**
 * Comprehensive bidirectional color conversion engine.
 * Supports HEX, HEX8, RGB, RGBA, HSL, HSLA, HSV/HSB, HWB, CMYK,
 * OKLCH, OKLAB, CIE LAB (D65), CIE LCH, CIE XYZ, Float/GLSL RGB,
 * 32-bit ARGB/HEX literals, CSS Named Colors, and closest Tailwind shades.
 */

export interface RgbaColor {
  /** Red 0 - 255 */
  r: number;
  /** Green 0 - 255 */
  g: number;
  /** Blue 0 - 255 */
  b: number;
  /** Alpha 0 - 1 */
  a: number;
}

export interface HslaColor {
  /** Hue 0 - 360 */
  h: number;
  /** Saturation 0 - 100 */
  s: number;
  /** Lightness 0 - 100 */
  l: number;
  /** Alpha 0 - 1 */
  a: number;
}

export interface HsvaColor {
  /** Hue 0 - 360 */
  h: number;
  /** Saturation 0 - 100 */
  s: number;
  /** Value / Brightness 0 - 100 */
  v: number;
  /** Alpha 0 - 1 */
  a: number;
}

export interface HwbaColor {
  /** Hue 0 - 360 */
  h: number;
  /** Whiteness 0 - 100 */
  w: number;
  /** Blackness 0 - 100 */
  b: number;
  /** Alpha 0 - 1 */
  a: number;
}

export interface CmykColor {
  /** Cyan 0 - 100 */
  c: number;
  /** Magenta 0 - 100 */
  m: number;
  /** Yellow 0 - 100 */
  y: number;
  /** Key (Black) 0 - 100 */
  k: number;
}

export interface OklabColor {
  /** Perceived Lightness 0 - 1 */
  l: number;
  /** Green-Red axis ~ -0.4 to 0.4 */
  a: number;
  /** Blue-Yellow axis ~ -0.4 to 0.4 */
  b: number;
  /** Alpha 0 - 1 */
  alpha: number;
}

export interface OklchColor {
  /** Perceived Lightness 0 - 100 (%) */
  l: number;
  /** Chroma 0 - 0.4 */
  c: number;
  /** Hue 0 - 360 */
  h: number;
  /** Alpha 0 - 1 */
  alpha: number;
}

export interface CieLabColor {
  /** L* 0 - 100 */
  l: number;
  /** a* -128 to 127 */
  a: number;
  /** b* -128 to 127 */
  b: number;
  /** Alpha 0 - 1 */
  alpha: number;
}

export interface CieLchColor {
  /** L* 0 - 100 */
  l: number;
  /** Chroma 0 - 150 */
  c: number;
  /** Hue 0 - 360 */
  h: number;
  /** Alpha 0 - 1 */
  alpha: number;
}

export type ColorFormatId =
  | "hex"
  | "hex8"
  | "rgb"
  | "rgba"
  | "rgb-modern"
  | "hsl"
  | "hsla"
  | "hsv"
  | "hwb"
  | "cmyk"
  | "oklch"
  | "oklab"
  | "lab"
  | "lch"
  | "glsl"
  | "argb-int";

export interface ColorFormatDefinition {
  id: ColorFormatId;
  label: string;
  badge: string;
  description: string;
  placeholder: string;
  format: (rgba: RgbaColor) => string;
}

// ============================================================================
// Math & Clamping Helpers
// ============================================================================

export function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, val));
}

export function roundTo(val: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

function normalizeHue(h: number): number {
  const mod = h % 360;
  return mod < 0 ? mod + 360 : mod;
}

// ============================================================================
// Core Conversions: RGBA <-> HEX / HSL / HSV / HWB / CMYK / OKLAB / OKLCH / LAB / LCH
// ============================================================================

export function rgbaToHex(rgba: RgbaColor, includeAlpha = false): string {
  const r = clamp(Math.round(rgba.r), 0, 255).toString(16).padStart(2, "0");
  const g = clamp(Math.round(rgba.g), 0, 255).toString(16).padStart(2, "0");
  const b = clamp(Math.round(rgba.b), 0, 255).toString(16).padStart(2, "0");
  if (!includeAlpha) {
    return `#${r}${g}${b}`.toUpperCase();
  }
  const a = clamp(Math.round(rgba.a * 255), 0, 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}${a}`.toUpperCase();
}

export function rgbaToHsla(rgba: RgbaColor): HslaColor {
  const r = clamp(rgba.r, 0, 255) / 255;
  const g = clamp(rgba.g, 0, 255) / 255;
  const b = clamp(rgba.b, 0, 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return {
    h: roundTo(h, 1),
    s: roundTo(s * 100, 1),
    l: roundTo(l * 100, 1),
    a: roundTo(clamp(rgba.a, 0, 1), 2),
  };
}

export function hslaToRgba(hsla: HslaColor): RgbaColor {
  const h = normalizeHue(hsla.h) / 360;
  const s = clamp(hsla.s, 0, 100) / 100;
  const l = clamp(hsla.l, 0, 100) / 100;
  const a = clamp(hsla.a, 0, 1);

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v, a };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    a,
  };
}

export function rgbaToHsva(rgba: RgbaColor): HsvaColor {
  const r = clamp(rgba.r, 0, 255) / 255;
  const g = clamp(rgba.g, 0, 255) / 255;
  const b = clamp(rgba.b, 0, 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return {
    h: roundTo(h, 1),
    s: roundTo(s * 100, 1),
    v: roundTo(v * 100, 1),
    a: roundTo(clamp(rgba.a, 0, 1), 2),
  };
}

export function hsvaToRgba(hsva: HsvaColor): RgbaColor {
  const h = normalizeHue(hsva.h) / 60;
  const s = clamp(hsva.s, 0, 100) / 100;
  const v = clamp(hsva.v, 0, 100) / 100;
  const a = clamp(hsva.a, 0, 1);

  const i = Math.floor(h);
  const f = h - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  let r = 0;
  let g = 0;
  let b = 0;

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a,
  };
}

export function rgbaToHwba(rgba: RgbaColor): HwbaColor {
  const hsv = rgbaToHsva(rgba);
  const r = clamp(rgba.r, 0, 255) / 255;
  const g = clamp(rgba.g, 0, 255) / 255;
  const b = clamp(rgba.b, 0, 255) / 255;

  const w = Math.min(r, g, b);
  const bl = 1 - Math.max(r, g, b);

  return {
    h: hsv.h,
    w: roundTo(w * 100, 1),
    b: roundTo(bl * 100, 1),
    a: hsv.a,
  };
}

export function hwbaToRgba(hwba: HwbaColor): RgbaColor {
  let w = clamp(hwba.w, 0, 100) / 100;
  let b = clamp(hwba.b, 0, 100) / 100;
  const sum = w + b;
  if (sum > 1) {
    w /= sum;
    b /= sum;
  }
  const pure = hsvaToRgba({ h: hwba.h, s: 100, v: 100, a: hwba.a });
  const factor = 1 - w - b;

  return {
    r: Math.round(((pure.r / 255) * factor + w) * 255),
    g: Math.round(((pure.g / 255) * factor + w) * 255),
    b: Math.round(((pure.b / 255) * factor + w) * 255),
    a: clamp(hwba.a, 0, 1),
  };
}

export function rgbaToCmyk(rgba: RgbaColor): CmykColor {
  const r = clamp(rgba.r, 0, 255) / 255;
  const g = clamp(rgba.g, 0, 255) / 255;
  const b = clamp(rgba.b, 0, 255) / 255;

  const k = 1 - Math.max(r, g, b);
  if (k >= 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: roundTo(c * 100, 1),
    m: roundTo(m * 100, 1),
    y: roundTo(y * 100, 1),
    k: roundTo(k * 100, 1),
  };
}

export function cmykToRgba(cmyk: CmykColor, alpha = 1): RgbaColor {
  const c = clamp(cmyk.c, 0, 100) / 100;
  const m = clamp(cmyk.m, 0, 100) / 100;
  const y = clamp(cmyk.y, 0, 100) / 100;
  const k = clamp(cmyk.k, 0, 100) / 100;

  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
    a: clamp(alpha, 0, 1),
  };
}

// ============================================================================
// Linear sRGB <-> OKLAB / OKLCH & CIE XYZ / LAB / LCH
// ============================================================================

function srgbToLinear(channel255: number): number {
  const c = clamp(channel255, 0, 255) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(linear: number): number {
  const clamped = clamp(linear, 0, 1);
  const c = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(clamp(c * 255, 0, 255));
}

export function rgbaToOklab(rgba: RgbaColor): OklabColor {
  const r = srgbToLinear(rgba.r);
  const g = srgbToLinear(rgba.g);
  const b = srgbToLinear(rgba.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    l: roundTo(0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 4),
    a: roundTo(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 4),
    b: roundTo(0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s, 4),
    alpha: roundTo(clamp(rgba.a, 0, 1), 2),
  };
}

export function oklabToRgba(oklab: OklabColor): RgbaColor {
  const L = clamp(oklab.l, 0, 1);
  const a = oklab.a;
  const b = oklab.b;

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: linearToSrgb(rLin),
    g: linearToSrgb(gLin),
    b: linearToSrgb(bLin),
    a: clamp(oklab.alpha, 0, 1),
  };
}

export function rgbaToOklch(rgba: RgbaColor): OklchColor {
  const lab = rgbaToOklab(rgba);
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  const h = c < 0.0001 ? 0 : normalizeHue((Math.atan2(lab.b, lab.a) * 180) / Math.PI);

  return {
    l: roundTo(lab.l * 100, 2),
    c: roundTo(c, 4),
    h: roundTo(h, 1),
    alpha: lab.alpha,
  };
}

export function oklchToRgba(oklch: OklchColor): RgbaColor {
  const L = clamp(oklch.l, 0, 100) / 100;
  const C = Math.max(0, oklch.c);
  const hRad = (normalizeHue(oklch.h) * Math.PI) / 180;

  return oklabToRgba({
    l: L,
    a: C * Math.cos(hRad),
    b: C * Math.sin(hRad),
    alpha: oklch.alpha,
  });
}

export function rgbaToCieLab(rgba: RgbaColor): CieLabColor {
  const r = srgbToLinear(rgba.r);
  const g = srgbToLinear(rgba.g);
  const b = srgbToLinear(rgba.b);

  // sRGB to XYZ (D65)
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1.0;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return {
    l: roundTo(116 * fy - 16, 1),
    a: roundTo(500 * (fx - fy), 1),
    b: roundTo(200 * (fy - fz), 1),
    alpha: roundTo(clamp(rgba.a, 0, 1), 2),
  };
}

export function cieLabToRgba(lab: CieLabColor): RgbaColor {
  const fy = (clamp(lab.l, 0, 100) + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const invF = (t: number) => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };

  const x = invF(fx) * 0.95047;
  const y = invF(fy) * 1.0;
  const z = invF(fz) * 1.08883;

  const rLin = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const gLin = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const bLin = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  return {
    r: linearToSrgb(rLin),
    g: linearToSrgb(gLin),
    b: linearToSrgb(bLin),
    a: clamp(lab.alpha, 0, 1),
  };
}

export function rgbaToCieLch(rgba: RgbaColor): CieLchColor {
  const lab = rgbaToCieLab(rgba);
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  const h = c < 0.01 ? 0 : normalizeHue((Math.atan2(lab.b, lab.a) * 180) / Math.PI);

  return {
    l: lab.l,
    c: roundTo(c, 1),
    h: roundTo(h, 1),
    alpha: lab.alpha,
  };
}

export function cieLchToRgba(lch: CieLchColor): RgbaColor {
  const hRad = (normalizeHue(lch.h) * Math.PI) / 180;
  return cieLabToRgba({
    l: lch.l,
    a: lch.c * Math.cos(hRad),
    b: lch.c * Math.sin(hRad),
    alpha: lch.alpha,
  });
}

// ============================================================================
// Standard CSS Named Colors (148 standard names)
// ============================================================================

export const CSS_NAMED_COLORS: Record<string, string> = {
  aliceblue: "#F0F8FF",
  antiquewhite: "#FAEBD7",
  aqua: "#00FFFF",
  aquamarine: "#7FFFD4",
  azure: "#F0FFFF",
  beige: "#F5F5DC",
  bisque: "#FFE4C4",
  black: "#000000",
  blanchedalmond: "#FFEBCD",
  blue: "#0000FF",
  blueviolet: "#8A2BE2",
  brown: "#A52A2A",
  burlywood: "#DEB887",
  cadetblue: "#5F9EA0",
  chartreuse: "#7FFF00",
  chocolate: "#D2691E",
  coral: "#FF7F50",
  cornflowerblue: "#6495ED",
  cornsilk: "#FFF8DC",
  crimson: "#DC143C",
  cyan: "#00FFFF",
  darkblue: "#00008B",
  darkcyan: "#008B8B",
  darkgoldenrod: "#B8860B",
  darkgray: "#A9A9A9",
  darkgreen: "#006400",
  darkgrey: "#A9A9A9",
  darkkhaki: "#BDB76B",
  darkmagenta: "#8B008B",
  darkolivegreen: "#556B2F",
  darkorange: "#FF8C00",
  darkorchid: "#9932CC",
  darkred: "#8B0000",
  darksalmon: "#E9967A",
  darkseagreen: "#8FBC8F",
  darkslateblue: "#483D8B",
  darkslategray: "#2F4F4F",
  darkslategrey: "#2F4F4F",
  darkturquoise: "#00CED1",
  darkviolet: "#9400D3",
  deeppink: "#FF1493",
  deepskyblue: "#00BFFF",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1E90FF",
  firebrick: "#B22222",
  floralwhite: "#FFFAF0",
  forestgreen: "#228B22",
  fuchsia: "#FF00FF",
  gainsboro: "#DCDCDC",
  ghostwhite: "#F8F8FF",
  gold: "#FFD700",
  goldenrod: "#DAA520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#ADFF2F",
  grey: "#808080",
  honeydew: "#F0FFF0",
  hotpink: "#FF69B4",
  indianred: "#CD5C5C",
  indigo: "#4B0082",
  ivory: "#FFFFF0",
  khaki: "#F0E68C",
  lavender: "#E6E6FA",
  lavenderblush: "#FFF0F5",
  lawngreen: "#7CFC00",
  lemonchiffon: "#FFFACD",
  lightblue: "#ADD8E6",
  lightcoral: "#F08080",
  lightcyan: "#E0FFFF",
  lightgoldenrodyellow: "#FAFAD2",
  lightgray: "#D3D3D3",
  lightgreen: "#90EE90",
  lightgrey: "#D3D3D3",
  lightpink: "#FFB6C1",
  lightsalmon: "#FFA07A",
  lightseagreen: "#20B2AA",
  lightskyblue: "#87CEFA",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#B0C4DE",
  lightyellow: "#FFFFE0",
  lime: "#00FF00",
  limegreen: "#32CD32",
  linen: "#FAF0E6",
  magenta: "#FF00FF",
  maroon: "#800000",
  mediumaquamarine: "#66CDAA",
  mediumblue: "#0000CD",
  mediumorchid: "#BA55D3",
  mediumpurple: "#9370DB",
  mediumseagreen: "#3CB371",
  mediumslateblue: "#7B68EE",
  mediumspringgreen: "#00FA9A",
  mediumturquoise: "#48D1CC",
  mediumvioletred: "#C71585",
  midnightblue: "#191970",
  mintcream: "#F5FFFA",
  mistyrose: "#FFE4E1",
  moccasin: "#FFE4B5",
  navajowhite: "#FFDEAD",
  navy: "#000080",
  oldlace: "#FDF5E6",
  olive: "#808000",
  olivedrab: "#6B8E23",
  orange: "#FFA500",
  orangered: "#FF4500",
  orchid: "#DA70D6",
  palegoldenrod: "#EEE8AA",
  palegreen: "#98FB98",
  paleturquoise: "#AFEEEE",
  palevioletred: "#DB7093",
  papayawhip: "#FFEFD5",
  peachpuff: "#FFDAB9",
  peru: "#CD853F",
  pink: "#FFC0CB",
  plum: "#DDA0DD",
  powderblue: "#B0E0E6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#FF0000",
  rosybrown: "#BC8F8F",
  royalblue: "#4169E1",
  saddlebrown: "#8B4513",
  salmon: "#FA8072",
  sandybrown: "#F4A460",
  seagreen: "#2E8B57",
  seashell: "#FFF5EE",
  sienna: "#A0522D",
  silver: "#C0C0C0",
  skyblue: "#87CEEB",
  slateblue: "#6A5ACD",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#FFFAFA",
  springgreen: "#00FF7F",
  steelblue: "#4682B4",
  tan: "#D2B48C",
  teal: "#008080",
  thistle: "#D8BFD8",
  tomato: "#FF6347",
  turquoise: "#40E0D0",
  violet: "#EE82EE",
  wheat: "#F5DEB3",
  white: "#FFFFFF",
  whitesmoke: "#F5F5F5",
  yellow: "#FFFF00",
  yellowgreen: "#9ACD32",
};

// Popular Tailwind CSS v4 Reference Palette for Closest Token Matching
export const TAILWIND_REFERENCE_COLORS: Array<{ token: string; hex: string }> = [
  { token: "slate-50", hex: "#F8FAFC" },
  { token: "slate-200", hex: "#E2E8F0" },
  { token: "slate-400", hex: "#94A3B8" },
  { token: "slate-500", hex: "#64748B" },
  { token: "slate-700", hex: "#334155" },
  { token: "slate-900", hex: "#0F172A" },
  { token: "red-400", hex: "#F87171" },
  { token: "red-500", hex: "#EF4444" },
  { token: "red-600", hex: "#DC2626" },
  { token: "orange-400", hex: "#FB923C" },
  { token: "orange-500", hex: "#F97316" },
  { token: "orange-600", hex: "#EA580C" },
  { token: "amber-400", hex: "#FBBF24" },
  { token: "amber-500", hex: "#F59E0B" },
  { token: "amber-600", hex: "#D97706" },
  { token: "yellow-400", hex: "#FACC15" },
  { token: "yellow-500", hex: "#EAB308" },
  { token: "lime-500", hex: "#84CC16" },
  { token: "green-500", hex: "#22C55E" },
  { token: "green-600", hex: "#16A34A" },
  { token: "emerald-400", hex: "#34D399" },
  { token: "emerald-500", hex: "#10B981" },
  { token: "emerald-600", hex: "#059669" },
  { token: "teal-500", hex: "#14B8A6" },
  { token: "cyan-400", hex: "#22D3EE" },
  { token: "cyan-500", hex: "#06B6D4" },
  { token: "sky-400", hex: "#38BDF8" },
  { token: "sky-500", hex: "#0EA5E9" },
  { token: "blue-400", hex: "#60A5FA" },
  { token: "blue-500", hex: "#3B82F6" },
  { token: "blue-600", hex: "#2563EB" },
  { token: "blue-700", hex: "#1D4ED8" },
  { token: "indigo-500", hex: "#6366F1" },
  { token: "indigo-600", hex: "#4F46E5" },
  { token: "violet-500", hex: "#8B5CF6" },
  { token: "violet-600", hex: "#7C3AED" },
  { token: "purple-500", hex: "#A855F7" },
  { token: "purple-600", hex: "#9333EA" },
  { token: "fuchsia-500", hex: "#D946EF" },
  { token: "pink-500", hex: "#EC4899" },
  { token: "rose-500", hex: "#F43F5E" },
  { token: "rose-600", hex: "#E11D48" },
];

// ============================================================================
// Universal Color String Parser
// ============================================================================

export interface ParsedColorResult {
  rgba: RgbaColor;
  detectedFormat: string;
}

function parseAlphaToken(token: string | undefined): number {
  if (!token) return 1;
  const trimmed = token.trim();
  if (!trimmed) return 1;
  if (trimmed.endsWith("%")) {
    return clamp(Number.parseFloat(trimmed) / 100, 0, 1);
  }
  return clamp(Number.parseFloat(trimmed), 0, 1);
}

function parseHexToRgba(hexStr: string): RgbaColor | null {
  const clean = hexStr.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(clean)) return null;

  if (clean.length === 3) {
    const r = Number.parseInt(clean[0] + clean[0], 16);
    const g = Number.parseInt(clean[1] + clean[1], 16);
    const b = Number.parseInt(clean[2] + clean[2], 16);
    return { r, g, b, a: 1 };
  }
  if (clean.length === 4) {
    const r = Number.parseInt(clean[0] + clean[0], 16);
    const g = Number.parseInt(clean[1] + clean[1], 16);
    const b = Number.parseInt(clean[2] + clean[2], 16);
    const a = roundTo(Number.parseInt(clean[3] + clean[3], 16) / 255, 2);
    return { r, g, b, a };
  }
  if (clean.length === 6) {
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  if (clean.length === 8) {
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    const a = roundTo(Number.parseInt(clean.slice(6, 8), 16) / 255, 2);
    return { r, g, b, a };
  }
  return null;
}

/**
 * Splits functional arguments like `(255, 100, 50, 0.8)` or `(255 100 50 / 80%)`
 */
function extractArgsAndAlpha(inner: string): { parts: string[]; alpha?: string } {
  const slashSplit = inner.split("/");
  const mainPart = slashSplit[0].trim();
  const slashAlpha = slashSplit[1]?.trim();

  const parts = mainPart
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (slashAlpha !== undefined) {
    return { parts, alpha: slashAlpha };
  }
  return { parts };
}

function parseAngleDeg(token: string): number {
  const lower = token.toLowerCase().trim();
  const num = Number.parseFloat(lower);
  if (Number.isNaN(num)) return 0;
  if (lower.endsWith("turn")) return num * 360;
  if (lower.endsWith("rad")) return (num * 180) / Math.PI;
  if (lower.endsWith("grad")) return num * 0.9;
  return num;
}

/**
 * Parses any supported color string into `RgbaColor` + detected format name.
 */
export function parseAnyColorInput(input: string): ParsedColorResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  // 1. Named CSS Color
  if (CSS_NAMED_COLORS[lower]) {
    const rgba = parseHexToRgba(CSS_NAMED_COLORS[lower]);
    if (rgba) return { rgba, detectedFormat: `CSS Named (${lower})` };
  }

  // 2. 0xAARRGGBB or 0xRRGGBB or Color(0xAARRGGBB)
  const hexLiteralMatch = lower.match(/^(?:color\(\s*)?0x([0-9a-f]{6}|[0-9a-f]{8})\s*\)?$/i);
  if (hexLiteralMatch) {
    const hexDigits = hexLiteralMatch[1];
    if (hexDigits.length === 8) {
      const a = roundTo(Number.parseInt(hexDigits.slice(0, 2), 16) / 255, 2);
      const r = Number.parseInt(hexDigits.slice(2, 4), 16);
      const g = Number.parseInt(hexDigits.slice(4, 6), 16);
      const b = Number.parseInt(hexDigits.slice(6, 8), 16);
      return { rgba: { r, g, b, a }, detectedFormat: "32-bit ARGB Literal" };
    }
    const r = Number.parseInt(hexDigits.slice(0, 2), 16);
    const g = Number.parseInt(hexDigits.slice(2, 4), 16);
    const b = Number.parseInt(hexDigits.slice(4, 6), 16);
    return { rgba: { r, g, b, a: 1 }, detectedFormat: "Hex Integer Literal" };
  }

  // 3. HEX (#RGB, #RGBA, #RRGGBB, #RRGGBBAA or bare 6/8 hex digits)
  if (trimmed.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    const rgba = parseHexToRgba(trimmed);
    if (rgba) {
      const cleanLen = trimmed.replace(/^#/, "").length;
      return {
        rgba,
        detectedFormat: cleanLen === 8 || cleanLen === 4 ? "HEX8 (Alpha)" : "HEX",
      };
    }
  }

  // 4. Functional syntax: fn(...)
  const fnMatch = lower.match(/^([a-z0-9-]+)\((.+)\)$/);
  if (fnMatch) {
    const fnName = fnMatch[1];
    const inner = fnMatch[2];
    const { parts, alpha: slashAlpha } = extractArgsAndAlpha(inner);

    // RGB / RGBA
    if ((fnName === "rgb" || fnName === "rgba") && parts.length >= 3) {
      const parseRgbChan = (tok: string) => {
        if (tok.endsWith("%")) {
          return Math.round(clamp((Number.parseFloat(tok) / 100) * 255, 0, 255));
        }
        return Math.round(clamp(Number.parseFloat(tok), 0, 255));
      };
      const r = parseRgbChan(parts[0]);
      const g = parseRgbChan(parts[1]);
      const b = parseRgbChan(parts[2]);
      const a = parseAlphaToken(slashAlpha ?? parts[3]);
      if ([r, g, b].some(Number.isNaN)) return null;
      return {
        rgba: { r, g, b, a },
        detectedFormat: fnName === "rgba" || slashAlpha || parts[3] ? "RGBA" : "RGB",
      };
    }

    // GLSL vec3 / vec4 (0.0 - 1.0 floats)
    if ((fnName === "vec3" || fnName === "vec4") && parts.length >= 3) {
      const r = Math.round(clamp(Number.parseFloat(parts[0]) * 255, 0, 255));
      const g = Math.round(clamp(Number.parseFloat(parts[1]) * 255, 0, 255));
      const b = Math.round(clamp(Number.parseFloat(parts[2]) * 255, 0, 255));
      const a = parts[3] !== undefined ? clamp(Number.parseFloat(parts[3]), 0, 1) : 1;
      if ([r, g, b].some(Number.isNaN)) return null;
      return { rgba: { r, g, b, a }, detectedFormat: "GLSL Float Vector" };
    }

    // HSL / HSLA
    if ((fnName === "hsl" || fnName === "hsla") && parts.length >= 3) {
      const h = parseAngleDeg(parts[0]);
      const s = Number.parseFloat(parts[1]);
      const l = Number.parseFloat(parts[2]);
      const a = parseAlphaToken(slashAlpha ?? parts[3]);
      if ([h, s, l].some(Number.isNaN)) return null;
      return {
        rgba: hslaToRgba({ h, s, l, a }),
        detectedFormat: fnName === "hsla" || slashAlpha || parts[3] ? "HSLA" : "HSL",
      };
    }

    // HSV / HSVA / HSB / HSBA
    if ((fnName === "hsv" || fnName === "hsva" || fnName === "hsb" || fnName === "hsba") && parts.length >= 3) {
      const h = parseAngleDeg(parts[0]);
      const s = Number.parseFloat(parts[1]);
      const v = Number.parseFloat(parts[2]);
      const a = parseAlphaToken(slashAlpha ?? parts[3]);
      if ([h, s, v].some(Number.isNaN)) return null;
      return {
        rgba: hsvaToRgba({ h, s, v, a }),
        detectedFormat: "HSV / HSB",
      };
    }

    // HWB / HWBA
    if ((fnName === "hwb" || fnName === "hwba") && parts.length >= 3) {
      const h = parseAngleDeg(parts[0]);
      const w = Number.parseFloat(parts[1]);
      const b = Number.parseFloat(parts[2]);
      const a = parseAlphaToken(slashAlpha ?? parts[3]);
      if ([h, w, b].some(Number.isNaN)) return null;
      return {
        rgba: hwbaToRgba({ h, w, b, a }),
        detectedFormat: "HWB",
      };
    }

    // CMYK / device-cmyk
    if ((fnName === "cmyk" || fnName === "device-cmyk") && parts.length >= 4) {
      const parseCmykVal = (tok: string) => {
        const val = Number.parseFloat(tok);
        if ( !tok.endsWith("%") && val >= 0 && val <= 1 && inner.includes(".")) {
          return val * 100;
        }
        return val;
      };
      const c = parseCmykVal(parts[0]);
      const m = parseCmykVal(parts[1]);
      const y = parseCmykVal(parts[2]);
      const k = parseCmykVal(parts[3]);
      const a = parseAlphaToken(slashAlpha ?? parts[4]);
      if ([c, m, y, k].some(Number.isNaN)) return null;
      return {
        rgba: cmykToRgba({ c, m, y, k }, a),
        detectedFormat: "CMYK",
      };
    }

    // OKLCH
    if (fnName === "oklch" && parts.length >= 3) {
      let l = Number.parseFloat(parts[0]);
      if (!parts[0].endsWith("%") && l <= 1) {
        l *= 100;
      }
      let c = Number.parseFloat(parts[1]);
      if (parts[1].endsWith("%")) {
        c = (c / 100) * 0.4;
      }
      const h = parseAngleDeg(parts[2]);
      const alpha = parseAlphaToken(slashAlpha ?? parts[3]);
      if ([l, c, h].some(Number.isNaN)) return null;
      return {
        rgba: oklchToRgba({ l, c, h, alpha }),
        detectedFormat: "OKLCH",
      };
    }

    // OKLAB
    if (fnName === "oklab" && parts.length >= 3) {
      let l = Number.parseFloat(parts[0]);
      if (parts[0].endsWith("%")) {
        l /= 100;
      }
      const a = Number.parseFloat(parts[1]);
      const b = Number.parseFloat(parts[2]);
      const alpha = parseAlphaToken(slashAlpha ?? parts[3]);
      if ([l, a, b].some(Number.isNaN)) return null;
      return {
        rgba: oklabToRgba({ l, a, b, alpha }),
        detectedFormat: "OKLAB",
      };
    }

    // CIE LAB
    if (fnName === "lab" && parts.length >= 3) {
      const l = Number.parseFloat(parts[0]);
      const a = Number.parseFloat(parts[1]);
      const b = Number.parseFloat(parts[2]);
      const alpha = parseAlphaToken(slashAlpha ?? parts[3]);
      if ([l, a, b].some(Number.isNaN)) return null;
      return {
        rgba: cieLabToRgba({ l, a, b, alpha }),
        detectedFormat: "CIE LAB",
      };
    }

    // CIE LCH
    if (fnName === "lch" && parts.length >= 3) {
      const l = Number.parseFloat(parts[0]);
      const c = Number.parseFloat(parts[1]);
      const h = parseAngleDeg(parts[2]);
      const alpha = parseAlphaToken(slashAlpha ?? parts[3]);
      if ([l, c, h].some(Number.isNaN)) return null;
      return {
        rgba: cieLchToRgba({ l, c, h, alpha }),
        detectedFormat: "CIE LCH",
      };
    }
  }

  // 5. Bare comma/space separated 3 numbers (e.g. "59, 130, 246")
  const bareNums = trimmed
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bareNums.length === 3 && bareNums.every((n) => /^\d+(\.\d+)?$/.test(n))) {
    const r = Number.parseFloat(bareNums[0]);
    const g = Number.parseFloat(bareNums[1]);
    const b = Number.parseFloat(bareNums[2]);
    if (r <= 1 && g <= 1 && b <= 1 && trimmed.includes(".")) {
      return {
        rgba: {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255),
          a: 1,
        },
        detectedFormat: "Normalized RGB (0–1)",
      };
    }
    return {
      rgba: {
        r: clamp(Math.round(r), 0, 255),
        g: clamp(Math.round(g), 0, 255),
        b: clamp(Math.round(b), 0, 255),
        a: 1,
      },
      detectedFormat: "RGB Tuple",
    };
  }

  return null;
}

// ============================================================================
// Formatting Definitions for All Supported Conventions
// ============================================================================

export const COLOR_FORMAT_DEFINITIONS: ColorFormatDefinition[] = [
  {
    id: "hex",
    label: "HEX",
    badge: "Web / CSS",
    description: "6-digit hexadecimal color notation",
    placeholder: "#2563EB",
    format: (rgba) => rgbaToHex(rgba, false),
  },
  {
    id: "hex8",
    label: "HEX8 (Alpha)",
    badge: "CSS4",
    description: "8-digit hexadecimal including alpha channel",
    placeholder: "#2563EBFF",
    format: (rgba) => rgbaToHex(rgba, true),
  },
  {
    id: "rgb",
    label: "RGB",
    badge: "sRGB",
    description: "Red, Green, Blue (0–255)",
    placeholder: "rgb(37, 99, 235)",
    format: (rgba) => `rgb(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)})`,
  },
  {
    id: "rgba",
    label: "RGBA",
    badge: "sRGB + Alpha",
    description: "Red, Green, Blue with opacity (0–1)",
    placeholder: "rgba(37, 99, 235, 1)",
    format: (rgba) => `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${roundTo(rgba.a, 2)})`,
  },
  {
    id: "rgb-modern",
    label: "CSS4 RGB",
    badge: "Space Syntax",
    description: "Modern CSS Color Level 4 space-separated syntax",
    placeholder: "rgb(37 99 235 / 100%)",
    format: (rgba) =>
      rgba.a < 1
        ? `rgb(${Math.round(rgba.r)} ${Math.round(rgba.g)} ${Math.round(rgba.b)} / ${roundTo(rgba.a * 100, 0)}%)`
        : `rgb(${Math.round(rgba.r)} ${Math.round(rgba.g)} ${Math.round(rgba.b)})`,
  },
  {
    id: "hsl",
    label: "HSL",
    badge: "Cylindrical",
    description: "Hue (0–360°), Saturation (%), Lightness (%)",
    placeholder: "hsl(221.2, 83.2%, 53.3%)",
    format: (rgba) => {
      const { h, s, l } = rgbaToHsla(rgba);
      return `hsl(${h}, ${s}%, ${l}%)`;
    },
  },
  {
    id: "hsla",
    label: "HSLA",
    badge: "HSL + Alpha",
    description: "Hue, Saturation, Lightness with opacity",
    placeholder: "hsla(221.2, 83.2%, 53.3%, 1)",
    format: (rgba) => {
      const { h, s, l, a } = rgbaToHsla(rgba);
      return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    },
  },
  {
    id: "hsv",
    label: "HSV / HSB",
    badge: "Figma / Design",
    description: "Hue (0–360°), Saturation (%), Value / Brightness (%)",
    placeholder: "hsv(221.2, 84.3%, 92.2%)",
    format: (rgba) => {
      const { h, s, v, a } = rgbaToHsva(rgba);
      return a < 1 ? `hsva(${h}, ${s}%, ${v}%, ${a})` : `hsv(${h}, ${s}%, ${v}%)`;
    },
  },
  {
    id: "hwb",
    label: "HWB",
    badge: "CSS4",
    description: "Hue (0–360°), Whiteness (%), Blackness (%)",
    placeholder: "hwb(221.2 14.5% 7.8%)",
    format: (rgba) => {
      const { h, w, b, a } = rgbaToHwba(rgba);
      return a < 1 ? `hwb(${h} ${w}% ${b}% / ${roundTo(a * 100, 0)}%)` : `hwb(${h} ${w}% ${b}%)`;
    },
  },
  {
    id: "cmyk",
    label: "CMYK",
    badge: "Print",
    description: "Cyan, Magenta, Yellow, Key / Black (%)",
    placeholder: "cmyk(84.3%, 57.9%, 0%, 7.8%)",
    format: (rgba) => {
      const { c, m, y, k } = rgbaToCmyk(rgba);
      return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
    },
  },
  {
    id: "oklch",
    label: "OKLCH",
    badge: "Tailwind v4",
    description: "Perceptually uniform Lightness, Chroma, Hue",
    placeholder: "oklch(54.61% 0.2152 262.9)",
    format: (rgba) => {
      const { l, c, h, alpha } = rgbaToOklch(rgba);
      return alpha < 1 ? `oklch(${l}% ${c} ${h} / ${roundTo(alpha * 100, 0)}%)` : `oklch(${l}% ${c} ${h})`;
    },
  },
  {
    id: "oklab",
    label: "OKLAB",
    badge: "Perceptual",
    description: "Oklab perceptual lightness and a/b opponent axes",
    placeholder: "oklab(0.5461 -0.0266 -0.2136)",
    format: (rgba) => {
      const { l, a, b, alpha } = rgbaToOklab(rgba);
      return alpha < 1 ? `oklab(${l} ${a} ${b} / ${roundTo(alpha * 100, 0)}%)` : `oklab(${l} ${a} ${b})`;
    },
  },
  {
    id: "lab",
    label: "CIE LAB",
    badge: "D65",
    description: "CIE 1976 L*a*b* device-independent color space",
    placeholder: "lab(43.9% 21.4 -73.2)",
    format: (rgba) => {
      const { l, a, b, alpha } = rgbaToCieLab(rgba);
      return alpha < 1 ? `lab(${l}% ${a} ${b} / ${roundTo(alpha * 100, 0)}%)` : `lab(${l}% ${a} ${b})`;
    },
  },
  {
    id: "lch",
    label: "CIE LCH",
    badge: "Cylindrical LAB",
    description: "Cylindrical representation of CIE L*a*b*",
    placeholder: "lch(43.9% 76.3 286.3)",
    format: (rgba) => {
      const { l, c, h, alpha } = rgbaToCieLch(rgba);
      return alpha < 1 ? `lch(${l}% ${c} ${h} / ${roundTo(alpha * 100, 0)}%)` : `lch(${l}% ${c} ${h})`;
    },
  },
  {
    id: "glsl",
    label: "Float / GLSL",
    badge: "Shader 0–1",
    description: "Normalized 0.0–1.0 RGBA vector for WebGL / shaders",
    placeholder: "vec4(0.145, 0.388, 0.922, 1.0)",
    format: (rgba) =>
      `vec4(${roundTo(rgba.r / 255, 3)}, ${roundTo(rgba.g / 255, 3)}, ${roundTo(rgba.b / 255, 3)}, ${roundTo(rgba.a, 2)})`,
  },
  {
    id: "argb-int",
    label: "32-bit ARGB Hex",
    badge: "Flutter / Android",
    description: "32-bit ARGB hexadecimal integer literal",
    placeholder: "0xFF2563EB",
    format: (rgba) => {
      const a = clamp(Math.round(rgba.a * 255), 0, 255)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase();
      const hex6 = rgbaToHex(rgba, false).slice(1);
      return `0x${a}${hex6}`;
    },
  },
];

// ============================================================================
// Contrast, Luminance, Closest Named Color & Harmonies
// ============================================================================

export function getRelativeLuminance(rgba: RgbaColor): number {
  const r = srgbToLinear(rgba.r);
  const g = srgbToLinear(rgba.g);
  const b = srgbToLinear(rgba.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(c1: RgbaColor, c2: RgbaColor): number {
  const l1 = getRelativeLuminance(c1);
  const l2 = getRelativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return roundTo((lighter + 0.05) / (darker + 0.05), 2);
}

function colorDistanceSquared(c1: RgbaColor, c2: RgbaColor): number {
  const rMean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  // Redmean weighted perceptual approximation
  return (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;
}

export function findClosestNamedColor(rgba: RgbaColor): {
  name: string;
  hex: string;
  exact: boolean;
} {
  let bestName = "black";
  let bestHex = "#000000";
  let bestDist = Number.POSITIVE_INFINITY;

  for (const [name, hex] of Object.entries(CSS_NAMED_COLORS)) {
    const target = parseHexToRgba(hex);
    if (!target) continue;
    const dist = colorDistanceSquared(rgba, target);
    if (dist < bestDist) {
      bestDist = dist;
      bestName = name;
      bestHex = hex;
      if (dist === 0) break;
    }
  }

  return {
    name: bestName,
    hex: bestHex,
    exact: bestDist === 0,
  };
}

export function findClosestTailwindColor(rgba: RgbaColor): {
  token: string;
  hex: string;
  exact: boolean;
} {
  let bestToken = "blue-600";
  let bestHex = "#2563EB";
  let bestDist = Number.POSITIVE_INFINITY;

  for (const item of TAILWIND_REFERENCE_COLORS) {
    const target = parseHexToRgba(item.hex);
    if (!target) continue;
    const dist = colorDistanceSquared(rgba, target);
    if (dist < bestDist) {
      bestDist = dist;
      bestToken = item.token;
      bestHex = item.hex;
      if (dist === 0) break;
    }
  }

  return {
    token: bestToken,
    hex: bestHex,
    exact: bestDist === 0,
  };
}

export function generateTintsAndShades(rgba: RgbaColor): Array<{
  step: number;
  hex: string;
  rgba: RgbaColor;
}> {
  const hsla = rgbaToHsla(rgba);
  const steps = [
    { step: 50, l: 96 },
    { step: 100, l: 91 },
    { step: 200, l: 82 },
    { step: 300, l: 71 },
    { step: 400, l: 60 },
    { step: 500, l: 50 },
    { step: 600, l: 41 },
    { step: 700, l: 33 },
    { step: 800, l: 24 },
    { step: 900, l: 16 },
    { step: 950, l: 10 },
  ];

  return steps.map(({ step, l }) => {
    const stepRgba = hslaToRgba({ h: hsla.h, s: hsla.s, l, a: 1 });
    return {
      step,
      hex: rgbaToHex(stepRgba, false),
      rgba: stepRgba,
    };
  });
}

export function generateColorHarmonies(rgba: RgbaColor): Array<{
  name: string;
  swatches: Array<{ hex: string; rgba: RgbaColor }>;
}> {
  const hsla = rgbaToHsla(rgba);
  const makeShift = (degOffset: number) => {
    const shifted = hslaToRgba({
      h: normalizeHue(hsla.h + degOffset),
      s: hsla.s,
      l: hsla.l,
      a: 1,
    });
    return { hex: rgbaToHex(shifted, false), rgba: shifted };
  };

  return [
    {
      name: "Complementary",
      swatches: [makeShift(0), makeShift(180)],
    },
    {
      name: "Analogous",
      swatches: [makeShift(-30), makeShift(0), makeShift(30)],
    },
    {
      name: "Triadic",
      swatches: [makeShift(0), makeShift(120), makeShift(240)],
    },
    {
      name: "Split-Complementary",
      swatches: [makeShift(0), makeShift(150), makeShift(210)],
    },
  ];
}
