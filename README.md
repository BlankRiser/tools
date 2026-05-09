# DevHaven Tools

A curated collection of visual utilities, generators, and visualizers, designed for developers who care about craft.

## ✨ Tools

### Available

| Tool              | Description                                                                            |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Map Wallpaper** | Design & export high-res map wallpapers with custom themes and granular layer controls |
| Diff Checker      | Compare two texts side-by-side with highlighted changes                                |
| QR Code Generator | Generate QR codes from text or URLs                                                    |
| URL Parser        | Break down URLs into protocol, host, path, query params, and fragment                  |

### Coming Soon

#### 🗺️ Map & Geo

| Tool                 | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| GeoJSON Viewer       | Paste GeoJSON and visualize geometries on an interactive map |
| Coordinate Converter | Convert between lat/lng, DMS, UTM, and MGRS formats          |
| Distance Calculator  | Calculate haversine distance between two points              |
| Bounding Box Picker  | Draw a bbox on a map and copy coordinates for API queries    |
| WKT ↔ GeoJSON        | Convert between Well-Known Text and GeoJSON formats          |

#### 🔤 Text & Data

| Tool                  | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| Text Inspector        | Analyze characters, bytes, words, lines, ASCII/Unicode usage, and word frequency |
| Sort Text             | Sort lines with options to filter duplicates and strip numbers                   |
| String Case Converter | Transform between camelCase, snake_case, kebab-case, Title Case, etc.            |
| Markdown Previewer    | Write Markdown with a live-rendered preview                                      |
| Regex Tester          | Test regular expressions with live matching and capture groups                   |

#### 🛠️ Converters & Formatters

| Tool               | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| JSON Formatter     | Format, validate, and minify JSON with error reporting                |
| JSON ↔ CSV         | Bidirectional conversion with automatic column detection              |
| Base64 Image Codec | Encode images to Base64 or decode Base64 to images                    |
| URL Parser         | Break down URLs into protocol, host, path, query params, and fragment |
| Date Converter     | Convert dates across timezones and UTC with formatting options        |
| Unit Converter     | Convert between SI units — length, mass, temperature, volume          |

#### 🎨 Visual

| Tool              | Description                                   |
| ----------------- | --------------------------------------------- |
| QR Code Generator | Generate QR codes from text or URLs           |
| Color Generator   | Generate, convert, and explore color palettes |

## 🏗️ Tech Stack

- **Framework** — [Vite](https://vite.dev) + [React 19](https://react.dev)
- **Routing** — [TanStack Router](https://tanstack.com/router) (file-based)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **Components** — [Base UI](https://base-ui.com) + [shadcn/ui](https://ui.shadcn.com)
- **Icons** — [Phosphor Icons](https://phosphoricons.com)
- **Maps** — [MapLibre GL](https://maplibre.org) via [@vis.gl/react-maplibre](https://visgl.github.io/react-maplibre/)

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server on port 3000
bun run dev
```

## Building for Production

```bash
bun run build
bun run preview
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared components (navbar, map wrapper, etc.)
│   └── ui/              # Base UI component wrappers (button, checkbox, select, etc.)
├── data/                # Static data (map theme presets, etc.)
├── hooks/               # Custom hooks (useTheme, useLayerStyles, useDebounce, etc.)
├── lib/                 # Utilities (cn, etc.)
├── modules/             # Feature modules
│   └── map-wallpaper/   # Map wallpaper tool components
├── routes/              # File-based routes (TanStack Router)
│   ├── index.tsx         # Landing page
│   └── tools/            # Tool routes
└── styles.css           # Global styles & theme tokens
```
