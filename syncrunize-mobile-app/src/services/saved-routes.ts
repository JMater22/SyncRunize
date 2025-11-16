import api from '../lib/api';
import { Route, RoutesApi } from './routes';

export interface SaveRouteToLibraryData {
  route_id: number;
}

export const SavedRoutesApi = {
  // Get user's saved routes with full details
  getSavedRoutes: async (): Promise<Route[]> => {
    const { data } = await api.get('/saved-routes/my-saved');
    const savedRoutes = Array.isArray(data) ? data : data?.routes || [];

    // If routes are missing critical data, fetch full details
    const enrichedRoutes = await Promise.all(
      savedRoutes.map(async (route: Route) => {
        // Check if route has all necessary data
        if (!route.route_name || route.distance_km === undefined || route.distance_km === null) {
          try {
            console.log(`Fetching full details for route ${route.route_id}`);
            const fullRoute = await RoutesApi.getRoute(route.route_id);
            return fullRoute;
          } catch (err) {
            console.error(`Failed to fetch details for route ${route.route_id}:`, err);
            return route; // Return original if fetch fails
          }
        }
        return route;
      })
    );

    return enrichedRoutes;
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
