import shp from "shpjs";

export type BBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

export interface GeoStats {
  featureCount: number;
  geometryTypes: string[];
  bbox: BBox | null;
  areaKm2?: number;
  widthKm?: number;
  heightKm?: number;
}

/**
 * Normalizes any GeoJSON input (Feature, FeatureCollection, or raw Geometry)
 * into a valid GeoJSON FeatureCollection.
 */
export function normalizeToFeatureCollection(input: any): any {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid GeoJSON: input must be a JSON object");
  }

  if (input.type === "FeatureCollection") {
    return {
      type: "FeatureCollection",
      features: Array.isArray(input.features)
        ? input.features.filter((f: any) => f && f.geometry)
        : [],
    };
  }

  if (input.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [input],
    };
  }

  // Raw geometry type (Point, LineString, Polygon, MultiPolygon, etc.)
  if (
    input.type === "Point" ||
    input.type === "MultiPoint" ||
    input.type === "LineString" ||
    input.type === "MultiLineString" ||
    input.type === "Polygon" ||
    input.type === "MultiPolygon" ||
    input.type === "GeometryCollection"
  ) {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: input,
        },
      ],
    };
  }

  // If input is an array of features or geometries
  if (Array.isArray(input)) {
    const features = input.map((item: any, idx: number) => {
      if (item?.type === "Feature") return item;
      if (item?.geometry) return { type: "Feature", properties: item.properties ?? {}, geometry: item.geometry };
      return { type: "Feature", properties: { id: idx + 1 }, geometry: item };
    });
    return {
      type: "FeatureCollection",
      features,
    };
  }

  throw new Error(`Unrecognized GeoJSON object type: "${input.type || typeof input}"`);
}

/**
 * Computes [minLng, minLat, maxLng, maxLat] for any GeoJSON object.
 */
export function computeBbox(geojson: any): BBox | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let hasCoords = false;

  function traverseCoords(coords: any) {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const lng = coords[0];
      const lat = coords[1];
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        hasCoords = true;
      }
      return;
    }
    for (const item of coords) {
      traverseCoords(item);
    }
  }

  function traverseGeom(geom: any) {
    if (!geom) return;
    if (geom.type === "GeometryCollection" && Array.isArray(geom.geometries)) {
      geom.geometries.forEach(traverseGeom);
    } else if (geom.coordinates) {
      traverseCoords(geom.coordinates);
    }
  }

  if (geojson.type === "FeatureCollection" && Array.isArray(geojson.features)) {
    for (const feat of geojson.features) {
      traverseGeom(feat?.geometry);
    }
  } else if (geojson.type === "Feature") {
    traverseGeom(geojson.geometry);
  } else {
    traverseGeom(geojson);
  }

  if (!hasCoords) return null;
  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Parses Shapefile buffer (zip or shp) into GeoJSON FeatureCollection.
 */
export async function parseShapefile(buffer: ArrayBuffer): Promise<any> {
  const result = await shp(buffer);
  if (Array.isArray(result)) {
    // Merge multiple layers into one FeatureCollection
    const allFeatures = result.flatMap((r) => r.features || []);
    return {
      type: "FeatureCollection",
      features: allFeatures,
    };
  }
  return normalizeToFeatureCollection(result);
}

/**
 * Creates a GeoJSON Polygon representing a Bounding Box.
 */
export function generateBboxPolygon(bbox: BBox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return {
    type: "Feature" as const,
    properties: { type: "bbox" },
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ],
      ],
    },
  };
}

/**
 * Generates an approximated circle as a GeoJSON Polygon.
 */
export function generateCirclePolygon(
  center: [number, number],
  radiusKm: number,
  points = 64,
) {
  const [centerLng, centerLat] = center;
  const coords: [number, number][] = [];
  const kmPerLatDegree = 111.32;
  const latRadius = radiusKm / kmPerLatDegree;
  const lngRadius = radiusKm / (kmPerLatDegree * Math.cos((centerLat * Math.PI) / 180));

  for (let i = 0; i < points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const lat = centerLat + latRadius * Math.sin(angle);
    const lng = centerLng + lngRadius * Math.cos(angle);
    coords.push([lng, lat]);
  }
  coords.push(coords[0]); // close polygon

  return {
    type: "Feature" as const,
    properties: { type: "circle", radiusKm, center },
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
  };
}

/**
 * Calculates haversine distance between two coordinates in km.
 */
export function haversineDistanceKm(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number],
): number {
  const R = 6371.0088;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Calculates dimensions and area for a given bounding box.
 */
export function calculateBboxMetrics(bbox: BBox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const widthKm = haversineDistanceKm([minLng, centerLat], [maxLng, centerLat]);
  const heightKm = haversineDistanceKm([centerLng, minLat], [centerLng, maxLat]);
  const areaKm2 = widthKm * heightKm;

  return {
    center: [centerLng, centerLat] as [number, number],
    widthKm,
    heightKm,
    areaKm2,
  };
}

/**
 * Formats bounding box into different developer formats.
 */
export function formatBbox(bbox: BBox) {
  const [w, s, e, n] = bbox.map((v) => Number(v.toFixed(6)));
  const [minLng, minLat, maxLng, maxLat] = [w, s, e, n];

  return {
    geojson: `[${minLng}, ${minLat}, ${maxLng}, ${maxLat}]`,
    array2d: `[[${minLng}, ${minLat}], [${maxLng}, ${maxLat}]]`,
    wkt: `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`,
    southWestNorthEast: `SW: (${minLat}, ${minLng}), NE: (${maxLat}, ${maxLng})`,
    csv: `${minLng},${minLat},${maxLng},${maxLat}`,
    openSearchQuery: `bbox=${minLng},${minLat},${maxLng},${maxLat}`,
  };
}
