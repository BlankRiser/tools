import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { WallpaperControls } from "#/modules/map-wallpaper/map-controls";
import { WallpaperMap } from "#/modules/map-wallpaper/wallpaper-map";
import { createFileRoute } from "@tanstack/react-router";
import { MapProvider } from "@vis.gl/react-maplibre";

export const Route = createFileRoute("/tools/map-wallpaper/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <GlobalErrorBoundary>
        <MapProvider>
          <div className="flex h-[calc(100dvh-2.8rem)] w-full overflow-hidden bg-background">
            <div className="z-10 h-full w-80 shrink-0 border-r bg-card shadow-xl">
              <WallpaperControls />
            </div>
            <div className="relative h-full flex-1">
              <WallpaperMap />
            </div>
          </div>
        </MapProvider>
      </GlobalErrorBoundary>
    </div>
  );
}
