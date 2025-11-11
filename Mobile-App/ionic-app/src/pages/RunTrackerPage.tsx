import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IonPage, IonContent, IonIcon, IonAlert, IonToast, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/react';
import { arrowBack, pauseOutline, playOutline, stopOutline, mapOutline, warningOutline, checkmarkCircle, banOutline, navigateOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { GoogleMap, LoadScript, Polyline, MarkerF, CircleF } from '@react-google-maps/api';
import { useHideTabBar } from '../hooks/useHideTabBar';
import { useRunTracker } from '../hooks/useRunTracker';
import ActivitySummarySheet from '../components/ActivitySummarySheet';
import '../theme/Run-Main.css';
import { formatPace, formatRelativeTime, formatDurationShort } from '../lib/utils';
import { HazardsApi, HazardReport } from '../services/hazards';
import { supabase } from '../lib/supabaseClient';
import { haversineDistanceMeters } from '../services/haversine';
import { GuidedRoutePayload } from '../lib/routeGuides';

const googleMapDefaultCenter = { lat: 15.4755, lng: 120.5963 };
const mapContainerStyle = { width: '100%', height: '100vh', minHeight: '100vh' };
const mapLibraries: ('marker')[] = ['marker'];
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapTypeId: 'roadmap',
  gestureHandling: 'greedy',
  zoom: 15,
};

const HAZARD_RADIUS_KM = 0.8;
const HAZARD_RADIUS_METERS = HAZARD_RADIUS_KM * 1000;
const HAZARD_REFETCH_MS = 45_000;
const guidedStartIconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
const guidedEndIconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';

const RunTrackerPage: React.FC = () => {
  useHideTabBar();
  const history = useHistory();
  const location = useLocation<{ guidedRoute?: GuidedRoutePayload }>();
  const { session, startRun, pauseRun, resumeRun, finishRun, discardRun, recordRun, isRecording, error } = useRunTracker();
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapOnlyView, setMapOnlyView] = useState(false);
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [hazardLoading, setHazardLoading] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);
  const [hazardActionLoading, setHazardActionLoading] = useState(false);
  const [guidedRoute, setGuidedRoute] = useState<GuidedRoutePayload | null>(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const latestLocationRef = useRef<google.maps.LatLngLiteral | null>(null);
  const lastHazardFetchRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const lastRealtimeRefreshRef = useRef<number>(0);
  const sessionRef = useRef(session);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const logDebug = useCallback((...args: unknown[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[RunTracking]', ...args);
    }
  }, []);
  const toNumber = (value: number | string | null | undefined) => {
    const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
    return Number.isFinite(parsed) ? (parsed as number) : null;
  };

  const computeHazardDistanceKm = useCallback((hazard?: HazardReport | null) => {
    if (!hazard) return null;
    if (typeof hazard.distance_km === 'number' && Number.isFinite(hazard.distance_km)) {
      return hazard.distance_km;
    }
    const latest = latestLocationRef.current;
    if (!latest) return null;
    const lat = toNumber(hazard.lat);
    const lng = toNumber(hazard.lng);
    if (lat == null || lng == null) return null;
    return haversineDistanceMeters(latest, { lat, lng }) / 1000;
  }, []);

  const getHazardIconUrl = useCallback((hazard: HazardReport) => {
    const severity = hazard.severity_weight ?? 0;
    if (severity >= 0.7) return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    if (severity >= 0.4) return 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
    return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
  }, []);

  const clearGuidedRoute = useCallback(() => {
    setGuidedRoute(null);
    // Force complete re-render by changing key
    setMapRefreshKey(prev => prev + 1);
    // Force map refresh when clearing guided route
    setTimeout(() => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize');
      }
    }, 100);
  }, []);

  const pathCoords = useMemo(
    () => session.samples.map((sample) => ({ lat: sample.lat, lng: sample.lng })),
    [session.samples]
  );
  const latestCoord = pathCoords.length ? pathCoords[pathCoords.length - 1] : null;
  const guidedPath = guidedRoute?.path ?? [];
  const guidedStart = guidedPath.length ? guidedPath[0] : null;
  const guidedEnd = guidedPath.length ? guidedPath[guidedPath.length - 1] : null;
  const guidedMetaText = useMemo(() => {
    if (!guidedRoute) return '';
    const parts: string[] = [];
    if (typeof guidedRoute.distanceKm === 'number') {
      parts.push(`${guidedRoute.distanceKm.toFixed(2)} km`);
    }
    if (guidedRoute.durationSeconds) {
      parts.push(formatDurationShort(guidedRoute.durationSeconds));
    }
    if (guidedRoute.averagePace) {
      parts.push(formatPace(guidedRoute.averagePace));
    }
    return parts.join(' \u2022 ');
  }, [guidedRoute]);
  const shouldShowLivePath = pathCoords.length > 0 && session.status !== 'IDLE';
  const mapCenter = useMemo(() => {
    if (shouldShowLivePath) {
      return pathCoords[pathCoords.length - 1];
    }
    return guidedStart ?? googleMapDefaultCenter;
  }, [shouldShowLivePath, pathCoords, guidedStart]);
  const hasGuide = Boolean(guidedRoute);
  const hazardSummaryText = hazardLoading
    ? 'Checking nearby hazards...'
    : hazards.length
      ? `${hazards.length} hazard${hazards.length > 1 ? 's' : ''} nearby`
      : 'No hazards nearby';


  const loadHazards = useCallback(async (center: google.maps.LatLngLiteral, options: { force?: boolean } = {}) => {
    if (!center) return;
    logDebug('loadHazards: request', { center, options });
    const now = Date.now();
    if (!options.force && lastHazardFetchRef.current) {
      const { lat, lng, time } = lastHazardFetchRef.current;
      const movedMeters = haversineDistanceMeters({ lat, lng }, center);
      if (movedMeters < HAZARD_RADIUS_METERS * 0.3 && now - time < HAZARD_REFETCH_MS) {
        logDebug('loadHazards: throttled', { movedMeters, elapsed: now - time });
        return;
      }
    }

    try {
      setHazardLoading(true);
      const fetched = await HazardsApi.getHazardsNear(center.lat, center.lng, HAZARD_RADIUS_KM);
      logDebug('loadHazards: fetched hazards', fetched?.length ?? 0);
      const sanitized = fetched
        .map((hazard) => {
          const lat = toNumber(hazard.lat);
          const lng = toNumber(hazard.lng);
          if (lat == null || lng == null) {
            logDebug('loadHazards: dropping hazard with invalid coordinates', hazard);
            return null;
          }
          return {
            ...hazard,
            lat,
            lng,
            distance_km: typeof hazard.distance_km === 'string'
              ? Number.parseFloat(hazard.distance_km)
              : hazard.distance_km,
          } as HazardReport;
        })
        .filter((item): item is HazardReport => item !== null);
      logDebug('loadHazards: sanitized hazards', sanitized.length);
      setHazards(sanitized);
      lastHazardFetchRef.current = { lat: center.lat, lng: center.lng, time: now };
    } catch (err) {
      console.error('Failed to load hazards:', err);
    } finally {
      setHazardLoading(false);
    }
  }, [logDebug]);

  useEffect(() => {
    if (!apiKey) {
      setMapError('Google Maps API key missing.');
    } else {
      setMapError(null);
    }
  }, [apiKey]);

  /**
   * BLACK MAP PREVENTION STRATEGY
   *
   * This page implements multiple layers of defense against Google Maps black screen issues:
   *
   * 1. Component Mount Refresh (below): Triggers map resize at 100ms, 300ms, and 500ms after mount
   * 2. Map Load Callback (handleMapLoad): Triggers resize at 100ms, 300ms, 500ms, and 800ms after map loads
   * 3. Window Resize Listener: Responds to browser/app resize and orientation changes
   * 4. Toggle Button Refresh: Triggers resize when switching between map/stats view
   * 5. Tiles Loaded Listener: Confirms map tiles are fully rendered
   * 6. LoadScript Error Handling: Provides clear error messages if API fails to load
   * 7. Loading Element: Shows "Loading map..." message during API load
   *
   * Additional tips for users:
   * - Clear browser cache with Ctrl+Shift+R (hard refresh)
   * - Clear Ionic cache: rm -rf node_modules .ionic www && npm install
   * - Ensure stable internet connection for Google Maps API
   * - Check API key is valid and has Maps JavaScript API enabled
   */

  // Fix black screen issue when navigating to this page
  useEffect(() => {
    const refreshMap = () => {
      if (mapInstanceRef.current && window.google) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize');
        logDebug('Map refreshed on component mount');
      }
    };

    // Multiple refresh attempts at different intervals for reliability
    const timer1 = setTimeout(refreshMap, 100);
    const timer2 = setTimeout(refreshMap, 300);
    const timer3 = setTimeout(refreshMap, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [logDebug]);

  // Add window resize listener to handle orientation changes and app resizing
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current && window.google) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize');
        logDebug('Map refreshed on window resize');
      }
    };

    window.addEventListener('resize', handleResize);
    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [logDebug]);

  useEffect(() => {
    if (!pathCoords.length) return;
    const latest = pathCoords[pathCoords.length - 1];
    latestLocationRef.current = latest;
  }, [pathCoords]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const incomingRoute = location.state?.guidedRoute;
    if (!incomingRoute) return;

    const currentSession = sessionRef.current;
    const hasPath = currentSession.samples.length > 0 || currentSession.status !== 'IDLE';
    if (hasPath) {
      discardRun();
    }

    setGuidedRoute(incomingRoute);
    logDebug('Guided route injected', incomingRoute.routeName);
    setToastMessage(`Guided route ready: ${incomingRoute.routeName}`);
    history.replace('/run-tracking');
  }, [location.state, history, discardRun, logDebug]);

  useEffect(() => {
    if (!latestCoord) return;
    loadHazards(latestCoord);
  }, [latestCoord, loadHazards]);

  useEffect(() => {
    const channel = supabase
      .channel('hazards-run-tracking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hazard_reports' }, () => {
        const latest = latestLocationRef.current;
        if (!latest) return;
        const now = Date.now();
        if (now - lastRealtimeRefreshRef.current < 5000) return;
        lastRealtimeRefreshRef.current = now;
        loadHazards(latest, { force: true });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadHazards]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    logDebug('Google map loaded');
    logDebug('Map center:', map.getCenter()?.toJSON());
    logDebug('Map zoom:', map.getZoom());
    logDebug('Map div:', map.getDiv());
    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Force multiple resizes at different intervals to ensure proper rendering
    // This is more aggressive to prevent black screens
    const refreshIntervals = [100, 300, 500, 800];
    refreshIntervals.forEach(delay => {
      setTimeout(() => {
        if (mapInstanceRef.current && window.google) {
          google.maps.event.trigger(mapInstanceRef.current, 'resize');
          logDebug(`Triggered map resize at ${delay}ms`);

          // Also ensure the map is centered correctly
          if (pathCoords.length) {
            mapInstanceRef.current.panTo(pathCoords[pathCoords.length - 1]);
          } else if (guidedStart) {
            mapInstanceRef.current.panTo(guidedStart);
          }
        }
      }, delay);
    });

    // Listen for tiles loaded event to confirm map is fully rendered
    const tilesLoadedListener = map.addListener('tilesloaded', () => {
      logDebug('Map tiles fully loaded');
      google.maps.event.removeListener(tilesLoadedListener);
    });
  }, [logDebug, pathCoords, guidedStart]);

  const handleMapUnmount = useCallback(() => {
    logDebug('Google map unmounted');
    mapInstanceRef.current = null;
    setMapLoaded(false);
  }, [logDebug]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (pathCoords.length) {
      mapInstanceRef.current.panTo(pathCoords[pathCoords.length - 1]);
    } else if (guidedStart) {
      mapInstanceRef.current.panTo(guidedStart);
    }
  }, [pathCoords, guidedStart]);

  const status = session.status;
  const isIdle = status === 'IDLE';
  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';
  const isFinished = status === 'FINISHED';
  const displayedElapsed = isIdle ? '00:00' : formatDuration(session.elapsedMs);
  const displayedDistanceKm = isIdle ? 0 : session.movingDistanceMeters / 1000;
  const displayedCalories = isIdle ? 0 : session.caloriesKcal;

  const primaryAction = useMemo(() => {
    if (isIdle || isFinished) {
      return { label: 'Start Run', icon: playOutline, variant: 'start' as const };
    }
    if (isRunning) {
      return { label: 'Pause', icon: pauseOutline, variant: 'pause' as const };
    }
    return { label: 'Resume', icon: playOutline, variant: 'resume' as const };
  }, [isIdle, isFinished, isRunning]);

  const handlePrimaryAction = () => {
    if (isIdle || isFinished) {
      startRun();
      setToastMessage('Run started. Tracking live.');
    } else if (isRunning) {
      pauseRun();
    } else if (isPaused) {
      resumeRun();
    }
  };

  const handleFinish = () => {
    if (isPaused) setShowFinishConfirm(true);
  };

  const handleRecord = async (meta: { name: string; visibility: 'public' | 'private' }) => {
    try {
      const recorded = await recordRun(meta);
      clearGuidedRoute();
      history.push('/run-pre-post', {
        routeId: recorded.routeId,
        routeName: recorded.routeName,
        snapshotUrl: recorded.snapshotUrl ?? null,
        route: recorded.rawRoute,
        path: recorded.path,
        stats: {
          distance_km: recorded.distanceKm,
          duration_seconds: recorded.durationSeconds,
          average_pace: recorded.averagePaceMin,
          estimated_calories: recorded.estimatedCalories,
        },
      });
    } catch (err: any) {
      console.error(err);
      setToastMessage(err?.message || 'Failed to save run. Please try again.');
    }
  };

  const handleDiscardRun = useCallback(() => {
    clearGuidedRoute();
    discardRun();
  }, [clearGuidedRoute, discardRun]);

  const updateHazardStatus = useCallback(async (status: 'active' | 'resolved') => {
    if (!selectedHazard) return;
    try {
      setHazardActionLoading(true);
      await HazardsApi.updateHazardStatus(selectedHazard.report_id, status);
      const latest = latestLocationRef.current;
      if (latest) {
        await loadHazards(latest, { force: true });
      }
      setToastMessage(status === 'resolved' ? 'Thanks! Hazard cleared.' : 'Hazard confirmed. Stay alert!');
      if (status === 'resolved') {
        setSelectedHazard(null);
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Unable to update hazard.';
      setToastMessage(message);
    } finally {
      setHazardActionLoading(false);
    }
  }, [selectedHazard, loadHazards]);

  const paceLabel = !isIdle && session.avgPaceMinPerKm > 0 ? formatPace(session.avgPaceMinPerKm) : '--';
  const selectedHazardDistance = computeHazardDistanceKm(selectedHazard);

  const handleReportHazard = () => {
    const latest = latestLocationRef.current;
    if (!latest) {
      setToastMessage('Need GPS lock before reporting a hazard.');
      return;
    }
    history.push('/hazard-report', {
      lat: latest.lat,
      lng: latest.lng,
      source: 'run-tracking',
    });
  };
  const liveMarkerIcon = useMemo<google.maps.Symbol | undefined>(() => {
    const googleObj = (window as any)?.google;
    if (!googleObj?.maps?.SymbolPath) return undefined;
    return {
      path: googleObj.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: '#4caf50',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    } as google.maps.Symbol;
  }, [mapLoaded]);

  console.log('[RunTracking] Render - apiKey:', !!apiKey, 'mapError:', mapError, 'mapLoaded:', mapLoaded);
  console.log('[RunTracking] mapCenter:', mapCenter, 'pathCoords.length:', pathCoords.length);
  console.log('[RunTracking] guidedRoute:', guidedRoute?.routeName, 'guidedPath.length:', guidedPath.length);

  return (
    <IonPage>
      <IonContent fullscreen className="run-map-content">
        <div className="map-container">
          <button className="custom-back-button-icon" onClick={() => history.push('/routes')}>
            <IonIcon icon={arrowBack} className="back-icon" />
          </button>
          {guidedRoute && (
            <div className="guided-map-chip">
              <IonIcon icon={navigateOutline} />
              <span>{guidedRoute.routeName}</span>
            </div>
          )}

          {(!apiKey || mapError) && (
            <div className="map-iframe map-error-placeholder">
              <p>{mapError ?? 'Google Maps API key missing.'}</p>
            </div>
          )}

          {apiKey && !mapError && (
            <LoadScript
              googleMapsApiKey={apiKey}
              libraries={mapLibraries}
              loadingElement={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>}
              onLoad={() => {
                console.log('[RunTracking] LoadScript onLoad called');
                logDebug('Google Maps API loaded successfully');
              }}
              onError={(error) => {
                console.error('[RunTracking] LoadScript error:', error);
                setMapError('Unable to load Google Maps. Please check your connection and try again.');
                logDebug('LoadScript error:', error);
              }}
              preventGoogleFontsLoading={false}
            >
              <GoogleMap
                key={`map-${mapRefreshKey}`}
                mapContainerStyle={mapContainerStyle}
                mapContainerClassName="map-iframe"
                center={mapCenter}
                options={mapOptions}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
              >
                {guidedPath.length > 0 && guidedRoute && (
                  <>
                    <Polyline
                      key={`guided-${guidedRoute.routeId || 'route'}`}
                      path={guidedPath}
                      options={{
                        strokeColor: '#2196F3',
                        strokeOpacity: 0.65,
                        strokeWeight: 4,
                        zIndex: 2,
                      }}
                    />
                    {guidedStart && (
                      <MarkerF
                        key={`guided-start-${guidedRoute.routeId || 'start'}`}
                        position={guidedStart}
                        icon={guidedStartIconUrl}
                      />
                    )}
                    {guidedEnd && !pathCoords.length && (
                      <MarkerF
                        key={`guided-end-${guidedRoute.routeId || 'end'}`}
                        position={guidedEnd}
                        icon={guidedEndIconUrl}
                      />
                    )}
                  </>
                )}
                {shouldShowLivePath && (
                  <>
                    <Polyline
                      path={pathCoords}
                      options={{
                        strokeColor: '#92c628',
                        strokeOpacity: 1,
                        strokeWeight: 4,
                      }}
                    />
                    <MarkerF
                      position={pathCoords[pathCoords.length - 1]}
                      icon={liveMarkerIcon}
                    />
                  </>
                )}
                {shouldShowLivePath && latestCoord && (
                  <CircleF
                    center={latestCoord}
                    radius={HAZARD_RADIUS_METERS}
                    options={{
                      fillColor: '#FFB74D',
                      fillOpacity: 0.2,
                      strokeColor: '#FB8C00',
                      strokeWeight: 1,
                      strokeOpacity: 0.7,
                    }}
                  />
                )}
                {hazards.map((hazard) => {
                  if (!Number.isFinite(hazard.lat) || !Number.isFinite(hazard.lng)) {
                    return null;
                  }
                  return (
                    <MarkerF
                      key={`hazard-${hazard.report_id}`}
                      position={{ lat: hazard.lat, lng: hazard.lng }}
                      icon={getHazardIconUrl(hazard)}
                      onClick={() => setSelectedHazard(hazard)}
                    />
                  );
                })}
              </GoogleMap>
            </LoadScript>
          )}

          <button
            className="view-toggle"
            onClick={() => {
              setMapOnlyView((prev) => !prev);
              // Refresh map after toggle to prevent black screen
              setTimeout(() => {
                if (mapInstanceRef.current && window.google) {
                  google.maps.event.trigger(mapInstanceRef.current, 'resize');
                }
              }, 100);
            }}
          >
            <IonIcon icon={mapOutline} /> {mapOnlyView ? 'Show stats' : 'Map only'}
          </button>

          <div className={`stats-panel ${mapOnlyView ? 'hidden' : ''}`}>
            <div className="tracking-overlay">
              {guidedRoute && (
                <div className="guided-route-banner">
                  <div>
                    <span className="guided-route-label">Guided route</span>
                    <h4>{guidedRoute.routeName}</h4>
                    {guidedMetaText && <p>{guidedMetaText}</p>}
                  </div>
                  <button className="ghost-button" onClick={clearGuidedRoute}>
                    Clear
                  </button>
                </div>
              )}
              <div className="tracking-status">
                <div>
                  <span className="status-label">Status</span>
                  <h3 className="status-value">{status}</h3>
                  <p className="status-subtext">
                    GPS {pathCoords.length > 0 ? 'locked' : 'searching'} â€¢ {session.samples.length} pts
                  </p>
                </div>
                <button
                  className="ghost-button"
                  onClick={() => {
                    const target =
                      pathCoords[pathCoords.length - 1] ??
                      guidedPath[guidedPath.length - 1] ??
                      guidedStart ??
                      googleMapDefaultCenter;
                    mapInstanceRef.current?.panTo(target);
                  }}
                  disabled={(!pathCoords.length && !guidedPath.length) || !mapLoaded}
                >
                  Recenter
                </button>
              </div>

              <button
                className={`hazard-summary ${hazards.length ? 'has-hazards' : ''}`}
                onClick={() => {
                  if (hazards.length) {
                    setMapOnlyView(false);
                  }
                }}
                disabled={hazardLoading && !hazards.length}
              >
                <IonIcon icon={warningOutline} />
                <span>{hazardSummaryText}</span>
              </button>
              <IonButton
                expand="block"
                size="small"
                fill="solid"
                color="warning"
                className="report-hazard-btn"
                onClick={handleReportHazard}
              >
                <IonIcon slot="start" icon={warningOutline} />
                Report hazard
              </IonButton>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="card-label">Elapsed</span>
                  <strong className="card-value">{displayedElapsed}</strong>
                </div>
                <div className="stat-card">
                  <span className="card-label">Distance</span>
                  <strong className="card-value">{displayedDistanceKm.toFixed(2)} km</strong>
                </div>
                <div className="stat-card">
                  <span className="card-label">Avg Pace</span>
                  <strong className="card-value">{paceLabel}</strong>
                </div>
                <div className="stat-card">
                  <span className="card-label">Calories</span>
                  <strong className="card-value">{displayedCalories.toFixed(0)}</strong>
                </div>
              </div>

              <div className="action-row">
                {isPaused && (
                  <button className="secondary-action-btn finish-btn" onClick={handleFinish}>
                    <IonIcon icon={stopOutline} />
                    Finish
                  </button>
                )}
                <button
                  className={`primary-action-btn variant-${primaryAction.variant}`}
                  onClick={handlePrimaryAction}
                >
                  <IonIcon icon={primaryAction.icon} />
                  {primaryAction.label}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ActivitySummarySheet
          isOpen={isFinished}
          session={session}
          isRecording={isRecording}
          error={error}
          onRecord={handleRecord}
          onDiscard={handleDiscardRun}
          onDismiss={() => undefined}
        />

        <IonModal isOpen={!!selectedHazard} onDidDismiss={() => setSelectedHazard(null)} className="hazard-detail-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Hazard details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setSelectedHazard(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="hazard-detail-body">
            {selectedHazard && (
              <div className="hazard-detail-content">
                <div className="hazard-detail-header">
                  <IonIcon icon={warningOutline} />
                  <div>
                    <h3>{selectedHazard.title}</h3>
                    <p className="hazard-meta">
                      {selectedHazard.incident_type}
                      {' Â· '}
                      Reported {formatRelativeTime(selectedHazard.reported_at)} by {selectedHazard.users?.username ?? 'runner'}
                    </p>
                    {selectedHazardDistance && (
                      <p className="hazard-meta">Approximately {selectedHazardDistance.toFixed(2)} km away</p>
                    )}
                  </div>
                </div>

                {selectedHazard.description && (
                  <p className="hazard-detail-description">{selectedHazard.description}</p>
                )}

                <div className="hazard-detail-actions">
                  <IonButton
                    fill="clear"
                    color="warning"
                    onClick={() => updateHazardStatus('active')}
                    disabled={hazardActionLoading}
                  >
                    <IonIcon slot="start" icon={checkmarkCircle} />
                    Still there
                  </IonButton>
                  <IonButton
                    color="success"
                    onClick={() => updateHazardStatus('resolved')}
                    disabled={hazardActionLoading}
                  >
                    <IonIcon slot="start" icon={banOutline} />
                    Hazard cleared
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showFinishConfirm}
          onDidDismiss={() => setShowFinishConfirm(false)}
          header="Finish run?"
          message="This will stop recording and open the summary."
          buttons={[
            { text: 'Keep running', role: 'cancel', handler: () => setShowFinishConfirm(false) },
            {
              text: 'Finish',
              handler: () => {
                setShowFinishConfirm(false);
                finishRun();
              },
            },
          ]}
        />

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage ?? ''}
          duration={1500}
          onDidDismiss={() => setToastMessage(null)}
        />
      </IonContent>
    </IonPage>
  );
};

const formatDuration = (ms: number) => {
  if (!ms) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default RunTrackerPage;
