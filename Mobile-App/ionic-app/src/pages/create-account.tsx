import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonIcon,
  IonText
} from "@ionic/react";
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

import '../theme/create-account.css';
import '../theme/global.css';
import { supabase } from "../lib/supabaseClient";
import { useHideTabBar } from "../hooks/useHideTabBar";

const CreateAccount: React.FC = () => {
  useHideTabBar();
  const history = useHistory();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      setSubmitting(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    try {
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
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

      // Create user profile in database
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          auth_id: authData.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user profile');
      }

      console.log('[CreateAccount] Account created successfully');
      setSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        history.replace("/home");
      }, 1500);

    } catch (err: any) {
      console.error('[CreateAccount] Signup error:', err);
      setError(err?.message || "Signup failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="dark-content">
        <div className="signup-form">
          <h1>
            CREATE
            <br />
            ACCOUNT
          </h1>

          <form onSubmit={handleSignup} noValidate>
            <IonList className="dark-content" lines="none">
              <IonItem className="form-item">
                <IonLabel position="stacked">Name:</IonLabel>
                <IonInput
                  type="text"
                  value={name}
                  onIonInput={(e) => setName(e.detail.value || "")}
                  placeholder="Enter your full name"
                  required
                />
              </IonItem>

              <IonItem className="form-item">
                <IonLabel position="stacked">Email:</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value || "")}
                  placeholder="Enter your email"
                  required
                />
              </IonItem>

              <IonItem className="form-item" style={{ position: 'relative' }}>
                <IonLabel position="stacked">Password:</IonLabel>
                <IonInput
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value || "")}
                  placeholder="At least 6 characters"
                  required
                />
                <IonButton
                  fill="clear"
                  size="small"
                  style={{ position: 'absolute', right: 0, top: 30 }}
                  onClick={() => setShowPassword(s => !s)}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </IonButton>
              </IonItem>

              <IonItem className="form-item" style={{ position: 'relative' }}>
                <IonLabel position="stacked">Confirm Password:</IonLabel>
                <IonInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value || "")}
                  placeholder="Re-enter your password"
                  required
                />
                <IonButton
                  fill="clear"
                  size="small"
                  style={{ position: 'absolute', right: 0, top: 30 }}
                  onClick={() => setShowConfirmPassword(s => !s)}
                >
                  <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} />
                </IonButton>
              </IonItem>
            </IonList>

            <IonButton
              expand="block"
              className="signup-btn"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating Account...' : 'SIGN UP'}
            </IonButton>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <IonText color="medium">Already have an account?</IonText>
              {' '}
              <a href="/log-in" style={{ color: 'var(--ion-color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                Log In
              </a>
            </div>
          </form>
        </div>

        <IonToast
          isOpen={!!error}
          message={error || ''}
          duration={3000}
          color="danger"
          onDidDismiss={() => setError(null)}
        />

        <IonToast
          isOpen={success}
          message="Account created successfully! Redirecting..."
          duration={1500}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default CreateAccount;
