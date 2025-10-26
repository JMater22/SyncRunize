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
  IonRadioGroup,
  IonRadio,
  IonInput,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText
} from '@ionic/react';
import {
  arrowBack,
  cameraOutline,
  locationOutline,
  pinOutline,
  star,
  starOutline,
  trailSignOutline,
  carOutline,
  warningOutline,
  buildOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import "../theme/Hazard-Report.css"; // custom styles if needed

const ReportHazard: React.FC = () => {
  const history = useHistory();
  const [selectedHazard, setSelectedHazard] = useState<string>('pothole');
  const [otherHazardText, setOtherHazardText] = useState<string>('');
  const [confidenceRating, setConfidenceRating] = useState<number>(4);

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log('Submitting hazard report:', {
      hazardType: selectedHazard,
      otherHazard: otherHazardText,
      confidence: confidenceRating
    });
    // Navigate back to run tracking page
    history.push('/run-tracking');
  };

  const handleUseMyLocation = () => {
    // Handle geolocation logic
    console.log('Using current location');
  };

  const handlePinOnMap = () => {
    // Handle map pin logic
    console.log('Opening map to pin location');
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <IonIcon
        key={index}
        icon={index < confidenceRating ? star : starOutline}
        style={{ 
          fontSize: '24px', 
          color: index < confidenceRating ? '#ffd700' : '#ccc',
          cursor: 'pointer',
          margin: '0 2px'
        }}
        onClick={() => setConfidenceRating(index + 1)}
      />
    ));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/run-tracking" />
          </IonButtons>
          <IonTitle>Report</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonText color="dark">
          <h2>Report Hazard</h2>
        </IonText>

        {/* Add Photo Section */}
        <IonCard style={{ marginBottom: '20px' }}>
          <IonCardContent style={{ textAlign: 'center', padding: '20px' }}>
            <IonButton 
              fill="clear" 
              size="large"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <IonIcon icon={cameraOutline} style={{ fontSize: '48px' }} />
              <IonLabel>Add Photo</IonLabel>
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Hazard Type Selection */}
        <IonText color="medium">
          <h3 style={{ margin: '20px 0 16px 0' }}>
            Select the type of hazard you'd like to report:
          </h3>
        </IonText>

        <IonRadioGroup 
          value={selectedHazard} 
          onIonChange={e => setSelectedHazard(e.detail.value)}
        >
          <IonItem>
            <IonIcon icon={trailSignOutline} slot="start" color="warning" />
            <IonLabel>Pothole or Road Damage</IonLabel>
            <IonRadio slot="end" value="pothole" />
          </IonItem>

          <IonItem>
            <IonIcon icon={carOutline} slot="start" color="danger" />
            <IonLabel>Heavy Traffic</IonLabel>
            <IonRadio slot="end" value="heavy_traffic" />
          </IonItem>

          <IonItem>
            <IonIcon icon={warningOutline} slot="start" color="warning" />
            <IonLabel>Unsafe Area</IonLabel>
            <IonRadio slot="end" value="unsafe_area" />
          </IonItem>

          <IonItem>
            <IonIcon icon={buildOutline} slot="start" color="medium" />
            <IonLabel>Construction</IonLabel>
            <IonRadio slot="end" value="construction" />
          </IonItem>

          <IonItem>
            <IonIcon icon={warningOutline} slot="start" color="warning" />
            <IonLabel>Other Hazard</IonLabel>
            <IonRadio slot="end" value="other" />
          </IonItem>
        </IonRadioGroup>

        {/* Other Hazard Input - Show only when "other" is selected */}
        {selectedHazard === 'other' && (
          <IonItem style={{ marginTop: '8px' }}>
            <IonInput
              value={otherHazardText}
              placeholder="Enter and describe the hazard"
              onIonInput={e => setOtherHazardText(e.detail.value!)}
              fill="outline"
            />
          </IonItem>
        )}

        {/* Location Method Selection */}
        <IonText color="medium">
          <h3 style={{ margin: '24px 0 16px 0' }}>Select Location Method</h3>
        </IonText>

        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonButton 
                expand="block" 
                fill="outline" 
                onClick={handleUseMyLocation}
                style={{ height: '60px' }}
              >
                <IonIcon icon={locationOutline} slot="start" />
                Use My Location
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton 
                expand="block" 
                fill="outline" 
                onClick={handlePinOnMap}
                style={{ height: '60px' }}
              >
                <IonIcon icon={pinOutline} slot="start" />
                Pin on Map
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Confidence Rating */}
        <IonText color="medium">
          <h3 style={{ margin: '24px 0 16px 0' }}>
            How confident are you about this report?
          </h3>
        </IonText>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          {renderStars()}
        </div>

        {/* Submit Button */}
        <IonButton 
          expand="block" 
          size="large" 
          onClick={handleSubmit}
          className="submit-button"
        >
          Submit
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default ReportHazard;