import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonText,
  IonToast,
} from '@ionic/react';
import { logoGoogle, mail } from 'ionicons/icons';
import { useHideTabBar } from '../hooks/useHideTabBar';
import { supabase } from '../lib/supabaseClient';
import { getAuthRedirectUrl } from '../lib/authRedirect';

const GetStarted: React.FC = () => {
  useHideTabBar();
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    try {
      const redirectTo = getAuthRedirectUrl('/home');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: redirectTo ? { redirectTo } : {},
      });

      if (error) {
        console.error('[GetStarted] Google OAuth error:', error);
        setError(error.message);
      }
    } catch (err: any) {
      console.error('[GetStarted] Google sign-up error:', err);
      setError(err?.message || 'Google sign-up failed');
    }
  };

  const handleEmailSignUp = () => {
    history.push('/create-account');
  };

  const handleLogIn = () => {
    history.push('/log-in');
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
                  fill="solid"
                  className="email-button"
                  onClick={handleEmailSignUp}
                >
                  <IonIcon icon={mail} slot="start" />
                  Sign up with Email
                </IonButton>

                <IonButton
                  expand="block"
                  fill="clear"
                  className="google-button"
                  onClick={handleGoogleSignUp}
                >
                  <IonIcon icon={logoGoogle} slot="start" />
                  Sign up with Google
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
      <IonToast
        isOpen={!!error}
        message={error || ''}
        duration={3000}
        color="danger"
        onDidDismiss={() => setError(null)}
      />
    </IonPage>
  );
};

export default GetStarted;