import { useState, useEffect, useCallback } from 'react';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';

interface Position {
latitude: number;
longitude: number;
accuracy: number;
altitude: number | null;
speed: number | null;
timestamp: number;
}

export const useGeolocation = () => {
const [position, setPosition] = useState<Position | null>(null);
const [isTracking, setIsTracking] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [watchId, setWatchId] = useState<string | null>(null);

// Request location permissions
const requestPermissions = useCallback(async (): Promise<boolean> => {
try {
const permission: PermissionStatus = await Geolocation.requestPermissions();
return permission?.location === 'granted';
} catch (err) {
setError('Failed to request location permissions');
console.error(err);
return false;
}
}, []);

// Get a single current position
const getCurrentPosition = useCallback(async () => {
try {
const coords = await Geolocation.getCurrentPosition({
enableHighAccuracy: true,
timeout: 10000,
});

const pos: Position = {
    latitude: coords.coords.latitude,
    longitude: coords.coords.longitude,
    accuracy: coords.coords.accuracy,
    altitude: coords.coords.altitude ?? null,
    speed: coords.coords.speed ?? null,
    timestamp: coords.timestamp,
  };
  setPosition(pos);
  return pos;
} catch (err) {
  setError('Failed to get current position');
  console.error(err);
  return null;
}
}, []);

// Start continuous location tracking
const startTracking = useCallback(() => {
try {
const id = Geolocation.watchPosition(
{
enableHighAccuracy: true,
timeout: 10000,
maximumAge: 0,
},
(position, err) => {
if (err) {
if (err instanceof Error) setError(err.message);
else setError('Unknown geolocation error');
console.error(err);
return;
}
 if (position) {
        const pos: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? null,
          speed: position.coords.speed ?? null,
          timestamp: position.timestamp,
        };
        setPosition(pos);
      }
    }
  );

  setWatchId(String(id));
  setIsTracking(true);
} catch (err) {
  setError('Failed to start tracking');
  console.error(err);
}
}, []);

// Stop watching position updates
const stopTracking = useCallback(() => {
if (watchId) {
Geolocation.clearWatch({ id: watchId });
setWatchId(null);
setIsTracking(false);
}
}, [watchId]);

// Cleanup on unmount
useEffect(() => {
return () => {
if (watchId) {
Geolocation.clearWatch({ id: watchId });
}
};
}, [watchId]);

return {
position,
isTracking,
error,
requestPermissions,
getCurrentPosition,
startTracking,
stopTracking,
};
};