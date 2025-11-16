import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonTextarea,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import {
  close,
  construct,
  warning,
  water,
  paw,
  bulb,
  car,
  fitness,
  ellipsisHorizontal,
} from 'ionicons/icons';

interface HazardReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPosition: { latitude: number; longitude: number } | null;
  onSubmit: (hazardData: {
    hazard_type: string;
    description?: string;
    severity: 'low' | 'medium' | 'high';
    lat: number;
    lng: number;
  }) => Promise<void>;
}

const HAZARD_TYPES = [
  { type: 'pothole', label: 'Pothole', icon: warning, color: 'warning' },
  { type: 'glass', label: 'Broken Glass', icon: warning, color: 'danger' },
  { type: 'construction', label: 'Construction', icon: construct, color: 'warning' },
  { type: 'dog', label: 'Aggressive Dog', icon: paw, color: 'danger' },
  { type: 'lighting', label: 'Poor Lighting', icon: bulb, color: 'medium' },
  { type: 'traffic', label: 'Heavy Traffic', icon: car, color: 'warning' },
  { type: 'flooding', label: 'Flooding', icon: water, color: 'primary' },
  { type: 'obstacle', label: 'Obstacle', icon: fitness, color: 'warning' },
  { type: 'other', label: 'Other', icon: ellipsisHorizontal, color: 'medium' },
];

const HazardReportModal: React.FC<HazardReportModalProps> = ({
  isOpen,
  onClose,
  currentPosition,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const handleSubmit = async () => {
    if (!selectedType) {
      setToastMessage('Please select a hazard type');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!currentPosition) {
      setToastMessage('Unable to get your location');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        hazard_type: selectedType,
        description: description.trim() || undefined,
        severity,
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
      });

      setToastMessage('Hazard reported successfully!');
      setToastColor('success');
      setShowToast(true);

      // Reset form and close after short delay
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Failed to report hazard:', error);
      setToastMessage(error.message || 'Failed to report hazard');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setDescription('');
    setSeverity('medium');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Report Hazard</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleClose} disabled={submitting}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {/* Hazard Type Grid */}
          <IonLabel style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
            Select Hazard Type
          </IonLabel>
          <IonGrid>
            <IonRow>
              {HAZARD_TYPES.map((hazard) => (
                <IonCol size="4" key={hazard.type}>
                  <div
                    onClick={() => !submitting && setSelectedType(hazard.type)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: '8px',
                      border: selectedType === hazard.type ? '2px solid var(--ion-color-primary)' : '1px solid var(--ion-color-light)',
                      backgroundColor: selectedType === hazard.type ? 'var(--ion-color-primary-tint)' : 'transparent',
                      cursor: 'pointer',
                      minHeight: '90px',
                      justifyContent: 'center',
                    }}
                  >
                    <IonIcon
                      icon={hazard.icon}
                      style={{ fontSize: '32px' }}
                      color={selectedType === hazard.type ? 'primary' : hazard.color}
                    />
                    <span
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        textAlign: 'center',
                        fontWeight: selectedType === hazard.type ? 'bold' : 'normal',
                      }}
                    >
                      {hazard.label}
                    </span>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>

          {/* Severity Selector */}
          <IonLabel style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '20px', marginBottom: '12px', display: 'block' }}>
            Severity
          </IonLabel>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {(['low', 'medium', 'high'] as const).map((level) => (
              <IonButton
                key={level}
                expand="block"
                fill={severity === level ? 'solid' : 'outline'}
                color={level === 'high' ? 'danger' : level === 'medium' ? 'warning' : 'success'}
                onClick={() => setSeverity(level)}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </IonButton>
            ))}
          </div>

          {/* Description */}
          <IonLabel style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
            Description (Optional)
          </IonLabel>
          <IonItem>
            <IonTextarea
              value={description}
              onIonInput={(e) => setDescription(e.detail.value || '')}
              placeholder="Add additional details about the hazard..."
              rows={4}
              disabled={submitting}
            />
          </IonItem>

          {/* Location Info */}
          {currentPosition && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--ion-color-light)', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                <strong>Location:</strong> {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <IonButton
            expand="block"
            onClick={handleSubmit}
            disabled={submitting || !selectedType}
            style={{ marginTop: '20px' }}
          >
            {submitting ? (
              <>
                <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                Reporting...
              </>
            ) : (
              'Report Hazard'
            )}
          </IonButton>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color={toastColor}
      />
    </>
  );
};

export default HazardReportModal;
