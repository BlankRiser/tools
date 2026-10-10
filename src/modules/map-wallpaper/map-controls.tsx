import { ScrollArea } from "#/components/ui/scroll-area";
import { useLayerStyles } from "#/hooks/use-layer-styles";
import { useMap } from "@vis.gl/react-maplibre";
import { ExportPanel } from "./export-panel";
import { LayerStylingPanel } from "./layer-styling-panel";
import { LocationSearch } from "./location-search";
import { ThemePresetSelector } from "./theme-preset-selector";

export function WallpaperControls() {
  const { "wallpaper-map": mapInfo } = useMap();
  const map = mapInfo?.getMap();

  const { layerGroups, colors, visibility, isReady, updateLayerColor, updateGroupColor, toggleLayerVisibility, toggleGroupVisibility, applyPreset } =
    useLayerStyles(map);

  return (
    <div className="flex h-full flex-col overflow-hidden border-r bg-background">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">Map Wallpaper</h1>
        <p className="mt-1 text-sm text-muted-foreground">Design & export high-res map wallpapers.</p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
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
