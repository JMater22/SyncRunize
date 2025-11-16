import api from '../lib/api';

export interface TrafficIncident {
  incident_id: number;
  incident_type: string;
  lat: number;
  lng: number;
  severity_weight?: number | null;
  description?: string | null;
  source?: string | null;
  date?: string | null;
  distance_km?: number;
}

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const TrafficApi = {
  async getIncidentsNear(
    lat: number,
    lng: number,
    radiusKm: number,
    lookbackHours = 3,
  ): Promise<TrafficIncident[]> {
    const now = new Date();
    const start = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);

    const { data } = await api.get('/official-incidents', {
      params: {
        lat,
        lng,
        radius: radiusKm,
        startDate: start.toISOString(),
        endDate: now.toISOString(),
      },
    });

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((incident: TrafficIncident) => ({
      ...incident,
      distance_km: haversineDistance(lat, lng, incident.lat, incident.lng),
    }));
  },
};

export default TrafficApi;

