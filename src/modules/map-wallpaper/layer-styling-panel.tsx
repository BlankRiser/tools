
import React, { useState } from "react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/ui/collapsible";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { LayerGroupState, PresetColors, PresetVisibility } from "#/hooks/use-layer-styles";
import { useDebounce } from "#/hooks/use-debounce";
import { CaretDownIcon } from "@phosphor-icons/react";

const formatLayerName = (id: string) => {
  return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const ColorPicker = ({
  value,
  onChange,
  disabled,
  title,
  className,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  disabled: boolean;
  title?: string;
  className?: string;
}) => {
  return (
    <input
      type="color"
      title={title}
      className={`cursor-pointer overflow-hidden border-0 bg-transparent p-0 transition-opacity ${
        className ? className : "h-5 w-5 rounded"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
};

interface LayerStylingPanelProps {
  layerGroups: LayerGroupState[];
  colors: PresetColors;
  visibility: PresetVisibility;
  isReady: boolean;
  updateLayerColor: (layerId: string, layerType: string, type: "fill" | "stroke", color: string) => void;
  updateGroupColor: (groupId: string, type: "fill" | "stroke", color: string) => void;
  toggleLayerVisibility: (layerId: string, isVisible: boolean) => void;
  toggleGroupVisibility: (groupId: string, isVisible: boolean) => void;
}

export function LayerStylingPanel({
  layerGroups,
  colors,
  visibility,
  isReady,
  updateLayerColor,
  updateGroupColor,
  toggleLayerVisibility,
  toggleGroupVisibility,
}: LayerStylingPanelProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredLayerGroups = React.useMemo(() => {
    if (!debouncedSearch) return layerGroups;

    const lowerSearch = debouncedSearch.toLowerCase();

    return layerGroups
      .map((group) => {
        const matchingLayers = group.layers.filter(
          (layer) => layer.id.toLowerCase().includes(lowerSearch) || formatLayerName(layer.id).toLowerCase().includes(lowerSearch),
        );

        return {
          ...group,
          layers: matchingLayers,
        };
      })
      .filter((group) => group.layers.length > 0);
  }, [layerGroups, debouncedSearch]);

  const isSearching = debouncedSearch.trim().length > 0;

  const toggleAllGroups = () => {
    const targetGroups = isSearching ? filteredLayerGroups : layerGroups;
    const allOpen = targetGroups.every((g) => openGroups[g.id]);
    const nextState: Record<string, boolean> = { ...openGroups };

    targetGroups.forEach((g) => {
      nextState[g.id] = !allOpen;
    });
    setOpenGroups(nextState);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          Layer Styling
          {!isReady && <span className="animate-pulse text-xs text-muted-foreground">Loading map...</span>}
        </h2>
        <Button variant="ghost" size="sm" onClick={toggleAllGroups} disabled={!isReady || filteredLayerGroups.length === 0}>
          {filteredLayerGroups.length > 0 && filteredLayerGroups.every((g) => (isSearching ? true : openGroups[g.id]))
            ? "Collapse All"
            : "Expand All"}
        </Button>
      </div>

      <Input
        placeholder="Search layers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-8 text-xs"
        disabled={!isReady}
      />

      <div className="space-y-1.5">
        {filteredLayerGroups.map((group) => {
          const allVisible = group.layers.every((l) => visibility[l.id] !== false);
          const someVisible = group.layers.some((l) => visibility[l.id] !== false);
          const isIndeterminate = someVisible && !allVisible;

          // !Note: For group color, we use the first layer's color as a proxy, or black
          const firstLayerId = group.layers[0]?.id;
          const proxyFillColor = firstLayerId ? colors[firstLayerId]?.fill || "#000000" : "#000000";
          const proxyStrokeColor = firstLayerId ? colors[firstLayerId]?.stroke || "#000000" : "#000000";

          const isOpen = isSearching ? true : openGroups[group.id] || false;

          return (
            <Collapsible
              key={group.id}
              open={isOpen}
              onOpenChange={(open) => {
                if (!isSearching) {
                  setOpenGroups((prev) => ({ ...prev, [group.id]: open }));
                }
              }}
              className="group/collapsible overflow-hidden rounded-md border border-border/50 bg-card transition-colors"
            >
              <div className={`flex flex-col ${someVisible ? "" : "bg-muted/20 opacity-75"}`}>
                {/* Group Header */}
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger
                      render={
                        <Button variant="ghost" size="icon" className="group/trigger h-6 w-6 shrink-0 p-0 hover:bg-muted" disabled={isSearching}>
                          <CaretDownIcon className="h-4 w-4 transition-transform duration-200 group-data-[panel-open]/trigger:-rotate-180" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      }
                    />
                    <Checkbox
                      id={`group-visibility-${group.id}`}
                      checked={allVisible || isIndeterminate}
                      indeterminate={isIndeterminate}
                      onCheckedChange={(checked) => toggleGroupVisibility(group.id, !!checked)}
                      disabled={!isReady}
                      className={`h-4 w-4 ${isIndeterminate ? "opacity-50" : ""}`}
                    />
                    <Label htmlFor={`group-visibility-${group.id}`} className="cursor-pointer text-xs font-medium">
                      {group.label}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 pl-2">
                    <div className="flex items-center gap-1.5">
                      <ColorPicker
                        value={proxyFillColor}
                        onChange={(e) => updateGroupColor(group.id, "fill", e.target.value)}
                        disabled={!isReady || !someVisible}
                        title="Group Fill Color"
                      />
                      <span className="text-[9px] text-muted-foreground uppercase">Fill</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ColorPicker
                        value={proxyStrokeColor}
                        onChange={(e) => updateGroupColor(group.id, "stroke", e.target.value)}
                        disabled={!isReady || !someVisible}
                        title="Group Stroke Color"
                      />
                      <span className="text-[9px] text-muted-foreground uppercase">Stroke</span>
                    </div>
                  </div>
                </div>

                {/* Granular Layers */}
                <CollapsibleContent>
                  <div className="flex flex-col gap-1 border-t border-border/40 bg-muted/10 px-3 pt-1 pb-2">
                    {group.layers.map((layer) => {
                      const isLayerVisible = visibility[layer.id] !== false;
                      return (
                        <div
                          key={layer.id}
                          className={`flex items-center justify-between rounded py-1.5 pr-1 pl-6 transition-colors hover:bg-muted/30 ${isLayerVisible ? "" : "opacity-60"}`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Checkbox
                              id={`layer-visibility-${layer.id}`}
                              checked={isLayerVisible}
                              onCheckedChange={(checked) => toggleLayerVisibility(layer.id, !!checked)}
                              disabled={!isReady}
                              className="h-3.5 w-3.5"
                            />
                            <Label
                              htmlFor={`layer-visibility-${layer.id}`}
                              className="cursor-pointer truncate text-[11px] font-normal text-muted-foreground transition-colors hover:text-foreground"
                              title={layer.id}
                            >
                              {formatLayerName(layer.id)}
                            </Label>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <ColorPicker
                              value={colors[layer.id]?.fill || "#000000"}
                              onChange={(e) => updateLayerColor(layer.id, layer.type, "fill", e.target.value)}
                              disabled={!isReady || !isLayerVisible}
                              title={`Fill: ${layer.id}`}
                              className="h-4 w-4 rounded-sm"
                            />
                            <ColorPicker
                              value={colors[layer.id]?.stroke || "#000000"}
                              onChange={(e) => updateLayerColor(layer.id, layer.type, "stroke", e.target.value)}
                              disabled={!isReady || !isLayerVisible}
                              title={`Stroke: ${layer.id}`}
                              className="h-4 w-4 rounded-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
        {filteredLayerGroups.length === 0 && isReady && <span className="text-sm text-muted-foreground">No layers match your search.</span>}
      </div>
    </div>
  );
}
