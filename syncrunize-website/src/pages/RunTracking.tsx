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
    const apkUrl = "/downloads/SyncRunize-v1.0.11.apk";
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = "SyncRunize-v1.0.11.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" scrollY={true}>
        <main className="mobile-app-info" style={{
          paddingBottom: '40px'
        }}>
          <img
            src={Laptop}
            alt="Run Tracking Mobile App"
            style={{
              maxWidth: '100%',
              width: '100%',
              height: 'auto',
              maxHeight: '350px',
              objectFit: 'contain',
              marginBottom: '20px'
            }}
          />
          <div className="mobile-app-text" style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              marginBottom: '16px',
              lineHeight: '1.3'
            }}>
              Run Tracking Available on Mobile App Only
            </h2>
            <p style={{
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              lineHeight: '1.6',
              marginBottom: '16px',
              color: '#555'
            }}>
              Experience seamless run tracking with real-time GPS monitoring,
              personalized insights, and achievement milestones. Take your fitness
              journey to the next level — download now and start running smarter!
            </p>
            <div style={{
              marginTop: '16px',
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#fff3cd',
              borderLeft: '4px solid #ffc107',
              borderRadius: '6px',
              fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
              lineHeight: '1.6',
              color: '#856404'
            }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>Important:</strong>
              Upon installation of the mobile application, please grant all necessary
              permissions (location, storage, notifications) to ensure optimal
              functionality and access to all features.
            </div>
            <IonButton
              expand="block"
              className="download-btn"
              onClick={handleDownloadAPK}
              style={{
                '--padding-top': '14px',
                '--padding-bottom': '14px',
                fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                fontWeight: '600',
                marginTop: '20px'
              }}
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