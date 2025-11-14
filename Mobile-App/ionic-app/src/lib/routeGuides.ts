export type LatLngPoint = { lat: number; lng: number };

export interface GuidedRoutePayload {
  routeId: number;
  routeName: string;
  path: LatLngPoint[];
  distanceKm?: number;
  durationSeconds?: number;
  averagePace?: number | string;
  snapshotUrl?: string | null;
  description?: string | null;
}

const sanitizePoint = (point: any): LatLngPoint | null => {
  if (!point) return null;
  const lat = Number(point.lat ?? point.latitude);
  const lng = Number(point.lng ?? point.longitude);
  if (!isFinite(lat) || !isFinite(lng)) return null;
  return { lat, lng };
};

export const normalizeRoutePath = (
  rawPath: unknown,
  fallback: LatLngPoint[] = [],
): LatLngPoint[] => {
  if (Array.isArray(rawPath)) {
    return rawPath
      .map(sanitizePoint)
      .filter((point): point is LatLngPoint => !!point);
  }

  if (typeof rawPath === 'string') {
    try {
      const parsed = JSON.parse(rawPath);
      return normalizeRoutePath(parsed, fallback);
    } catch {
      return fallback.slice();
    }
  }

  if (rawPath && typeof rawPath === 'object') {
    const maybePath =
      (rawPath as Record<string, unknown>).path ??
      (rawPath as Record<string, unknown>).points;
    if (Array.isArray(maybePath)) {
      return normalizeRoutePath(maybePath, fallback);
    }
  }

  return fallback
    .map(sanitizePoint)
    .filter((point): point is LatLngPoint => !!point);
};

export const buildGuidedRoutePayload = (
  route: {
    route_id: number;
    route_name?: string | null;
    snapshot_url?: string | null;
    map_image_url?: string | null;
    distance_km?: number;
    duration_seconds?: number;
    average_pace?: number | string | null;
    description?: string | null;
    chosen_path?: unknown;
  },
  fallbackPath: LatLngPoint[] = [],
): GuidedRoutePayload => {
  const path = fallbackPath.length
    ? fallbackPath
    : normalizeRoutePath(route.chosen_path, []);

  return {
    routeId: route.route_id,
    routeName: route.route_name ?? 'Guided Route',
    path,
    distanceKm: route.distance_km ?? undefined,
    durationSeconds: route.duration_seconds ?? undefined,
    averagePace: route.average_pace ?? undefined,
    snapshotUrl: route.snapshot_url ?? route.map_image_url ?? null,
    description: route.description ?? null,
  };
};
