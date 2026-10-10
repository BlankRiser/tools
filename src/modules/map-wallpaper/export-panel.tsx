import { Button } from "#/components/ui/button";
import { EXPORT_RESOLUTIONS, useMapExport } from "#/hooks/use-map-export";
import maplibregl from "maplibre-gl";

interface ExportPanelProps {
  map: maplibregl.Map | null | undefined;
  isReady: boolean;
}

export function ExportPanel({ map, isReady }: ExportPanelProps) {
  const { exportMap, isExporting, exportProgress } = useMapExport(map);

  return (
    <div className="border-t bg-muted/30 p-4">
      <h2 className="mb-3 text-sm font-semibold">Export</h2>
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
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-1.5 bg-primary transition-all duration-300" style={{ width: `${exportProgress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
