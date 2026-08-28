import type { ToolID } from "#/data/tools-list";
import * as React from "react";
import { Base64ImageCodecPage } from "./base64-image-codec/base64-image-codec-page";
import { DateTimeConverterPage } from "./date-time-converter/date-time-converter-page";
import QRCodeGenPage from "./qr-code-gen/qr-code-gen-page";
import { RegexTesterPage } from "./regex-tester/regex-tester-page";
import { StringCaseConverterPage } from "./string-case-converter/string-case-converter-page";
import { TextInspectorPage } from "./text-inspector/text-inspector-page";
import { URLParserPage } from "./url-parser/url-parser-page";
const MapWallpaperPage = React.lazy(() => import("./map-wallpaper/map-wallpaper-page"));
const DiffCheckerPage = React.lazy(() => import("./diff-checker/diff-checker-page"));
const DistanceCalculatorPage = React.lazy(() => import("./distance-calculator/distance-calculator-page"));

const ToolMap: Partial<Record<ToolID, React.ComponentType>> = {
  "map-wallpaper": MapWallpaperPage,
  "diff-checker": DiffCheckerPage,
  "qr-code-generator": QRCodeGenPage,
  "url-parser": URLParserPage,
  "date-time-converter": DateTimeConverterPage,
  "text-inspector": TextInspectorPage,
  "base64-image-codec": Base64ImageCodecPage,
  "string-case-converter": StringCaseConverterPage,
  "regex-tester": RegexTesterPage,
  "distance-calculator": DistanceCalculatorPage,
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
