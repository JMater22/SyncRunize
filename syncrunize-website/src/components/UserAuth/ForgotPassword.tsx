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

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Password reset error:", error);
        setError("Failed to send password reset email. Please try again.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Unexpected error during password reset:", err);
      setError("An unexpected error occurred.");
    }
  };

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
                <h1 className="form-title2">Forgot Password</h1>
                <p className="form-subtitle2">
                  Enter your email address and we'll send you a link to reset
                  your password
                </p>
              </div>

              {success ? (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#d4edda",
                      border: "1px solid #c3e6cb",
                      borderRadius: "8px",
                      color: "#155724",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      Password reset email sent! Please check your inbox.
                    </p>
                  </div>
                  <IonButton
                    expand="block"
                    onClick={() => history.push("/login")}
                    className="submit-button2"
                  >
                    Back to Login
                  </IonButton>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} noValidate>
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
                  </div>

                  <IonButton
                    expand="block"
                    type="submit"
                    className="submit-button2"
                  >
                    Send Reset Link
                  </IonButton>

                  {error && (
                    <p style={{ color: "red", textAlign: "center" }}>
                      {error}
                    </p>
                  )}

                  <div className="signup-section2">
                    <IonText color="medium">Remember your password?</IonText>
                    <a href="/login" className="signup-link2">
                      Back to Login
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="visual-container2">
            <div className="visual-content2">
              <div className="image-caption-container">
                <p className="image-caption-subtitle">
                  SyncRunize Account Recovery
                </p>
                <h2 className="image-caption-title">
                  Reset your password and
                  <br />
                  get back to{" "}
                  <span className="highlight-text">running safely</span>
                </h2>
              </div>

              <img
                src={LogInImage}
                alt="Account Recovery"
                className="main-image2"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
