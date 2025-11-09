import { useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonTextarea,
  IonRange,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonToast,
  IonSpinner,
  IonInput,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  warningOutline,
  trailSignOutline,
  carOutline,
  buildOutline,
  ellipsisHorizontal,
  locateOutline,
  mapOutline,
  cameraOutline,
  trashOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { HazardsApi } from '../services/hazards';
import '../theme/Hazard-Report.css';

type LocationState = {
  lat?: number;
  lng?: number;
  source?: string;
};

const hazardTypes = [
  { id: 'pothole', label: 'Pothole / Road damage', icon: trailSignOutline },
  { id: 'heavy_traffic', label: 'Heavy traffic', icon: carOutline },
  { id: 'construction', label: 'Construction zone', icon: buildOutline },
  { id: 'unsafe_area', label: 'Unsafe area', icon: warningOutline },
  { id: 'other', label: 'Other hazard', icon: ellipsisHorizontal },
];

const defaultDescription: Record<string, string> = {
  pothole: 'Large pothole along the route.',
  heavy_traffic: 'Significant traffic congestion in this segment.',
  construction: 'Construction zone blocking part of the path.',
  unsafe_area: 'Reported unsafe area. Stay alert.',
  other: 'Reported hazard.',
};

const ReportHazard: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [hazardType, setHazardType] = useState<string>('pothole');
  const [title, setTitle] = useState<string>('Pothole / Road damage');
  const [description, setDescription] = useState<string>('Large pothole along the route.');
  const [severity, setSeverity] = useState<number>(50);
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; color?: 'success' | 'danger' } | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const initialLocation = useMemo(() => ({
    lat: location.state?.lat,
    lng: location.state?.lng,
  }), [location.state]);

  useEffect(() => {
    if (initialLocation.lat && initialLocation.lng) {
      setLat(initialLocation.lat.toString());
      setLng(initialLocation.lng.toString());
    }
  }, [initialLocation]);

  useEffect(() => {
    const selected = hazardTypes.find((t) => t.id === hazardType);
    if (selected) {
      setTitle(selected.label);
      setDescription(defaultDescription[hazardType] || 'Reported hazard.');
    }
  }, [hazardType]);

  const handleUseMyLocation = async () => {
    try {
      setLoadingLocation(true);
      const permission = await Geolocation.requestPermissions();
      if (permission.location === 'denied') {
        setToast({ message: 'Location permission denied', color: 'danger' });
        return;
      }
      const coords = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      setLat(coords.coords.latitude.toFixed(6));
      setLng(coords.coords.longitude.toFixed(6));
      setToast({ message: 'Location captured', color: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Unable to get location', color: 'danger' });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });
      if (photo?.dataUrl) {
        setPhotoDataUrl(photo.dataUrl);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Camera unavailable', color: 'danger' });
    }
  };

  const toBlob = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleSubmit = async () => {
    if (!lat || !lng) {
      setToast({ message: 'Provide the hazard location first.', color: 'danger' });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setToast({ message: 'Invalid coordinates', color: 'danger' });
      return;
    }

    try {
      setSubmitting(true);
      await HazardsApi.reportHazard({
        title: title.trim() || 'Hazard report',
        incident_type: hazardType,
        description: description.trim() || defaultDescription[hazardType] || 'Hazard reported.',
        lat: latNum,
        lng: lngNum,
        severity_weight: severity / 100,
        imageFile: photoDataUrl ? toBlob(photoDataUrl) : undefined,
      });
      setToast({ message: 'Hazard reported. Thank you!', color: 'success' });
      setTimeout(() => {
        history.replace('/run-tracking');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.message || 'Failed to submit hazard.';
      setToast({ message: msg, color: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/run-tracking" text="" />
          </IonButtons>
          <IonTitle>Report hazard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="hazard-report-content">
        <section className="hazard-section">
          <IonText color="medium">
            <h3 className="section-heading">Hazard type</h3>
          </IonText>
          <IonRadioGroup value={hazardType} onIonChange={(e) => setHazardType(e.detail.value)}>
            {hazardTypes.map((hazard) => (
              <IonItem key={hazard.id} lines="full">
                <IonIcon slot="start" icon={hazard.icon} color="warning" />
                <IonLabel>{hazard.label}</IonLabel>
                <IonRadio slot="end" value={hazard.id} />
              </IonItem>
            ))}
          </IonRadioGroup>
        </section>

        <section className="hazard-section">
          <IonText color="medium">
            <h3 className="section-heading">Details</h3>
          </IonText>
          <IonItem>
            <IonLabel position="stacked">Title</IonLabel>
            <IonInput value={title} onIonInput={(e) => setTitle(e.detail.value ?? '')} placeholder="Hazard title" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea
              autoGrow
              value={description}
              onIonInput={(e) => setDescription(e.detail.value ?? '')}
              placeholder="Describe what other runners should know"
            />
          </IonItem>
        </section>

        <section className="hazard-section">
          <IonText color="medium">
            <h3 className="section-heading">Severity</h3>
          </IonText>
          <IonRange min={0} max={100} value={severity} onIonChange={(e) => setSeverity(e.detail.value as number)}>
            <IonIcon size="small" slot="start" icon={warningOutline} />
            <IonIcon size="small" slot="end" icon={warningOutline} />
          </IonRange>
          <p className="severity-label">{Math.round(severity)}% severity</p>
        </section>

        <section className="hazard-section">
          <IonText color="medium">
            <h3 className="section-heading">Location</h3>
          </IonText>
          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <IonButton expand="block" fill="outline" onClick={handleUseMyLocation} disabled={loadingLocation}>
                  {loadingLocation ? <IonSpinner name="crescent" /> : <IonIcon slot="start" icon={locateOutline} />}
                  Use location
                </IonButton>
              </IonCol>
              <IonCol size="6">
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => {
                    setLat('');
                    setLng('');
                  }}
                >
                  <IonIcon slot="start" icon={mapOutline} />
                  Clear
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonItem>
            <IonLabel position="stacked">Latitude</IonLabel>
            <IonInput value={lat} onIonInput={(e) => setLat(e.detail.value ?? '')} placeholder="e.g. 15.123456" inputmode="decimal" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Longitude</IonLabel>
            <IonInput value={lng} onIonInput={(e) => setLng(e.detail.value ?? '')} placeholder="e.g. 120.123456" inputmode="decimal" />
          </IonItem>
        </section>

        <section className="hazard-section">
          <IonText color="medium">
            <h3 className="section-heading">Photo (optional)</h3>
          </IonText>
          <div className="photo-actions">
            <IonButton fill="outline" onClick={handleTakePhoto}>
              <IonIcon slot="start" icon={cameraOutline} />
              {photoDataUrl ? 'Retake photo' : 'Add photo'}
            </IonButton>
            {photoDataUrl && (
              <IonButton fill="clear" color="medium" onClick={() => setPhotoDataUrl(null)}>
                <IonIcon slot="start" icon={trashOutline} />
                Remove
              </IonButton>
            )}
          </div>
          {photoDataUrl && (
            <div className="photo-preview">
              <img src={photoDataUrl} alt="Hazard preview" />
            </div>
          )}
        </section>

        <IonButton expand="block" size="large" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <IonSpinner name="crescent" /> : 'Submit hazard'}
        </IonButton>

        <IonToast
          isOpen={!!toast}
          duration={2000}
          onDidDismiss={() => setToast(null)}
          message={toast?.message}
          color={toast?.color}
        />
      </IonContent>
    </IonPage>
  );
};

export default ReportHazard;
