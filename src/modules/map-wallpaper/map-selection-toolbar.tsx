import { Button } from "#/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Switch } from "#/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import { ArrowUpLeftIcon, CursorClickIcon, EyeSlashIcon, TargetIcon } from "@phosphor-icons/react";
import { useMap } from "@vis.gl/react-maplibre";
import React, { useCallback, useEffect, useState } from "react";
import { useMapWallpaperStore } from "./store";

const formatLayerName = (id: string) => {
  return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const ColorPicker = ({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  disabled: boolean;
  className?: string;
}) => {
  return (
    <div className={`relative flex shrink-0 items-center justify-center ${disabled ? "opacity-40" : ""}`}>
      <input
        type="color"
        className={`absolute inset-0 cursor-pointer overflow-hidden border-0 bg-transparent p-0 opacity-0 transition-opacity ${disabled ? "cursor-not-allowed" : ""}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <div className={className || "h-6 w-6 rounded-full border shadow-sm"} style={{ backgroundColor: value }} />
    </div>
  );
};

export function MapSelectionToolbar() {
  const { "wallpaper-map": mapInfo } = useMap();
  const map = mapInfo?.getMap();

  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedLayerId,
    setSelectedLayerId,
    selectedFeature,
    setSelectedFeature,
    colors,
    setColors,
    layerGroups,
    elementOverrides,
    setElementOverride,
    deletedElements,
    deleteElement,
    restoreElement,
    toggleDeletedElementVisibility,
  } = useMapWallpaperStore();

  const [applyToElementOnly, setApplyToElementOnly] = useState(false);
  const [elementColors, setElementColors] = useState({ fill: "#000000", stroke: "#000000" });

  useEffect(() => {
    if (selectedLayerId) {
      let hasOverride = false;
      let overrideFill = colors[selectedLayerId]?.fill || "#000000";
      let overrideStroke = colors[selectedLayerId]?.stroke || "#000000";

      if (selectedFeature) {
        const overrideKey = `${selectedLayerId}-${selectedFeature.value}`;
        const override = elementOverrides[overrideKey];
        if (override) {
          hasOverride = true;
          if (override.fill) overrideFill = override.fill;
          if (override.stroke) overrideStroke = override.stroke;
        }
      }

      setElementColors({
        fill: overrideFill,
        stroke: overrideStroke,
      });
      setApplyToElementOnly(hasOverride);
    }
  }, [selectedLayerId, selectedFeature]);

  const handleColorChange = useCallback(
    (type: "fill" | "stroke", color: string) => {
      if (!map || !selectedLayerId) return;

      if (applyToElementOnly && selectedFeature) {
        setElementColors((prev) => ({ ...prev, [type]: color }));
        setElementOverride(selectedLayerId, selectedFeature.value, type, color);
      } else {
        setColors((prev) => ({
          ...prev,
          [selectedLayerId]: {
            ...prev[selectedLayerId],
            [type]: color,
          },
        }));
        setElementColors((prev) => ({ ...prev, [type]: color }));
      }

      const layer = layerGroups.flatMap((g) => g.layers).find((l) => l.id === selectedLayerId);
      if (!layer) return;

      const propsToUpdate: string[] = [];

      if (type === "fill") {
        if (layer.type === "fill") propsToUpdate.push("fill-color");
        if (layer.type === "background") propsToUpdate.push("background-color");
        if (layer.type === "circle") propsToUpdate.push("circle-color");
        if (layer.type === "symbol") propsToUpdate.push("text-color");
        if (layer.type === "fill-extrusion") propsToUpdate.push("fill-extrusion-color");
      } else if (type === "stroke") {
        if (layer.type === "line") propsToUpdate.push("line-color");
        if (layer.type === "fill") propsToUpdate.push("fill-outline-color");
        if (layer.type === "circle") propsToUpdate.push("circle-stroke-color");
        if (layer.type === "symbol") propsToUpdate.push("text-halo-color");
      }

      propsToUpdate.forEach((prop) => {
        try {
          if (applyToElementOnly && selectedFeature) {
            const fallbackColor = colors[selectedLayerId]?.[type] || "#000000";
            const matchCondition =
              selectedFeature.key === "id" ? ["==", ["id"], selectedFeature.value] : ["==", ["get", selectedFeature.key], selectedFeature.value];

            map.setPaintProperty(selectedLayerId, prop, ["case", matchCondition, color, fallbackColor]);
          } else {
            map.setPaintProperty(selectedLayerId, prop, color);
          }
        } catch (e) {
          console.error("Failed to set paint property:", e);
        }
      });
    },
    [map, selectedLayerId, setColors, layerGroups, applyToElementOnly, selectedFeature, colors],
  );

  const handleDeleteElement = () => {
    if (!selectedLayerId || !selectedFeature) return;
    deleteElement({
      layerId: selectedLayerId,
      featureKey: selectedFeature.key,
      featureValue: selectedFeature.value,
      featureName: `${formatLayerName(selectedLayerId)} Element`,
    });
    setSelectedLayerId(null);
    setSelectedFeature(null);
  };

  return (
    <div className="absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-background/95 p-1.5 shadow-2xl backdrop-blur-xl transition-all">
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant={isSelectionMode ? "default" : "ghost"}
            size="icon"
            className={`h-9 w-9 shrink-0 rounded-full transition-colors ${isSelectionMode ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => {
              const newMode = !isSelectionMode;
              setIsSelectionMode(newMode);
              if (!newMode) {
                setSelectedLayerId(null);
                setSelectedFeature(null);
              }
            }}
          >
            <CursorClickIcon className="h-4 w-4" weight={isSelectionMode ? "fill" : "regular"} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isSelectionMode ? "Disable Selection Mode" : "Enable Selection Mode"}</p>
        </TooltipContent>
      </Tooltip>

      <div className="mx-1 h-5 w-px shrink-0 bg-border/60" />

      <div className="flex items-center gap-1.5 px-1">
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center">
              <ColorPicker
                value={applyToElementOnly ? elementColors.fill : colors[selectedLayerId || ""]?.fill || "#000000"}
                onChange={(e) => handleColorChange("fill", e.target.value)}
                disabled={!selectedLayerId}
                className="h-7 w-7 rounded-full border shadow-sm ring-offset-background transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Fill Color {selectedLayerId ? `(${formatLayerName(selectedLayerId)})` : ""}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center">
              <ColorPicker
                value={applyToElementOnly ? elementColors.stroke : colors[selectedLayerId || ""]?.stroke || "#000000"}
                onChange={(e) => handleColorChange("stroke", e.target.value)}
                disabled={!selectedLayerId}
                className="h-7 w-7 rounded-full border-2 border-dashed bg-transparent shadow-sm ring-offset-background transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Stroke Color {selectedLayerId ? `(${formatLayerName(selectedLayerId)})` : ""}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="mx-1 h-5 w-px shrink-0 bg-border/60" />

      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-muted/50">
            <TargetIcon
              className={`h-4 w-4 ${selectedFeature ? (applyToElementOnly ? "text-primary" : "text-muted-foreground") : "text-muted-foreground/40"}`}
            />
            <Switch size="sm" checked={applyToElementOnly} onCheckedChange={setApplyToElementOnly} disabled={!selectedFeature} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Apply style to specific element only</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDeleteElement}
            disabled={!selectedFeature}
          >
            <EyeSlashIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium text-destructive">Hide Selected Element</p>
        </TooltipContent>
      </Tooltip>

      <div className="mx-1 h-5 w-px shrink-0 bg-border/60" />

      <Popover>
        <Tooltip>
          <TooltipTrigger>
            <PopoverTrigger>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0 rounded-full" disabled={deletedElements.length === 0}>
                <EyeSlashIcon className="h-4 w-4" />
                {deletedElements.length > 0 && (
                  <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                    {deletedElements.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Manage Hidden Elements</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent side="top" align="end" className="w-72 p-0 shadow-2xl">
          <div className="flex flex-col">
            <div className="border-b bg-muted/30 px-4 py-3">
              <h4 className="text-sm font-semibold">Hidden Elements</h4>
              <p className="text-xs text-muted-foreground">Manage elements removed from the map.</p>
            </div>
            <div className="max-h-[300px] space-y-1 overflow-y-auto p-2">
              {deletedElements.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No hidden elements.</p>
              ) : (
                deletedElements.map((el, i) => (
                  <div key={i} className="group flex items-center justify-between rounded-md bg-muted/40 p-2 transition-colors hover:bg-muted/60">
                    <span className="flex-1 truncate pr-2 text-xs font-medium" title={String(el.featureValue)}>
                      {el.featureName}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <div>
                            <Switch
                              size="sm"
                              checked={el.isHidden}
                              onCheckedChange={(checked) => toggleDeletedElementVisibility(el.layerId, el.featureValue, checked)}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">Toggle Visibility</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => restoreElement(el.layerId, el.featureValue)}
                          >
                            <ArrowUpLeftIcon className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Restore to map</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
