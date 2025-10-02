import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

import {
  IonPage,
  IonContent,
  IonButton,
  IonInput,
  IonText,
  IonCheckbox,
} from "@ionic/react";
import "./LoginForm.css";
import CreateAccImage from "../../assets/UA image 2.jpg";
import AppleIcon from "../../assets/apple.svg";
import GoogleIcon from "../../assets/google.svg";

const LoginForm: React.FC = () => {
  const history = useHistory();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempted");
    history.push("/home"); // redirect after login
  };

    const [isMobile, setIsMobile] = useState(false);
  
    useEffect(() => {
      const checkScreenSize = () => {
        setIsMobile(window.innerWidth <= 768); 
      };
  
      // Check on mount
      checkScreenSize();
  
      // Add event listener for window resize
      window.addEventListener('resize', checkScreenSize);
  
      // Cleanup
      return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-page-content2">
          {/* Left Side - Form */}
          <div className="form-container2">
            <div className="form-content2">
              {/* Header */}
              <div className="form-header2">
                <h1 className="form-title2">Log in</h1>
                <p className="form-subtitle2">
                  Please enter your credentials below
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} noValidate>
                <div className="form-fields2">
                  {/* Email */}
                  <div className="input-group2">
                    <label className="input-label2">
                      Mobile Email
                    </label>
                    <IonInput
                      className="custom-input2"
                      type="email"
                      placeholder="Enter your email or mobile"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="input-group2">
                    <label className="input-label2">Password</label>
                    <IonInput
                      className="custom-input2"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="form-options2">
                  <div className="checkbox-wrapper2">
                    <IonCheckbox id="remember" name="remember" />
                    <label htmlFor="remember" className="checkbox-label2">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="forgot-link2">
                    Forgot password?
                  </a>
                </div>

                {/* Submit */}
                <IonButton expand="block" type="submit" className="submit-button2">
                  Log in
                </IonButton>

                {/* Social Login */}
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

                {/* Redirect to Signup */}
                <div className="login-section2">
                  <IonText color="medium">Don’t have an account?</IonText>
                  <a href="/get-started" className="login-link2">
                    Create New Account
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="visual-container2">
            <div className="visual-content2">
              <img
                src={CreateAccImage}
                alt="Login illustration"
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