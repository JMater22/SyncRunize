import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInput,
  IonTextarea,
  IonAvatar,
  IonSpinner,
  IonToast,
} from "@ionic/react";
import { 
  location, 
  chatbubbles, 
  imageOutline, 
  closeCircle, 
  arrowBack,
  heartOutline,
  heart 
} from "ionicons/icons";
import { useParams } from "react-router-dom";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import "./GroupFeed.css";

// Import default images
import DefaultBanner from "../../assets/Banner UP.png";
import DefaultGroupImage from "../../assets/GROUP 1.png";
import DefaultProfileImage from "../../assets/MAN5.png";

// ==================== INTERFACES ====================
interface GroupDetails {
  group_id: number;
  name: string;
  description: string;
  location?: string;
  group_picture: string;
  banner_link?: string;
  privacy: boolean;
  created_by: number;
  member_count?: number;
}

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  avatar: string;
  distance: string;
  runs: number;
  longest: string;
  total_time?: string;
}

interface LastWeekLeader {
  name: string;
  avatar: string;
  value: string;
  user_id: number;
}

interface Member {
  user_id: number;
  role: 'admin' | 'member';
  joined_at: string;
  users: {
    name: string;
    username: string | null;
    profile_picture: string;
    location?: string;
  };
}


interface Post {
  post_id: number;
  author: string;
  author_id: number;
  avatar: string;
  timestamp: string;
  content: string;
  title?: string;
  images?: string[];
  likes: number;
  comments: number;
  isLiked?: boolean;
}

interface Comment {
  comment_id: number;
  user_id: number;
  username: string;
  avatar: string;
  content: string;
  timestamp: string;
}

// ==================== COMPONENT ====================
const GroupFeed: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== STATE ====================
  // User & Auth
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string>("");

  // Group Data
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);

  // Navigation
  const [activeSegment, setActiveSegment] = useState<string>("leaderboard");

  // Leaderboard Data
  const [lastWeekLeaders, setLastWeekLeaders] = useState<{
    distance: LastWeekLeader[];
    time: LastWeekLeader[];
  }>({ distance: [], time: [] });
  const [thisWeekLeaderboard, setThisWeekLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardWeek, setLeaderboardWeek] = useState<'current' | 'last'>('current');

  // Members Data
  const [members, setMembers] = useState<Member[]>([]);
  const [admins, setAdmins] = useState<Member[]>([]);

  // Posts Data
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  // ==================== HELPER FUNCTIONS ====================
  const showToastMessage = (message: string, color: "success" | "danger" | "warning" = "success") => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // ==================== FETCH CURRENT USER ====================
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return;

        const token = session.access_token;
        setAuthToken(token);

        const { data: user } = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCurrentUserId(user.user_id);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // ==================== FETCH GROUP DETAILS ====================
  useEffect(() => {
    if (!groupId) return;

    const fetchGroupDetails = async () => {
      try {
        setIsLoading(true);

        // TODO: Implement this endpoint
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/groups/${groupId}`);
        setGroupDetails(response.data);

        // PLACEHOLDER - Remove when API is ready
        // setGroupDetails({
        //   group_id: parseInt(groupId),
        //   name: "Tarlac City Runners",
        //   description: "Let's Run Tarlakenos",
        //   location: "Tarlac City, Tarlac, Philippines",
        //   group_picture: DefaultGroupImage,
        //   banner_link: "https://hooceemtoyucadhxuevx.supabase.co/storage/v1/object/public/assets/Default-banner/Banner%20UP.png",
        //   privacy: false,
        //   created_by: 1,
        //   member_count: 698
        // });

      } catch (error) {
        console.error("Error fetching group details:", error);
        showToastMessage("Failed to load group details", "danger");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  // ==================== CHECK MEMBERSHIP STATUS ====================
  useEffect(() => {
    if (!groupId || !currentUserId) return;

    const checkMembership = async () => {
      try {
        // TODO: Implement this endpoint
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/group-members/${groupId}/check/${currentUserId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setIsMember(response.data.isMember);
        setUserRole(response.data.role);

        // PLACEHOLDER - Remove when API is ready
        // setIsMember(false);
        // setUserRole(null);

      } catch (error) {
        console.error("Error checking membership:", error);
      }
    };

    checkMembership();
  }, [groupId, currentUserId, authToken]);

  // ==================== FETCH LEADERBOARD ====================
  useEffect(() => {
    if (!groupId || activeSegment !== 'leaderboard') return;

    const fetchLeaderboard = async () => {
      try {
        // TODO: Implement these endpoints
        // Weekly Leaderboard
        // const weeklyResponse = await axios.get(
        //   `${import.meta.env.VITE_API_URL}/groups/${groupId}/leaderboard/weekly?week=${leaderboardWeek}`
        // );
        // setThisWeekLeaderboard(weeklyResponse.data);

        // Last Week's Leaders
        // const leadersResponse = await axios.get(
        //   `${import.meta.env.VITE_API_URL}/groups/${groupId}/leaderboard/last-week/leaders`
        // );
        // setLastWeekLeaders(leadersResponse.data);

        // PLACEHOLDER - Remove when API is ready
        setLastWeekLeaders({
          distance: [
            { user_id: 1, name: "Amir Haha", avatar: DefaultProfileImage, value: "130.5 km" },
            { user_id: 2, name: "Hero Berms", avatar: DefaultProfileImage, value: "70.9 km" },
            { user_id: 3, name: "Carl Tayag", avatar: DefaultProfileImage, value: "66.6 km" },
          ],
          time: [
            { user_id: 4, name: "Jam Losañez", avatar: DefaultProfileImage, value: "96:10:49" },
            { user_id: 1, name: "Amir Haha", avatar: DefaultProfileImage, value: "22:55:10" },
            { user_id: 5, name: "PATRICK JARV", avatar: DefaultProfileImage, value: "7:51:55" },
          ],
        });

        setThisWeekLeaderboard([
          { rank: 1, user_id: 1, name: "Amir Haha", avatar: DefaultProfileImage, distance: "69.9 km", runs: 6, longest: "21.2 km" },
          { rank: 2, user_id: 3, name: "Carl Tayag", avatar: DefaultProfileImage, distance: "49.3 km", runs: 5, longest: "12.3 km" },
          { rank: 3, user_id: 6, name: "Darrell Castro", avatar: DefaultProfileImage, distance: "48.4 km", runs: 4, longest: "18.0 km" },
        ]);

      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboard();
  }, [groupId, activeSegment, leaderboardWeek]);

  // ==================== FETCH MEMBERS ====================
  useEffect(() => {
    if (!groupId || activeSegment !== 'members') return;

    const fetchMembers = async () => {
      try {
        // TODO: Implement this endpoint
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/group-members/${groupId}/members`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const allMembers = response.data;
        setAdmins(allMembers.filter((m: Member) => m.role === 'admin'));
        setMembers(allMembers.filter((m: Member) => m.role === 'member'));

        // PLACEHOLDER - Remove when API is ready
        // setAdmins([
        //   { user_id: 1, name: "Yobs V. Cabrera", username: "yobs", location: "Tarlac City, Tarlac", avatar: DefaultProfileImage, role: 'admin' }
        // ]);
        // setMembers([
        //   { user_id: 2, name: "Aaron Andres", username: "aaron", location: "Mabalacat, Pampanga", avatar: DefaultProfileImage, role: 'member' },
        //   { user_id: 3, name: "Carl Tayag", username: "carl", location: "Tarlac City", avatar: DefaultProfileImage, role: 'member' },
        // ]);

      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembers();
  }, [groupId, activeSegment, authToken]);

  // ==================== FETCH POSTS ====================
  useEffect(() => {
    if (!groupId || activeSegment !== 'posts') return;

    const fetchPosts = async () => {
      try {
        // TODO: Implement this endpoint
        // const response = await axios.get(
        //   `${import.meta.env.VITE_API_URL}/group-posts/${groupId}?limit=20&offset=0`,
        //   { headers: { Authorization: `Bearer ${authToken}` } }
        // );
        // setPosts(response.data);

        // PLACEHOLDER - Remove when API is ready
        setPosts([
          {
            post_id: 1,
            author: "Masao de Guzman",
            author_id: 7,
            avatar: DefaultProfileImage,
            timestamp: "July 9, 2025 at 5:05 PM",
            content: "Hello friends, please join us on August 24.",
            images: [DefaultBanner],
            likes: 18,
            comments: 5,
            isLiked: false
          },
          {
            post_id: 2,
            author: "Vincent Reyla",
            author_id: 8,
            avatar: DefaultProfileImage,
            timestamp: "October 4, 2025 at 7:50 PM",
            content: "Any suggestions here in Tarlac City guys... 😊",
            likes: 8,
            comments: 0,
            isLiked: false
          }
        ]);

      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, [groupId, activeSegment, authToken]);

  // ==================== JOIN GROUP ====================
  const handleJoinGroup = async () => {
    if (!currentUserId || !groupId) return;

    try {
      setIsJoining(true);

      // TODO: Implement this endpoint
      // await axios.post(
      //   `${import.meta.env.VITE_API_URL}/group-members/${groupId}/join`,
      //   { userId: currentUserId },
      //   { headers: { Authorization: `Bearer ${authToken}` } }
      // );

      // PLACEHOLDER - Remove when API is ready
      setIsMember(true);
      setUserRole('member');
      showToastMessage("Successfully joined the group!", "success");

    } catch (error: any) {
      console.error("Error joining group:", error);
      showToastMessage(error.response?.data?.error || "Failed to join group", "danger");
    } finally {
      setIsJoining(false);
    }
  };

  // ==================== LEAVE GROUP ====================
  const handleLeaveGroup = async () => {
    if (!currentUserId || !groupId) return;

    try {
      setIsJoining(true);

      // TODO: Implement this endpoint
      // await axios.delete(
      //   `${import.meta.env.VITE_API_URL}/group-members/${groupId}/leave/${currentUserId}`,
      //   { headers: { Authorization: `Bearer ${authToken}` } }
      // );

      // PLACEHOLDER - Remove when API is ready
      setIsMember(false);
      setUserRole(null);
      showToastMessage("You have left the group", "success");

    } catch (error: any) {
      console.error("Error leaving group:", error);
      showToastMessage(error.response?.data?.error || "Failed to leave group", "danger");
    } finally {
      setIsJoining(false);
    }
  };

  // ==================== UPLOAD IMAGES TO SUPABASE ====================
  const uploadImagesToSupabase = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `group-posts/${fileName}`;

        const { data, error } = await supabase.storage
          .from("assets")
          .upload(filePath, file, { upsert: true });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("assets")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  // ==================== CREATE POST ====================
  const handleCreatePost = async () => {
    if (!currentUserId || !groupId) return;
    if (!postContent.trim() && postImages.length === 0) {
      showToastMessage("Please add content or images", "warning");
      return;
    }

    try {
      setIsCreatingPost(true);

      // Upload images to Supabase if any
      let imageUrls: string[] = [];
      if (postImages.length > 0) {
        setIsUploadingImages(true);
        imageUrls = await uploadImagesToSupabase(postImages);
        setIsUploadingImages(false);
      }

      // TODO: Implement this endpoint
      // const response = await axios.post(
      //   `${import.meta.env.VITE_API_URL}/group-posts/${groupId}`,
      //   {
      //     userId: currentUserId,
      //     title: postTitle.trim() || null,
      //     content: postContent.trim(),
      //     images: imageUrls
      //   },
      //   { headers: { Authorization: `Bearer ${authToken}` } }
      // );

      // PLACEHOLDER - Add post locally
      const newPost: Post = {
        post_id: Date.now(),
        author: "Current User", // Replace with actual user name
        author_id: currentUserId,
        avatar: DefaultProfileImage,
        timestamp: new Date().toLocaleString(),
        content: postContent.trim(),
        title: postTitle.trim() || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        likes: 0,
        comments: 0,
        isLiked: false
      };

      setPosts(prev => [newPost, ...prev]);
      
      // Reset form
      setPostTitle('');
      setPostContent('');
      setPostImages([]);
      setImagePreviews([]);
      setShowCreatePost(false);
      showToastMessage("Post created successfully!", "success");

    } catch (error: any) {
      console.error("Error creating post:", error);
      showToastMessage(error.response?.data?.error || "Failed to create post", "danger");
    } finally {
      setIsCreatingPost(false);
      setIsUploadingImages(false);
    }
  };

  // ==================== LIKE POST ====================
  const handleLikePost = async (postId: number) => {
    if (!currentUserId) return;

    try {
      // TODO: Implement this endpoint
      // const response = await axios.post(
      //   `${import.meta.env.VITE_API_URL}/group-posts/${postId}/like`,
      //   { userId: currentUserId },
      //   { headers: { Authorization: `Bearer ${authToken}` } }
      // );

      // PLACEHOLDER - Toggle like locally
      setPosts(prev => prev.map(post => {
        if (post.post_id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          };
        }
        return post;
      }));

    } catch (error) {
      console.error("Error liking post:", error);
      showToastMessage("Failed to like post", "danger");
    }
  };

  // ==================== FILE HANDLING ====================
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    // Validate file size (max 5MB per image)
    const validFiles = newFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToastMessage(`${file.name} is too large (max 5MB)`, "warning");
        return false;
      }
      return true;
    });

    setPostImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDiscardPost = () => {
    setPostTitle('');
    setPostContent('');
    setPostImages([]);
    setImagePreviews([]);
    setShowCreatePost(false);
  };

  // ==================== RENDER ====================
  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding">
          <div style={{ marginTop: "50%" }}>
            <IonSpinner name="crescent" style={{ width: "50px", height: "50px" }} />
            <p>Loading group...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!groupDetails) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding">
          <p>Group not found</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent>
        {/* Hero Banner */}
        <div className="club-hero-banner">
          <img 
            src={groupDetails.banner_link || DefaultBanner} 
            alt="Club banner" 
            className="hero-image" 
          />
          <div className="club-hero-overlay">
            <div className="club-hero-content">
              <div className="club-avatar">
                <img src={groupDetails.group_picture || DefaultGroupImage} alt="Club logo" />
              </div>
              <div className="club-info">
                <h1 className="club-name">{groupDetails.name}</h1>
                {groupDetails.location && (
                  <div className="club-location">
                    <IonIcon icon={location} />
                    <span>{groupDetails.location}</span>
                  </div>
                )}
                <p className="club-description">{groupDetails.description}</p>
              </div>
              <IonButton
                className={isMember ? "join-club-btn joined" : "join-club-btn"}
                onClick={isMember ? handleLeaveGroup : handleJoinGroup}
                disabled={isJoining}
              >
                {isJoining ? (
                  <IonSpinner name="crescent" />
                ) : isMember ? (
                  "Joined"
                ) : (
                  "Join Club"
                )}
              </IonButton>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="club-navigation">
          <IonSegment
            value={activeSegment}
            onIonChange={(e) => setActiveSegment((e.detail.value as string) || "leaderboard")}
          >
            <IonSegmentButton value="leaderboard">
              <IonLabel>Club Leaderboard</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="members">
              <IonLabel>Members</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="posts">
              <IonLabel>Posts</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Main Content Area */}
        <div className="club-main-content">
          <div className="club-content-grid">
            {/* Left Content */}
            <div className="club-left-content">
              {/* ==================== LEADERBOARD ==================== */}
              {activeSegment === "leaderboard" && (
                <>
                  <section className="leaders-section">
                    <h2 className="section-heading">Last Week's Leaders</h2>
                    <div className="leaders-grid">
                      <div className="leader-category">
                        <h3 className="category-title">Distance</h3>
                        {lastWeekLeaders.distance.map((leader, index) => (
                          <div key={`dist-${index}`} className="leader-item">
                            <div className="leader-medal">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </div>
                            <img src={leader.avatar} alt={leader.name} className="leader-avatar" />
                            <span className="leader-name">{leader.name}</span>
                            <span className="leader-value">{leader.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="leader-category">
                        <h3 className="category-title">Total Running Time</h3>
                        {lastWeekLeaders.time.map((leader, index) => (
                          <div key={`time-${index}`} className="leader-item">
                            <div className="leader-medal">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </div>
                            <img src={leader.avatar} alt={leader.name} className="leader-avatar" />
                            <span className="leader-name">{leader.name}</span>
                            <span className="leader-value">{leader.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* This Week's Leaderboard */}
                  <section className="leaderboard-section">
                    <div className="leaderboard-header">
                      <h2 className="section-heading">This Week's Leaderboard</h2>
                      <div className="week-toggle">
                        <button 
                          className={`week-btn ${leaderboardWeek === 'last' ? 'active' : ''}`}
                          onClick={() => setLeaderboardWeek('last')}
                        >
                          Last Week
                        </button>
                        <button 
                          className={`week-btn ${leaderboardWeek === 'current' ? 'active' : ''}`}
                          onClick={() => setLeaderboardWeek('current')}
                        >
                          This Week
                        </button>
                      </div>
                    </div>

                    <div className="leaderboard-table">
                      <div className="table-header">
                        <div className="th rank-col">Rank</div>
                        <div className="th athlete-col">Athlete</div>
                        <div className="th">Distance ▼</div>
                        <div className="th">Runs</div>
                        <div className="th">Longest ▼</div>
                      </div>

                      {thisWeekLeaderboard.map((entry) => (
                        <div key={entry.rank} className="table-row">
                          <div className="td rank-col">{entry.rank}</div>
                          <div className="td athlete-col">
                            <img src={entry.avatar} alt={entry.name} className="athlete-avatar" />
                            <span className="athlete-name">{entry.name}</span>
                          </div>
                          <div className="td">{entry.distance}</div>
                          <div className="td">{entry.runs}</div>
                          <div className="td">{entry.longest}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* ==================== MEMBERS ==================== */}
              {activeSegment === "members" && (
                <div className="members-content">
                  <div className="invite-section">
                    <div className="invite-header">
                      <h2 className="section-heading">Invite Athletes to This Club</h2>
                      <IonButton className="invite-btn-inline">Invite Athletes</IonButton>
                    </div>
                    <p className="invite-description">
                      The bigger your Club, the more fun you can have. Compare your training,
                      view recent accomplishments, and chat with Club members.
                    </p>
                  </div>

                  <section className="admins-section">
                    <h3 className="subsection-heading">Admins</h3>
                    <div className="members-list">
                      {admins.map((admin) => (
                        <div key={admin.user_id} className="member-item">
                          <img 
                            src={admin.users.profile_picture || DefaultProfileImage} 
                            alt={admin.users.name} 
                            className="member-avatar" 
                          />
                          <div className="member-info">
                            <span className="member-name">{admin.users.name}</span>
                            {admin.users.location && (
                              <span className="member-location">{admin.users.location}</span>
                            )}
                          </div>
                          <span className="member-badge">Owner</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* MEMBERS */}
                  <section className="members-list-section">
                    <h3 className="subsection-heading">Members ({members.length})</h3>
                    <div className="members-list">
                      {members.map((member) => (
                        <div key={member.user_id} className="member-item">
                          <img 
                            src={member.users.profile_picture || DefaultProfileImage} 
                            alt={member.users.name} 
                            className="member-avatar" 
                          />
                          <div className="member-info">
                            <span className="member-name">{member.users.name}</span>
                            {member.users.location && (
                              <span className="member-location">{member.users.location}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                </div>
              )}

              {/* ==================== POSTS ==================== */}
              {activeSegment === "posts" && (
                <div className="posts-content">
                  {showCreatePost ? (
                    <div className="create-post-form">
                      <div className="create-post-header">
                        <IonButton fill="clear" onClick={handleDiscardPost}>
                          Back
                        </IonButton>
                        <h2>Create Post</h2>
                        <IonButton 
                          onClick={handleCreatePost}
                          disabled={
                            isCreatingPost || 
                            isUploadingImages || 
                            (!postContent.trim() && postImages.length === 0)
                          }
                          strong
                        >
                          {isCreatingPost || isUploadingImages ? (
                            <IonSpinner name="crescent" />
                          ) : (
                            "Publish"
                          )}
                        </IonButton>
                      </div>

                      <div className="post-creator-info">
                        <IonAvatar className="creator-avatar">
                          <img src={DefaultProfileImage} alt="You" />
                        </IonAvatar>
                        <div className="creator-name">You</div>
                      </div>

                      <div className="post-form">
                        <IonInput
                          className="post-title-input" 
                          placeholder="Add a title (optional)"
                          value={postTitle}
                          onIonInput={(e) => setPostTitle(e.detail.value || '')}
                          disabled={isCreatingPost}
                        />

                        <IonTextarea
                          className="post-content-input"
                          placeholder="What's going on?"
                          rows={6}
                          value={postContent}
                          onIonInput={(e) => setPostContent(e.detail.value || '')}
                          autoGrow
                          disabled={isCreatingPost}
                        />

                        {imagePreviews.length > 0 && (
                          <div className="image-previews">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="preview-item">
                                <img src={preview} alt={`Preview ${index + 1}`} />
                                <IonButton
                                  className="remove-image-btn"
                                  fill="clear"
                                  size="small"
                                  onClick={() => removeImage(index)}
                                  disabled={isCreatingPost}
                                >
                                  <IonIcon icon={closeCircle} />
                                </IonButton>
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          className={`file-upload-zone ${isDragging ? 'dragging' : ''}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => !isCreatingPost && fileInputRef.current?.click()}
                        >
                          <IonIcon icon={imageOutline} className="upload-icon" />
                          <div className="upload-text">Drag and drop images</div>
                          <div className="upload-subtext">or click to upload (max 5MB each)</div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect(e.target.files)}
                            disabled={isCreatingPost}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isMember && (
                        <div className="create-post-section">
                          <IonButton 
                            className="create-post-btn" 
                            expand="block"
                            onClick={() => setShowCreatePost(true)}
                          >
                            Create a Post
                          </IonButton>
                        </div>
                      )}

                      {!isMember && posts.length === 0 ? (
                        <div className="empty-state">
                          <IonIcon icon={chatbubbles} className="empty-icon" />
                          <p>Join the club to view and create posts</p>
                        </div>
                      ) : (
                        <div className="posts-list">
                          {posts.map((post) => (
                            <div key={post.post_id} className="post-card">
                              <div className="post-header">
                                <img src={post.avatar} alt={post.author} className="post-avatar" />
                                <div className="post-author-info">
                                  <span className="post-author-name">{post.author}</span>
                                  <span className="post-timestamp">{post.timestamp}</span>
                                </div>
                              </div>

                              <div className="post-content">
                                {post.title && <h3 className="post-title">{post.title}</h3>}
                                <p>{post.content}</p>
                                {post.images && post.images.length > 0 && (
                                  <div className="post-images">
                                    {post.images.map((img, idx) => (
                                      <img key={idx} src={img} alt="Post content" className="post-image" />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="post-footer">
                                <div className="post-stats">
                                  <span className="kudos-text">
                                    {post.likes} {post.likes === 1 ? 'Like' : 'Likes'} · {post.comments} {post.comments === 1 ? 'Comment' : 'Comments'}
                                  </span>
                                </div>

                                <div className="post-actions">
                                  <button 
                                    className="post-action-btn"
                                    onClick={() => handleLikePost(post.post_id)}
                                  >
                                    <IonIcon icon={post.isLiked ? heart : heartOutline} />
                                    <span>{post.isLiked ? 'Liked' : 'Like'}</span>
                                  </button>
                                  <button className="post-action-btn">
                                    <IonIcon icon={chatbubbles} />
                                    <span>Comment</span>
                                  </button>
                                </div>
                              </div>

                              {isMember && (
                                <div className="add-comment-section">
                                  <img src={DefaultProfileImage} alt="You" className="comment-avatar" />
                                  <input 
                                    type="text" 
                                    placeholder="Add a comment, @ to mention" 
                                    className="comment-input" 
                                  />
                                  <button className="comment-post-btn">Post</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="club-right-sidebar">
              <div className="invite-card">
                <h3 className="invite-title">Invite Athletes to This Club</h3>
                <IonButton className="invite-btn" expand="block">
                  Invite Athletes
                </IonButton>
              </div>

              <div className="members-card">
                <h3 className="members-count">
                  {groupDetails.member_count || 0} {groupDetails.member_count === 1 ? 'member' : 'members'}
                </h3>
                <div className="members-avatars">
                  {members.slice(0, 3).map((member, idx) => (
                    <img key={idx} src={member.avatar} alt={member.name} />
                  ))}
                  {members.length > 3 && (
                    <span className="more-members-text">
                      and {members.length - 3} others
                    </span>
                  )}
                </div>
                {isMember && (
                  <IonButton 
                    className="leave-btn" 
                    expand="block" 
                    onClick={handleLeaveGroup}
                    disabled={isJoining}
                  >
                    {isJoining ? <IonSpinner name="crescent" /> : "Leave Club"}
                  </IonButton>
                )}
              </div>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default GroupFeed;