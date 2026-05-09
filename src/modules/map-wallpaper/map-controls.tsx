
import { useMap } from "@vis.gl/react-maplibre";
import { useLayerStyles } from "#/hooks/use-layer-styles";
import { ThemePresetSelector } from "./theme-preset-selector";
import { LayerStylingPanel } from "./layer-styling-panel";
import { ExportPanel } from "./export-panel";
import { ScrollArea } from "#/components/ui/scroll-area";
import { LocationSearch } from "./location-search";

export function WallpaperControls() {
  const { "wallpaper-map": mapInfo } = useMap();
  const map = mapInfo?.getMap();

  const {
    layerGroups,
    colors,
    visibility,
    isReady,
    updateLayerColor,
    updateGroupColor,
    toggleLayerVisibility,
    toggleGroupVisibility,
    applyPreset,
  } = useLayerStyles(map);

  return (
    <div className="flex flex-col h-full bg-background border-r overflow-hidden">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Map Wallpaper</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Design & export high-res map wallpapers.
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          <LocationSearch />
          <ThemePresetSelector applyPreset={applyPreset} isReady={isReady} />

          <LayerStylingPanel
            layerGroups={layerGroups}
            colors={colors}
            visibility={visibility}
            isReady={isReady}
            updateLayerColor={updateLayerColor}
            updateGroupColor={updateGroupColor}
            toggleLayerVisibility={toggleLayerVisibility}
            toggleGroupVisibility={toggleGroupVisibility}
          />
        </div>
      </ScrollArea>

      <ExportPanel map={map} isReady={isReady} />
    </div>
  );
}
