import { useState, useCallback } from "react";
import maplibregl from "maplibre-gl";

export interface ExportResolution {
  name: string;
  width: number;
  height: number;
}

export const EXPORT_RESOLUTIONS: ExportResolution[] = [
  { name: "1080p (FHD)", width: 1920, height: 1080 },
  { name: "1440p (QHD)", width: 2560, height: 1440 },
  { name: "4K (UHD)", width: 3840, height: 2160 },
];

export function useMapExport(map: maplibregl.Map | undefined | null) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportMap = useCallback(
    async (resolution: ExportResolution) => {
      if (!map) return;

      try {
        setIsExporting(true);
        setExportProgress(10); // Initializing

        // Create a hidden container for the HD map
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.top = "-9999px";
        container.style.left = "-9999px";
        container.style.width = `${resolution.width}px`;
        container.style.height = `${resolution.height}px`;
        // Needs to be in the DOM for the map to render properly
        document.body.appendChild(container);

        setExportProgress(30); // Setting up map

        // Get the current state
        const style = map.getStyle();
        const center = map.getCenter();
        const zoom = map.getZoom();
        const pitch = map.getPitch();
        const bearing = map.getBearing();

        // Initialize the new map
        const hdMap = new maplibregl.Map({
          container,
          style,
          center,
          zoom,
          pitch,
          bearing,
          canvasContextAttributes: { preserveDrawingBuffer: true },
          interactive: false,
        });

        setExportProgress(60); // Waiting for render

        // Wait for the map to become fully idle
        await new Promise<void>((resolve) => {
          hdMap.once("idle", () => {
            resolve();
          });
        });

        setExportProgress(90); // Exporting image

        // Get the canvas and data URL
        const canvas = hdMap.getCanvas();
        const dataURL = canvas.toDataURL("image/png");

        // Download the image
        const link = document.createElement("a");
        link.download = `map-wallpaper-${resolution.width}x${resolution.height}.png`;
        link.href = dataURL;
        link.click();

        setExportProgress(100); // Cleanup

        // Cleanup
        hdMap.remove();
        document.body.removeChild(container);
      } catch (error) {
        console.error("Failed to export map:", error);
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    [map]
  );

  return {
    exportMap,
    isExporting,
    exportProgress,
  };
}
