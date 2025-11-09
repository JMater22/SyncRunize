import api from '../lib/api';

export interface Route {
  route_id: number;
  user_id: number;
  route_name: string;
  distance_km: number;
  duration_seconds: number;
  average_pace: string;
  estimated_calories: number;
  route_type: 'run' | 'walk' | 'cycle';
  route_status: 'generated' | 'completed' | 'saved';
  chosen_path: Array<{ lat: number; lng: number }>;
  map_image_url?: string;
  snapshot_url?: string;
  description?: string;
  elevation_gain?: number;
  risk_score?: number;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface GenerateRouteData {
  start_lat: number;
  start_lng: number;
  end_lat?: number;
  end_lng?: number;
  distance_km?: number;
  route_type?: 'run' | 'walk' | 'cycle';
}

export interface SaveRouteData {
  route_name: string;
  distance_km: number;
  duration_seconds: number;
  average_pace: string;
  estimated_calories: number;
  route_type?: 'run' | 'walk' | 'cycle';
  chosen_path: Array<{ lat: number; lng: number }>;
  description?: string;
  visibility?: 'public' | 'private';
  snapshot_url?: string;
}

export interface UpdateRouteData {
  route_name?: string;
  description?: string;
  visibility?: 'public' | 'private';
  route_status?: 'completed';
  duration_seconds?: number;
  average_pace?: string;
  estimated_calories?: number;
}

export const RoutesApi = {
  // Get user's routes
  getUserRoutes: async (userId: number, activitiesOnly: boolean = false): Promise<Route[]> => {
    const params = activitiesOnly ? { activities_only: true } : {};
    const { data } = await api.get(`/routes/user/${userId}`, { params });
    return data;
  },

  // Get public routes
  getPublicRoutes: async (): Promise<Route[]> => {
    const { data } = await api.get('/unsaved/public');
    return data.routes || data;
  },

  // Get single route
  getRoute: async (routeId: number): Promise<Route> => {
    const { data } = await api.get(`/routes/${routeId}`);
    return data;
  },

  // Generate route with AI
  generateRoute: async (routeData: GenerateRouteData): Promise<any> => {
    const { data } = await api.post('/routes/generate', routeData);
    return data;
  },

  // Save route
  saveRoute: async (routeData: SaveRouteData): Promise<Route> => {
    const { data } = await api.post('/routes/save', routeData);
    return data;
  },

  // Update route
  updateRoute: async (routeId: number, updates: UpdateRouteData): Promise<Route> => {
    const { data } = await api.put(`/routes/${routeId}`, updates);
    return data;
  },

  // Delete route
  deleteRoute: async (routeId: number): Promise<void> => {
    await api.delete(`/routes/${routeId}`);
  },
};
