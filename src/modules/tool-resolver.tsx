import * as React from "react";
import type { ToolID } from "#/data/tools-list";

const Base64ImageCodecPage = React.lazy(() =>
  import("./base64-image-codec/base64-image-codec-page").then((m) => ({ default: m.Base64ImageCodecPage })),
);
const CronBuilderPage = React.lazy(() =>
  import("./cron-expression-builder/cron-builder-page").then((m) => ({ default: m.CronBuilderPage })),
);
const DataConverterPage = React.lazy(() =>
  import("./data-converter/data-converter-page").then((m) => ({ default: m.DataConverterPage })),
);
const DateTimeConverterPage = React.lazy(() =>
  import("./date-time-converter/date-time-converter-page").then((m) => ({ default: m.DateTimeConverterPage })),
);
const DiffCheckerPage = React.lazy(() => import("./diff-checker/diff-checker-page"));
const DistanceCalculatorPage = React.lazy(() => import("./distance-calculator/distance-calculator-page"));
const GeoJsonViewerPageLazy = React.lazy(() =>
  import("./geojson-viewer/geojson-viewer-page").then((m) => ({ default: m.GeoJsonViewerPage })),
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
  "geojson-viewer": GeoJsonViewerPageRoute,
  "bounding-box-picker": BoundingBoxPickerPageRoute,
  "sort-text": SortTextPage,
  "pdf-tools": PdfToolsPage,
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

function ToolNotFound() {
  return (
    <div className="flex min-h-[calc(100dvh-2.8rem)] items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-foreground">Tool Not Found</h1>
        <p className="text-lg text-muted-foreground">We couldn't find the tool you're looking for.</p>
      </div>
    </div>
  );
}
