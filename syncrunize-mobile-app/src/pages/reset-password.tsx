import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonInput, IonText, IonIcon, IonToast } from '@ionic/react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import LogoIcon from '../components/assets/SycnRunize-Logo.png';
import { supabase } from '../lib/supabaseClient';
import '../theme/log-in.css';

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; color?: string }>({ open: false, msg: '' });

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setToast({ open: true, msg: 'Password must be at least 6 characters', color: 'danger' });
      return;
    }
    if (password !== confirm) {
      setToast({ open: true, msg: 'Passwords do not match', color: 'danger' });
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setToast({ open: true, msg: error.message, color: 'danger' });
        return;
      }
      setToast({ open: true, msg: 'Password updated. You are now signed in.', color: 'success' });
      setTimeout(() => history.replace('/home'), 800);
    } catch (err: any) {
      setToast({ open: true, msg: err?.message || 'Failed to update password', color: 'danger' });
    } finally {
      setSubmitting(false);
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
                <h1 className="form-title2">Reset Password</h1>
                <p className="form-subtitle2">Enter your new password below</p>
              </div>

              <form onSubmit={handleReset} noValidate>
                <div className="form-fields2">
                  <div className="input-group2" style={{ position: 'relative' }}>
                    <label className="input-label2">New Password</label>
                    <IonInput
                      className="custom-input2"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onIonChange={(e) => setPassword(e.detail.value || '')}
                      required
                    />
                    <IonButton fill="clear" size="small" style={{ position: 'absolute', right: 0, top: 30 }} onClick={() => setShowPass(s => !s)}>
                      <IonIcon icon={showPass ? eyeOffOutline : eyeOutline} />
                    </IonButton>
                  </div>

                  <div className="input-group2" style={{ position: 'relative' }}>
                    <label className="input-label2">Confirm Password</label>
                    <IonInput
                      className="custom-input2"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirm}
                      onIonChange={(e) => setConfirm(e.detail.value || '')}
                      required
                    />
                    <IonButton fill="clear" size="small" style={{ position: 'absolute', right: 0, top: 30 }} onClick={() => setShowConfirm(s => !s)}>
                      <IonIcon icon={showConfirm ? eyeOffOutline : eyeOutline} />
                    </IonButton>
                  </div>
                </div>

                <IonButton expand="block" type="submit" className="submit-button2" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Password'}
                </IonButton>

                <div className="signup-section2">
                  <IonText color="medium">Go back</IonText>
                  <a href="/authentication" className="signup-link2">Return to Sign in</a>
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

export default ResetPassword;

