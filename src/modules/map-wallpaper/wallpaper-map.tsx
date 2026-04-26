import { type MapRef } from "@vis.gl/react-maplibre";
import { useRef } from "react";
import { MAP_STYLES, MapWrapper } from "@/components/common/map-wrapper";


export function WallpaperMap() {
  const mapRef = useRef<MapRef>(null);

  return (
    <div className="flex h-[calc(100dvh-2.6rem)] w-full items-center justify-center bg-muted/50 p-4">
      <div className="relative h-full max-h-full w-full overflow-hidden rounded-xl shadow-2xl ring-1 ring-border">
        <MapWrapper
          ref={mapRef}
          id="wallpaper-map"
          hash="wallpaper-map"
          reuseMaps={true}
          mapStyle={MAP_STYLES["openfreemap-liberty"]}
          canvasContextAttributes={{ preserveDrawingBuffer: true }}
          initialViewState={{
            zoom: 14.65,
            latitude: 12.91524,
            longitude: 77.62513,
          }}
        >
          <div className="h-full w-full" />
        </MapWrapper>
      </div>
    </div>
  );
}
