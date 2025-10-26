import React from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import '../theme/log-in.css';

const Login: React.FC = () => {
  return (
    <IonPage className="login-page">
      {/* Back Button */}
      <IonHeader>
        <IonToolbar className="header-toolbar">
          <IonButtons slot="start">
            <IonButton routerLink="/UserAuthentication/UserA1">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Login Form */}
      <IonContent fullscreen className="ion-padding login-form">
        <h1>LOG IN</h1>

        <form>
          {/* Email */}
          <IonItem className="form-item">
            <IonLabel position="stacked">
              Enter your mobile number or email:
            </IonLabel>
            <IonInput
              type="email"
              placeholder="abcd@gmail.com"
              required
            ></IonInput>
          </IonItem>

          {/* Password */}
          <IonItem className="form-item">
            <IonLabel position="stacked">Enter your password:</IonLabel>
            <IonInput
              type="password"
              placeholder="••••••••••••••••"
              required
            ></IonInput>
          </IonItem>

          {/* Forgot Password */}
          <div className="forgot-password">
            <a href="#" className="forgot-link">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <IonButton
            expand="block"
            className="login-btn"
            routerLink="/HomeModule/homeM1"
          >
            LOGIN
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Login;
