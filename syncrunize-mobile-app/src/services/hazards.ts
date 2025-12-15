import api from '../lib/api';

export interface HazardReport {
  report_id: number;
  title: string;
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
  cached_address?: string | null; // Human-readable address from reverse geocoding
  image_url?: string | null;
  reported_at: string;
  severity_weight: number;
  trust_score: number;
  status: string;
  distance_km?: number;
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
  severity_weight?: number;
  image_url?: string; // ✅ NEW: Send URL instead of file blob
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
    const { data } = await api.get('/hazards/nearby', { params: { lat, lng, radius: radiusKm } });
    return data?.hazards ?? [];
  },

  // Report a hazard
  reportHazard: async (hazardData: CreateHazardData, onUploadProgress?: (progress: number) => void): Promise<HazardReport> => {
    console.log('[HazardsApi] reportHazard called with:', {
      title: hazardData.title,
      incident_type: hazardData.incident_type,
      lat: hazardData.lat,
      lng: hazardData.lng,
      hasImage: !!hazardData.image_url,
      imageUrl: hazardData.image_url || 'none',
    });

    // ✅ NEW: Send JSON payload instead of FormData
    // Image is already uploaded to Supabase, we just send the URL
    console.log('[HazardsApi] Preparing JSON payload...');
    const payload = {
      title: hazardData.title,
      incident_type: hazardData.incident_type,
      description: hazardData.description,
      lat: hazardData.lat,
      lng: hazardData.lng,
      severity_weight: hazardData.severity_weight,
      image_url: hazardData.image_url, // ✅ NEW: Send URL instead of file
    };

    console.log('[HazardsApi] Sending POST /hazards...', payload);
    const requestStart = performance.now();

    try {
      const { data } = await api.post('/hazards', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000, // ✅ Much shorter timeout now - no file upload!
      });

      const requestTime = performance.now() - requestStart;
      console.log(`[HazardsApi] ✅ Response received in ${requestTime.toFixed(0)}ms`);

      return data?.hazard ?? data;
    } catch (err: any) {
      const requestTime = performance.now() - requestStart;
      console.error(`[HazardsApi] ❌ Request failed after ${requestTime.toFixed(0)}ms:`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw err;
    }
  },

  updateHazardStatus: async (hazardId: number, status: 'active' | 'resolved' | 'hidden'): Promise<HazardReport> => {
    const { data } = await api.put(`/hazards/${hazardId}`, { status });
    return data?.hazard ?? data;
  },

  // Check if user has confirmed a hazard
  checkConfirmation: async (hazardId: number, token: string): Promise<{ confirmed: boolean }> => {
    const { data } = await api.get(`/confirmations/${hazardId}/check`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Confirm a hazard
  confirmHazard: async (hazardId: number, token: string): Promise<void> => {
    await api.post(`/confirmations/${hazardId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Remove confirmation from a hazard
  removeConfirmation: async (hazardId: number, token: string): Promise<void> => {
    await api.delete(`/confirmations/${hazardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get safety analysis for a route (if backend provides this)
  getSafetyAnalysis: async (routePath: Array<{ lat: number; lng: number }>): Promise<SafetyAnalysis> => {
    const { data } = await api.post('/hazards/analyze', { path: routePath });
    return data;
  },
};
