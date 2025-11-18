import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonInput,
  IonRouterLink,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import "../theme/user-authentication.css";
import LogoIcon from "../components/assets/SycnRunize-Logo.png";
import { useHideTabBar } from "../hooks/useHideTabBar";
import { supabase } from "../lib/supabaseClient";


const GetStarted: React.FC = () => {
  useHideTabBar(); // Hide tab bar on this page
  const history = useHistory();
  const [isMobile, setIsMobile] = useState(false);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error states
  const [fullnameError, setFullnameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    }; 

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset all errors
    setFullnameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setError(null);

    let isValid = true;

    // Validate fullname
    if (!fullname.trim()) {
      setFullnameError("Please enter your fullname");
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError("Please enter your email");
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address");
        isValid = false;
      }
    }

    // Validate password
    if (!password) {
      setPasswordError("Please enter your password");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    // If all validations pass, proceed with signup
    if (!isValid) {
      return;
    }

    setSubmitting(true);

    try {
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: fullname.trim(),
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        setError("Failed to create account. Please try again.");
        setSubmitting(false);
        return;
      }

      // Get the session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError("Failed to get authentication token. Please try again.");
        setSubmitting(false);
        return;
      }

      // Create user profile in database
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          name: fullname.trim(),
          auth_id: authData.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user profile');
      }

      console.log('[GetStarted] Account created successfully');
      setSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        history.replace("/home");
      }, 1500);

    } catch (err: any) {
      console.error('[GetStarted] Signup error:', err);
      setError(err?.message || "Signup failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="get-started-content">
          {/* Left Side - Form */}
          <div className="form-container">
            <div className="form-content"> 
              {/* Logo */}
              <div className="logo-container">
                <img src={LogoIcon} alt="SyncRunize" className="logo-image" />
                <span className="logo-text">SyncRunize</span>
              </div>

              {/* Header */}
              <div className="form-header">
                <h1 className="form-title">Sign Up</h1>
                <p className="form-subtitle">
                  Join running events and plan safe routes for your runs
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="form-fields">
                  {/* Full Name */}
                  <div className="input-group">
                    <label className="input-label">Fullname</label>
                    <IonInput
                      className={`custom-input ${fullnameError ? 'input-error' : ''}`}
                      type="text"
                      placeholder="Enter your fullname"
                      value={fullname}
                      onIonInput={(e) => {
                        setFullname(e.detail.value!);
                        if (fullnameError) setFullnameError("");
                      }}
                      required
                    />
                    {fullnameError && (
                      <div className="error-message">{fullnameError}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <IonInput
                      className={`custom-input ${emailError ? 'input-error' : ''}`}
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onIonInput={(e) => {
                        setEmail(e.detail.value!);
                        if (emailError) setEmailError("");
                      }}
                      required
                    />
                    {emailError && (
                      <div className="error-message">{emailError}</div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <IonInput
                        className={`custom-input ${passwordError ? 'input-error' : ''}`}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onIonInput={(e) => {
                          setPassword(e.detail.value!);
                          if (passwordError) setPasswordError("");
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
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
                    {passwordError && (
                      <div className="error-message">{passwordError}</div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <IonInput
                        className={`custom-input ${confirmPasswordError ? 'input-error' : ''}`}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onIonInput={(e) => {
                          setConfirmPassword(e.detail.value!);
                          if (confirmPasswordError) setConfirmPasswordError("");
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
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
                        {showConfirmPassword ? (
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
                    {confirmPasswordError && (
                      <div className="error-message">{confirmPasswordError}</div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <IonButton
                  expand="block"
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                      Creating Account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </IonButton>

                {/* Social Login */}
                <div className="social-login">
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

                {/* Redirect to Login */}
                <div className="login-section">
                  <IonText color="medium">Already have an account?</IonText>
                  <IonRouterLink routerLink="/log-in" className="login-link">
                    Log In 
                  </IonRouterLink>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Toast Messages */}
        <IonToast
          isOpen={!!error}
          message={error || ''}
          duration={3000}
          color="danger"
          onDidDismiss={() => setError(null)}
          position="top"
        />

        <IonToast
          isOpen={success}
          message="Account created successfully! Redirecting to home..."
          duration={1500}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default GetStarted;
