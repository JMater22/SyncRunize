import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IonPage, IonContent, IonIcon, IonAlert, IonToast } from '@ionic/react';
import { arrowBack, pauseOutline, playOutline, stopOutline, mapOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { GoogleMap, LoadScript, Polyline, MarkerF } from '@react-google-maps/api';
import { useHideTabBar } from '../hooks/useHideTabBar';
import { useRunTracker } from '../hooks/useRunTracker';
import ActivitySummarySheet from '../components/ActivitySummarySheet';
import '../theme/Run-Main.css';
import { formatPace } from '../lib/utils';

const googleMapDefaultCenter = { lat: 15.4755, lng: 120.5963 };
const mapContainerStyle = { width: '100%', height: '100%' };
const mapLibraries: ('marker')[] = ['marker'];
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapTypeId: 'roadmap',
  gestureHandling: 'greedy',
  zoom: 15,
};

const RunTrackerPage: React.FC = () => {
  useHideTabBar();
  const history = useHistory();
  const { session, startRun, pauseRun, resumeRun, finishRun, discardRun, recordRun, isRecording, error } = useRunTracker();
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapOnlyView, setMapOnlyView] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const pathCoords = useMemo(
    () => session.samples.map((sample) => ({ lat: sample.lat, lng: sample.lng })),
    [session.samples]
  );

  useEffect(() => {
    if (!apiKey) {
      setMapError('Google Maps API key missing.');
    } else {
      setMapError(null);
    }
  }, [apiKey]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapInstanceRef.current = map;
    setMapLoaded(true);
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapInstanceRef.current = null;
    setMapLoaded(false);
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!pathCoords.length) return;
    const latest = pathCoords[pathCoords.length - 1];
    mapInstanceRef.current.panTo(latest);
  }, [pathCoords]);

  const status = session.status;
  const isIdle = status === 'IDLE';
  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';
  const isFinished = status === 'FINISHED';

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
    } catch (err) {
      console.error(err);
    }
  };

  const paceLabel = session.avgPaceMinPerKm > 0 ? formatPace(session.avgPaceMinPerKm) : '--';
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

  return (
    <IonPage>
      <IonContent fullscreen className="run-map-content">
        <div className="map-container">
          <button className="custom-back-button-icon" onClick={() => history.push('/routes')}>
            <IonIcon icon={arrowBack} className="back-icon" />
          </button>

          {(!apiKey || mapError) && (
            <div className="map-iframe map-error-placeholder">
              <p>{mapError ?? 'Google Maps API key missing.'}</p>
            </div>
          )}

          {apiKey && !mapError && (
            <LoadScript
              googleMapsApiKey={apiKey}
              libraries={mapLibraries}
              onError={() => setMapError('Unable to load Google Maps.')}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                mapContainerClassName="map-iframe"
                center={pathCoords[pathCoords.length - 1] ?? googleMapDefaultCenter}
                options={mapOptions}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
              >
                {pathCoords.length > 0 && (
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
              </GoogleMap>
            </LoadScript>
          )}

          <button
            className="view-toggle"
            onClick={() => setMapOnlyView((prev) => !prev)}
          >
            <IonIcon icon={mapOutline} /> {mapOnlyView ? 'Show stats' : 'Map only'}
          </button>

          <div className={`stats-panel ${mapOnlyView ? 'hidden' : ''}`}>
            <div className="tracking-overlay">
              <div className="tracking-status">
                <div>
                  <span className="status-label">Status</span>
                  <h3 className="status-value">{status}</h3>
                  <p className="status-subtext">
                    GPS {pathCoords.length > 0 ? 'locked' : 'searching'} • {session.samples.length} pts
                  </p>
                </div>
                <button
                  className="ghost-button"
                  onClick={() => {
                    const target = pathCoords[pathCoords.length - 1] ?? googleMapDefaultCenter;
                    mapInstanceRef.current?.panTo(target);
                  }}
                  disabled={!pathCoords.length || !mapLoaded}
                >
                  Recenter
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="card-label">Elapsed</span>
                  <strong className="card-value">{formatDuration(session.elapsedMs)}</strong>
                </div>
                <div className="stat-card">
                  <span className="card-label">Distance</span>
                  <strong className="card-value">{(session.movingDistanceMeters / 1000).toFixed(2)} km</strong>
                </div>
                <div className="stat-card">
                  <span className="card-label">Avg Pace</span>
                  <strong className="card-value">{paceLabel}</strong>
                </div>
                <div className="stat-card">
                  <span className="card-label">Calories</span>
                  <strong className="card-value">{session.caloriesKcal.toFixed(0)}</strong>
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
          onDiscard={discardRun}
          onDismiss={() => undefined}
        />

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
