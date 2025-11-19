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
  IonProgressBar,
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
  // ✅ CRITICAL FIX: Pre-convert blob at capture time to avoid UI freeze during submit
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  // ✅ FIX: Track upload progress to show user feedback
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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

  // ✅ CRITICAL FIX: Convert DataUrl to Blob with performance logging
  // This conversion blocks the UI thread, so we do it at photo capture time, not submit time
  const toBlob = (dataUrl: string): Blob => {
    const conversionStart = performance.now();
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bstr = atob(arr[1]); // Synchronous base64 decode (can take 50-200ms)
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    // Byte-by-byte loop (can take 100-300ms for large images)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const conversionTime = performance.now() - conversionStart;
    console.log(`[HazardReport] Blob conversion took ${conversionTime.toFixed(0)}ms for ${(blob.size / 1024).toFixed(0)}KB`);
    return blob;
  };

  const handleTakePhoto = async () => {
    try {
      console.log('[HazardReport] Opening camera...');
      const captureStart = performance.now();

      const photo = await Camera.getPhoto({
        quality: 40, // ✅ FIX: Reduced to 40% for faster uploads (saves ~30% file size)
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 800, // ✅ FIX: Resize to max 800px width (smaller = faster upload)
        height: 800, // ✅ FIX: Max height to keep files small (saves ~40% vs 1024px)
      });

      console.log(`[HazardReport] Photo captured after ${(performance.now() - captureStart).toFixed(0)}ms`);

      if (photo?.dataUrl) {
        // ✅ FIX: Validate size before setting (DataUrl size check)
        const sizeInMB = (photo.dataUrl.length * 0.75) / (1024 * 1024); // Approximate blob size
        if (sizeInMB > 3) {
          setToast({ message: `Image too large (${sizeInMB.toFixed(1)}MB). Maximum 3MB allowed.`, color: 'danger' });
          return;
        }

        console.log(`[HazardReport] Image size: ${sizeInMB.toFixed(2)}MB, converting to blob...`);

        // ✅ CRITICAL FIX: Convert to blob NOW (not during submit) to avoid UI freeze later
        const blob = toBlob(photo.dataUrl);

        setPhotoDataUrl(photo.dataUrl);
        setPhotoBlob(blob);
        console.log(`[HazardReport] Photo ready for upload: ${(blob.size / 1024).toFixed(0)}KB`);
      }
    } catch (err) {
      console.error('[HazardReport] Camera error:', err);
      setToast({ message: 'Camera unavailable', color: 'danger' });
    }
  };

  const handleSubmit = async () => {
    console.log('[HazardReport] Submit button clicked');
    const submitStart = performance.now();

    // Trim whitespace from coordinates
    const trimmedLat = lat.trim();
    const trimmedLng = lng.trim();

    console.log('[HazardReport] Validating coordinates:', {
      rawLat: lat,
      rawLng: lng,
      trimmedLat,
      trimmedLng,
    });

    if (!trimmedLat || !trimmedLng) {
      console.log('[HazardReport] ❌ Empty coordinates');
      setToast({ message: 'Provide the hazard location first.', color: 'danger' });
      return;
    }

    const latNum = parseFloat(trimmedLat);
    const lngNum = parseFloat(trimmedLng);

    console.log('[HazardReport] Parsed coordinates:', {
      latNum,
      lngNum,
      isLatNaN: isNaN(latNum),
      isLngNaN: isNaN(lngNum),
    });

    // Validate numeric values
    if (isNaN(latNum) || isNaN(lngNum)) {
      console.log('[HazardReport] ❌ Coordinates are not numbers');
      setToast({ message: 'Invalid coordinates format. Use numbers only.', color: 'danger' });
      return;
    }

    // Validate coordinate ranges
    if (latNum < -90 || latNum > 90) {
      console.log('[HazardReport] ❌ Latitude out of range:', latNum);
      setToast({ message: `Latitude must be between -90 and 90 (got ${latNum})`, color: 'danger' });
      return;
    }

    if (lngNum < -180 || lngNum > 180) {
      console.log('[HazardReport] ❌ Longitude out of range:', lngNum);
      setToast({ message: `Longitude must be between -180 and 180 (got ${lngNum})`, color: 'danger' });
      return;
    }

    console.log('[HazardReport] ✅ Coordinate validation passed');

    // ✅ Process submission with instant feedback
    (async () => {
      try {
        setSubmitting(true);
        setUploadProgress(0);
        console.log('[HazardReport] Validation passed, submitting...');

        // Upload image to Supabase first if present
        let imageUrl: string | undefined = undefined;
        if (photoBlob) {
          console.log(`[HazardReport] Uploading image to Supabase (${(photoBlob.size / 1024).toFixed(0)}KB)...`);
          const uploadStart = performance.now();

          try {
            const { uploadImageToSupabase } = await import('../lib/supabaseClient');
            imageUrl = await uploadImageToSupabase(
              photoBlob,
              `hazard-${Date.now()}.jpg`,
              'hazardImage',
              (progress) => {
                setUploadProgress(progress);
                console.log(`[HazardReport] Upload progress: ${progress}%`);
              }
            );
            const uploadTime = performance.now() - uploadStart;
            console.log(`[HazardReport] ✅ Image uploaded to Supabase in ${uploadTime.toFixed(0)}ms: ${imageUrl}`);
          } catch (uploadError: any) {
            console.error('[HazardReport] ❌ Image upload failed:', uploadError);
            throw new Error('Failed to upload image: ' + uploadError.message);
          }
        }

        const hazardData = {
          title: title.trim() || 'Hazard report',
          incident_type: hazardType,
          description: description.trim() || defaultDescription[hazardType] || 'Hazard reported.',
          lat: latNum,
          lng: lngNum,
          severity_weight: severity / 100,
          image_url: imageUrl,
        };

        console.log('[HazardReport] Data prepared, calling API...', {
          hasImage: !!imageUrl,
          imageUrl: imageUrl || 'none',
        });

        const apiCallStart = performance.now();
        await HazardsApi.reportHazard(hazardData);
        const apiCallTime = performance.now() - apiCallStart;

        console.log(`[HazardReport] ✅ API call completed in ${apiCallTime.toFixed(0)}ms`);
        console.log(`[HazardReport] ✅ Total submit time: ${(performance.now() - submitStart).toFixed(0)}ms`);

        // ✅ Show success and navigate
        setToast({ message: 'Hazard reported. Thank you!', color: 'success' });
        setTimeout(() => {
          history.replace('/run-tracking');
        }, 600);

      } catch (err: any) {
        const submitTime = performance.now() - submitStart;
        console.error(`[HazardReport] ❌ Submission failed after ${submitTime.toFixed(0)}ms:`, err);

        // ✅ Show error toast so user knows what happened
        const msg = err?.response?.data?.error || err?.message || 'Failed to submit hazard.';
        setToast({ message: msg, color: 'danger' });
        console.error('[HazardReport] ❌ Error details:', msg);
      } finally {
        setSubmitting(false);
        setUploadProgress(0);
      }
    })();
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
            <IonInput
              value={lat}
              onIonInput={(e) => setLat((e.detail.value ?? '').trim())}
              placeholder="e.g. 15.123456"
              inputmode="decimal"
              type="text"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Longitude</IonLabel>
            <IonInput
              value={lng}
              onIonInput={(e) => setLng((e.detail.value ?? '').trim())}
              placeholder="e.g. 120.123456"
              inputmode="decimal"
              type="text"
            />
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
              <IonButton fill="clear" color="medium" onClick={() => {
                setPhotoDataUrl(null);
                setPhotoBlob(null);
                console.log('[HazardReport] Photo removed');
              }}>
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

        {/* ✅ FIX: Show upload progress to user */}
        {submitting && uploadProgress > 0 && (
          <div style={{ marginTop: '16px', padding: '0 16px' }}>
            <IonProgressBar value={uploadProgress / 100} color="success" />
            <p style={{
              textAlign: 'center',
              fontSize: '14px',
              marginTop: '8px',
              color: 'var(--ion-color-medium)'
            }}>
              {uploadProgress < 100
                ? `Uploading... ${uploadProgress}%`
                : 'Processing...'}
            </p>
          </div>
        )}

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
