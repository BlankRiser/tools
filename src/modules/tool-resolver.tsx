import * as React from "react";
const MapWallpaperPage = React.lazy(() => import("./map-wallpaper/map-wallpaper-page"));
const DiffCheckerPage = React.lazy(() => import("./diff-checker/diff-checker-page"));

const ToolMap: Record<string, React.ComponentType> = {
  "map-wallpaper": MapWallpaperPage,
  "diff-checker": DiffCheckerPage,
};

export function ToolResolver({ toolID }: { toolID: string }) {
  const Tool = ToolMap[toolID];

  if (!Tool) {
    return <ToolNotFound />;
  }

  return <Tool />;
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
