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
  IonModal
} from "@ionic/react";
import {
  location,
  chatbubbles, 
  imageOutline,
  closeCircle, 
  arrowBack,
  heartOutline,
  heart,
  sendOutline,
  searchOutline, 
  peopleOutline,
  alertCircleOutline,
  lockClosedOutline,
  eyeOutline,
  person,
} from "ionicons/icons";
import { useParams, useLocation, useHistory } from "react-router-dom";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import "./GroupFeed.css";

// Import default images
import DefaultBanner from "../../assets/Banner UP.png";
import DefaultGroupImage from "../../assets/GROUP 1.png";
import { DEFAULT_AVATAR } from "../../constants/avatar";

// ==================== INTERFACES ====================

interface User {
  user_id: number;
  name: string;
  username: string | null;
  profile_picture: string;
  location?: string;
}


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
  author_name: string;
  author_id: number;
  author_avatar: string;
  created_at: string;
  content: string;
  title?: string;
  images?: string[];
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
}

interface Comment {
  comment_id: number;
  user_id: number;
  username: string;
  name: string;
  avatar: string;
  content: string;
  timestamp: string;
}

// ==================== COMPONENT ====================
const GroupFeed: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const routerLocation = useLocation(); 
  const contentRef = useRef<HTMLIonContentElement>(null);
  const history = useHistory();

  // ==================== STATE ====================
  // User & Auth
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("You");
const [currentUserAvatar, setCurrentUserAvatar] = useState<string>(DEFAULT_AVATAR);

  // Group Data
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);

  // Navigation
  const [activeSegment, setActiveSegment] = useState<string>("leaderboard");
  
  // Invite Modal
const [showInviteModal, setShowInviteModal] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<User[]>([]);
const [isSearching, setIsSearching] = useState(false);
const [invitingUsers, setInvitingUsers] = useState<{ [userId: number]: boolean }>({});



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

  // Comments
  const [postComments, setPostComments] = useState<{ [postId: number]: Comment[] }>({});
  const [commentInput, setCommentInput] = useState<{ [postId: number]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: number]: boolean }>({});
  const [isPostingComment, setIsPostingComment] = useState<{ [postId: number]: boolean }>({});

  // Image Loading States
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  //selection of image state

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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


  // ==================== AVATAR HELPER ====================
  const renderAvatar = (src: string | null | undefined, alt: string, className: string) => (
    <img src={src || DEFAULT_AVATAR} alt={alt} className={className} />
  );

  // ==================== ADD SEARCH FUNCTION ====================
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);

      // Get fresh token from Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error("No active session");
      }

      const token = session.access_token;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter out users who are already members
      const memberIds = [...members, ...admins].map(m => m.user_id);
      const filteredResults = response.data.filter(
        (user: User) => !memberIds.includes(user.user_id) && user.user_id !== currentUserId
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      showToastMessage("Failed to search users", "danger");
    } finally {
      setIsSearching(false);
    }
  };


  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);



  // ==================== INVITE USER FUNCTION ====================
const handleInviteUser = async (userId: number) => {
  try {
    setInvitingUsers(prev => ({ ...prev, [userId]: true }));

    await axios.post(
      `${import.meta.env.VITE_API_URL}/group-members/${groupId}/invite`,
      { userId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    showToastMessage("Invitation sent successfully!", "success");

    // Remove user from search results
    setSearchResults(prev => prev.filter(user => user.user_id !== userId));
  } catch (error: any) {
    console.error("Error inviting user:", error);
    showToastMessage(
      error.response?.data?.error || "Failed to send invitation",
      "danger"
    );
  } finally {
    setInvitingUsers(prev => ({ ...prev, [userId]: false }));
  }
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
        setCurrentUserName(user.name || "You");
        setCurrentUserAvatar(user.profile_picture || DEFAULT_AVATAR);
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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/groups/${groupId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        setGroupDetails(response.data);
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
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/group-members/${groupId}/check/${currentUserId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setIsMember(response.data.isMember);
        setUserRole(response.data.role);
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
        const weeklyResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/groups/${groupId}/leaderboard/weekly?week=${leaderboardWeek}`
        );
        setThisWeekLeaderboard(weeklyResponse.data);

        const leadersResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/groups/${groupId}/leaderboard/last-week/leaders`
        );
        setLastWeekLeaders(leadersResponse.data);
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
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/group-members/${groupId}/members`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const allMembers = response.data;
        setAdmins(allMembers.filter((m: Member) => m.role === 'admin'));
        setMembers(allMembers.filter((m: Member) => m.role === 'member'));
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembers();
  }, [groupId, activeSegment, authToken]);

  // ==================== FETCH POSTS ====================
  useEffect(() => {
    if (!groupId || activeSegment !== 'posts' || !currentUserId) return;

    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/group-posts/${groupId}?limit=20&offset=0&userId=${currentUserId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

         // ✅ ADD THIS DEBUG
        console.log('📥 Fetched Posts:', response.data);
        console.log('📸 First Post Images:', response.data[0]?.images);

        setPosts(response.data.map((post: any) => ({
          ...post,
          images: typeof post.images === "string" ? JSON.parse(post.images) : post.images
        })));

      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      }
    };

    fetchPosts();
  }, [groupId, activeSegment, authToken, currentUserId]);

  // ==================== FETCH COMMENTS ====================
  const fetchComments = async (postId: number) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/group-comments/${postId}/comments`
      );
      setPostComments(prev => ({ ...prev, [postId]: response.data || [] }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const toggleComments = async (postId: number) => {
    const isCurrentlyShown = showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: !isCurrentlyShown }));
    
    if (!isCurrentlyShown && !postComments[postId]) {
      await fetchComments(postId);
    }
  };

  // ==================== JOIN GROUP ====================
  const handleJoinGroup = async () => {
    if (!currentUserId || !groupId) return;

    try {
      setIsJoining(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/group-members/${groupId}/addMembers`,
        { userId: currentUserId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

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
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/group-members/${groupId}/members/${currentUserId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

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

  // ==================== DISBAND (DELETE) GROUP [ADMIN ONLY] ====================
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const handleDeleteGroup = async () => {
    if (!currentUserId || !groupId) return;
    if (userRole !== 'admin') return; // Only admin can disband

    try {
      setIsDeletingGroup(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/groups/${groupId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      showToastMessage('Group disbanded successfully', 'success');
      // Redirect back to community after short delay
      setTimeout(() => {
        history.push('/community');
      }, 600);
    } catch (error: any) {
      console.error('Error deleting group:', error);
      showToastMessage(error.response?.data?.error || 'Failed to disband group', 'danger');
    } finally {
      setIsDeletingGroup(false);
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

    // Generate temporary ID for optimistic post (negative to avoid collisions)
    const optimisticPostId = -Date.now();

    // ✅ STEP 1: Create optimistic post - show IMMEDIATELY in UI
    const optimisticPost: any = {
      post_id: optimisticPostId,
      author_name: currentUserName,
      author_id: currentUserId,
      author_avatar: currentUserAvatar,
      created_at: new Date().toISOString(),
      content: postContent.trim(),
      title: postTitle.trim() || undefined,
      images: imagePreviews, // Use preview images temporarily
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      _optimistic: true, // Flag to show loading indicator
    };

    // Add to UI immediately - user sees it instantly!
    setPosts(prev => [optimisticPost as Post, ...prev]);

    // Reset form immediately for better UX
    const savedTitle = postTitle;
    const savedContent = postContent;
    const savedImages = postImages;
    const savedPreviews = imagePreviews;

    setPostTitle('');
    setPostContent('');
    setPostImages([]);
    setImagePreviews([]);
    setShowCreatePost(false);

    try {
      setIsCreatingPost(true);

      // ✅ STEP 2: Upload images in background
      let imageUrls: string[] = [];
      if (savedImages.length > 0) {
        setIsUploadingImages(true);
        imageUrls = await uploadImagesToSupabase(savedImages);
        setIsUploadingImages(false);
      }

      // ✅ STEP 3: Create post in backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/group-posts/${groupId}`,
        {
          userId: currentUserId,
          title: savedTitle.trim() || null,
          content: savedContent.trim(),
          images: imageUrls.length > 0 ? imageUrls : null
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const createdPost = response.data;

      // ✅ STEP 4: Replace optimistic post with real data
      setPosts(prev => prev.map(post =>
        post.post_id === optimisticPostId
          ? {
              ...createdPost,
              images: typeof createdPost.images === 'string'
                ? JSON.parse(createdPost.images)
                : createdPost.images,
            }
          : post
      ));

      showToastMessage("Post created successfully!", "success");

      console.log('[GroupFeed] ✅ Optimistic post creation:', {
        optimisticId: optimisticPostId,
        realId: createdPost.post_id,
        totalTime: 'Instant to user!',
        backgroundUpload: `${imageUrls.length} images`
      });

    } catch (error: any) {
      console.error("Error creating post:", error);

      // ✅ STEP 5: Remove optimistic post on error
      setPosts(prev => prev.filter(post => post.post_id !== optimisticPostId));

      // Restore form data so user doesn't lose their work
      setPostTitle(savedTitle);
      setPostContent(savedContent);
      setPostImages(savedImages);
      setImagePreviews(savedPreviews);
      setShowCreatePost(true);

      showToastMessage(error.response?.data?.error || "Failed to create post", "danger");
    } finally {
      setIsCreatingPost(false);
      setIsUploadingImages(false);
    }
  };

  // When routed with ?focusGroupPost=<id>, refresh and scroll to that post
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const focus = params.get('focusGroupPost');
    if (!focus || !groupId || !currentUserId) return;
    (async () => {
      try {
        // Ensure Posts tab is active so the target element exists in the DOM
        if (activeSegment !== 'posts') {
          setActiveSegment('posts');
        }
        const refreshed = await axios.get(
          `${import.meta.env.VITE_API_URL}/group-posts/${groupId}?limit=20&offset=0&userId=${currentUserId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setPosts(refreshed.data.map((post: any) => ({
          ...post,
          images: typeof post.images === 'string' ? JSON.parse(post.images) : post.images,
        })));
      } catch (e) {
        console.error('Error refreshing posts for focusGroupPost:', e);
      } finally {
        setTimeout(() => {
          const el = document.getElementById(`gpost-${Number(focus)}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    })();
  }, [routerLocation.search, groupId, currentUserId, authToken]);

  // ==================== LIKE POST ====================
  const handleLikePost = async (postId: number) => {
    if (!currentUserId) return;

    // ✅ STEP 1: Optimistic update - instant visual feedback!
    setPosts(prev => prev.map(post => {
      if (post.post_id === postId) {
        return {
          ...post,
          is_liked: !post.is_liked,
          likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
        };
      }
      return post;
    }));

    try {
      // ✅ STEP 2: Sync with backend in background
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/group-likes/${postId}/toggle`,
        { userId: currentUserId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // ✅ STEP 3: Verify optimistic update matches reality
      setPosts(prev => prev.map(post => {
        if (post.post_id === postId) {
          return {
            ...post,
            is_liked: response.data.liked,
            likes_count: response.data.likes
          };
        }
        return post;
      }));

    } catch (error) {
      console.error("Error liking post:", error);

      // ✅ STEP 4: Rollback on error
      setPosts(prev => prev.map(post => {
        if (post.post_id === postId) {
          return {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
          };
        }
        return post;
      }));

      showToastMessage("Failed to like post", "danger");
    }
  };

  // ==================== POST COMMENT ====================
  const handlePostComment = async (postId: number) => {
    if (!currentUserId || !commentInput[postId]?.trim()) return;

    try {
      setIsPostingComment(prev => ({ ...prev, [postId]: true }));

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/group-comments/${postId}/comments`,
        {
          userId: currentUserId,
          content: commentInput[postId].trim()
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Add comment to list
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.data]
      }));

      // Update comment count in post
      setPosts(prev => prev.map(post => {
        if (post.post_id === postId) {
          return { ...post, comments_count: post.comments_count + 1 };
        }
        return post;
      }));

      // Clear input
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
      showToastMessage("Comment posted!", "success");

    } catch (error: any) {
      console.error("Error posting comment:", error);
      showToastMessage(error.response?.data?.error || "Failed to post comment", "danger");
    } finally {
      setIsPostingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // ==================== FILE HANDLING ====================
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

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
      <IonContent ref={contentRef}>
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
                {/* Privacy Indicator */}
                <div
                  className={`privacy-badge ${groupDetails.privacy ? 'private' : 'public'}`}
                  style={{ marginTop: 4 }}
                >
                  <IonIcon icon={groupDetails.privacy ? lockClosedOutline : eyeOutline} />
                  <span>
                    {groupDetails.privacy ? 'Private Group' : 'Public Group'}
                  </span>
                </div>
                {groupDetails.location && (
                  <div className="club-location">
                    <IonIcon icon={location} />
                    <span>{groupDetails.location}</span>
                  </div>
                )}
                <p className="club-description">{groupDetails.description}</p>
              </div>
              {/* Membership/Admin action */}
              {userRole === 'admin' ? (
                <IonButton
                  color="danger"
                  className="join-club-btn"
                  onClick={handleDeleteGroup}
                  disabled={isDeletingGroup}
                >
                  {isDeletingGroup ? <IonSpinner name="crescent" /> : 'Disband Group'}
                </IonButton>
              ) : isMember ? (
                <IonButton
                  className="join-club-btn joined"
                  onClick={handleLeaveGroup}
                  disabled={isJoining}
                >
                  {isJoining ? <IonSpinner name="crescent" /> : 'Joined'}
                </IonButton>
              ) : groupDetails.privacy ? (
                <IonButton className="join-club-btn" disabled>
                  Invite Only
                </IonButton>
              ) : (
                <IonButton
                  className="join-club-btn"
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                >
                  {isJoining ? <IonSpinner name="crescent" /> : 'Join Club'}
                </IonButton>
              )}
            </div>
          </div>
        </div>

        {/* Access Check - Non-members must join first */}
        {!isMember && userRole !== 'admin' ? (
          <div className="club-main-content">
            <div className="access-restricted-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              padding: '48px 24px'
            }}>
              <div style={{
                maxWidth: '500px',
                textAlign: 'center',
                background: '#1a1a1a',
                borderRadius: '16px',
                padding: '48px 32px',
                border: '1px solid #2a2a2a'
              }}>
                <IonIcon
                  icon={peopleOutline}
                  style={{
                    fontSize: '80px',
                    color: '#84cc16',
                    marginBottom: '24px'
                  }}
                />
                <h2 style={{
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: '700',
                  margin: '0 0 16px 0'
                }}>
                  Join to Access Group Content
                </h2>
                <p style={{
                  color: '#999999',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  margin: '0 0 32px 0'
                }}>
                  You need to be a member to view posts, leaderboards, and interact with this group.
                </p>
                <IonButton
                  expand="block"
                  color="success"
                  size="large"
                  onClick={handleJoinGroup}
                  disabled={isJoining || groupDetails?.privacy}
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    height: '48px'
                  }}
                >
                  {isJoining ? (
                    <IonSpinner name="crescent" />
                  ) : groupDetails?.privacy ? (
                    <>
                      <IonIcon icon={lockClosedOutline} slot="start" />
                      Invite Only
                    </>
                  ) : (
                    <>
                      <IonIcon icon={person} slot="start" />
                      Join Group
                    </>
                  )}
                </IonButton>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs - Only visible to members */}
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

            {/* Main Content Area - Only visible to members */}
            <div className="club-main-content">
          <div className="club-content-grid">
            {/* Left Content */}
            <div className="club-left-content">
              {/* ==================== LEADERBOARD ==================== */}
              {activeSegment === "leaderboard" && (
                <>
                 <section className="leaders-section">
                  <h2 className="section-heading">
                    {leaderboardWeek === 'last' ? "Last Week's Leaders" : "This Week's Leaders"}
                  </h2>
                    <div className="leaders-grid">
                      <div className="leader-category">
                        <h3 className="category-title">Distance</h3>
                        {lastWeekLeaders.distance.map((leader, index) => (
                          <div key={`dist-${index}`} className="leader-item">
                            <div className="leader-medal">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </div>
                          {renderAvatar(leader.avatar, leader.name, "leader-avatar")}
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
                          {renderAvatar(leader.avatar, leader.name, "leader-avatar")}
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
                          {renderAvatar(entry.avatar, entry.name, "athlete-avatar")}
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
                      <IonButton 
                        className="invite-btn-inline"
                        onClick={() => setShowInviteModal(true)}
                      >
                        Invite Athletes
                      </IonButton>
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
                          {renderAvatar(admin.users.profile_picture, admin.users.name, "member-avatar")}
                          <div className="member-info">
                            <span className="member-name">{admin.users.name}</span>
                            {admin.users.location && (
                              <span className="member-location">{admin.users.location}</span>
                            )}
                          </div>
                          <span className="member-badge">Admin</span>
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
                          {renderAvatar(member.users.profile_picture, member.users.name, "member-avatar")}
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
                          <img src={currentUserAvatar} alt="You" />
                        </IonAvatar>
                        <div className="creator-name">{currentUserName}</div>
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
                            <div key={post.post_id} id={`gpost-${post.post_id}`} className="post-card">
                              <div className="post-header">
                                {renderAvatar(post.author_avatar, post.author_name, "post-avatar")}
                                <div className="post-author-info">
                                  <span className="post-author-name">{post.author_name}</span>
                                  <span className="post-timestamp">{post.created_at}</span>
                                </div>
                              </div>

                              <div className="post-content">
                                {post.title && <h3 className="post-title">{post.title}</h3>}
                                <p>{post.content}</p>
                                
                                {/* Show images with loading placeholders */}
                                {post.images && Array.isArray(post.images) && post.images.length > 0 && (
                                  <div className={`post-images ${
                                    post.images.length === 1 ? 'single-image' :
                                    post.images.length === 2 ? 'two-images' :
                                    post.images.length === 3 ? 'three-images' :
                                    'four-plus-images'
                                  }`}>
                                    {post.images.slice(0, 4).map((img, idx) => {
                                      const imageKey = `${post.post_id}-${idx}`;
                                      const isLoading = imageLoadingStates[imageKey] ?? true;
                                                                            // DEBUG: Log posts with images
                                      console.log('🎨 RENDER DEBUG:');
                                      posts.forEach(post => {
                                        console.log(`Post ${post.post_id}:`, {
                                          hasImages: !!post.images,
                                          isArray: Array.isArray(post.images),
                                          length: post.images?.length,
                                          images: post.images
                                        });
                                      });
                                      return (
                                        <div 
                                          key={idx} 
                                          className={`post-image-container ${idx === 3 && post.images && post.images.length > 4 ? 'post-image-overlay' : ''}`}
                                          data-count={post.images && post.images.length > 4 ? `+${post.images.length - 4}` : ''}
                                        >
                                          {/* Loading Placeholder */}
                                          {isLoading && (
                                            <div className="post-image-placeholder">
                                              <IonSpinner name="crescent" />
                                            </div>
                                          )}
                                          
                                          {/* Actual Image */}
                                          <img 
                                            src={img} 
                                            alt={`${post.title || 'Post'} - Image ${idx + 1}`} 
                                            className="post-image"
                                            style={{ display: isLoading ? 'none' : 'block' }}
                                            onLoad={() => {
                                              setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                                            }}
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.src = DefaultBanner;
                                              setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                                            }}
                                            onClick={() => setSelectedImage(img)}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>


                              <div className="post-footer">
                                <div className="post-stats">
                                  <span className="kudos-text">
                                    {post.likes_count} {post.likes_count === 1 ? 'Like' : 'Likes'} · {post.comments_count} {post.comments_count === 1 ? 'Comment' : 'Comments'}
                                  </span>
                                </div>

                                <div className="post-actions">
                                  <button
                                    className={`post-action-btn ${post.is_liked ? 'liked' : ''}`}
                                    onClick={() => handleLikePost(post.post_id)}
                                  >
                                    <IonIcon icon={post.is_liked ? heart : heartOutline} />
                                    <span>{post.is_liked ? 'Liked' : 'Like'}</span>
                                  </button>
                                  <button
                                    className="post-action-btn"
                                    onClick={() => toggleComments(post.post_id)}
                                  >
                                    <IonIcon icon={chatbubbles} />
                                    <span>Comment</span>
                                  </button>
                                </div>
                              </div>

                              {/* Comments Section */}
                              {showComments[post.post_id] && (
                                <div className="comments-section">
                                  {postComments[post.post_id]?.map((comment) => (
                                    <div key={comment.comment_id} className="comment-item">
                                      {renderAvatar(comment.avatar, comment.name, "comment-avatar")}
                                      <div className="comment-content">
                                        <div className="comment-header">
                                          <span className="comment-author">{comment.name}</span>
                                          <span className="comment-timestamp">{comment.timestamp}</span>
                                        </div>
                                        <p className="comment-text">{comment.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Add Comment */}
                              {isMember && (
                                <div className="add-comment-section">
                                  <img src={currentUserAvatar} alt="You" className="comment-avatar" />
                                  <input 
                                    type="text" 
                                    placeholder="Add a comment..." 
                                    className="comment-input"
                                    value={commentInput[post.post_id] || ''}
                                    onChange={(e) => setCommentInput(prev => ({ ...prev, [post.post_id]: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment(post.post_id)}
                                    disabled={isPostingComment[post.post_id]}
                                  />
                                  <button 
                                    className="comment-post-btn"
                                    onClick={() => handlePostComment(post.post_id)}
                                    disabled={isPostingComment[post.post_id] || !commentInput[post.post_id]?.trim()}
                                  >
                                    {isPostingComment[post.post_id] ? (
                                      <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />
                                    ) : (
                                      <IonIcon icon={sendOutline} />
                                    )}
                                  </button>
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
                <IonButton 
                  className="invite-btn" 
                  expand="block"
                  onClick={() => setShowInviteModal(true)}
                >
                  Invite Athletes
                </IonButton>
              </div>

              <div className="members-card">
                <h3 className="members-count">
                  {groupDetails.member_count || 0} {groupDetails.member_count === 1 ? 'member' : 'members'}
                </h3>
                <div className="members-avatars">
                  {members.slice(0, 3).map((member, idx) => (
                    <img
                      key={idx}
                      src={member.users.profile_picture || DEFAULT_AVATAR}
                      alt={member.users.name}
                    />
                  ))}
                  {members.length > 3 && (
                    <span className="more-members-text">
                      and {members.length - 3} others
                    </span>
                  )}
                </div>
                {isMember && userRole !== 'admin' && (
                  <IonButton 
                    className="leave-btn" 
                    expand="block" 
                    onClick={handleLeaveGroup}
                    disabled={isJoining}
                  >
                    {isJoining ? <IonSpinner name="crescent" /> : "Leave Club"}
                  </IonButton>
                )}
                {isMember && userRole === 'admin' && (
                  <IonButton 
                    color="danger"
                    className="leave-btn" 
                    expand="block" 
                    onClick={handleDeleteGroup}
                    disabled={isDeletingGroup}
                  >
                    {isDeletingGroup ? <IonSpinner name="crescent" /> : "Disband Club (Admin)"}
                  </IonButton>
                )}
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />

        {/* Upload Progress Overlay */}
        {isUploadingImages && (
          <div className="upload-progress-overlay">
            <div className="upload-progress-content">
              <IonSpinner name="crescent" className="upload-progress-spinner" />
              <div className="upload-progress-text">Uploading images...</div>
              <div className="upload-progress-subtext">
                Please wait while we upload your images
              </div>
            </div>
          </div>
        )}
      </IonContent>

      <IonModal isOpen={!!selectedImage} onDidDismiss={() => setSelectedImage(null)}>
      <div className="flex items-center justify-center h-full bg-black">
        <IonButton
          fill="clear"
          color="dark"
          className="absolute top-6 right-6 text-3xl"
          onClick={() => setSelectedImage(null)}
        >
          ✕
        </IonButton>
        <img
          src={selectedImage || ""}
          className="object-contain max-h-full max-w-full"
        />
      </div>
    </IonModal>
     
    {/* // ==================== RENDER - ADD MODAL AT THE END ====================
// Add this before the closing </IonPage> tag (after the image modal) */}

      <IonModal
        isOpen={showInviteModal}
        onDidDismiss={() => {
          setShowInviteModal(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
      >
        <IonContent
          ref={contentRef}
          style={{
            '--background': '#0a0a0a',
            '--color': '#ffffff'
          } as React.CSSProperties}
        >
          <div className="invite-modal-container">
            {/* Header */}
            <div className="invite-modal-header">
              <h2>Invite Athletes to Club</h2>
              <IonButton 
                fill="clear" 
                onClick={() => setShowInviteModal(false)}
                className="close-modal-btn"
              >
                <IonIcon icon={closeCircle} />
              </IonButton>
            </div>

            {/* Search Section */}
            <div className="invite-search-section">
              <div className="search-input-wrapper">
                <IonIcon icon={searchOutline} className="search-icon" />
                <IonInput
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onIonInput={(e) => setSearchQuery(e.detail.value || '')}
                  className="invite-search-input"
                />
                {isSearching && (
                  <IonSpinner name="crescent" className="search-spinner" />
                )}
              </div>
              <p className="search-hint">
                Search for athletes to invite to {groupDetails?.name}
              </p>
            </div>

            {/* Search Results */}
            <div className="invite-search-results">
              {!searchQuery && (
                <div className="empty-search-state">
                  <IonIcon icon={peopleOutline} className="empty-search-icon" />
                  <p>Start typing to search for athletes</p>
                </div>
              )}

              {searchQuery && isSearching && (
                <div className="searching-state">
                  <IonSpinner name="crescent" />
                  <p>Searching...</p>
                </div>
              )}

              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="no-results-state">
                  <IonIcon icon={alertCircleOutline} className="no-results-icon" />
                  <p>No athletes found</p>
                  <span>Try a different search term</span>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="results-list">
                  <div className="results-header">
                    <p>{searchResults.length} athlete{searchResults.length !== 1 ? 's' : ''} found</p>
                  </div>
                  
                  {searchResults.map((user) => (
                    <div key={user.user_id} className="user-result-item">
                      {renderAvatar(user.profile_picture, user.name, "user-result-avatar")}
                      <div className="user-result-info">
                        <span className="user-result-name">{user.name}</span>
                        {user.username && (
                          <span className="user-result-username">@{user.username}</span>
                        )}
                        {user.location && (
                          <span className="user-result-location">
                            <IonIcon icon={location} />
                            {user.location}
                          </span>
                        )}
                      </div>
                      <IonButton
                        size="small"
                        onClick={() => handleInviteUser(user.user_id)}
                        disabled={invitingUsers[user.user_id]}
                        className="invite-user-btn"
                      >
                        {invitingUsers[user.user_id] ? (
                          <IonSpinner name="crescent" />
                        ) : (
                          "Invite"
                        )}
                      </IonButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default GroupFeed;




