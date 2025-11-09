import { useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonTextarea,
  IonItem,
  IonLabel,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useHideTabBar } from '../hooks/useHideTabBar';
import { createPost } from '../services/api';
import { RoutesApi, type Route } from '../services/routes';

interface LocationState {
  routeId?: number;
  routeName?: string;
  snapshotUrl?: string | null;
  route?: Route;
  path?: Array<{ lat: number; lng: number }>;
  stats?: {
    distance_km?: number;
    duration_seconds?: number;
    average_pace?: number;
    estimated_calories?: number;
  };
}

const PrePostPage: React.FC = () => {
  useHideTabBar();
  const history = useHistory();
  const location = useLocation<LocationState>();
  const routeId = location.state?.routeId;
  const [routeData, setRouteData] = useState<Route | undefined>(location.state?.route);
  const [routeName, setRouteName] = useState(location.state?.routeName ?? location.state?.route?.route_name ?? 'Recorded run');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(location.state?.snapshotUrl ?? location.state?.route?.snapshot_url ?? null);
  const [path, setPath] = useState<Array<{ lat: number; lng: number }>>(location.state?.path ?? extractPath(location.state?.route));
  const [content, setContent] = useState('Felt great on this run!');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  useEffect(() => {
    if (!routeId) {
      history.replace('/run-tracking');
      return;
    }

    if (routeData) {
      setRouteName(routeData.route_name ?? routeName);
      if (routeData.snapshot_url) {
        setSnapshotUrl(routeData.snapshot_url);
      }
      setPath((prev) => (prev.length ? prev : extractPath(routeData)));
      return;
    }

    setLoadingRoute(true);
    RoutesApi.getRoute(routeId)
      .then((route) => {
        setRouteData(route);
        setRouteName(route.route_name ?? routeName);
        if (route.snapshot_url) {
          setSnapshotUrl(route.snapshot_url);
        }
        setPath(extractPath(route));
      })
      .catch((err) => {
        console.error(err);
        setToast('Could not load recorded route.');
      })
      .finally(() => setLoadingRoute(false));
  }, [routeId, history, routeData, routeName]);

  const staticMapUrl = useMemo(() => {
    if (snapshotUrl) return snapshotUrl;
    if (!path.length || !apiKey) return null;
    const sample = samplePath(path, 80)
      .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
      .join('|');
    return `https://maps.googleapis.com/maps/api/staticmap?size=600x320&scale=2&path=weight:4|color:0x92c628ff|${sample}&key=${apiKey}`;
  }, [path, snapshotUrl, apiKey]);

  const handlePost = async () => {
    if (!routeId) return;
    setPosting(true);
    try {
      await createPost({
        route_id: routeId,
        content,
        image_url: staticMapUrl,
      });
      setToast('Run shared to community feed.');
      history.replace('/run-tracking');
    } catch (err: any) {
      console.error(err);
      setToast(err?.response?.data?.error || 'Failed to create post.');
    } finally {
      setPosting(false);
    }
  };

  const handleCancel = () => {
    history.replace('/run-tracking');
  };

  if (!routeId) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleCancel}>Back</IonButton>
          </IonButtons>
          <IonTitle>Share Run</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handlePost} disabled={posting}>
              {posting ? <IonSpinner name="crescent" /> : 'Post'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loadingRoute ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            <IonItem lines="none">
              <IonLabel position="stacked">Route name</IonLabel>
              <p style={{ margin: '8px 0 0', fontWeight: 600 }}>{routeName}</p>
            </IonItem>

            {staticMapUrl && (
              <div className="static-map-wrapper">
                <img src={staticMapUrl} alt="Route snapshot" />
              </div>
            )}

            <IonItem lines="none">
              <IonLabel position="stacked">Add a note</IonLabel>
              <IonTextarea
                autoGrow
                value={content}
                onIonChange={(ev) => setContent(ev.detail.value ?? '')}
                placeholder="How did it feel?"
              />
            </IonItem>

            <div className="pre-post-actions">
              <IonButton fill="clear" onClick={handleCancel} disabled={posting}>
                Cancel
              </IonButton>
              <IonButton onClick={handlePost} disabled={posting}>
                {posting ? <IonSpinner name="crescent" /> : 'Post activity'}
              </IonButton>
            </div>
          </>
        )}

        <IonToast
          isOpen={!!toast}
          onDidDismiss={() => setToast(null)}
          duration={2000}
          message={toast ?? ''}
        />
      </IonContent>
    </IonPage>
  );
};

const samplePath = (points: Array<{ lat: number; lng: number }>, limit: number) => {
  if (points.length <= limit) return points;
  const stride = Math.ceil(points.length / limit);
  const sampled: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < points.length; i += stride) {
    sampled.push(points[i]);
  }
  sampled.push(points[points.length - 1]);
  return sampled;
};

const extractPath = (route?: Route) => {
  if (!route) return [];
  const rawPath = (route as any).chosen_path;
  if (Array.isArray(rawPath)) {
    return rawPath.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }));
  }
  if (typeof rawPath === 'string') {
    try {
      const parsed = JSON.parse(rawPath);
      if (Array.isArray(parsed)) {
        return parsed.map((point: any) => ({ lat: Number(point.lat), lng: Number(point.lng) }));
      }
    } catch {
      return [];
    }
  }
  return [];
};

export default PrePostPage;
