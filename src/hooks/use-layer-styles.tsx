import { useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { MAP_STYLES } from "#/components/common/map-wrapper";
import { useMapWallpaperStore } from "../modules/map-wallpaper/store";

export type PresetColors = Record<string, { fill?: string; stroke?: string }>;
export type PresetVisibility = Record<string, boolean>;

export interface LayerGroupState {
  id: string;
  label: string;
  layers: Array<{ id: string; type: string }>;
}

export function useLayerStyles(map: maplibregl.Map | undefined | null) {
  const {
    colors,
    visibility,
    layerGroups,
    isReady,
    selectedLayerId,
    setColors,
    setVisibility,
    setLayerGroups,
    setIsReady,
    deletedElements
  } = useMapWallpaperStore();

  useEffect(() => {
    if (!map) return;

    const setupLayers = () => {
      const style = map.getStyle();
      if (!style || !style.layers) return false;

      const groupsMap = new Map<string, Array<{ id: string; type: string }>>();

      style.layers.forEach((layer) => {
        const id = layer.id;
        const type = layer.type;
        
        // Group by source-layer if available, else by type
        const sourceLayer = (layer as any)["source-layer"];
        let groupId = sourceLayer || type;
        
        // If it's a background layer, just call it background
        if (type === "background") {
          groupId = "background";
        }
        
        if (!groupId) groupId = "other";

        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, []);
        }
        groupsMap.get(groupId)!.push({ id, type });
      });

      const parsedGroups: LayerGroupState[] = Array.from(groupsMap.entries()).map(([id, layers]) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1).replace(/[-_]/g, " "),
        layers,
      }));

      // Sort alphabetically, keeping background at the top
      parsedGroups.sort((a, b) => {
        if (a.id === "background") return -1;
        if (b.id === "background") return 1;
        return a.label.localeCompare(b.label);
      });

      setLayerGroups(parsedGroups);

      // Initialize visibility state based on actual layer layout properties (per layer)
      const initialVisibility: PresetVisibility = {};
      parsedGroups.forEach(group => {
        group.layers.forEach(layer => {
            const layout = style.layers?.find(sl => sl.id === layer.id)?.layout;
            initialVisibility[layer.id] = layout && (layout as any).visibility === "none" ? false : true;
        });
      });
      
      setVisibility(initialVisibility);
      setIsReady(true);
      return true;
    };

    setIsReady(false);
    setupLayers();

    const handleStyleLoad = () => {
      setupLayers();
    };

    const handleStyleData = () => {
      if (!isReady) {
        setupLayers();
      }
    };

    map.on("styledata", handleStyleData);
    map.on("style.load", handleStyleLoad);

    return () => {
      map.off("styledata", handleStyleData);
      map.off("style.load", handleStyleLoad);
    };
  }, [map, isReady]);

  // Update a single layer's color
  const updateLayerColor = useCallback(
    (layerId: string, layerType: string, type: "fill" | "stroke", color: string) => {
      if (!map || !isReady) return;

      setColors((prev) => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          [type]: color,
        },
      }));

      const propsToUpdate: string[] = [];

      if (type === "fill") {
        if (layerType === "fill") propsToUpdate.push("fill-color");
        if (layerType === "background") propsToUpdate.push("background-color");
        if (layerType === "circle") propsToUpdate.push("circle-color");
        if (layerType === "symbol") propsToUpdate.push("text-color"); // Text fill
        if (layerType === "fill-extrusion") propsToUpdate.push("fill-extrusion-color");
      } else if (type === "stroke") {
        if (layerType === "line") propsToUpdate.push("line-color");
        if (layerType === "fill") propsToUpdate.push("fill-outline-color");
        if (layerType === "circle") propsToUpdate.push("circle-stroke-color");
        if (layerType === "symbol") propsToUpdate.push("text-halo-color"); // Text outline/stroke
      }

      propsToUpdate.forEach((prop) => {
        try {
          map.setPaintProperty(layerId, prop, color);
        } catch (e) {
          console.error(e)
        }
      });
    },
    [map, isReady]
  );

  // Update an entire group's color at once
  const updateGroupColor = useCallback(
    (groupId: string, type: "fill" | "stroke", color: string) => {
      const group = layerGroups.find((g) => g.id === groupId);
      if (!group) return;

      group.layers.forEach((layer) => {
        updateLayerColor(layer.id, layer.type, type, color);
      });
    },
    [layerGroups, updateLayerColor]
  );

  // Toggle a single layer's visibility
  const toggleLayerVisibility = useCallback(
    (layerId: string, isVisible: boolean) => {
      if (!map || !isReady) return;

      setVisibility((prev) => ({ ...prev, [layerId]: isVisible }));

      try {
        map.setLayoutProperty(layerId, "visibility", isVisible ? "visible" : "none");
      } catch  {
        // Ignore unsupported layout property
      }
    },
    [map, isReady]
  );

  // Toggle an entire group's visibility at once
  const toggleGroupVisibility = useCallback(
    (groupId: string, isVisible: boolean) => {
      const group = layerGroups.find((g) => g.id === groupId);
      if (!group) return;

      group.layers.forEach((layer) => {
        toggleLayerVisibility(layer.id, isVisible);
      });
    },
    [layerGroups, toggleLayerVisibility]
  );

  const applyPreset = useCallback(
    (preset: import("../data/map-theme-presets").MapThemePreset, preserveLayers: boolean = false) => {
      if (!map || !isReady) return;

      if (preset.isReset) {
        map.setStyle(MAP_STYLES["openfreemap-liberty"]);
        setColors({});
        
        if (!preserveLayers) {
          const resetVisibility: PresetVisibility = {};
          layerGroups.forEach(g => {
            g.layers.forEach(l => {
              resetVisibility[l.id] = true;
            });
          });
          setVisibility(resetVisibility);
        }
        return;
      }

      const newVisibility = { ...visibility };
      const newColors: PresetColors = { ...colors };

      layerGroups.forEach((group) => {
        let isGroupVisible = true;
        if (preset.hiddenGroups?.includes(group.id)) {
          isGroupVisible = false;
        }

        // Determine colors based on group type
        if (!preset.colors) return;
        let fill = preset.colors.background;
        let stroke = preset.colors.background;

        if (group.id === "background") {
          fill = preset.colors.background;
        } else if (group.id === "water" || group.id === "waterway") {
          fill = preset.colors.water;
          stroke = preset.colors.water;
        } else if (
          group.id === "highways_&_primary_roads" ||
          group.id === "transportation"
        ) {
          fill = preset.colors.highways;
          stroke = preset.colors.highways;
        } else if (
          group.id === "secondary_streets" ||
          group.id === "minor_streets" ||
          group.id === "other_transportation"
        ) {
          fill = preset.colors.roads;
          stroke = preset.colors.roads;
        } else if (group.id === "building") {
          fill = preset.colors.buildings;
          stroke = preset.colors.buildings;
        } else if (group.id === "boundary") {
          fill = "transparent";
          stroke = preset.colors.admin;
        } else if (group.id.includes("label") || group.id === "place" || group.id === "poi" || group.id === "housenumber") {
          fill = preset.colors.text;
          stroke = preset.colors.background; // halo color
        }

        group.layers.forEach((layer) => {
          // Apply visibility
          let layerVis = isGroupVisible;
          
          const hiddenLayers = [
            "transportation_name", 
            "water_name_point_label",
            "water_name_line_label",
            "waterway_tunnel",
            "waterway_river",
            "waterway_other",
            "waterway_line_label",
            "road_minor", 
            "road_minor_casing", 
            "road_service_track_casing", 
            "highway-name-major", 
            "highway-name-minor", 
            "highway-shield-non-us", 
            "label_other", 
            "waterway_line_label",
            "road_path_pedestrian",
            "road_one_way_arrow",
            "road_oneway_arrow",
            "road_one_way_arrow_opposite",
            "road_oneway_arrow_opposite",
            "road_service_track"
          ];
          
          if (!preset.isReset && hiddenLayers.includes(layer.id)) {
            layerVis = false;
          }

          if (!preserveLayers) {
            newVisibility[layer.id] = layerVis;
            try {
              map.setLayoutProperty(layer.id, "visibility", layerVis ? "visible" : "none");
            } catch {
              // Ignore unsupported layout property
            }
          }

          // Apply colors
          newColors[layer.id] = { fill, stroke };
          
          const fills: string[] = [];
          const strokes: string[] = [];

          if (layer.type === "fill") fills.push("fill-color");
          if (layer.type === "background") fills.push("background-color");
          if (layer.type === "circle") fills.push("circle-color");
          if (layer.type === "symbol") fills.push("text-color");
          if (layer.type === "fill-extrusion") fills.push("fill-extrusion-color");

          if (layer.type === "line") strokes.push("line-color");
          if (layer.type === "fill") strokes.push("fill-outline-color");
          if (layer.type === "circle") strokes.push("circle-stroke-color");
          if (layer.type === "symbol") strokes.push("text-halo-color");

          fills.forEach((prop) => {
            try {
              map.setPaintProperty(layer.id, prop, fill);
            } catch (e) {
              console.error(e);
            }
          });

          strokes.forEach((prop) => {
            try {
              map.setPaintProperty(layer.id, prop, stroke);
            } catch (e) {
              console.error(e);
            }
          });
        });
      });

      setVisibility(newVisibility);
      setColors(newColors);
    },
    [map, isReady, layerGroups, colors, visibility]
  );

  // !NOTE: Highlight logic for selected layer and hide deleted elements
  useEffect(() => {
    if (!map || !isReady) return;

    layerGroups.forEach(group => {
      group.layers.forEach(layer => {
        const isSelected = layer.id === selectedLayerId;
        const baseOpacity = selectedLayerId ? (isSelected ? 1 : 0.2) : 1;
        
        let targetOpacity: any = baseOpacity;
        
        const deletedInLayer = deletedElements.filter(e => e.layerId === layer.id && e.isHidden);
        if (deletedInLayer.length > 0) {
          const cases: any[] = ["case"];
          deletedInLayer.forEach(del => {
            cases.push(del.featureKey === "id" ? ["==", ["id"], del.featureValue] : ["==", ["get", del.featureKey], del.featureValue]);
            cases.push(0);
          });
          cases.push(baseOpacity);
          targetOpacity = cases;
        }
        
        try {
          if (layer.type === "fill" || layer.type === "background") map.setPaintProperty(layer.id, "fill-opacity", targetOpacity);
          if (layer.type === "line") map.setPaintProperty(layer.id, "line-opacity", targetOpacity);
          if (layer.type === "symbol") map.setPaintProperty(layer.id, "text-opacity", targetOpacity);
          if (layer.type === "circle") map.setPaintProperty(layer.id, "circle-opacity", targetOpacity);
          if (layer.type === "fill-extrusion") map.setPaintProperty(layer.id, "fill-extrusion-opacity", targetOpacity);
        } catch {}
      });
    });
  }, [map, isReady, selectedLayerId, layerGroups, deletedElements]);

  return {
    layerGroups,
    colors,
    visibility,
    isReady,
    updateLayerColor,
    updateGroupColor,
    toggleLayerVisibility,
    toggleGroupVisibility,
    applyPreset,
  };
}
