import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonInput,
  IonRouterLink,
} from "@ionic/react";
import "./GetStarted.css";
import CreateAccImage from "../../assets/CREATE ACCOUNT.jpg";
import AppleIcon from "../../assets/apple.svg";
import GoogleIcon from "../../assets/google.svg";


const GetStarted: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen>
        {/* Main container with side-by-side layout */}
        <div className="get-started-content">
          {/* Left Side - Form */}
          <div className="form-container">
            <div className="form-content">
              <div className="form-header">
                <h1 className="form-title">Sign Up Here</h1>
                <p className="form-subtitle">
                  Register for events and create images of the activities you
                  plan to attend.
                </p>
              </div>

              {/* Form Fields */}
              <div className="form-fields">
                <div className="input-group">
                  <label className="input-label">Full name</label>
                  <IonInput
                    className="custom-input"
                    fill="outline"
                    placeholder="Enter your full name"
                    mode="md"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Email</label>
                  <IonInput
                    className="custom-input"
                    fill="outline"
                    placeholder="Enter your email"
                    type="email"
                    mode="md"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <IonInput
                    className="custom-input"
                    fill="outline"
                    placeholder="Enter your password"
                    type="password"
                    mode="md"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <IonButton expand="block" className="submit-button">
                <IonRouterLink routerLink="/login" className="login-link">
                  Sign Up
                </IonRouterLink>
              </IonButton>

              {/* Social Login - Wrapped in container */}
              <div className="social-login">
                <IonButton className="social-button apple-button">
                  <div className="social-icon-wrapper">
                    <img src={AppleIcon} alt="Apple" className="social-icon" />
                  </div>
                  <span>Apple</span>
                </IonButton>

                <IonButton className="social-button google-button">
                  <div className="social-icon-wrapper">
                    <img src={GoogleIcon} alt="Google" className="social-icon" />
                  </div>
                  <span>Google</span>
                </IonButton>
              </div>

              {/* Login Link */}
              <div className="login-section">
                <IonText>Already have an account?</IonText>
                <IonRouterLink routerLink="/login" className="login-link">
                  Log in
                </IonRouterLink>
              </div>
            </div>
          </div>

          {/* Right Side - Visual Content - Only render on desktop/tablet */}
          {!isMobile && (
            <div className="visual-container">
              <div className="visual-content">
                <img
                  src={CreateAccImage}
                  alt="Create Account"
                  className="main-image"
                />
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GetStarted;