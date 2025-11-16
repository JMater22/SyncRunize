import api from '../lib/api';
import type { HazardReport } from './hazards';

interface HazardAlertPayload {
  hazard: Partial<HazardReport> & { lat: number; lng: number };
  distance_m?: number;
}

interface TrafficAlertPayload {
  traffic: {
    lat: number;
    lng: number;
    condition?: string | null;
    description?: string | null;
    severity?: string | number | null;
    report_id?: number | null;
  };
  distance_m?: number;
}

export interface AccidentCluster {
  cluster_id: number;
  lat: number;
  lon: number;
  count: number;
  radius_meters: number;
  distance_km?: number;
  distance_m?: number;
}

export interface BatchAlertPayload {
  hazards: Array<Partial<HazardReport> & { distance_m?: number; distance_km?: number }>;
  clusters: Array<AccidentCluster>;
}

const extractHazardPayload = (hazard: HazardReport): HazardAlertPayload['hazard'] => ({
  report_id: hazard.report_id ?? (hazard as any).id ?? null,
  incident_type: hazard.incident_type ?? (hazard as any).type ?? 'hazard',
  description: hazard.description ?? '',
  lat: hazard.lat,
  lng: hazard.lng,
  severity_weight: hazard.severity_weight ?? null,
  trust_score: hazard.trust_score ?? null,
});

export const AlertsApi = {
  async sendHazardAlert(hazard: HazardReport, distanceMeters?: number) {
    const payload: HazardAlertPayload = {
      hazard: extractHazardPayload(hazard),
      distance_m: distanceMeters,
    };
    const { data } = await api.post('/alerts/hazard', payload);
    return data?.data ?? data;
  },

  async sendTrafficAlert(info: TrafficAlertPayload) {
    const { data } = await api.post('/alerts/traffic', info);
    return data?.data ?? data;
  },

  async sendBatchAlert(payload: BatchAlertPayload) {
    const { data } = await api.post('/alerts/batch', payload);
    return data?.data ?? data;
  },
};

export default AlertsApi;
