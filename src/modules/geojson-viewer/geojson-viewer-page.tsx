import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { MapWrapper } from "#/components/common/map-wrapper";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { CopyButton } from "#/components/ui/copy-button";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import {
  ArrowsOutIcon,
  CircleIcon,
  CursorClickIcon,
  DownloadSimpleIcon,
  FileArrowUpIcon,
  HandIcon,
  MapTrifoldIcon,
  PolygonIcon,
  SelectionAllIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Layer, NavigationControl, Popup, Source, type MapLayerMouseEvent, type MapRef } from "@vis.gl/react-maplibre";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  calculateBboxMetrics,
  computeBbox,
  formatBbox,
  generateBboxPolygon,
  generateCirclePolygon,
  haversineDistanceKm,
  normalizeToFeatureCollection,
  parseShapefile,
  type BBox,
} from "./geo-utils";

type ToolMode = "viewer" | "bbox";
type DrawMode = "pan" | "select" | "rectangle" | "circle" | "polygon";

const SAMPLE_GEOJSON = JSON.stringify(
  {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Central Park", category: "Park", rating: 4.8 },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-73.9818, 40.7681],
              [-73.9582, 40.8005],
              [-73.9493, 40.7968],
              [-73.9729, 40.7644],
              [-73.9818, 40.7681],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: { name: "Broadway Avenue Path", length_km: 3.2 },
        geometry: {
          type: "LineString",
          coordinates: [
            [-73.9855, 40.758],
            [-73.9822, 40.762],
            [-73.9754, 40.771],
            [-73.9689, 40.78],
          ],
        },
      },
      {
        type: "Feature",
        properties: { name: "Metropolitan Museum of Art", visitors_yearly: "5.5M" },
        geometry: {
          type: "Point",
          coordinates: [-73.9632, 40.7794],
        },
      },
      {
        type: "Feature",
        properties: { name: "Empire State Building", height_m: 381 },
        geometry: {
          type: "Point",
          coordinates: [-73.9857, 40.7484],
        },
      },
    ],
  },
  null,
  2,
);

export function GeoJsonViewerPage({ initialMode = "viewer" }: { initialMode?: ToolMode }) {
  const [mode, setMode] = useState<ToolMode>(initialMode);
  const mapRef = useRef<MapRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // Mode 1: GeoJSON & Shapefile Viewer State
  // -------------------------------------------------------------
  const [rawInput, setRawInput] = useState(SAMPLE_GEOJSON);
  const [selectedFeature, setSelectedFeature] = useState<{ properties: any; coords: [number, number] } | null>(null);
  const [layerColor, setLayerColor] = useState("#2563eb");

  const parsedData = useMemo(() => {
    if (!rawInput.trim()) return null;
    try {
      const parsed = JSON.parse(rawInput);
      const fc = normalizeToFeatureCollection(parsed);
      const bbox = computeBbox(fc);
      return { fc, bbox, error: null };
    } catch (err: any) {
      return { fc: null, bbox: null, error: err.message || "Invalid GeoJSON" };
    }
  }, [rawInput]);

  // Fit map to parsed GeoJSON
  const fitToGeoJson = useCallback(
    (bboxOverride?: BBox) => {
      const box = bboxOverride || parsedData?.bbox;
      if (!box || !mapRef.current) return;
      const [minLng, minLat, maxLng, maxLat] = box;
      const map = mapRef.current.getMap();
      if (!map) return;

      if (minLng === maxLng && minLat === maxLat) {
        map.flyTo({ center: [minLng, minLat], zoom: 14, duration: 800 });
        return;
      }

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 60, maxZoom: 16, duration: 800 },
      );
    },
    [parsedData?.bbox],
  );

  useEffect(() => {
    if (mode === "viewer" && parsedData?.bbox) {
      fitToGeoJson();
    }
  }, [parsedData?.bbox, mode, fitToGeoJson]);

  // -------------------------------------------------------------
  // Mode 2: Interactive Bounding Box Picker State
  // -------------------------------------------------------------
  const [drawMode, setDrawMode] = useState<DrawMode>("rectangle");
  const [drawStart, setDrawStart] = useState<[number, number] | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<[number, number] | null>(null);
  const [mouseCoords, setMouseCoords] = useState<[number, number] | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [drawnFeature, setDrawnFeature] = useState<any | null>(null);
  const [mapVersion, setMapVersion] = useState(0);

  // Selection & Shape Dragging State
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const shapeDragRef = useRef<{
    startPos: { x: number; y: number };
    startLngLat: { lng: number; lat: number };
    initialCoordinates?: [number, number][];
    initialCenter?: [number, number];
    radiusKm?: number;
    isCircle?: boolean;
    hasMoved: boolean;
  } | null>(null);

  const pointerDownRef = useRef<{ point: { x: number; y: number }; coords: [number, number] } | null>(null);

  // Project map [lng, lat] coordinates to screen pixel { x, y }
  const project = useCallback(
    (coords: [number, number] | null | undefined): { x: number; y: number } | null => {
      if (!coords) return null;
      const map = mapRef.current?.getMap();
      if (!map) return null;
      try {
        const pt = map.project(coords);
        if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return null;
        return { x: pt.x, y: pt.y };
      } catch {
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapVersion],
  );

  // Computed bbox from drawn feature
  const drawnBbox = useMemo<BBox | null>(() => {
    if (!drawnFeature) return null;
    return computeBbox(drawnFeature);
  }, [drawnFeature]);

  // BBox polygon feature
  const bboxFeature = useMemo(() => {
    if (!drawnBbox) return null;
    return generateBboxPolygon(drawnBbox);
  }, [drawnBbox]);

  const bboxMetrics = useMemo(() => {
    if (!drawnBbox) return null;
    return calculateBboxMetrics(drawnBbox);
  }, [drawnBbox]);

  const bboxFormats = useMemo(() => {
    if (!drawnBbox) return null;
    return formatBbox(drawnBbox);
  }, [drawnBbox]);

  // Initiates dragging the entire shape across the map
  const handleShapePointerDown = (e: React.PointerEvent) => {
    if (drawMode !== "select") return;
    if (e.button !== 0) return; // Only primary mouse button
    e.stopPropagation();

    const map = mapRef.current?.getMap();
    if (!map || !drawnFeature) return;

    const rect = map.getContainer().getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const startLngLat = map.unproject([screenX, screenY]);

    const isCircle = drawnFeature.properties?.type === "circle";
    const initialCoordinates = drawnFeature.geometry?.coordinates?.[0] as [number, number][] | undefined;
    const initialCenter = drawnFeature.properties?.center as [number, number] | undefined;
    const radiusKm = drawnFeature.properties?.radiusKm as number | undefined;

    shapeDragRef.current = {
      startPos: { x: e.clientX, y: e.clientY },
      startLngLat: { lng: startLngLat.lng, lat: startLngLat.lat },
      initialCoordinates: initialCoordinates ? initialCoordinates.map((c) => [...c] as [number, number]) : undefined,
      initialCenter: initialCenter ? [...initialCenter] : undefined,
      radiusKm,
      isCircle,
      hasMoved: false,
    };
    setIsDraggingShape(true);
  };

  // Window listener for dragging the entire shape across the map
  useEffect(() => {
    if (!isDraggingShape) return;

    const handlePointerMove = (e: PointerEvent) => {
      const drag = shapeDragRef.current;
      if (!drag) return;

      const dist = Math.hypot(e.clientX - drag.startPos.x, e.clientY - drag.startPos.y);
      if (dist > 3) {
        drag.hasMoved = true;
      }

      const map = mapRef.current?.getMap();
      if (!map) return;

      const rect = map.getContainer().getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const currentLngLat = map.unproject([screenX, screenY]);

      const deltaLng = currentLngLat.lng - drag.startLngLat.lng;
      const deltaLat = currentLngLat.lat - drag.startLngLat.lat;

      if (drag.isCircle && drag.initialCenter) {
        const newCenterLng = drag.initialCenter[0] + deltaLng;
        const newCenterLat = Math.min(85, Math.max(-85, drag.initialCenter[1] + deltaLat));
        const newCenter: [number, number] = [newCenterLng, newCenterLat];
        const newCircle = generateCirclePolygon(newCenter, drag.radiusKm || 1);
        setDrawnFeature(newCircle);
      } else if (drag.initialCoordinates) {
        const newRing: [number, number][] = drag.initialCoordinates.map(([lng, lat]) => [
          lng + deltaLng,
          Math.min(85, Math.max(-85, lat + deltaLat)),
        ]);
        setDrawnFeature((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            geometry: {
              ...prev.geometry,
              coordinates: [newRing],
            },
          };
        });
      }
    };

    const handlePointerUp = () => {
      shapeDragRef.current = null;
      setIsDraggingShape(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingShape]);

  // Cancel any in-progress drawing or selection
  const cancelDrawing = useCallback(() => {
    setDrawStart(null);
    setDrawCurrent(null);
    setPolygonPoints([]);
    setMouseCoords(null);
    shapeDragRef.current = null;
    setIsDraggingShape(false);
    pointerDownRef.current = null;
  }, []);

  const clearDrawing = useCallback(() => {
    setDrawnFeature(null);
    cancelDrawing();
  }, [cancelDrawing]);

  // Keyboard shortcut listener: Escape to cancel drawing, Delete/Backspace to remove shape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelDrawing();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";
        if (!isInput && drawMode === "select" && drawnFeature) {
          e.preventDefault();
          clearDrawing();
          toast.success("Shape removed");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelDrawing, clearDrawing, drawMode, drawnFeature]);

  // -------------------------------------------------------------
  // Map Mouse Events for Drawing (Supports both Click-Click and Click-Drag)
  // -------------------------------------------------------------
  const handleMapMouseDown = (e: MapLayerMouseEvent) => {
    if (drawMode === "pan" || drawMode === "select") {
      return;
    }
    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    pointerDownRef.current = { point: { x: e.point.x, y: e.point.y }, coords };

    if (drawMode === "rectangle" || drawMode === "circle") {
      if (!drawStart) {
        // First click/press: set start point
        setDrawStart(coords);
        setDrawCurrent(coords);
      } else {
        // Second click: finalize shape!
        finishShape(drawStart, coords);
      }
    } else if (drawMode === "polygon") {
      setPolygonPoints((prev) => [...prev, coords]);
    }
  };

  const handleMapMouseMove = (e: MapLayerMouseEvent) => {
    if (drawMode === "pan" || drawMode === "select") return;
    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    setMouseCoords(coords);

    if (drawStart) {
      setDrawCurrent(coords);
    }
  };

  const handleMapMouseUp = (e: MapLayerMouseEvent) => {
    if (drawMode === "pan" || drawMode === "select" || !drawStart || !pointerDownRef.current) return;
    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];

    // Distance in screen pixels between pointerdown and pointerup
    const pixelDist = Math.hypot(e.point.x - pointerDownRef.current.point.x, e.point.y - pointerDownRef.current.point.y);

    if (pixelDist > 8) {
      // User dragged to create the shape -> complete on mouseup!
      finishShape(drawStart, coords);
    }
  };

  const handleMapDblClick = (e: MapLayerMouseEvent) => {
    if (drawMode === "polygon" && polygonPoints.length >= 2) {
      e.preventDefault();
      finishPolygon();
    }
  };

  const finishShape = (start: [number, number], end: [number, number]) => {
    if (drawMode === "rectangle") {
      const minLng = Math.min(start[0], end[0]);
      const maxLng = Math.max(start[0], end[0]);
      const minLat = Math.min(start[1], end[1]);
      const maxLat = Math.max(start[1], end[1]);

      if (Math.abs(maxLng - minLng) < 0.00001 && Math.abs(maxLat - minLat) < 0.00001) {
        return;
      }

      const bboxPoly = generateBboxPolygon([minLng, minLat, maxLng, maxLat]);
      setDrawnFeature(bboxPoly);
      setDrawMode("select");
      toast.success("Bounding box captured — drag shape to reposition");
    } else if (drawMode === "circle") {
      const radiusKm = haversineDistanceKm(start, end);
      if (radiusKm < 0.001) return;
      const circlePoly = generateCirclePolygon(start, radiusKm);
      setDrawnFeature(circlePoly);
      setDrawMode("select");
      toast.success("Circle captured — drag shape to reposition");
    }

    setDrawStart(null);
    setDrawCurrent(null);
    setMouseCoords(null);
    pointerDownRef.current = null;
  };

  const finishPolygon = () => {
    // Filter out consecutive duplicate points (e.g. from double click)
    const pts = polygonPoints.filter((pt, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      return Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) > 0.00001;
    });

    if (pts.length < 3) {
      toast.error("A polygon requires at least 3 points");
      return;
    }
    const closedCoords = [...pts, pts[0]];
    const feat = {
      type: "Feature",
      properties: { type: "polygon" },
      geometry: {
        type: "Polygon",
        coordinates: [closedCoords],
      },
    };
    setDrawnFeature(feat);
    setPolygonPoints([]);
    setMouseCoords(null);
    pointerDownRef.current = null;
    setDrawMode("select");
    toast.success("Polygon captured — drag shape to reposition");
  };

  // Handle file upload (GeoJSON or Shapefile)
  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    const name = file.name.toLowerCase();

    try {
      if (name.endsWith(".zip") || name.endsWith(".shp")) {
        const buffer = await file.arrayBuffer();
        const geojson = await parseShapefile(buffer);
        setRawInput(JSON.stringify(geojson, null, 2));
        setMode("viewer");
        toast.success(`Parsed Shapefile: ${file.name}`);
      } else {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const normalized = normalizeToFeatureCollection(parsed);
        setRawInput(JSON.stringify(normalized, null, 2));
        setMode("viewer");
        toast.success(`Loaded GeoJSON: ${file.name}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error reading file: ${err.message || "Invalid file format"}`);
    }
  };

  const handleFeatureClick = (e: MapLayerMouseEvent) => {
    if (drawMode !== "pan" || !e.features || e.features.length === 0) return;
    const f = e.features[0];
    setSelectedFeature({
      properties: f.properties,
      coords: [e.lngLat.lng, e.lngLat.lat],
    });
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col gap-4 p-4 lg:p-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              {mode === "viewer" ? "GeoJSON & Shapefile Viewer" : "Bounding Box Picker"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
              {mode === "viewer"
                ? "Visualize GeoJSON, Shapefiles, and spatial geometries with auto-zoom and feature inspection."
                : "Draw rectangles, circles, or custom polygons on the map to extract precise bounding box coordinates."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode("viewer");
                  setDrawMode("pan");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === "viewer" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MapTrifoldIcon className="size-4" weight="duotone" />
                Viewer
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("bbox");
                  setDrawMode("rectangle");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === "bbox" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <SelectionAllIcon className="size-4" weight="duotone" />
                Bounding Box Picker
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json,.zip,.shp"
              className="sr-only"
              onChange={(e) => {
                void handleFileUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileArrowUpIcon data-icon="inline-start" />
              Upload (.geojson, .shp, .zip)
            </Button>
          </div>
        </div>

        {/* Workspace: Map + Side Panel */}
        <div className="grid flex-1 items-stretch gap-4 overflow-hidden lg:grid-cols-[1fr_380px]">
          {/* Map View */}
          <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-border bg-card lg:h-full">
            <MapWrapper
              ref={mapRef}
              id="geo-viewer-map"
              reuseMaps
              dragPan={!isDraggingShape && (drawMode === "pan" || drawMode === "select")}
              doubleClickZoom={drawMode === "pan" || drawMode === "select"}
              touchZoomRotate={drawMode === "pan" || drawMode === "select"}
              initialViewState={{
                longitude: -73.97,
                latitude: 40.77,
                zoom: 12,
              }}
              cursor={isDraggingShape ? "grabbing" : drawMode === "pan" ? "grab" : drawMode === "select" ? "default" : "crosshair"}
              interactiveLayerIds={mode === "viewer" && drawMode === "pan" ? ["geojson-polygons-fill", "geojson-lines", "geojson-points"] : undefined}
              onMove={() => setMapVersion((v) => v + 1)}
              onZoom={() => setMapVersion((v) => v + 1)}
              onRotate={() => setMapVersion((v) => v + 1)}
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onDblClick={handleMapDblClick}
              onClick={handleFeatureClick}
            >
              <NavigationControl position="top-right" />

              {/* Mode 1: Render GeoJSON Layers */}
              {mode === "viewer" && parsedData?.fc && (
                <Source id="user-geojson" type="geojson" data={parsedData.fc}>
                  <Layer
                    id="geojson-polygons-fill"
                    type="fill"
                    filter={["==", "$type", "Polygon"]}
                    paint={{
                      "fill-color": layerColor,
                      "fill-opacity": 0.25,
                    }}
                  />
                  <Layer
                    id="geojson-polygons-outline"
                    type="line"
                    filter={["==", "$type", "Polygon"]}
                    paint={{
                      "line-color": layerColor,
                      "line-width": 2,
                    }}
                  />
                  <Layer
                    id="geojson-lines"
                    type="line"
                    filter={["==", "$type", "LineString"]}
                    paint={{
                      "line-color": "#f59e0b",
                      "line-width": 3,
                    }}
                  />
                  <Layer
                    id="geojson-points"
                    type="circle"
                    filter={["==", "$type", "Point"]}
                    paint={{
                      "circle-color": "#ec4899",
                      "circle-radius": 7,
                      "circle-stroke-width": 2,
                      "circle-stroke-color": "#ffffff",
                    }}
                  />
                </Source>
              )}

              {/* Feature Inspection Popup */}
              {selectedFeature && (
                <Popup
                  longitude={selectedFeature.coords[0]}
                  latitude={selectedFeature.coords[1]}
                  closeButton
                  closeOnClick={false}
                  onClose={() => setSelectedFeature(null)}
                  className="text-xs"
                >
                  <div className="max-h-48 overflow-auto p-1 font-sans">
                    <p className="mb-1 font-bold text-foreground">Feature Properties</p>
                    <table className="w-full text-2xs">
                      <tbody>
                        {Object.entries(selectedFeature.properties || {}).map(([k, v]) => (
                          <tr key={k} className="border-b border-border/40">
                            <td className="pr-2 font-mono text-muted-foreground">{k}</td>
                            <td className="font-mono font-medium">{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Popup>
              )}

              {/* Completed Drawn Shape (MapLibre layer) */}
              {drawnFeature && (
                <Source id="drawn-feature-source" type="geojson" data={drawnFeature}>
                  <Layer
                    id="drawn-fill"
                    type="fill"
                    filter={["==", "$type", "Polygon"]}
                    paint={{
                      "fill-color": "#0ea5e9",
                      "fill-opacity": 0.25,
                    }}
                  />
                  <Layer
                    id="drawn-line"
                    type="line"
                    filter={["in", "$type", "Polygon", "LineString"]}
                    paint={{
                      "line-color": "#0ea5e9",
                      "line-width": 2.5,
                    }}
                  />
                </Source>
              )}

              {/* Bounding Box Outline (MapLibre layer) */}
              {bboxFeature && (
                <Source id="drawn-bbox-source" type="geojson" data={bboxFeature}>
                  <Layer
                    id="drawn-bbox-line"
                    type="line"
                    filter={["in", "$type", "Polygon", "LineString"]}
                    paint={{
                      "line-color": "#10b981",
                      "line-width": 2,
                    }}
                  />
                  <Layer
                    id="drawn-bbox-fill"
                    type="fill"
                    filter={["==", "$type", "Polygon"]}
                    paint={{
                      "fill-color": "#10b981",
                      "fill-opacity": 0.08,
                    }}
                  />
                </Source>
              )}
            </MapWrapper>

            {/* Real-time High-Visibility Interactive Drawing & Geometry SVG Overlay */}
            <svg className="pointer-events-none absolute inset-0 z-1 size-full overflow-hidden">
              {/* 1. Polygon: Solid lines connecting placed nodes */}
              {drawMode === "polygon" && polygonPoints.length >= 2 && (
                <polyline
                  points={polygonPoints
                    .map((pt) => {
                      const p = project(pt);
                      return p ? `${p.x},${p.y}` : "";
                    })
                    .filter(Boolean)
                    .join(" ")}
                  fill={polygonPoints.length >= 3 ? "rgba(37, 99, 235, 0.15)" : "none"}
                  stroke="#2563eb"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* 2. Polygon: Live dashed rubberband line to cursor */}
              {drawMode === "polygon" &&
                polygonPoints.length >= 1 &&
                mouseCoords &&
                (() => {
                  const lastPt = project(polygonPoints[polygonPoints.length - 1]);
                  const curPt = project(mouseCoords);
                  if (!lastPt || !curPt) return null;
                  return <line x1={lastPt.x} y1={lastPt.y} x2={curPt.x} y2={curPt.y} stroke="#2563eb" strokeWidth={2.5} strokeDasharray="6,4" />;
                })()}

              {/* 3. Polygon: Closing preview line from cursor back to node 1 */}
              {drawMode === "polygon" &&
                polygonPoints.length >= 2 &&
                mouseCoords &&
                (() => {
                  const firstPt = project(polygonPoints[0]);
                  const curPt = project(mouseCoords);
                  if (!firstPt || !curPt) return null;
                  return (
                    <line
                      x1={curPt.x}
                      y1={curPt.y}
                      x2={firstPt.x}
                      y2={firstPt.y}
                      stroke="#60a5fa"
                      strokeWidth={1.5}
                      strokeDasharray="4,4"
                      opacity={0.7}
                    />
                  );
                })()}

              {/* 4. Polygon: Numbered Vertex Indicators during placement */}
              {drawMode === "polygon" &&
                polygonPoints.map((pt, i) => {
                  const p = project(pt);
                  if (!p) return null;
                  return (
                    <g key={`polygon-node-${pt[0]}-${pt[1]}-${i}`} className="pointer-events-none select-none">
                      <circle cx={p.x} cy={p.y} r={10} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
                      <text
                        x={p.x}
                        y={p.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={9}
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {i + 1}
                      </text>
                    </g>
                  );
                })}

              {/* 5. Rectangle: Live in-progress drawing */}
              {drawMode === "rectangle" &&
                drawStart &&
                drawCurrent &&
                (() => {
                  const p1 = project(drawStart);
                  const p2 = project(drawCurrent);
                  if (!p1 || !p2) return null;
                  const x = Math.min(p1.x, p2.x);
                  const y = Math.min(p1.y, p2.y);
                  const w = Math.abs(p1.x - p2.x);
                  const h = Math.abs(p1.y - p2.y);
                  return (
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill="rgba(37, 99, 235, 0.18)"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        strokeDasharray="6,4"
                        rx={2}
                      />
                      <rect x={x - 3.5} y={y - 3.5} width={7} height={7} fill="#ffffff" stroke="#2563eb" strokeWidth={1.5} />
                      <rect x={x + w - 3.5} y={y - 3.5} width={7} height={7} fill="#ffffff" stroke="#2563eb" strokeWidth={1.5} />
                      <rect x={x - 3.5} y={y + h - 3.5} width={7} height={7} fill="#ffffff" stroke="#2563eb" strokeWidth={1.5} />
                      <rect x={x + w - 3.5} y={y + h - 3.5} width={7} height={7} fill="#ffffff" stroke="#2563eb" strokeWidth={1.5} />
                    </g>
                  );
                })()}

              {/* 6. Circle: Live in-progress drawing */}
              {drawMode === "circle" &&
                drawStart &&
                drawCurrent &&
                (() => {
                  const pCenter = project(drawStart);
                  const pEdge = project(drawCurrent);
                  if (!pCenter || !pEdge) return null;
                  const radiusPx = Math.hypot(pEdge.x - pCenter.x, pEdge.y - pCenter.y);
                  return (
                    <g>
                      <circle
                        cx={pCenter.x}
                        cy={pCenter.y}
                        r={Math.max(radiusPx, 2)}
                        fill="rgba(37, 99, 235, 0.18)"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        strokeDasharray="6,4"
                      />
                      <line x1={pCenter.x} y1={pCenter.y} x2={pEdge.x} y2={pEdge.y} stroke="#2563eb" strokeWidth={2} />
                      <circle cx={pCenter.x} cy={pCenter.y} r={4.5} fill="#2563eb" stroke="#ffffff" strokeWidth={1.5} />
                      <circle cx={pEdge.x} cy={pEdge.y} r={4.5} fill="#ffffff" stroke="#2563eb" strokeWidth={1.5} />
                    </g>
                  );
                })()}

              {/* 7. Completed Drawn Shape (Polygon / Circle / Rectangle) */}
              {drawnFeature?.geometry &&
                (() => {
                  const coords = drawnFeature.geometry.coordinates?.[0] as [number, number][] | undefined;
                  if (!coords || coords.length < 3) return null;
                  const pts = coords
                    .map((pt) => {
                      const p = project(pt);
                      return p ? `${p.x},${p.y}` : "";
                    })
                    .filter(Boolean)
                    .join(" ");
                  if (!pts) return null;
                  return (
                    <polygon
                      points={pts}
                      fill={isDraggingShape ? "rgba(14, 165, 233, 0.35)" : "rgba(14, 165, 233, 0.22)"}
                      stroke="#0284c7"
                      strokeWidth={drawMode === "select" ? 2.5 : 2}
                      strokeDasharray={isDraggingShape ? "6,4" : undefined}
                      strokeLinejoin="round"
                      className={cn(
                        drawMode === "select"
                          ? "pointer-events-auto cursor-grab hover:fill-sky-500/30 active:cursor-grabbing"
                          : "pointer-events-none",
                      )}
                      onPointerDown={handleShapePointerDown}
                    />
                  );
                })()}

              {/* 8. Center Indicator for completed Circle */}
              {drawnFeature?.properties?.type === "circle" &&
                drawnFeature.properties.center &&
                (() => {
                  const centerPt = drawnFeature.properties.center as [number, number];
                  const pCenter = project(centerPt);
                  if (!pCenter) return null;
                  return (
                    <circle cx={pCenter.x} cy={pCenter.y} r={4.5} fill="#0284c7" stroke="#ffffff" strokeWidth={2} className="pointer-events-none" />
                  );
                })()}

              {/* 10. Completed Bounding Box Outline with corner pins */}
              {drawnBbox &&
                (() => {
                  const [minLng, minLat, maxLng, maxLat] = drawnBbox;
                  const c1 = project([minLng, minLat]);
                  const c2 = project([maxLng, minLat]);
                  const c3 = project([maxLng, maxLat]);
                  const c4 = project([minLng, maxLat]);
                  if (!c1 || !c2 || !c3 || !c4) return null;
                  return (
                    <g>
                      <polygon
                        points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y} ${c4.x},${c4.y}`}
                        fill="rgba(16, 185, 129, 0.08)"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5,4"
                      />
                      {[c1, c2, c3, c4].map((c, idx) => (
                        <rect
                          key={`bbox-pin-${idx}`}
                          x={c.x - 3.5}
                          y={c.y - 3.5}
                          width={7}
                          height={7}
                          fill="#ffffff"
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      ))}
                    </g>
                  );
                })()}
            </svg>

            {/* In-Map Floating Drawing & Navigation Toolbar */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-background/95 p-1 shadow-md backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => {
                    setDrawMode("pan");
                    cancelDrawing();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    drawMode === "pan"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title="Pan and navigate map"
                >
                  <HandIcon className="size-3.5" weight="duotone" />
                  Pan
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawMode("select");
                    cancelDrawing();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    drawMode === "select"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title="Select & drag shape to reposition it on the map"
                >
                  <CursorClickIcon className="size-3.5" weight="duotone" />
                  Select & Move
                </button>

                <div className="mx-0.5 h-4 w-px bg-border/60" />

                <button
                  type="button"
                  onClick={() => {
                    setDrawMode("rectangle");
                    cancelDrawing();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    drawMode === "rectangle"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title="Click two corners or drag to draw rectangle"
                >
                  <SelectionAllIcon className="size-3.5" weight="duotone" />
                  Rectangle
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawMode("circle");
                    cancelDrawing();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    drawMode === "circle"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title="Click center and drag/click edge for circle"
                >
                  <CircleIcon className="size-3.5" weight="duotone" />
                  Circle
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawMode("polygon");
                    cancelDrawing();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    drawMode === "polygon"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title="Click points on map to build polygon"
                >
                  <PolygonIcon className="size-3.5" weight="duotone" />
                  Polygon
                </button>

                {drawnFeature && (
                  <>
                    <div className="mx-0.5 h-4 w-px bg-border/60" />
                    <Button size="xs" variant="ghost" onClick={clearDrawing} title="Clear shape">
                      <TrashIcon className="size-3.5 text-muted-foreground" />
                    </Button>
                  </>
                )}
              </div>

              {/* Active Instructions Banner */}
              {drawMode !== "pan" && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary shadow-sm backdrop-blur-md">
                  <span className="font-medium">
                    {drawMode === "select" &&
                      (drawnFeature ? "Click & drag the shape to reposition it on the map" : "Draw a shape above to move or inspect it")}
                    {drawMode === "rectangle" &&
                      (drawStart ? "Click opposite corner (or release drag) to finish" : "Click map to set 1st corner (or drag)")}
                    {drawMode === "circle" && (drawStart ? "Move cursor and click to set circle radius" : "Click map to set circle center")}
                    {drawMode === "polygon" &&
                      (polygonPoints.length === 0 ? "Click map to place 1st vertex" : `Placed ${polygonPoints.length} points. Click to add more.`)}
                  </span>

                  <div className="flex items-center gap-1">
                    {drawMode === "polygon" && polygonPoints.length >= 3 && (
                      <Button size="xs" variant="default" onClick={finishPolygon}>
                        Finish
                      </Button>
                    )}
                    {(drawStart || polygonPoints.length > 0) && (
                      <button type="button" onClick={cancelDrawing} className="rounded p-0.5 hover:bg-primary/20" title="Cancel drawing">
                        <XIcon className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Fit Button (bottom left) */}
            {mode === "viewer" && parsedData?.bbox && (
              <div className="absolute bottom-4 left-3 z-10">
                <Button size="sm" variant="secondary" onClick={() => fitToGeoJson()} className="shadow-md backdrop-blur-md">
                  <ArrowsOutIcon data-icon="inline-start" />
                  Fit to features
                </Button>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="flex h-full flex-col gap-3 overflow-auto">
            {mode === "viewer" ? (
              /* Viewer Controls */
              <div className="flex h-full flex-col gap-3">
                <Card className="flex flex-1 flex-col overflow-hidden py-3">
                  <CardHeader className="py-0 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">GeoJSON Data</CardTitle>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="xs" onClick={() => setRawInput(SAMPLE_GEOJSON)} disabled={rawInput === SAMPLE_GEOJSON}>
                          Sample
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => setRawInput("")} disabled={!rawInput}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col py-0">
                    <Textarea
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder="Paste GeoJSON (FeatureCollection, Feature, or Geometry)..."
                      spellCheck={false}
                      className="h-full min-h-[16rem] resize-none font-mono text-2xs leading-relaxed"
                    />

                    {parsedData?.error ? (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                        <WarningCircleIcon className="size-4 shrink-0" weight="fill" />
                        <span className="line-clamp-2">{parsedData.error}</span>
                      </div>
                    ) : parsedData?.fc ? (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-2xs text-muted-foreground">
                        <span>{parsedData.fc.features.length} features parsed</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-2xs">Layer Color</Label>
                          <input
                            type="color"
                            value={layerColor}
                            onChange={(e) => setLayerColor(e.target.value)}
                            className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Feature Attributes Summary / BBox */}
                {parsedData?.bbox && (
                  <Card className="py-3">
                    <CardHeader className="py-0 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bounding Box</CardTitle>
                        <CopyButton value={JSON.stringify(parsedData.bbox)} size="icon-xs" variant="ghost" />
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <code className="block rounded bg-muted/50 p-2 font-mono text-2xs">
                        [{parsedData.bbox.map((v) => v.toFixed(5)).join(", ")}]
                      </code>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Bounding Box Picker Controls */
              <div className="flex h-full flex-col gap-3">
                {/* Bounding Box Outputs */}
                {!drawnBbox || !bboxFormats ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/30 p-6 text-center">
                    <SelectionAllIcon className="mb-2 size-8 text-muted-foreground/60" weight="duotone" />
                    <p className="text-xs font-medium text-muted-foreground">
                      Pick a tool above (Rectangle, Circle, or Polygon) and click on the map to draw.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-3">
                    {/* Metrics card */}
                    {bboxMetrics && (
                      <Card className="py-3">
                        <CardHeader className="py-0 pb-2">
                          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Dimensions & Area</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-2xs text-muted-foreground">Width:</span>
                            <p className="font-mono font-medium">{bboxMetrics.widthKm.toFixed(2)} km</p>
                          </div>
                          <div>
                            <span className="text-2xs text-muted-foreground">Height:</span>
                            <p className="font-mono font-medium">{bboxMetrics.heightKm.toFixed(2)} km</p>
                          </div>
                          <div>
                            <span className="text-2xs text-muted-foreground">Area:</span>
                            <p className="font-mono font-medium">{bboxMetrics.areaKm2.toFixed(2)} km²</p>
                          </div>
                          <div>
                            <span className="text-2xs text-muted-foreground">Center:</span>
                            <p className="font-mono font-medium">
                              {bboxMetrics.center[1].toFixed(4)}, {bboxMetrics.center[0].toFixed(4)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Formats Card */}
                    <Card className="flex-1 overflow-auto py-3">
                      <CardHeader className="py-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bounding Box Formats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 py-0">
                        {/* GeoJSON Bbox */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-2xs font-semibold text-muted-foreground">GeoJSON [minX, minY, maxX, maxY]</span>
                            <CopyButton value={bboxFormats.geojson} size="icon-xs" />
                          </div>
                          <code className="block rounded bg-muted/60 p-2 font-mono text-2xs break-all">{bboxFormats.geojson}</code>
                        </div>

                        {/* Leaflet / MapLibre 2D Array */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-2xs font-semibold text-muted-foreground">2D Array [[w, s], [e, n]]</span>
                            <CopyButton value={bboxFormats.array2d} size="icon-xs" />
                          </div>
                          <code className="block rounded bg-muted/60 p-2 font-mono text-2xs break-all">{bboxFormats.array2d}</code>
                        </div>

                        {/* WKT Polygon */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-2xs font-semibold text-muted-foreground">WKT Polygon</span>
                            <CopyButton value={bboxFormats.wkt} size="icon-xs" />
                          </div>
                          <code className="block rounded bg-muted/60 p-2 font-mono text-2xs break-all">{bboxFormats.wkt}</code>
                        </div>

                        {/* Lat / Lng SW-NE */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-2xs font-semibold text-muted-foreground">SW / NE LatLng</span>
                            <CopyButton value={bboxFormats.southWestNorthEast} size="icon-xs" />
                          </div>
                          <code className="block rounded bg-muted/60 p-2 font-mono text-2xs break-all">{bboxFormats.southWestNorthEast}</code>
                        </div>

                        {/* OpenSearch Query param */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-2xs font-semibold text-muted-foreground">Query Param (bbox=...)</span>
                            <CopyButton value={bboxFormats.openSearchQuery} size="icon-xs" />
                          </div>
                          <code className="block rounded bg-muted/60 p-2 font-mono text-2xs break-all">{bboxFormats.openSearchQuery}</code>
                        </div>

                        {/* Download Bbox GeoJSON */}
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 text-xs"
                            onClick={() => {
                              const blob = new Blob([JSON.stringify(bboxFeature, null, 2)], {
                                type: "application/geo+json",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "bounding-box.geojson";
                              a.click();
                              URL.revokeObjectURL(url);
                              toast.success("Downloaded bounding-box.geojson");
                            }}
                          >
                            <DownloadSimpleIcon className="size-4" />
                            Download BBox Polygon (.geojson)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
