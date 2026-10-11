import * as React from "react";
import type { ToolID } from "#/data/tools-list";

const Base64ImageCodecPage = React.lazy(() =>
  import("./base64-image-codec/base64-image-codec-page").then((m) => ({ default: m.Base64ImageCodecPage })),
);
const ColorConverterPage = React.lazy(() =>
  import("./color-converter/color-converter-page").then((m) => ({ default: m.ColorConverterPage })),
);
const CronBuilderPage = React.lazy(() =>
  import("./cron-expression-builder/cron-builder-page").then((m) => ({ default: m.CronBuilderPage })),
);
const DataConverterPage = React.lazy(() =>
  import("./data-converter/data-converter-page").then((m) => ({ default: m.DataConverterPage })),
);
const DataExplorerPage = React.lazy(() =>
  import("./data-explorer/data-explorer-page").then((m) => ({ default: m.DataExplorerPage })),
);
const DateTimeConverterPage = React.lazy(() =>
  import("./date-time-converter/date-time-converter-page").then((m) => ({ default: m.DateTimeConverterPage })),
);
const DiffCheckerPage = React.lazy(() => import("./diff-checker/diff-checker-page"));
const DistanceCalculatorPage = React.lazy(() => import("./distance-calculator/distance-calculator-page"));
const GeoJsonViewerPageLazy = React.lazy(() =>
  import("./geojson-viewer/geojson-viewer-page").then((m) => ({ default: m.GeoJsonViewerPage })),
);
const GradientGeneratorPage = React.lazy(() =>
  import("./gradient-generator/gradient-generator-page").then((m) => ({ default: m.GradientGeneratorPage })),
);
const HtmlToJsxPage = React.lazy(() =>
  import("./html-to-jsx/html-to-jsx-page").then((m) => ({ default: m.HtmlToJsxPage })),
);
const JsonFormatterPage = React.lazy(() =>
  import("./json-formatter/json-formatter-page").then((m) => ({ default: m.JsonFormatterPage })),
);
const JwtCodecPage = React.lazy(() =>
  import("./jwt-codec/jwt-codec-page").then((m) => ({ default: m.JwtCodecPage })),
);
const MapWallpaperPage = React.lazy(() => import("./map-wallpaper/map-wallpaper-page"));
const MarkdownStripperPage = React.lazy(() =>
  import("./markdown-stripper/markdown-stripper-page").then((m) => ({ default: m.MarkdownStripperPage })),
);
const MarkdownToRichTextPage = React.lazy(() =>
  import("./markdown-to-rich-text/markdown-to-rich-text-page").then((m) => ({ default: m.MarkdownToRichTextPage })),
);
const MarkdownTocGeneratorPage = React.lazy(() =>
  import("./markdown-toc-generator/markdown-toc-generator-page").then((m) => ({ default: m.MarkdownTocGeneratorPage })),
);
const PdfToolsPage = React.lazy(() =>
  import("./pdf-tools/pdf-tools-page").then((m) => ({ default: m.PdfToolsPage })),
);
const QRCodeGenPage = React.lazy(() => import("./qr-code-gen/qr-code-gen-page"));
const RegexTesterPage = React.lazy(() =>
  import("./regex-tester/regex-tester-page").then((m) => ({ default: m.RegexTesterPage })),
);
const SortTextPage = React.lazy(() =>
  import("./sort-text/sort-text-page").then((m) => ({ default: m.SortTextPage })),
);
const StringCaseConverterPage = React.lazy(() =>
  import("./string-case-converter/string-case-converter-page").then((m) => ({ default: m.StringCaseConverterPage })),
);
const TextInspectorPage = React.lazy(() =>
  import("./text-inspector/text-inspector-page").then((m) => ({ default: m.TextInspectorPage })),
);
const URLParserPage = React.lazy(() =>
  import("./url-parser/url-parser-page").then((m) => ({ default: m.URLParserPage })),
);

const GeoJsonViewerPageRoute = () => <GeoJsonViewerPageLazy initialMode="viewer" />;
const BoundingBoxPickerPageRoute = () => <GeoJsonViewerPageLazy initialMode="bbox" />;

const ToolMap: Partial<Record<ToolID, React.ComponentType>> = {
  "map-wallpaper": MapWallpaperPage,
  "diff-checker": DiffCheckerPage,
  "qr-code-generator": QRCodeGenPage,
  "url-parser": URLParserPage,
  "color-generator": ColorConverterPage,
  "date-time-converter": DateTimeConverterPage,
  "cron-expression-builder": CronBuilderPage,
  "text-inspector": TextInspectorPage,
  "base64-image-codec": Base64ImageCodecPage,
  "string-case-converter": StringCaseConverterPage,
  "regex-tester": RegexTesterPage,
  "distance-calculator": DistanceCalculatorPage,
  "jwt-encoder-decoder": JwtCodecPage,
  "markdown-to-rich-text": MarkdownToRichTextPage,
  "markdown-stripper": MarkdownStripperPage,
  "markdown-toc-generator": MarkdownTocGeneratorPage,
  "json-csv": DataConverterPage,
  "json-formatter": JsonFormatterPage,
  "geojson-viewer": GeoJsonViewerPageRoute,
  "bounding-box-picker": BoundingBoxPickerPageRoute,
  "sort-text": SortTextPage,
  "pdf-tools": PdfToolsPage,
  "data-explorer": DataExplorerPage,
  "gradient-generator": GradientGeneratorPage,
  "html-to-jsx": HtmlToJsxPage,
};

export function ToolResolver({ toolID }: { toolID: ToolID }) {
  const Tool = ToolMap[toolID];

  if (!Tool) {
    return <ToolNotFound />;
  }

  return (
    <React.Suspense
      fallback={<div className="flex min-h-[calc(100dvh-2.8rem)] items-center justify-center text-sm text-muted-foreground">Loading tool…</div>}
    >
      <Tool />
    </React.Suspense>
  );
}

import { ToolOrbitalSphere } from "#/components/common/tool-orbital-sphere";
import { Link } from "@tanstack/react-router";

function ToolNotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-5xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div className="max-w-lg">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          404 • Tool Not Found
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          We couldn't find that tool
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Pick any orbiting utility in the sphere below to launch it immediately, or return to
          the main directory.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/tools"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse All Tools
          </Link>
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-md border border-border/80 bg-card px-4 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            Return Home
          </Link>
        </div>
      </div>

      <ToolOrbitalSphere className="max-w-[420px]" />
    </div>
  );
}
