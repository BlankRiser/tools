import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { MapProvider } from "@vis.gl/react-maplibre";
import { WallpaperControls } from "./map-controls";
import { WallpaperMap } from "./wallpaper-map";

export default function MapWallpaperPage() {
  return (
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
  );
}
