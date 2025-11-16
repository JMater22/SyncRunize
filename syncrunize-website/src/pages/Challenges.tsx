import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import axios from "axios";
import { supabase } from "../supabaseClient";
import "../components/Challenges/Challenge.css";

interface Challenge { 
  challenge_id: string;
  name: string;
  description: string;
  target_distance_km: number;
  duration_days: number;
  image_url: string;
  joined?: boolean;
  completed?: boolean;
  progress_percent?: number;
}


const Challenges: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [joining, setJoining] = useState<{ [key: string]: boolean }>({});
  const location = useLocation<{ focusChallengeId?: number }>();

  // ✅ Retrieve authenticated user ID
  const fetchCurrentUser = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) return;

    const token = session.access_token;
    const { data: user } = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setCurrentUserId(user.user_id);
  };

  // ✅ Fetch all challenges + user's joined ones
const fetchChallenges = async () => {
  try {
    setLoading(true);

    // Step 1: Get current user first (returns the id instead of setting state separately)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) return;

    const token = session.access_token;
    const { data: user } = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const userId = user.user_id;
    setCurrentUserId(userId);

    // Step 2: Fetch challenges for this user
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/challenges/${userId}/all`
    );

    // Log response to confirm structure
    console.log("Fetched challenges:", res.data);

    // Step 3: Verify and set as array
    if (Array.isArray(res.data)) {
      setChallenges(res.data);
    } else if (Array.isArray(res.data.challenges)) {
      setChallenges(res.data.challenges);
    } else {
      console.warn("Unexpected data structure:", res.data);
      setChallenges([]);
    }
  } catch (err) {
    console.error("❌ Failed to fetch challenges:", err);
    setChallenges([]);
  } finally {
    setLoading(false);
  }
};

// ✅ Call once on mount
useEffect(() => {
  fetchChallenges();
}, []);

// ✅ Scroll to focused challenge after challenges load
useEffect(() => {
  if (!location.state?.focusChallengeId || challenges.length === 0) return;

  const challengeId = location.state.focusChallengeId;
  const targetElement = document.getElementById(`challenge-${challengeId}`);

  if (targetElement) {
    setTimeout(() => {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetElement.classList.add('highlight-focus');
      setTimeout(() => targetElement.classList.remove('highlight-focus'), 2000);
    }, 300);
  }
}, [challenges, location.state]);

  // ✅ Handle join challenge
  const handleJoinClick = async (challengeId: string) => {
    if (!currentUserId) return;
    try {
      setJoining((prev) => ({ ...prev, [challengeId]: true }));

      // Get authentication token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        console.error("No active session");
        return;
      }

      const token = session.access_token;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/challenges/${currentUserId}/join`,
        { challenge_id: challengeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh list to show updated joined state
      await fetchChallenges();
    } catch (err: any) {
      console.error("❌ Join failed:", err);
      alert(err?.response?.data?.error || "Failed to join challenge. Please try again.");
    } finally {
      setJoining((prev) => ({ ...prev, [challengeId]: false }));
    }
  };

  // ✅ Handle leave challenge
  const handleLeaveClick = async (challengeId: string) => {
    if (!currentUserId) return;
    try {
      setJoining((prev) => ({ ...prev, [challengeId]: true }));

      // Get authentication token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        console.error("No active session");
        return;
      }

      const token = session.access_token;

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/challenges/${currentUserId}/leave/${challengeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchChallenges();
    } catch (err: any) {
      console.error("❌ Leave failed:", err);
      alert(err?.response?.data?.error || "Failed to leave challenge. Please try again.");
    } finally {
      setJoining((prev) => ({ ...prev, [challengeId]: false }));
    }
  };

  // ✅ Button render helper
const renderButton = (challenge: Challenge) => {
  const { challenge_id, joined, completed } = challenge;
  const progress = Number(challenge.progress_percent) || 0; // ✅ ensure it's always a number
  const isLoading = joining[challenge_id];

  // ✅ Case 1: Completed challenge
  if (joined && completed) {
    return (
      <div className="completed-section">
        <IonButton expand="block" color="success" disabled>
           Challenge Completed
        </IonButton>
      </div>
    );
  }

  // ✅ Case 2: Joined but in progress
  if (joined && !completed) {
    const percent = Math.min(progress, 100).toFixed(1);

    return (
      <div className="joined-section">
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Progress</span>
            <span className="progress-percentage">{percent}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {progress < 100 ? "Keep running!" : "Almost there!"}
          </p>
        </div>

        <IonButton
          expand="block"
          className="leave-challenge-btn"
          color="danger"
          onClick={() => handleLeaveClick(challenge_id)}
          disabled={isLoading}
        >
          {isLoading ? <IonSpinner name="dots" /> : "Leave Challenge"}
        </IonButton>
      </div>
    );
  }

  // ✅ Case 3: Not joined
  return (
    <IonButton
      expand="block"
      className="suggested-join-btn"
      onClick={() => handleJoinClick(challenge_id)}
      disabled={isLoading}
    >
      {isLoading ? <IonSpinner name="dots" /> : "Join Challenge"}
    </IonButton>
  );
};



  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="ion-padding challenges-page">
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <h3 className="suggested-header">Suggested Challenges</h3>
            </IonCol>
          </IonRow>

          <IonRow className="suggested-row">
            {challenges.map((ch) => (
              <IonCol size="12" sizeMd="6" sizeLg="2.5" key={ch.challenge_id}>
                <IonCard className="suggested-card" id={`challenge-${ch.challenge_id}`}>
                  <IonImg src={ch.image_url} alt={ch.name} />
                  <IonCardHeader>
                    <IonCardTitle className="challenge-subtitle">{ch.name}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p className="challenge-description">{ch.description}</p>
                    <p className="challenge-date">
                      Target: {ch.target_distance_km} km • Duration: {ch.duration_days} days
                    </p>
                    {renderButton(ch)}
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Challenges;
