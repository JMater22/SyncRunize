import React from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/react';
import { logoGoogle, mail, call } from 'ionicons/icons';
import './User-Authentication/user-authentication.css'; 
import { IonImg } from '@ionic/react';
import { Route } from 'react-router';

const RoutesPage: React.FC = () => {
  const handleGoogleSignUp = () => {
    // Handle Google sign up logic
    console.log('Google sign up clicked');
  };

  const handleEmailSignUp = () => {
    // Handle email sign up logic
    console.log('Email sign up clicked');
  };

  const handlePhoneSignUp = () => {
    // Handle phone sign up logic
    console.log('Phone sign up clicked');
  };

  const handleLogIn = () => {
    // Handle login logic
    console.log('Log in clicked');
  };

  return (
    <IonPage>
      <IonContent className="get-started-content" fullscreen>
        <div className="background-image">
          <div className="overlay">
            <div className="content-container">
              <div className="header-section">
                <h1 className="main-title" color="success">Get Started</h1>
                <p className="subtitle">
                  Register for events and create images of the activities you plan to attend.
                </p>
              </div>

              <div className="buttons-section">
                <IonButton
                  expand="block"
                  fill="clear"
                  className="google-button"
                  onClick={handleGoogleSignUp}
                >
                  <IonIcon icon={logoGoogle} slot="start" />
                  Sign up with email
                </IonButton>

                <IonButton
                  expand="block"
                  fill="solid"
                  className="email-button"
                  onClick={handleEmailSignUp}
                >
                  <IonIcon icon={mail} slot="start" />
                  Sign up with email
                </IonButton>

                <IonButton
                  expand="block"
                  fill="solid"
                  className="phone-button"
                  onClick={handlePhoneSignUp}
                >
                  <IonIcon icon={call} slot="start" />
                  Sign up with phone number
                </IonButton>
              </div>

              <div className="login-section">
                <IonText className="login-text">
                  Already have an account?{' '}
                  <span className="login-link" onClick={handleLogIn}>
                    Log In
                  </span>
                </IonText>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RoutesPage;