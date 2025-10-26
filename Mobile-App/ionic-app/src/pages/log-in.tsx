import React, { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    const validateCredentials = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('YOUR_API_ENDPOINT', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
    // For demonstration, showing error for any attempt
    const isValid = false; // Replace with actual validation
    
    if (!isValid) {
      setShowError(true);
    } else {
      // Navigate to home on successful login
      window.location.href = "/HomeModule/homeM1";
    }
  };

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

        <form onSubmit={handleLogin}>
          {/* Email */}
          <IonItem className="form-item">
            <IonLabel position="stacked">
              Enter your mobile number or email:
            </IonLabel>
            <IonInput
              type="email"
              placeholder="abcd@gmail.com"
              value={email}
              onIonInput={(e) => setEmail(e.detail.value!)}
              required
            ></IonInput>
          </IonItem>

          {/* Password */}
          <IonItem className="form-item">
            <IonLabel position="stacked">Enter your password:</IonLabel>
            <IonInput
              type="password"
              placeholder="••••••••••••••••"
              value={password}
              onIonInput={(e) => setPassword(e.detail.value!)}
              required
            ></IonInput>
          </IonItem>

          {/* Forgot Password */}
          <div className="forgot-password">
            <a href="#" className="forgot-link">
              Forgot password?
            </a>
          </div>

          {/* Error Alert */}
          {showError && (
            <div style={{
              backgroundColor: '#ffcdd2',
              color: '#c62828',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Your email or password are incorrect.<br />
              Please try again!
            </div>
          )}

          {/* Login Button */}
          <IonButton
            expand="block"
            className="login-btn"
            type="submit"
          >
            LOGIN
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Login;