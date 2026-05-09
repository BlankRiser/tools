import { ArrowsClockwiseIcon, ArrowsInIcon, CalendarIcon, CompassIcon, CursorTextIcon, EyeIcon, FileCodeIcon, HashIcon, ImageIcon, LinkIcon, ListBulletsIcon, MapPinIcon, MapTrifoldIcon, NavigationArrowIcon, PaletteIcon, PolygonIcon, QrCodeIcon, RulerIcon, TableIcon, TextAaIcon } from "@phosphor-icons/react";
import { linkOptions } from "@tanstack/react-router";

export const toolsList = linkOptions([
  {
    icon: MapTrifoldIcon,
    title: "Map Wallpaper",
    description: "Design high-res map wallpapers with custom themes and granular layer controls.",
    comingSoon: false,
    to: "/tools/$toolID",
    params: {
      toolID:"map-wallpaper"
    },
},
  {
    icon: PolygonIcon,
    title: "GeoJSON Viewer",
    description: "Paste GeoJSON and visualize geometries on an interactive map for quick debugging.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"geojson-viewer"
    },
  },
  {
    icon: CompassIcon,
    title: "Coordinate Converter",
    description: "Convert between lat/lng, DMS, UTM, and MGRS coordinate formats instantly.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"coordinate-converter"
    },
  },
  {
    icon: NavigationArrowIcon,
    title: "Distance Calculator",
    description: "Calculate haversine distance between two points on the globe.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"distance-calculator",
    },
  },
  {
    icon: ArrowsInIcon,
    title: "Bounding Box Picker",
    description: "Draw a rectangle on a map and copy the bbox coordinates for API queries.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"bounding-box-picker",
    },
  },
  {
    icon: MapPinIcon,
    title: "WKT ↔ GeoJSON",
    description: "Convert between Well-Known Text and GeoJSON geometry formats.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"wkt-geojson",
    },
  },
  {
    icon: QrCodeIcon,
    title: "QR Code Generator",
    description: "Generate QR codes from any text or URL.",
    comingSoon: false,
    to: "/tools/$toolID",
    params: {
      toolID:"qr-code-generator",
    },
  },
  {
    icon: CursorTextIcon,
    title: "Text Inspector",
    description: "Analyze characters, bytes, words, lines, ASCII/Unicode usage, and word frequency.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"text-inspector",
    },
  },
  {
    icon: PaletteIcon,
    title: "Color Generator",
    description: "Generate, convert, and explore color palettes across HEX, RGB, HSL, and more.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"color-generator",
    },
  },
  {
    icon: CalendarIcon,
    title: "Date Converter",
    description: "Convert dates across timezones and UTC with flexible formatting options.",
    comingSoon: false,
    to: "/tools/$toolID",
    params: {
      toolID:"date-time-converter",
    },
  },
  {
    icon: RulerIcon,
    title: "Unit Converter",
    description: "Convert between SI units — length, mass, temperature, volume, and more.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"unit-converter",
    },
  },
  {
    icon: ArrowsClockwiseIcon,
    title: "Diff Checker",
    description: "Compare two texts side-by-side and highlight additions, deletions, and changes.",
    comingSoon: false,
    to: "/tools/$toolID",
    params: {
      toolID:"diff-checker",
    },
  },
  {
    icon: ListBulletsIcon,
    title: "Sort Text",
    description: "Sort lines alphabetically with options to filter duplicates and strip numbers.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"sort-text",
    },
  },
  {
    icon: EyeIcon,
    title: "Markdown Previewer",
    description: "Write Markdown and see a live-rendered preview side by side.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"markdown-previewer",
    },
  },
  {
    icon: LinkIcon,
    title: "URL Parser",
    description: "Parse, inspect, and safely copy URLs. Automatically detects and strips tracking parameters.",
    comingSoon: false,
    to: "/tools/$toolID",
    params: {
      toolID:"url-parser",
    },
  },
  {
    icon: HashIcon,
    title: "Regex Tester",
    description: "Test regular expressions with live matching, capture groups, and flag toggles.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"regex-tester",
    },
  },
  {
    icon: FileCodeIcon,
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON with syntax highlighting and error reporting.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"json-formatter",
    },
  },
  {
    icon: ImageIcon,
    title: "Base64 Image Codec",
    description: "Encode images to Base64 strings or decode Base64 back to viewable images.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"base64-image-codec",
    },
  },
  {
    icon: TableIcon,
    title: "JSON ↔ CSV",
    description: "Convert between JSON and CSV formats with automatic column detection.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"json-csv",
    },
  },
  {
    icon: TextAaIcon,
    title: "String Case Converter",
    description: "Transform text between camelCase, snake_case, kebab-case, Title Case, and more.",
    comingSoon: true,
    to: "/tools/$toolID",
    params: {
      toolID:"string-case-converter",
    },
  },
]);


export type ToolID = typeof toolsList[number]["params"]["toolID"];