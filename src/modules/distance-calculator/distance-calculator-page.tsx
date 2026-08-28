import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { MapProvider } from "@vis.gl/react-maplibre";
import { useState } from "react";
import { DistanceMap } from "./distance-map";
import { DistancePanel } from "./distance-panel";
import type { DistanceUnit, LatLng } from "./haversine";

const LONDON: LatLng = { lat: 51.5074, lng: -0.1278 };
const NEW_YORK: LatLng = { lat: 40.7128, lng: -74.006 };

export default function DistanceCalculatorPage() {
  const [pointA, setPointA] = useState<LatLng>(LONDON);
  const [pointB, setPointB] = useState<LatLng>(NEW_YORK);
  const [activePoint, setActivePoint] = useState<"a" | "b">("a");
  const [unit, setUnit] = useState<DistanceUnit>("km");
  const [fitToken, setFitToken] = useState(0);

  const setPoint = (id: "a" | "b", point: LatLng) => {
    if (id === "a") setPointA(point);
    else setPointB(point);
  };

  return (
    <GlobalErrorBoundary>
      <MapProvider>
        <div className="mx-auto flex h-[calc(100dvh-2.8rem)] w-full max-w-7xl flex-col gap-4 p-4 lg:flex-row">
          <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border bg-card lg:w-80">
            <div className="border-b p-4">
              <h1 className="text-xl font-bold tracking-tight">Distance Calculator</h1>
              <p className="mt-1 text-sm text-muted-foreground">Haversine distance between two points on the globe.</p>
            </div>
            <DistancePanel
              pointA={pointA}
              pointB={pointB}
              activePoint={activePoint}
              unit={unit}
              onChangePoint={setPoint}
              onActivePointChange={setActivePoint}
              onSwap={() => {
                setPointA(pointB);
                setPointB(pointA);
              }}
              onUnitChange={setUnit}
              onFit={() => setFitToken((token) => token + 1)}
            />
          </div>
          <div className="h-full min-h-[28rem] min-w-0 flex-1">
            <DistanceMap
              pointA={pointA}
              pointB={pointB}
              fitToken={fitToken}
              onMapClick={(point) => {
                setPoint(activePoint, point);
                setActivePoint((current) => (current === "a" ? "b" : "a"));
              }}
              onDragPoint={(id, point) => {
                setPoint(id, point);
                setActivePoint(id);
              }}
            />
          </div>
        </div>
      </MapProvider>
    </GlobalErrorBoundary>
  );
}
