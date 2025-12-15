import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonText, 
  IonInput,
  IonRouterLink,
} from "@ionic/react";
import "./GetStarted.css";
import LogInImage from "../../assets/Authen Image.png";
import LogoIcon from "../../assets/SycnRunize-Logo.png";
import { supabase } from "../../supabaseClient.js";

//This will handle OAuth
const handleOAuthLogin = async (provider: 'google') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/home`, // redirect after login
    },
  });

  if (error) console.error('OAuth login error:', error.message);
};
const GetStarted: React.FC = () => {
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

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    }; 
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

    useEffect(() => {
      const checkSession = async () => {
        // 1. Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          history.push('/home');
          return;
        }
      };

      checkSession();
    }, [history]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setFullnameError("");
  setEmailError("");
  setPasswordError("");
  setConfirmPasswordError("");

  // Basic validation
  if (!fullname.trim()) return setFullnameError("Please enter your full name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setEmailError("Invalid email");
  if (password.length < 6) return setPasswordError("At least 6 characters required");
  if (password !== confirmPassword) return setConfirmPasswordError("Passwords do not match");

  try {
    // 1️⃣ Register user in Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
        console.error("Signup error:", signUpError.message);

        // ✅ Handle already registered case
        if (signUpError.message.includes("User already registered")) {
          setEmailError("User already registered. Please log in instead.");
        } else {
          setEmailError(signUpError.message);
        }

        return;
    }

    const user = data.user;
    if (!user) throw new Error("Signup failed. No user returned.");

    // 2️⃣ Add profile to 'users' table (linked by auth_id)
    const { error: insertError } = await supabase
      .from("users")
      .upsert([
        {
          auth_id: user.id,   // Link to Supabase Auth UUID
          email: user.email || email,
          name: fullname,
        },
      ], { onConflict: "auth_id" }); // Avoid duplicates

      if (insertError) {
        if (insertError.message.includes("duplicate key value")) {
            setEmailError("User already registered. Please log in instead.");
          } else {
            alert(`Signup succeeded, but profile creation failed: ${insertError.message}`);
          }
          return;
      }
        const { data: profileRaw, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError.message);
        } else {
          console.log("👤 profileRaw:", profileRaw);
        }

    // 3️⃣ Redirect or confirm email
    if (data.session) {
      history.push("/home");
    } else {
      alert("Check your email to confirm your account before logging in.");
      history.push("/login");
    }
  } catch (err) {
    console.error("Unexpected signup error:", err);
    setEmailError("Unexpected error during signup. Try again.");
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
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
                    {passwordError && (
                      <div className="error-message">{passwordError}</div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                >
                  Sign Up
                </IonButton>

                {/* Social Login */}
                <div className="social-login">
                  <IonButton
                    fill="solid"
                    className="social-button google-button"
                    onClick={() => handleOAuthLogin('google')}
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
                  <IonRouterLink routerLink="/login" className="login-link">
                    Log In
                  </IonRouterLink>
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
                    href="/downloads/SyncRunize-v1.0.19.apk"
                    download="SyncRunize-v1.0.19.apk"
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

          {/* Right Side - Image */}
          <div className="visual-container">
            <div className="visual-content">
              {/* Caption on top of image */}
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
                className="main-image"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GetStarted;