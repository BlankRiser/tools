import { EXPORT_RESOLUTIONS, useMapExport } from "#/hooks/use-map-export";
import { Button } from "#/components/ui/button";

import maplibregl from "maplibre-gl";

interface ExportPanelProps {
  map: maplibregl.Map | null | undefined;
  isReady: boolean;
}

export function ExportPanel({ map, isReady }: ExportPanelProps) {
  const { exportMap, isExporting, exportProgress } = useMapExport(map);

  return (
    <div className="p-4 border-t bg-muted/30">
      <h2 className="text-sm font-semibold mb-3">Export</h2>
      <div className="space-y-2">
        {EXPORT_RESOLUTIONS.map((res) => (
          <Button
            key={res.name}
            variant="outline"
            size="sm"
            className="w-full justify-between"
            onClick={() => exportMap(res)}
            disabled={isExporting || !isReady}
          >
            <span>{res.name}</span>
            <span className="text-xs text-muted-foreground">
              {res.width}x{res.height}
            </span>
          </Button>
        ))}
        {isExporting && (
          <div className="w-full bg-secondary rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-primary h-1.5 transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
