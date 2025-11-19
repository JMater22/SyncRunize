import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton, IonText } from '@ionic/react';
import LogoIcon from '../assets/SycnRunize-Logo.png';

/**
 * Auth Redirect Bridge for Password Reset
 *
 * This page receives the callback from Supabase password reset emails
 * and redirects to the mobile app with the authentication tokens.
 *
 * Flow:
 * 1. User clicks password reset link in email
 * 2. Supabase redirects here with access_token in URL hash
 * 3. Page extracts tokens and builds deep link
 * 4. Redirects to syncrunize:// to open mobile app
 */
const AuthRedirect: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [deepLink, setDeepLink] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    try {
      // Extract tokens from URL hash (Supabase uses hash-based redirect)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      console.log('[AuthRedirect] Received params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type
      });

      if (accessToken && type === 'recovery') {
        // Build deep link with tokens for password reset
        const link = `syncrunize://reset-password?access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`;
        setDeepLink(link);
        setStatus('success');

        // Auto-redirect to app after 1 second
        setTimeout(() => {
          console.log('[AuthRedirect] Redirecting to app:', link);
          window.location.href = link;
        }, 1000);
      } else {
        setStatus('error');
        setErrorMessage('Invalid or missing authentication tokens. Please request a new password reset link.');
      }
    } catch (error: any) {
      console.error('[AuthRedirect] Error processing redirect:', error);
      setStatus('error');
      setErrorMessage('An error occurred while processing the authentication. Please try again.');
    }
  }, []);

  const handleManualRedirect = () => {
    if (deepLink) {
      window.location.href = deepLink;
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
            {/* Logo */}
            <div style={{ marginBottom: '24px' }}>
              <img src={LogoIcon} alt="SyncRunize" style={{ width: '80px', height: '80px' }} />
            </div>

            {status === 'processing' && (
              <>
                <IonSpinner name="crescent" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
                  Processing...
                </h2>
                <IonText color="medium">
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Verifying your authentication tokens
                  </p>
                </IonText>
              </>
            )}

            {status === 'success' && (
              <>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#4caf50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '32px'
                }}>
                  ✓
                </div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
                  Opening SyncRunize App...
                </h2>
                <IonText color="medium">
                  <p style={{ margin: '0 0 24px 0', fontSize: '14px' }}>
                    If the app doesn't open automatically:
                  </p>
                </IonText>
                <IonButton
                  expand="block"
                  onClick={handleManualRedirect}
                  style={{
                    '--background': '#667eea',
                    '--background-hover': '#5568d3',
                    '--background-activated': '#4451b8'
                  }}
                >
                  Open App Manually
                </IonButton>
              </>
            )}

            {status === 'error' && (
              <>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#f44336',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '32px',
                  color: 'white'
                }}>
                  ✕
                </div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
                  Authentication Failed
                </h2>
                <IonText color="danger">
                  <p style={{ margin: '0 0 24px 0', fontSize: '14px' }}>
                    {errorMessage}
                  </p>
                </IonText>
                <IonButton
                  expand="block"
                  routerLink="/login"
                  style={{
                    '--background': '#667eea',
                    '--background-hover': '#5568d3',
                    '--background-activated': '#4451b8'
                  }}
                >
                  Return to Login
                </IonButton>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AuthRedirect;
