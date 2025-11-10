import api from '../lib/api';

export interface CreateRouteRequest {
  route_name: string;
  visibility: 'public' | 'private';
  duration_seconds: number;
  average_pace: number;
  distance_km: number;
  estimated_calories: number;
  chosen_path: Array<{ lat: number; lng: number; t?: number }>; // server stores JSON
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  snapshot_url?: string | null;
  weight_kg?:number;
}

export interface CreateRouteResponse {
  route_id: number;
  route_name?: string;
  snapshot_url?: string | null;
  distance_km?: number;
  duration_seconds?: number;
  average_pace?: number;
  estimated_calories?: number;
  visibility?: 'public' | 'private';
  chosen_path?: Array<{ lat: number; lng: number }> | string | null;
  [key: string]: any;
}

export interface CreatePostRequest {
  route_id: number;
  content: string;
  image_url?: string | null;
  visibility?: 'public' | 'private';
}

export const createRoute = async (payload: CreateRouteRequest): Promise<CreateRouteResponse> => {
  const { data } = await api.post('/routes/complete', payload);
  if (data?.route) return data.route;
  return data;
};

export const createPost = async (payload: CreatePostRequest) => {
  const { data } = await api.post('/posts', payload);
  return data;
};

export const withRetry = async <T>(fn: () => Promise<T>, attempts = 3, delayMs = 500): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
};
