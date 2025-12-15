// Minimal hazard interface for clustering (subset of full HazardReport)
export interface ClusterableHazard {
  report_id: number;
  lat: number;
  lng: number;
  incident_type?: string;
}

export interface HazardCluster {
  id: string;
  hazards: ClusterableHazard[];
  centroid: { lat: number; lng: number };
  count: number;
}

export const SPIDERFY_CONFIG = {
  CLUSTERING_THRESHOLD_METERS: 10,
  SPIDER_RADIUS_DESKTOP: 80,
  SPIDER_RADIUS_MOBILE: 60,
  ANIMATION_DURATION_MS: 300,
  MAX_SPIDER_DISPLAY: 8,
} as const;

/**
 * Calculate Haversine distance between two points in meters
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;

  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);

  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Group hazards by proximity using distance threshold
 * Works with any object that has lat, lng, and report_id
 */
export function clusterHazards<T extends ClusterableHazard>(
  hazards: T[],
  distanceThreshold: number = SPIDERFY_CONFIG.CLUSTERING_THRESHOLD_METERS
): Map<string, T[]> {
  const clusters = new Map<string, T[]>();
  const assigned = new Set<number>();

  hazards.forEach((hazard, i) => {
    if (assigned.has(i)) return;

    const cluster: T[] = [hazard];
    assigned.add(i);

    // Find all hazards within threshold
    hazards.forEach((other, j) => {
      if (i !== j && !assigned.has(j)) {
        const distance = calculateDistance(
          { lat: hazard.lat, lng: hazard.lng },
          { lat: other.lat, lng: other.lng }
        );

        if (distance <= distanceThreshold) {
          cluster.push(other);
          assigned.add(j);
        }
      }
    });

    const clusterId = generateClusterId(cluster);
    clusters.set(clusterId, cluster);
  });

  return clusters;
}

/**
 * Calculate centroid (center point) of a hazard cluster
 */
export function calculateCentroid<T extends ClusterableHazard>(
  hazards: T[]
): { lat: number; lng: number } {
  const sum = hazards.reduce(
    (acc, h) => ({ lat: acc.lat + h.lat, lng: acc.lng + h.lng }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / hazards.length,
    lng: sum.lng / hazards.length,
  };
}

/**
 * Generate unique cluster ID from hazard report IDs
 */
export function generateClusterId<T extends ClusterableHazard>(hazards: T[]): string {
  const ids = hazards.map(h => h.report_id).sort().join('-');
  return `cluster-${ids}`;
}
