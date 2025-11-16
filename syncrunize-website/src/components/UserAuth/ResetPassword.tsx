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

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Password update error:", error);
        setError("Failed to update password. Please try again.");
        return;
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        history.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Unexpected error during password update:", err);
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
                <h1 className="form-title2">Reset Password</h1>
                <p className="form-subtitle2">
                  Enter your new password below
                </p>
              </div>

              {success ? (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#d4edda",
                    border: "1px solid #c3e6cb",
                    borderRadius: "8px",
                    color: "#155724",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    Password updated successfully! Redirecting to login...
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePasswordUpdate} noValidate>
                  <div className="form-fields2">
                    <div className="input-group2">
                      <label className="input-label2">New Password</label>
                      <IonInput
                        className="custom-input2"
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onIonInput={(e: any) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group2">
                      <label className="input-label2">Confirm Password</label>
                      <IonInput
                        className="custom-input2"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onIonInput={(e: any) =>
                          setConfirmPassword(e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <IonButton
                    expand="block"
                    type="submit"
                    className="submit-button2"
                  >
                    Update Password
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
                  SyncRunize Account Security
                </p>
                <h2 className="image-caption-title">
                  Create a strong password
                  <br />
                  to keep your account{" "}
                  <span className="highlight-text">secure</span>
                </h2>
              </div>

              <img
                src={LogInImage}
                alt="Password Security"
                className="main-image2"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
