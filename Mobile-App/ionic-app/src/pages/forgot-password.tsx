import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonInput, IonText, IonToast } from '@ionic/react';
import LogoIcon from '../components/assets/SycnRunize-Logo.png';
import { supabase } from '../lib/supabaseClient';
import '../theme/log-in.css';

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; color?: string }>({ open: false, msg: '' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setToast({ open: true, msg: 'Please enter your email', color: 'danger' });
      return;
    }
    try {
      setSending(true);
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        setToast({ open: true, msg: error.message, color: 'danger' });
        return;
      }
      setToast({ open: true, msg: 'Reset link sent. Check your email.', color: 'success' });
    } catch (err: any) {
      setToast({ open: true, msg: err?.message || 'Failed to send reset link', color: 'danger' });
    } finally {
      setSending(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-page-content2">
          <div className="form-container2">
            <div className="form-content2">
              <div className="logo-container">
                <img src={LogoIcon} alt="SyncRunize" className="logo-image" />
                <span className="logo-text">SyncRunize</span>
              </div>

              <div className="form-header2">
                <h1 className="form-title2">Forgot Password</h1>
                <p className="form-subtitle2">Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleSend} noValidate>
                <div className="form-fields2">
                  <div className="input-group2">
                    <label className="input-label2">Email</label>
                    <IonInput
                      className="custom-input2"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onIonChange={(e) => setEmail(e.detail.value || '')}
                      required
                    />
                  </div>
                </div>

                <IonButton expand="block" type="submit" className="submit-button2" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Reset Link'}
                </IonButton>

                <div className="signup-section2">
                  <IonText color="medium">Remembered your password?</IonText>
                  <a href="/log-in" className="signup-link2">Back to Login</a>
                </div>
              </form>
            </div>
          </div>
        </div>
        <IonToast isOpen={toast.open} message={toast.msg} color={toast.color} duration={2500} onDidDismiss={() => setToast({ open: false, msg: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;

