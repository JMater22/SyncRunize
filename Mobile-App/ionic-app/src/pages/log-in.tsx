import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonInput,
  IonText,
  IonToast,
  IonIcon,
} from "@ionic/react";
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import "../theme/log-in.css";
import LogoIcon from "../components/assets/SycnRunize-Logo.png";
import { useHideTabBar } from "../hooks/useHideTabBar";
import { supabase } from "../lib/supabaseClient";

const Login: React.FC = () => {
  useHideTabBar();
  const history = useHistory();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        return;
      }

      // Verify session was created
      if (!data.session) {
        setError("Failed to establish session. Please try again.");
        return;
      }

      // Wait for session to be persisted to localStorage
      // This ensures onAuthStateChange listeners have fired
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify the session is actually stored before navigating
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Session initialization failed. Please try again.");
        return;
      }

      // Now it's safe to navigate
      history.replace("/home");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }; 

  const [isMobile, setIsMobile] = useState(false); 

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768); 
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
                <h1 className="form-title2">Log In</h1>
                <p className="form-subtitle2">Fill the below form to login</p>
              </div>

              
              <form onSubmit={handleLogin} noValidate>
                <div className="form-fields2">
                  
                  <div className="input-group2">
                    <label className="input-label2">Email</label>
                    <IonInput
                      className="custom-input2"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onIonInput={(e) => setEmail(e.detail.value || "")}
                      debounce={0}
                      required
                    />
                  </div>


                  <div className="input-group2" style={{ position: 'relative' }}>
                    <label className="input-label2">Password</label>
                    <IonInput
                      className="custom-input2"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value || "")}
                      debounce={0}
                      required
                    />
                    <IonButton fill="clear" size="small" style={{ position: 'absolute', right: 0, top: 30 }} onClick={() => setShowPassword(s => !s)}>
                      <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                    </IonButton>
                  </div> 

                 
                  <div className="forgot-password-container">
                    <a href="/forgot-password" className="forgot-link2">
                      Forgot Password?
                    </a>
                  </div>
                </div>

                 
                <IonButton
                  expand="block"
                  type="submit"
                  className="submit-button2"
                  disabled={submitting}
                >
                  {submitting ? 'Signing in...' : 'Log in'}
                </IonButton>

               
                <div className="social-login2">
                  <IonButton
                    fill="solid"
                    className="social-button google-button"
                  >
                    <div className="social-content">
                      <svg className="social-icon" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Sign in with Google</span>
                    </div>
                  </IonButton>
                </div>


                <div className="signup-section2">
                  <IonText color="medium">Don't have an account?</IonText>
                  <a href="/authentication" className="signup-link2">
                    Create New Account
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
      <IonToast
        isOpen={!!error}
        message={error || ''}
        duration={2500}
        color="danger"
        onDidDismiss={() => setError(null)}
      />
    </IonPage>
  );
};

export default Login;
