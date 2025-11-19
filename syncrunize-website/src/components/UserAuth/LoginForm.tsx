import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonInput,
  IonText,
} from "@ionic/react";
import "./LoginForm.css";
import LogInImage from "../../assets/Authen Image.png";
import LogoIcon from "../../assets/SycnRunize-Logo.png";
import { supabase } from "../../supabaseClient";
const LoginForm: React.FC = () => {
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        setError("Invalid email or password.");
        console.log("Supabase response:", { data, error });
        return;
      }

      if (data.session) {
        console.log("Login successful:", data);
        history.push("/home"); // redirect after login
      } else {
        setError("No active session. Please verify your email first.");
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) {
        console.error('Google login error:', error.message);
        setError('Failed to sign in with Google.');
      }
    } catch (err) {
      console.error('Unexpected error during Google login:', err);
      setError('An unexpected error occurred.');
    }
  };



  const [isMobile, setIsMobile] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
                        onIonInput={(e: any) => setEmail(e.target.value)}
                        required
                    />
                  </div>


                  <div className="input-group2">
                    <label className="input-label2">Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <IonInput
                          className="custom-input2"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onIonInput={(e: any) => setPassword(e.target.value)}
                          required
                          style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666',
                          zIndex: 10
                        }}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
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
                >
                  Log in
                </IonButton>
                {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
                

                <div className="social-login2">
                  <IonButton
                    fill="solid"
                    className="social-button google-button"
                    onClick={handleGoogleLogin}
                    expand="block"
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
                  <a href="/get-started" className="signup-link2">
                    Create New Account
                  </a>
                </div>

                {/* APK Download Section */}
                <div className="download-apk-section" style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #e0e0e0'
                }}>
                  <IonText>
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: '#333',
                      lineHeight: '1.5'
                    }}>
                      To access the full range of features, please download our mobile application.
                      Upon installation, kindly grant the necessary permissions to ensure optimal functionality.
                    </p>
                  </IonText>
                  <IonButton
                    expand="block"
                    className="download-apk-button"
                    href="/downloads/SyncRunize-v1.0.11.apk"
                    download="SyncRunize-v1.0.11.apk"
                    style={{
                      '--background': '#7cb342',
                      '--background-hover': '#689f38',
                      '--background-activated': '#558b2f',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Download Mobile App
                  </IonButton>
                </div>
              </form>
            </div>
          </div>


          <div className="visual-container2">
            <div className="visual-content2">

              <div className="image-caption-container">
                <p className="image-caption-subtitle">SyncRunize Route Creation</p>
                <h2 className="image-caption-title">
                  Organize your running routes<br />
                  with safety <span className="highlight-text">as a priority</span>
                </h2>
              </div>
              
              <img
                src={LogInImage}
                alt="Route Creation"
                className="main-image2"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginForm;