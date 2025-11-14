import { useEffect, useState } from 'react';
import {
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonRadioGroup,
  IonRadio,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { closeOutline, trendingUp, trendingDown } from 'ionicons/icons';
import type { RunSession } from '../state/runTrackerContext';
import type { RecordMeta } from '../hooks/useRunTracker';
import { formatPace } from '../lib/utils';

interface ActivitySummarySheetProps {
  isOpen: boolean;
  session: RunSession;
  isRecording: boolean;
  error?: string | null;
  onRecord: (meta: RecordMeta) => Promise<void> | void;
  onDiscard: () => void;
  onDismiss: () => void;
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const ActivitySummarySheet = ({
  isOpen,
  session,
  isRecording,
  error,
  onRecord,
  onDiscard,
  onDismiss,
}: ActivitySummarySheetProps) => {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>(session.visibility ?? 'private');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const defaultName = session.name || buildDefaultName(session.startedAt);
    setName(defaultName);
    setVisibility(session.visibility ?? 'private');
    setLocalError(null);
  }, [isOpen, session.name, session.visibility, session.startedAt]);

  const handleRecord = async () => {
    if (!name.trim()) {
      setLocalError('Please enter a run name.');
      return;
    }
    setLocalError(null);
    await onRecord({ name: name.trim(), visibility });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="activity-summary-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Activity Summary</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss} disabled={isRecording}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <section className="summary-stats">
          <div>
            <p className="label">Time</p>
            <strong>{formatDuration(session.elapsedMs)}</strong>
          </div>
          <div>
            <p className="label">Distance</p>
            <strong>{(session.movingDistanceMeters / 1000).toFixed(2)} km</strong>
          </div>
          <div>
            <p className="label">Avg pace</p>
            <strong>
              {session.avgPaceMinPerKm > 0
                ? formatPace(session.avgPaceMinPerKm)
                : '--'}
            </strong>
          </div>
          <div>
            <p className="label">Calories</p>
            <strong>{session.caloriesKcal.toFixed(0)} kcal</strong>
          </div>
        </section>

        {/* Elevation Stats - Only show if elevation data exists */}
        {session.elevationGainMeters !== undefined && session.elevationGainMeters > 0 && (
          <section className="summary-stats" style={{ marginTop: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <IonIcon icon={trendingUp} style={{ color: 'var(--ion-color-success)', fontSize: '18px' }} />
                <strong>+{session.elevationGainMeters.toFixed(0)}m</strong>
              </div>
              <p className="label">Elevation Gain</p>
            </div>
            {session.elevationLossMeters !== undefined && session.elevationLossMeters > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <IonIcon icon={trendingDown} style={{ color: 'var(--ion-color-warning)', fontSize: '18px' }} />
                  <strong>-{session.elevationLossMeters.toFixed(0)}m</strong>
                </div>
                <p className="label">Elevation Loss</p>
              </div>
            )}
          </section>
        )}

        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Run name</IonLabel>
            <IonInput
              value={name}
              onIonChange={(ev) => setName(ev.detail.value ?? '')}
              placeholder="Morning long run"
              disabled={isRecording}
            />
          </IonItem>

          <IonItem lines="none">
            <IonLabel>Visibility</IonLabel>
          </IonItem>
          <IonRadioGroup
            value={visibility}
            onIonChange={(ev) => setVisibility(ev.detail.value)}
            className="visibility-group"
          >
            <IonItem>
              <IonLabel>Public</IonLabel>
              <IonRadio value="public" />
            </IonItem>
            <IonItem>
              <IonLabel>Private</IonLabel>
              <IonRadio value="private" />
            </IonItem>
          </IonRadioGroup>
        </IonList>

        {(localError || error) && (
          <IonText color="danger">
            <p>{localError || error}</p>
          </IonText>
        )}

        <div className="summary-actions">
          <IonButton fill="clear" color="medium" onClick={onDiscard} disabled={isRecording}>
            Discard
          </IonButton>
          <IonButton expand="block" onClick={handleRecord} disabled={isRecording}>
            {isRecording ? (
              <IonSpinner name="crescent" />
            ) : (
              'Record run'
            )}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

const buildDefaultName = (startedAt?: number) => {
  if (!startedAt) return 'Untitled run';
  try {
    const date = new Date(startedAt);
    return `Run on ${date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`;
  } catch {
    return 'Untitled run';
  }
};

export default ActivitySummarySheet;
