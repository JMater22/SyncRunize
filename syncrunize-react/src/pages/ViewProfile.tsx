import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonButton,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton
} from '@ionic/react';
import {
  arrowBackOutline,
  personAddOutline,
  personRemoveOutline,
  heartOutline,
  chatbubbleEllipses,
  locationOutline,
  timeOutline,
  flameOutline,
  speedometerOutline
} from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import ProfilePic from '../assets/Profile Picture.png';

// Post interface
interface Post {
  post_id: number;
  user_id: number;
  route_id?: number;
  content?: string;
  route_name?: string;
  distance_km?: number;
  duration_seconds?: number;
  average_pace?: string;
  estimated_calories?: number;
  snapshot_url?: string;
  visibility: 'public' | 'private';
  created_at: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

// User profile interface
interface UserProfile {
  user_id: number;
  name: string;
  username: string;
  email: string;
  profile_picture?: string;
  description?: string;
  gender?: string;
  age?: number;
  weight_kg?: number;
  created_at: string;
}

const ViewProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const history = useHistory();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
    fetchFollowCounts();
    checkFollowStatus();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/public/${userId}`,
        session?.access_token ? {
          headers: { Authorization: `Bearer ${session.access_token}` }
        } : undefined
      );

      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/posts/user/${userId}`,
        session?.access_token ? {
          headers: { Authorization: `Bearer ${session.access_token}` }
        } : undefined
      );

      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/${userId}/counts`
      );

      setFollowerCount(response.data.followers || 0);
      setFollowingCount(response.data.following || 0);
    } catch (error) {
      console.error('Failed to fetch follow counts:', error);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/status/${userId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/follows/${userId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      setIsFollowing(response.data.isFollowing);

      // Update follower count
      if (response.data.isFollowing) {
        setFollowerCount(prev => prev + 1);
      } else {
        setFollowerCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Loading profile...
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!profile) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            User not found
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{profile.name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          {/* Profile Header */}
          <IonCard>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <IonAvatar style={{ width: '100px', height: '100px' }}>
                  <img src={profile.profile_picture || ProfilePic} alt={profile.name} />
                </IonAvatar>

                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
                    {profile.name}
                  </h2>
                  <p style={{ margin: '0 0 12px 0', color: '#666' }}>
                    @{profile.username}
                  </p>

                  <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                    <div>
                      <strong>{followerCount}</strong> Followers
                    </div>
                    <div>
                      <strong>{followingCount}</strong> Following
                    </div>
                  </div>

                  <IonButton
                    fill={isFollowing ? 'outline' : 'solid'}
                    onClick={handleToggleFollow}
                  >
                    <IonIcon icon={isFollowing ? personRemoveOutline : personAddOutline} slot="start" />
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </IonButton>
                </div>
              </div>

              {profile.description && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, color: '#333' }}>{profile.description}</p>
                </div>
              )}

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: '#666', fontSize: '14px' }}>
                  {profile.gender && <div>Gender: {profile.gender}</div>}
                  {profile.age && <div>Age: {profile.age}</div>}
                  {profile.weight_kg && <div>Weight: {profile.weight_kg} kg</div>}
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Posts Section */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
              Posts
            </h3>

            {postsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No posts yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map((post) => (
                  <IonCard key={post.post_id}>
                    <IonCardContent>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ color: '#666', fontSize: '14px' }}>
                          {formatRelativeTime(post.created_at)} • {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {post.route_name && (
                        <h4 style={{ marginBottom: '8px', fontWeight: 'bold' }}>{post.route_name}</h4>
                      )}

                      {post.content && (
                        <p style={{ marginBottom: '12px' }}>{post.content}</p>
                      )}

                      {post.route_id && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <IonIcon icon={locationOutline} style={{ color: '#3b82f6' }} />
                            <div style={{ marginTop: '4px', fontWeight: 'bold' }}>{post.distance_km?.toFixed(1)} km</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Distance</div>
                          </div>
                          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <IonIcon icon={timeOutline} style={{ color: '#10b981' }} />
                            <div style={{ marginTop: '4px', fontWeight: 'bold' }}>{formatDuration(post.duration_seconds)}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Time</div>
                          </div>
                          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <IonIcon icon={speedometerOutline} style={{ color: '#f59e0b' }} />
                            <div style={{ marginTop: '4px', fontWeight: 'bold' }}>{post.average_pace || 'N/A'}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Pace</div>
                          </div>
                          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <IonIcon icon={flameOutline} style={{ color: '#ef4444' }} />
                            <div style={{ marginTop: '4px', fontWeight: 'bold' }}>{post.estimated_calories || 'N/A'}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Calories</div>
                          </div>
                        </div>
                      )}

                      {post.snapshot_url && (
                        <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden' }}>
                          <img src={post.snapshot_url} alt="Route map" style={{ width: '100%', display: 'block' }} />
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#666', fontSize: '14px' }}>
                          <IonIcon icon={heartOutline} /> {post.likes_count} Likes
                        </div>
                        <div style={{ color: '#666', fontSize: '14px' }}>
                          <IonIcon icon={chatbubbleEllipses} /> {post.comments_count} Comments
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ViewProfile;
