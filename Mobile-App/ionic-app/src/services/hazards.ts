import api from '../lib/api';

export interface HazardReport {
  report_id: number;
  title: string;
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
  image_url?: string | null;
  reported_at: string;
  severity_weight: number;
  trust_score: number;
  status: string;
  users?: {
    username: string;
    profile_picture?: string | null;
  };
}

export interface CreateHazardData {
  title: string;
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
  image_url?: string;
  severity_weight?: number;
}

export interface SafetyWarning {
  segment?: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  message: string;
  advice: string;
}

export interface SafetyAnalysis {
  warnings: SafetyWarning[];
  stats: {
    total_distance_km: number;
    has_critical_warnings: boolean;
  };
}

export const HazardsApi = {
  // Get hazards in area (by bounding box)
  getHazardsInArea: async (bounds: { north: number; south: number; east: number; west: number }): Promise<HazardReport[]> => {
    const { data } = await api.get('/hazards', { params: bounds });
    return data;
  },

  // Get hazards near a point
  getHazardsNear: async (lat: number, lng: number, radiusKm: number = 5): Promise<HazardReport[]> => {
    const { data } = await api.get('/hazards/near', { params: { lat, lng, radius_km: radiusKm } });
    return data;
  },

  // Report a hazard
  reportHazard: async (hazardData: CreateHazardData): Promise<HazardReport> => {
    const { data } = await api.post('/hazards', hazardData);
    return data;
  },

  // Get safety analysis for a route (if backend provides this)
  getSafetyAnalysis: async (routePath: Array<{ lat: number; lng: number }>): Promise<SafetyAnalysis> => {
    const { data } = await api.post('/hazards/analyze', { path: routePath });
    return data;
  },
};
