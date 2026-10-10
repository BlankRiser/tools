import type { ToolID } from "#/data/tools-list";
import * as React from "react";
import { Base64ImageCodecPage } from "./base64-image-codec/base64-image-codec-page";
import { DataConverterPage } from "./data-converter/data-converter-page";
import { DateTimeConverterPage } from "./date-time-converter/date-time-converter-page";
import { JwtCodecPage } from "./jwt-codec/jwt-codec-page";
import { MarkdownStripperPage } from "./markdown-stripper/markdown-stripper-page";
import { MarkdownToRichTextPage } from "./markdown-to-rich-text/markdown-to-rich-text-page";
import { MarkdownTocGeneratorPage } from "./markdown-toc-generator/markdown-toc-generator-page";
import QRCodeGenPage from "./qr-code-gen/qr-code-gen-page";
import { RegexTesterPage } from "./regex-tester/regex-tester-page";
import { StringCaseConverterPage } from "./string-case-converter/string-case-converter-page";
import { TextInspectorPage } from "./text-inspector/text-inspector-page";
import { URLParserPage } from "./url-parser/url-parser-page";
const MapWallpaperPage = React.lazy(() => import("./map-wallpaper/map-wallpaper-page"));
const DiffCheckerPage = React.lazy(() => import("./diff-checker/diff-checker-page"));
const DistanceCalculatorPage = React.lazy(() => import("./distance-calculator/distance-calculator-page"));
const GeoJsonViewerPageLazy = React.lazy(() =>
  import("./geojson-viewer/geojson-viewer-page").then((m) => ({ default: m.GeoJsonViewerPage })),
);

const GeoJsonViewerPageRoute = () => <GeoJsonViewerPageLazy initialMode="viewer" />;
const BoundingBoxPickerPageRoute = () => <GeoJsonViewerPageLazy initialMode="bbox" />;
const SortTextPageLazy = React.lazy(() =>
  import("./sort-text/sort-text-page").then((m) => ({ default: m.SortTextPage })),
);
const CronBuilderPageLazy = React.lazy(() =>
  import("./cron-expression-builder/cron-builder-page").then((m) => ({ default: m.CronBuilderPage })),
);

const ToolMap: Partial<Record<ToolID, React.ComponentType>> = {
  "map-wallpaper": MapWallpaperPage,
  "diff-checker": DiffCheckerPage,
  "qr-code-generator": QRCodeGenPage,
  "url-parser": URLParserPage,
  "date-time-converter": DateTimeConverterPage,
  "cron-expression-builder": CronBuilderPageLazy,
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
  "sort-text": SortTextPageLazy,
};

export function ToolResolver({ toolID }: { toolID: ToolID }) {
  const Tool = ToolMap[toolID];

  if (!Tool) {
    return <ToolNotFound />;
  }

  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-2.8rem)] items-center justify-center text-sm text-muted-foreground">Loading tool…</div>
      }
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
