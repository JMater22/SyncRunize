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

const LoginForm: React.FC = () => {
  const history = useHistory();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempted");
    history.push("/home");
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
                      required
                    />
                  </div>

                 
                  <div className="input-group2">
                    <label className="input-label2">Password</label>
                    <IonInput
                      className="custom-input2"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                 
                  <div className="forgot-password-container">
                    <a href="#" className="forgot-link2">
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

                  <IonButton
                    fill="solid"
                    className="social-button apple-button"
                  >
                    <div className="social-content">
                      <svg
                        className="social-icon"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.66-3.74 4.25z" />
                      </svg>
                      <span>Sign in with Apple</span>
                    </div>
                  </IonButton>
                </div>


                <div className="signup-section2">
                  <IonText color="medium">Don't have an account?</IonText>
                  <a href="/get-started" className="signup-link2">
                    Create New Account
                  </a>
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