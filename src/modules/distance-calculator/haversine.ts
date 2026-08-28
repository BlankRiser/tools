export type LatLng = {
  lat: number;
  lng: number;
};

export type DistanceUnit = "km" | "mi" | "nmi" | "m";

const EARTH_RADIUS_KM = 6371.0088;
const KM_PER_MILE = 1.609344;
const KM_PER_NAUTICAL_MILE = 1.852;

export function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeLng(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

export function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLng(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function centralAngle(a: LatLng, b: LatLng): number {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);
  const h = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function haversineKm(a: LatLng, b: LatLng, radiusKm = EARTH_RADIUS_KM): number {
  return radiusKm * centralAngle(a, b);
}

export function convertDistance(km: number, unit: DistanceUnit): number {
  if (unit === "km") return km;
  if (unit === "mi") return km / KM_PER_MILE;
  if (unit === "nmi") return km / KM_PER_NAUTICAL_MILE;
  return km * 1000;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  const value = convertDistance(km, unit);
  const digits = unit === "m" ? (value >= 1000 ? 0 : 1) : value >= 100 ? 1 : 2;
  const labels: Record<DistanceUnit, string> = { km: "km", mi: "mi", nmi: "nmi", m: "m" };
  return `${value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 })} ${labels[unit]}`;
}

export function initialBearing(a: LatLng, b: LatLng): number {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function formatBearing(degrees: number): string {
  return `${degrees.toFixed(1)}°`;
}

export function midpoint(a: LatLng, b: LatLng): LatLng {
  const φ1 = toRad(a.lat);
  const λ1 = toRad(a.lng);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const bx = Math.cos(φ2) * Math.cos(Δλ);
  const by = Math.cos(φ2) * Math.sin(Δλ);
  const φ3 = Math.atan2(Math.sin(φ1) + Math.sin(φ2), Math.sqrt((Math.cos(φ1) + bx) ** 2 + by ** 2));
  const λ3 = λ1 + Math.atan2(by, Math.cos(φ1) + bx);
  return { lat: toDeg(φ3), lng: normalizeLng(toDeg(λ3)) };
}

export function formatCoord(value: number, digits = 5): string {
  return value.toFixed(digits);
}

export function greatCirclePoints(a: LatLng, b: LatLng, steps = 64): LatLng[] {
  const δ = centralAngle(a, b);
  if (δ < 1e-12) return [a, b];

  const φ1 = toRad(a.lat);
  const λ1 = toRad(a.lng);
  const φ2 = toRad(b.lat);
  const λ2 = toRad(b.lng);
  const sinδ = Math.sin(δ);
  const points: LatLng[] = [];

  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * δ) / sinδ;
    const B = Math.sin(f * δ) / sinδ;
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
    const λ = Math.atan2(y, x);
    points.push({ lat: toDeg(φ), lng: normalizeLng(toDeg(λ)) });
  }

  return points;
}

export function lineSegmentsLngLat(points: LatLng[]): [number, number][][] {
  const segments: [number, number][][] = [[]];

  for (const point of points) {
    const coord: [number, number] = [point.lng, point.lat];
    const current = segments[segments.length - 1];
    if (current.length > 0) {
      const prev = current[current.length - 1];
      if (Math.abs(coord[0] - prev[0]) > 180) {
        segments.push([coord]);
        continue;
      }
    }
    current.push(coord);
  }

  return segments.filter((segment) => segment.length > 1);
}
