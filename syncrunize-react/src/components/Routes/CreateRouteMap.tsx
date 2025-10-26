import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';
import { locationOutline, navigateOutline, arrowBackOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './CreateRouteMap.css';
 
const CreateRouteMap = () => {
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const history = useHistory();

  const handleBack = () => {
    history.push('/routes');
  };

  return (
    <IonPage>
      <IonContent className="route-builder-content">
        <div className="route-builder-container">
          {/* Left Sidebar */}
          <div className="sidebar">
            {/* Back Button */}
            <IonButton 
              fill="clear" 
              className="back-button"
              onClick={handleBack}
            >
              <IonIcon icon={arrowBackOutline} slot="start" />
              Back to Routes
            </IonButton>

            <div className="sidebar-header">
              <h1 className="main-title">
                Create a New Route
              </h1>
              <p className="subtitle">
                Create a route by entering or pinning your starting point and destination. Once finished, you can save and share your route.
              </p>
            </div>

            {/* Starting Point Section */}
            <div className="section-card">
              <div className="section-header">
                <div className="step-number">1</div>
                <div className="section-title-wrapper">
                  <span className="section-title">STARTING POINT</span>
                </div>
              </div>

              <div className="input-wrapper">
                <IonInput
                  value={startPoint}
                  onIonChange={(e) => setStartPoint(e.detail.value!)}
                  placeholder="Enter starting location"
                  className="location-input"
                />
                <IonButton fill="solid" className="pin-button">
                  <IonIcon icon={locationOutline} slot="icon-only" />
                </IonButton>
              </div>
            </div>

            {/* End Point Section */}
            <div className="section-card">
              <div className="section-header">
                <div className="step-number">2</div>
                <div className="section-title-wrapper">
                  <span className="section-title">END POINT</span>
                </div>
              </div>

              <div className="input-wrapper">
                <IonInput
                  value={endPoint}
                  onIonChange={(e) => setEndPoint(e.detail.value!)}
                  placeholder="Enter destination"
                  className="location-input"
                />
                <IonButton fill="solid" className="pin-button">
                  <IonIcon icon={navigateOutline} slot="icon-only" />
                </IonButton>
              </div>

              {/* Distance Unit Selector */}
              <div className="distance-unit-container">
                <div className="unit-label">
                  <IonIcon icon={locationOutline} className="unit-icon" />
                  <span className="unit-text">Distance Unit</span>
                </div>
                <IonSegment 
                  value={distanceUnit} 
                  onIonChange={(e) => setDistanceUnit(e.detail.value as string)}
                  className="distance-segment"
                >
                  <IonSegmentButton value="km" className="segment-button">
                    <IonLabel>KM</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="miles" className="segment-button">
                    <IonLabel>Miles</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>
            </div>

            {/* Next Button */}
            <IonButton expand="block" className="next-button">
              Next
            </IonButton>
          </div>

          {/* Map Container */}
          <div className="map-container">
            <div className="map-tabs">
              <button className="map-tab active">Map</button>
              <button className="map-tab">Satellite</button>
            </div>
            
            <div className="map-placeholder">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.11976383964465!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sph!4v1696896000000!5m2!1sen!2sph"
                width="100%"
                height="100%"
                allowFullScreen
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Map Controls */}
            <div className="map-controls">
              <IonIcon icon={navigateOutline} />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateRouteMap;