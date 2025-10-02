import React from "react";
import {
  IonPage,
  IonContent,
} from "@ionic/react";

import Laptop from "../assets/RT LAPTOP.png";
import '../components/RunTracking/RunTracking.css';


const RunTracking: React.FC = () => {
return (
    <IonPage>
      <IonContent className="ion-padding">
        <main className="mobile-app-info">
          <img src={Laptop} alt="Profile" />
          <div className="mobile-app-text">
            <h2>Run Tracking Available on Mobile App Only</h2>
            <p>
              Track your runs, monitor your progress, and stay motivated — all
              from your phone. Download the app now to get started!
            </p>
          </div>
        </main>
      </IonContent>

    </IonPage>
  );
};

export default RunTracking;
