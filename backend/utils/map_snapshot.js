// utils/map_snapshot.js

/**
 * ✅ FIX: Decimates path to reduce URL size for map snapshots
 * Snapshots still look good visually with fewer points
 * @param {Array} path - Original route path
 * @param {number} maxPoints - Maximum points to keep (default: 50)
 * @returns {Array} Decimated path
 */
const decimatePath = (path, maxPoints = 50) => {
  if (path.length <= maxPoints) return path;

  // Calculate step size to evenly distribute points
  const step = Math.ceil(path.length / maxPoints);
  const decimated = [];

  // Always keep first point
  decimated.push(path[0]);

  // Keep evenly distributed points
  for (let i = step; i < path.length - 1; i += step) {
    decimated.push(path[i]);
  }

  // Always keep last point
  decimated.push(path[path.length - 1]);

  return decimated;
};

export const generateMapboxSnapshot = (routePath, options = {}) => {
  const {
    width = 600,
    height = 400,
    strokeColor = '#4c9cff',
    strokeWidth = 4,
    strokeOpacity = 0.9,
    style = process.env.MAPBOX_STATIC_STYLE || 'mapbox/streets-v12',
  } = options;

  if (!routePath || routePath.length < 2) {
    throw new Error('Route must have at least 2 points');
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN
    || process.env.MAPBOX_TOKEN
    || process.env.MAPBOX_PUBLIC_TOKEN;

  if (!token) {
    throw new Error('Mapbox access token is missing');
  }

  // ✅ FIX: Decimate path to max 50 points (reduces URL size by 80-90%)
  // Snapshot still looks good visually but URL is much shorter
  // Example: 1000 points → 50 points = 8000 chars → 400 chars
  const decimatedPath = decimatePath(routePath, 50);
  const coordinates = decimatedPath.map((point) => [Number(point.lng), Number(point.lat)]);
  const geojson = encodeURIComponent(JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          stroke: strokeColor,
          'stroke-width': strokeWidth,
          'stroke-opacity': strokeOpacity,
        },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    ],
  }));

  const overlays = [`geojson(${geojson})`];
  const startPoint = routePath[0];
  const endPoint = routePath[routePath.length - 1];
  if (startPoint) {
    overlays.push(`pin-s-a+1e88e5(${startPoint.lng},${startPoint.lat})`);
  }
  if (endPoint) {
    overlays.push(`pin-s-b+43a047(${endPoint.lng},${endPoint.lat})`);
  }

  return `https://api.mapbox.com/styles/v1/${style}/static/${overlays.join(',')}/auto/${width}x${height}@2x?access_token=${token}`;
};

export const generateGoogleMapSnapshot = (routePath, options = {}) => {
  const {
    width = 600,
    height = 400,
    lineColor = '0x0080ffff',
    lineWeight = 5,
    mapType = 'roadmap',
  } = options;

  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Maps API key is missing');
  }

  if (!routePath || routePath.length < 2) {
    throw new Error('Route must have at least 2 points');
  }

  const pathString = routePath.map((p) => `${p.lat},${p.lng}`).join('|');
  const startPoint = routePath[0];
  const endPoint = routePath[routePath.length - 1];

  return `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&scale=2&maptype=${mapType}` +
    `&path=color:${lineColor}|weight:${lineWeight}|${pathString}` +
    `&markers=color:green|label:S|${startPoint.lat},${startPoint.lng}` +
    `&markers=color:red|label:F|${endPoint.lat},${endPoint.lng}` +
    `&key=${GOOGLE_API_KEY}`;
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
  const provider = process.env.MAP_SNAPSHOT_PROVIDER || 'mapbox'; // 'mapbox', 'osm', 'maptiler', 'google'

  console.log(`Generating route snapshot using provider: ${provider}`);

  if (provider === 'mapbox') {
    try {
      return generateMapboxSnapshot(routePath, options);
    } catch (err) {
      console.warn('Mapbox snapshot failed, falling back to OSM', err?.message);
      return generateOSMSnapshot(routePath, options);
    }
  }

  if (provider === 'google') {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found, falling back to OSM');
      return generateOSMSnapshot(routePath, options);
    }
    return generateGoogleMapSnapshot(routePath, options);
  }

  if (provider === 'maptiler') {
    if (!process.env.MAPTILER_API_KEY) {
      console.warn('MapTiler API key not found, falling back to OSM');
      return generateOSMSnapshot(routePath, options);
    }
    return generateMapTilerSnapshot(routePath, options);
  }

  return generateOSMSnapshot(routePath, options);
};
