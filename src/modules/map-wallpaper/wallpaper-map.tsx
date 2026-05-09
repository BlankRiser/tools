import { type MapRef } from "@vis.gl/react-maplibre";
import { useRef, useCallback } from "react";
import { MAP_STYLES, MapWrapper } from "#/components/common/map-wrapper";
import { useMapWallpaperStore } from "./store";
import { MapSelectionToolbar } from "./map-selection-toolbar";
import { Route as ToolRoute } from "#/routes/tools/$toolID/index";

export function WallpaperMap() {
  const mapRef = useRef<MapRef>(null);
  const { isSelectionMode, setSelectedLayerId, setSelectedFeature, deletedElements } = useMapWallpaperStore();
  
  const loaderData = ToolRoute.useLoaderData();
  const initialViewState = loaderData?.mapCenter ? {
    zoom: loaderData.mapCenter.zoom ?? 14.65,
    latitude: loaderData.mapCenter.lat,
    longitude: loaderData.mapCenter.lng,
  } : {
    zoom: 14.65,
    latitude: 12.91524,
    longitude: 77.62513,
  };

  const handleMapClick = useCallback((e: any) => {
    if (!isSelectionMode) return;
    
    const map = mapRef.current?.getMap();
    if (!map || !e.point) return;
    
    const allFeatures = map.queryRenderedFeatures(e.point);
    
    const features = allFeatures.filter(f => {
      const fId = f.id ?? f.properties?.id ?? f.properties?.name;
      return !deletedElements.some(del => del.layerId === f.layer.id && del.featureValue === fId && del.isHidden);
    });

    if (features.length > 0) {
      let feature = features.find(f => f.layer.type !== 'background');
      if (!feature) {
        feature = features[0];
      }
      setSelectedLayerId(feature.layer.id);
      
      let selectedFeatureInfo = null;
      if (feature.id !== undefined) {
        selectedFeatureInfo = { key: "id", value: feature.id };
      } else if (feature.properties?.id !== undefined) {
        selectedFeatureInfo = { key: "id", value: feature.properties.id };
      } else if (feature.properties?.name !== undefined) {
        selectedFeatureInfo = { key: "name", value: feature.properties.name };
      } else if (feature.properties?.class !== undefined) {
        selectedFeatureInfo = { key: "class", value: feature.properties.class };
      }
      setSelectedFeature(selectedFeatureInfo);
    } else {
      setSelectedLayerId(null);
      setSelectedFeature(null);
    }
  }, [isSelectionMode, setSelectedLayerId, setSelectedFeature, deletedElements]);

  return (
    <div className="flex h-[calc(100dvh-2.6rem)] w-full items-center justify-center bg-muted/50 p-4 relative">
      <MapSelectionToolbar />
      <div className="relative h-full max-h-full w-full overflow-hidden rounded-xl shadow-2xl ring-1 ring-border">
        <MapWrapper
          ref={mapRef}
          id="wallpaper-map"
          hash="wallpaper-map"
          reuseMaps={true}
          mapStyle={MAP_STYLES["openfreemap-liberty"]}
          canvasContextAttributes={{ preserveDrawingBuffer: true }}
          initialViewState={initialViewState}
          onClick={handleMapClick}
          cursor={isSelectionMode ? "crosshair" : "auto"}
        >
          <div className="h-full w-full" />
        </MapWrapper>
      </div>
    </div>
  );
}
