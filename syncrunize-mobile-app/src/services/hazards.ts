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
  imageFile?: Blob | File | null;
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
      hasImage: !!hazardData.imageFile,
      imageSize: hazardData.imageFile ? `${(hazardData.imageFile.size / 1024).toFixed(0)}KB` : 'none',
    });

    const formDataStart = performance.now();
    const formData = new FormData();
    formData.append('title', hazardData.title);
    formData.append('incident_type', hazardData.incident_type);
    formData.append('description', hazardData.description);
    formData.append('lat', hazardData.lat.toString());
    formData.append('lng', hazardData.lng.toString());
    if (typeof hazardData.severity_weight === 'number') {
      formData.append('severity_weight', hazardData.severity_weight.toString());
    }
    if (hazardData.imageFile) {
      formData.append('image', hazardData.imageFile, 'hazard.jpg');
    }
    console.log(`[HazardsApi] FormData prepared in ${(performance.now() - formDataStart).toFixed(0)}ms`);

    console.log('[HazardsApi] Sending POST /hazards...');
    const requestStart = performance.now();

    try {
      const { data } = await api.post('/hazards', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000, // ✅ FIX: 45-second timeout to account for Render cold starts (30-50s)
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total && onUploadProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percentCompleted);
          }
        },
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

  // Get safety analysis for a route (if backend provides this)
  getSafetyAnalysis: async (routePath: Array<{ lat: number; lng: number }>): Promise<SafetyAnalysis> => {
    const { data } = await api.post('/hazards/analyze', { path: routePath });
    return data;
  },
};
