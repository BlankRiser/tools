import { Button } from "#/components/ui/button";
import { CopyButton } from "#/components/ui/copy-button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { cn } from "#/lib/utils";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import {
  formatBearing,
  formatCoord,
  formatDistance,
  haversineKm,
  initialBearing,
  isValidLat,
  isValidLng,
  midpoint,
  type DistanceUnit,
  type LatLng,
} from "./haversine";

const UNITS: { id: DistanceUnit; label: string }[] = [
  { id: "km", label: "km" },
  { id: "mi", label: "mi" },
  { id: "nmi", label: "nmi" },
  { id: "m", label: "m" },
];

type DistancePanelProps = {
  pointA: LatLng;
  pointB: LatLng;
  activePoint: "a" | "b";
  unit: DistanceUnit;
  onChangePoint: (id: "a" | "b", point: LatLng) => void;
  onActivePointChange: (id: "a" | "b") => void;
  onSwap: () => void;
  onUnitChange: (unit: DistanceUnit) => void;
  onFit: () => void;
};

export function DistancePanel({
  pointA,
  pointB,
  activePoint,
  unit,
  onChangePoint,
  onActivePointChange,
  onSwap,
  onUnitChange,
  onFit,
}: DistancePanelProps) {
  const km = haversineKm(pointA, pointB);
  const bearing = initialBearing(pointA, pointB);
  const mid = midpoint(pointA, pointB);
  const distanceLabel = formatDistance(km, unit);

  return (
    <div className="flex h-full flex-col gap-5 overflow-auto p-4">
      <p className="text-sm text-muted-foreground">Click the map or drag a marker. The next click updates the selected point.</p>

      <PointFields
        id="a"
        label="Point A"
        point={pointA}
        active={activePoint === "a"}
        onFocus={() => onActivePointChange("a")}
        onChange={(point) => onChangePoint("a", point)}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onSwap}>
          <ArrowsLeftRightIcon data-icon="inline-start" />
          Swap
        </Button>
        <Button variant="outline" size="sm" onClick={onFit}>
          Recenter
        </Button>
      </div>

      <PointFields
        id="b"
        label="Point B"
        point={pointB}
        active={activePoint === "b"}
        onFocus={() => onActivePointChange("b")}
        onChange={(point) => onChangePoint("b", point)}
      />

      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">Haversine</p>
            <p className="font-mono text-xl font-medium tabular-nums">{distanceLabel}</p>
          </div>
          <CopyButton value={distanceLabel} />
        </div>
        <div className="flex flex-wrap gap-1">
          {UNITS.map((item) => (
            <Button key={item.id} size="xs" variant={unit === item.id ? "default" : "outline"} onClick={() => onUnitChange(item.id)}>
              {item.label}
            </Button>
          ))}
        </div>
        <dl className="grid grid-cols-1 gap-2">
          <Stat label="Initial bearing" value={formatBearing(bearing)} />
          <Stat
            label="Midpoint"
            value={`${formatCoord(mid.lat)}, ${formatCoord(mid.lng)}`}
            copyValue={`${formatCoord(mid.lat)}, ${formatCoord(mid.lng)}`}
          />
        </dl>
      </div>
    </div>
  );
}

function PointFields({
  id,
  label,
  point,
  active,
  onFocus,
  onChange,
}: {
  id: "a" | "b";
  label: string;
  point: LatLng;
  active: boolean;
  onFocus: () => void;
  onChange: (point: LatLng) => void;
}) {
  return (
    <fieldset
      className={cn("flex flex-col gap-2 rounded-xl border p-3", active ? "border-primary/50 bg-primary/5" : "bg-muted/10")}
      onFocus={onFocus}
    >
      <legend className="px-1 text-xs font-semibold">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-lat`} className="text-2xs text-muted-foreground">
            Latitude
          </Label>
          <Input
            id={`${id}-lat`}
            type="number"
            step="0.00001"
            min={-90}
            max={90}
            value={point.lat}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "" || raw === "-" || raw === ".") return;
              const lat = Number(raw);
              if (isValidLat(lat)) onChange({ ...point, lat });
            }}
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-lng`} className="text-2xs text-muted-foreground">
            Longitude
          </Label>
          <Input
            id={`${id}-lng`}
            type="number"
            step="0.00001"
            min={-180}
            max={180}
            value={point.lng}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "" || raw === "-" || raw === ".") return;
              const lng = Number(raw);
              if (isValidLng(lng)) onChange({ ...point, lng });
            }}
            className="font-mono"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="truncate font-mono text-2xs text-muted-foreground">
          {formatCoord(point.lat)}, {formatCoord(point.lng)}
        </p>
        <CopyButton value={`${formatCoord(point.lat)}, ${formatCoord(point.lng)}`} />
      </div>
    </fieldset>
  );
}

function Stat({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-background/70 px-2.5 py-2">
      <div className="min-w-0">
        <p className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      {copyValue && <CopyButton value={copyValue} />}
    </div>
  );
}
