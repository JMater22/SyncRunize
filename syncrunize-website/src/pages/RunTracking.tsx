import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
} from "@ionic/react";

import Laptop from "../assets/RUN-T-PHONE.png";
import '../components/RunTracking/RunTracking.css';

const RunTracking: React.FC = () => { 
  const handleDownloadAPK = () => {
    // APK will be located in public/downloads/ folder
    const apkUrl = "/downloads/SyncRunize-v1.0.0.apk";
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = "SyncRunize-v1.0.0.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <main className="mobile-app-info">
          <img
            src={Laptop}
            alt="Run Tracking Mobile App"
            style={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '500px',
              objectFit: 'contain'
            }}
          />
          <div className="mobile-app-text">
            <h2>Run Tracking Available on Mobile App Only</h2>
            <p>
              Experience seamless run tracking with real-time GPS monitoring,
              personalized insights, and achievement milestones. Take your fitness
              journey to the next level — download now and start running smarter!
            </p>
            <p style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fff3cd',
              borderLeft: '4px solid #ffc107',
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#856404'
            }}>
              <strong>Important:</strong> Upon installation of the mobile application,
              please grant all necessary permissions (location, storage, notifications)
              to ensure optimal functionality and access to all features.
            </p>
            <IonButton
              expand="block"
              className="download-btn"
              onClick={handleDownloadAPK}
            >
              Download APK
            </IonButton>
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default RunTracking;