import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonCheckbox,
  IonImg,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToast
} from '@ionic/react';
import {
  arrowBack,
  earth,
  eye,
  saveOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { createRoute } from '../services/api';
import "../theme/Activity-Summary.css";
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import Map from '../components/assets/map.png';
import Challenge1 from '../components/assets/challenge1.jpg';
import { useHideTabBar } from "../hooks/useHideTabBar";
import { formatPace, paceStringToMinutes } from '../lib/utils';

interface RunData {
  distance_km: number;
  duration_seconds: number;
  average_pace: string | number;
  estimated_calories: number;
  chosen_path: Array<{ lat: number; lng: number }>;
  route_type?: 'run' | 'walk' | 'cycle';
}

const Activity: React.FC = () => {
  // Hide the tab bar on this page
  useHideTabBar();

  const history = useHistory();
  const location = useLocation<{ runData?: RunData }>();
  const { currentUser } = useUser();

  // Get run data from navigation state or use defaults
  const runData = location.state?.runData || {
    distance_km: 0,
    duration_seconds: 0,
    average_pace: '--:--',
    estimated_calories: 0,
    chosen_path: [],
    route_type: 'run' as const
  };

  const [activityTitle, setActivityTitle] = useState<string>('Morning Run');
  const [activityDescription, setActivityDescription] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [shareToFeed, setShareToFeed] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const handleSave = async () => {
    if (!currentUser) {
      setToastMessage('Please log in to save your activity');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!activityTitle.trim()) {
      setToastMessage('Please enter an activity title');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setSaving(true);

      if (!runData.chosen_path?.length) {
        throw new Error('No GPS path detected for this run.');
      }

      const first = runData.chosen_path[0];
      const last = runData.chosen_path[runData.chosen_path.length - 1] ?? first;
      if (!first || !last) {
        throw new Error('Unable to determine route start/end.');
      }

      const avePace = paceStringToMinutes(
        runData.average_pace,
        runData.distance_km,
        runData.duration_seconds
      );

      const savedRoute = await createRoute({
        route_name: activityTitle.trim(),
        visibility,
        duration_seconds: runData.duration_seconds,
        average_pace: avePace,
        distance_km: runData.distance_km,
        estimated_calories: runData.estimated_calories,
        chosen_path: runData.chosen_path.map((point) => ({ lat: point.lat, lng: point.lng })),
        start_lat: first.lat,
        start_lng: first.lng,
        end_lat: last.lat,
        end_lng: last.lng,
        snapshot_url: undefined,
      });

      console.log('Activity saved successfully:', savedRoute);

      setToastMessage('Activity saved successfully!');
      setToastColor('success');
      setShowToast(true);

      if (shareToFeed && visibility === 'public') {
        history.push('/run-pre-post', {
          routeId: savedRoute.route_id,
          routeName: savedRoute.route_name ?? activityTitle.trim(),
          snapshotUrl: savedRoute.snapshot_url ?? null,
          route: savedRoute,
        });
      } else {
        setTimeout(() => {
          history.push('/profile');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Failed to save activity:', error);
      setToastMessage(error.message || 'Failed to save activity');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = () => {
    console.log('Saving changes and navigating...');
    // Navigate to next page (you can change this path)
    history.push('/activity-summary');
  };

  const handleChangeMapType = () => {
    console.log('Changing map type...');
    // Handle map type change logic
  };

  const handleVisibilityChange = (type: string) => {
    console.log(`Changing ${type} visibility`);
    // Handle visibility changes
  };
  
  const handleDiscardActivity = () => {
    console.log('Activity discarded');
    history.push('/run-tracking');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/run-tracking" text={''}/>
          </IonButtons>
          <IonTitle>Activity</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleSave} disabled={saving} className="save-header-btn">
              {saving ? <IonSpinner name="crescent" /> : 'Save'}
            </IonButton>
          </IonButtons>
        </IonToolbar> 
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {/* Activity Title */}
        <IonItem className="activity-title-item">
          <IonInput
            value={activityTitle}
            onIonInput={e => setActivityTitle(e.detail.value!)}
            className="activity-title-input"
          />
        </IonItem>

        {/* Media Section */}
        <div className="media-section">
          <IonGrid className="media-grid">
            <IonRow>
              <IonCol size="12" className="map-col">
                <IonImg
                  src={Map}
                  alt="Activity Map"
                  className="media-item map-preview"
                />
              </IonCol>
            </IonRow>
            
          </IonGrid>
        </div>

        {/* Run Stats Summary */}
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--ion-color-light)', borderRadius: '8px' }}>
          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
                    {runData.distance_km.toFixed(2)} km
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--ion-color-medium)' }}>Distance</p>
                </div>
              </IonCol>
              <IonCol size="6">
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
                    {Math.floor(runData.duration_seconds / 60)}:{(runData.duration_seconds % 60).toString().padStart(2, '0')}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--ion-color-medium)' }}>Duration</p>
                </div>
              </IonCol>
            </IonRow>
            <IonRow style={{ marginTop: '8px' }}>
              <IonCol size="6">
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                    {formatPace(
                      paceStringToMinutes(
                        runData.average_pace,
                        runData.distance_km,
                        runData.duration_seconds
                      )
                    )}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--ion-color-medium)' }}>Avg Pace (/km)</p>
                </div>
              </IonCol>
              <IonCol size="6">
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                    {runData.estimated_calories}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--ion-color-medium)' }}>Calories</p>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Details Section */}
        <IonText color="dark">
          <h2 className="section-heading">Details</h2>
        </IonText>

        <IonItem className="private-notes-item">
          <IonTextarea
            value={activityDescription}
            placeholder="Add a description (optional). This will be visible to others."
            onIonInput={e => setActivityDescription(e.detail.value!)}
            className="private-notes-textarea"
            autoGrow={true}
            rows={3}
          />
        </IonItem>

        {/* Visibility Section */}
        <IonText color="dark">
          <h2 className="section-heading">Visibility</h2>
        </IonText>

        <IonItem className="visibility-option">
          <IonIcon icon={earth} slot="start" color="medium" />
          <IonLabel>
            <div className="visibility-content">
              <span className="option-label" slot='start'>Who can see</span>
              <IonSelect
                justify="end"
                value={visibility}
                interface="action-sheet"
                onIonChange={(e) => {
                  const newVisibility = e.detail.value as 'public' | 'private';
                  setVisibility(newVisibility);
                  // If set to private, disable sharing to feed
                  if (newVisibility === 'private') {
                    setShareToFeed(false);
                  }
                }}
              >
                <IonSelectOption value="public">Everyone</IonSelectOption>
                <IonSelectOption value="private">Private (Only Me)</IonSelectOption>
              </IonSelect>
            </div>
          </IonLabel>
        </IonItem>

        {/* Share to Feed Option (only visible when public) */}
        {visibility === 'public' && (
          <IonItem>
            <IonLabel>Share to Community Feed</IonLabel>
            <IonCheckbox
              slot="end"
              checked={shareToFeed}
              onIonChange={(e) => setShareToFeed(e.detail.checked)}
            />
          </IonItem>
        )}

        {/* Discard Activity Button */}
        <IonButton
          expand="block"
          size="large"
          onClick={handleDiscardActivity}
          disabled={saving}
          className="discard-activity-btn"
        >
          Discard activity
        </IonButton>

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default Activity;
