import api from '../lib/api';
import { Route } from './routes';

export interface SaveRouteToLibraryData {
  route_id: number;
}

export const SavedRoutesApi = {
  // Get user's saved routes
  getSavedRoutes: async (): Promise<Route[]> => {
    const { data } = await api.get('/saved-routes/my-saved');
    return Array.isArray(data) ? data : data?.routes || [];
  },

  // Save a public route to library
  saveRouteToLibrary: async (routeData: SaveRouteToLibraryData): Promise<any> => {
    const { data } = await api.post('/saved-routes/save', routeData);
    return data;
  },

  // Remove route from library
  unsaveRoute: async (routeId: number): Promise<void> => {
    await api.delete('/saved-routes/unsave', { data: { route_id: routeId } });
  },
};
