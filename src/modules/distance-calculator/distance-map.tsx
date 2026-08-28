import { MapWrapper } from "#/components/common/map-wrapper";
import { Layer, Marker, NavigationControl, Source, type MapRef } from "@vis.gl/react-maplibre";
import { useEffect, useMemo, useRef } from "react";
import { greatCirclePoints, lineSegmentsLngLat, type LatLng } from "./haversine";

type DistanceMapProps = {
  pointA: LatLng;
  pointB: LatLng;
  fitToken: number;
  onMapClick: (point: LatLng) => void;
  onDragPoint: (id: "a" | "b", point: LatLng) => void;
};

export function DistanceMap({ pointA, pointB, fitToken, onMapClick, onDragPoint }: DistanceMapProps) {
  const mapRef = useRef<MapRef>(null);
  const pointsRef = useRef({ pointA, pointB });
  pointsRef.current = { pointA, pointB };

  const routeData = useMemo(() => {
    const segments = lineSegmentsLngLat(greatCirclePoints(pointA, pointB));
    return {
      type: "FeatureCollection" as const,
      features: segments.map((coordinates) => ({
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates },
      })),
    };
  }, [pointA, pointB]);

  const fitToPoints = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const { pointA: a, pointB: b } = pointsRef.current;
    const minLng = Math.min(a.lng, b.lng);
    const maxLng = Math.max(a.lng, b.lng);
    const minLat = Math.min(a.lat, b.lat);
    const maxLat = Math.max(a.lat, b.lat);
    if (Math.abs(a.lng - b.lng) > 180) return;
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 72, maxZoom: 8, duration: 600 },
    );
  };

  useEffect(() => {
    if (fitToken === 0) return;
    fitToPoints();
  }, [fitToken]);

  return (
    <div className="relative h-full min-h-[28rem] w-full overflow-hidden rounded-xl ring-1 ring-border">
      <MapWrapper
        ref={mapRef}
        id="distance-map"
        reuseMaps
        initialViewState={{
          longitude: (pointA.lng + pointB.lng) / 2,
          latitude: (pointA.lat + pointB.lat) / 2,
          zoom: 2.4,
        }}
        cursor="crosshair"
        onLoad={() => fitToPoints()}
        onClick={(event) => {
          onMapClick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
        }}
      >
        <NavigationControl position="bottom-right" />
        <Source id="great-circle" type="geojson" data={routeData}>
          <Layer
            id="great-circle-line"
            type="line"
            paint={{
              "line-color": "#5b8def",
              "line-width": 3,
              "line-opacity": 0.9,
            }}
          />
        </Source>
        <PointMarker id="a" point={pointA} onDrag={onDragPoint} />
        <PointMarker id="b" point={pointB} onDrag={onDragPoint} />
      </MapWrapper>
    </div>
  );
}

function PointMarker({ id, point, onDrag }: { id: "a" | "b"; point: LatLng; onDrag: (id: "a" | "b", point: LatLng) => void }) {
  return (
    <Marker
      longitude={point.lng}
      latitude={point.lat}
      anchor="center"
      draggable
      onClick={(event) => event.originalEvent?.stopPropagation()}
      onDragEnd={(event) => onDrag(id, { lat: event.lngLat.lat, lng: event.lngLat.lng })}
    >
      <div
        className={
          id === "a"
            ? "flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md ring-2 ring-background"
            : "flex size-8 items-center justify-center rounded-full bg-chart-2 text-xs font-bold text-background shadow-md ring-2 ring-background"
        }
      >
        {id.toUpperCase()}
      </div>
    </Marker>
  );
}
