// utils/map_snapshot.js

/**
 * Generate route snapshot using Google Maps Static API
 * This is what will be used in production (matches your paper)
 * @param {Array} routePath - Array of {lat, lng} coordinates
 * @param {Object} options - Customization options
 * @returns {string} Static map image URL
 */
export const generateGoogleMapSnapshot = (routePath, options = {}) => {
  const {
    width = 600,
    height = 400,
    lineColor = '0x0080ffff', // Blue with full opacity
    lineWeight = 5,
    mapType = 'roadmap', // roadmap, satellite, terrain, hybrid
  } = options;

  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!routePath || routePath.length < 2) {
    throw new Error('Route must have at least 2 points');
  }

  // Build path string
  const pathString = routePath
    .map(p => `${p.lat},${p.lng}`)
    .join('|');

  // Get start and end points
  const startPoint = routePath[0];
  const endPoint = routePath[routePath.length - 1];

  // Build URL
  const url = `https://maps.googleapis.com/maps/api/staticmap?` +
    `size=${width}x${height}` +
    `&scale=2` +
    `&maptype=${mapType}` +
    `&path=color:${lineColor}|weight:${lineWeight}|${pathString}` +
    `&markers=color:green|label:S|${startPoint.lat},${startPoint.lng}` +
    `&markers=color:red|label:F|${endPoint.lat},${endPoint.lng}` +
    `&key=${GOOGLE_API_KEY}`;

  return url;
};

/**
 * Generate route snapshot using OpenStreetMap (FREE - for testing)
 * Uses tile.openstreetmap.org - completely free, no API key needed
 * @param {Array} routePath - Array of {lat, lng} coordinates
 * @param {Object} options - Customization options
 * @returns {string} Static map image URL (returns center tile URL)
 */
export const generateOSMSnapshot = (routePath, options = {}) => {
  const {
    width = 600,
    height = 400,
  } = options;

  if (!routePath || routePath.length < 2) {
    throw new Error('Route must have at least 2 points');
  }

  // Calculate center and bounds
  const lats = routePath.map(p => p.lat);
  const lngs = routePath.map(p => p.lng);
  
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  
  // Calculate zoom level based on route extent
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lngRange = Math.max(...lngs) - Math.min(...lngs);
  const maxRange = Math.max(latRange, lngRange);
  
  let zoom;
  if (maxRange > 0.5) zoom = 10;
  else if (maxRange > 0.1) zoom = 12;
  else if (maxRange > 0.05) zoom = 13;
  else if (maxRange > 0.01) zoom = 14;
  else zoom = 15;

  // Use a simple, reliable OSM tile URL
  // This returns just the map tile centered on the route
  const tileX = Math.floor((centerLng + 180) / 360 * Math.pow(2, zoom));
  const tileY = Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

  // Return OpenStreetMap tile URL (always works, no API key)
  const url = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

  return url;
};

/**
 * Alternative: Generate snapshot using MapTiler (also reliable and free)
 * Get free API key at: https://www.maptiler.com/
 */
export const generateMapTilerSnapshot = (routePath, options = {}) => {
  const {
    width = 600,
    height = 400,
    zoom = 14,
  } = options;

  if (!routePath || routePath.length < 2) {
    throw new Error('Route must have at least 2 points');
  }

  const MAPTILER_KEY = process.env.MAPTILER_API_KEY || 'get_your_free_key';

  // Calculate center
  const lats = routePath.map(p => p.lat);
  const lngs = routePath.map(p => p.lng);
  
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

  const startPoint = routePath[0];
  const endPoint = routePath[routePath.length - 1];

  // Build markers string
  const markers = `pin-s-s+00ff00(${startPoint.lng},${startPoint.lat}),` +
                  `pin-s-f+ff0000(${endPoint.lng},${endPoint.lat})`;

  const url = `https://api.maptiler.com/maps/streets/static/` +
    `${centerLng},${centerLat},${zoom}/${width}x${height}.png?` +
    `markers=${encodeURIComponent(markers)}` +
    `&key=${MAPTILER_KEY}`;

  return url;
};

/**
 * Main function that switches between providers
 * Use environment variable to control which service to use
 */
export const generateRouteSnapshot = (routePath, options = {}) => {
  const provider = process.env.MAP_SNAPSHOT_PROVIDER || 'osm'; // 'google' or 'osm'

  if (provider === 'google') {
    return generateGoogleMapSnapshot(routePath, options);
  } else {
    return generateOSMSnapshot(routePath, options);
  }
};