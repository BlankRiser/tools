import { create } from "zustand";
import type { PresetColors, PresetVisibility, LayerGroupState } from "#/hooks/use-layer-styles";

export interface DeletedElement {
  layerId: string;
  featureKey: string;
  featureValue: any;
  featureName: string;
  isHidden: boolean;
}

export interface MapWallpaperState {
  colors: PresetColors;
  visibility: PresetVisibility;
  layerGroups: LayerGroupState[];
  isReady: boolean;
  selectedLayerId: string | null;
  selectedFeature: { key: string, value: any } | null;
  isSelectionMode: boolean;
  elementOverrides: Record<string, { fill?: string; stroke?: string }>;
  deletedElements: DeletedElement[];
  
  setColors: (updater: PresetColors | ((prev: PresetColors) => PresetColors)) => void;
  setVisibility: (updater: PresetVisibility | ((prev: PresetVisibility) => PresetVisibility)) => void;
  setLayerGroups: (groups: LayerGroupState[]) => void;
  setIsReady: (isReady: boolean) => void;
  setSelectedLayerId: (id: string | null) => void;
  setSelectedFeature: (feature: { key: string, value: any } | null) => void;
  setIsSelectionMode: (mode: boolean) => void;
  setElementOverride: (layerId: string, featureValue: any, type: "fill" | "stroke", color: string) => void;
  deleteElement: (element: Omit<DeletedElement, 'isHidden'>) => void;
  restoreElement: (layerId: string, featureValue: any) => void;
  toggleDeletedElementVisibility: (layerId: string, featureValue: any, isHidden: boolean) => void;
}

export const useMapWallpaperStore = create<MapWallpaperState>((set) => ({
  colors: {},
  visibility: {},
  layerGroups: [],
  isReady: false,
  selectedLayerId: null,
  selectedFeature: null,
  isSelectionMode: false,
  elementOverrides: {},
  deletedElements: [],
  
  setColors: (updater) => set((state) => ({ colors: typeof updater === 'function' ? updater(state.colors) : updater })),
  setVisibility: (updater) => set((state) => ({ visibility: typeof updater === 'function' ? updater(state.visibility) : updater })),
  setLayerGroups: (groups) => set({ layerGroups: groups }),
  setIsReady: (isReady) => set({ isReady }),
  setSelectedLayerId: (id) => set({ selectedLayerId: id }),
  setSelectedFeature: (feature) => set({ selectedFeature: feature }),
  setIsSelectionMode: (mode) => set({ isSelectionMode: mode }),
  setElementOverride: (layerId, featureValue, type, color) => 
    set((state) => {
      const key = `${layerId}-${featureValue}`;
      return {
        elementOverrides: {
          ...state.elementOverrides,
          [key]: {
            ...state.elementOverrides[key],
            [type]: color
          }
        }
      };
    }),
  deleteElement: (element) => set((state) => ({ deletedElements: [...state.deletedElements, { ...element, isHidden: true }] })),
  restoreElement: (layerId, featureValue) => 
    set((state) => ({
      deletedElements: state.deletedElements.filter(e => !(e.layerId === layerId && e.featureValue === featureValue))
    })),
  toggleDeletedElementVisibility: (layerId, featureValue, isHidden) =>
    set((state) => ({
      deletedElements: state.deletedElements.map(e => 
        (e.layerId === layerId && e.featureValue === featureValue) ? { ...e, isHidden } : e
      )
    })),
}));
