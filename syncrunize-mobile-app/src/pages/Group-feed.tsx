import React, { useState, useEffect, useMemo } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonItem,
  IonAvatar,
  IonImg,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonModal,
  IonTextarea,
  IonActionSheet,
  IonAlert,
  IonToast,
  IonBadge,
  IonList,
  IonLabel,
  IonSpinner,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonInput,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from "@ionic/react";
import {
  heartOutline,
  heart,
  chatbubbleOutline,
  ellipsisVertical,
  exitOutline,
  peopleOutline,
  personAddOutline,
  trophyOutline,
  documentTextOutline,
  searchOutline,
  camera,
  close,
  images as imagesIcon,
  trashOutline
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { GroupsApi, Group, GroupMember, GroupPost } from "../services/groups";
import { UsersApi } from "../services/users";
import { useUser } from "../contexts/UserContext";
import { getAvatarUrl, formatRelativeTime, DEFAULT_AVATAR } from "../lib/utils";
import { supabase } from "../lib/supabaseClient";
import "../theme/Group-feed.css";

interface Post {
  id: number;
  user: string;
  time: string;
  text: string;
  image: string;
}

const GroupFeed: React.FC = () => {
  const history = useHistory();
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser } = useUser();

  // Backend state
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [hasFetchedMembers, setHasFetchedMembers] = useState(false);  // ✅ Track if members loaded
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state for posts
  const [postsOffset, setPostsOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const POSTS_PER_PAGE = 10;

  // UI state
  const [activeTab, setActiveTab] = useState<'posts' | 'leaderboard' | 'members'>('posts');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Group membership state
  const [isUserJoined, setIsUserJoined] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Comments state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<{[key: number]: Array<{id: number, user: string, text: string, time: string}>}>({});

  // Likes state
  const [likes, setLikes] = useState<{[key: number]: {count: number, isLiked: boolean}}>({});

  // Legacy posts state for backward compatibility with notifications
  const [posts, setPosts] = useState<Post[]>([]);

  // Push notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "primary">("primary");
  const [newPostsCount, setNewPostsCount] = useState(0);

  // Leave/Disband Group state
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [showDisbandAlert, setShowDisbandAlert] = useState(false);

  // Leaderboard state
  const [weekFilter, setWeekFilter] = useState<'current' | 'last'>('current');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lastWeekLeaders, setLastWeekLeaders] = useState<{distance: any[], time: any[]}>({distance: [], time: []});
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Invite Members state
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingUsers, setInvitingUsers] = useState<{[userId: number]: boolean}>({});

  // Create Post Modal state
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Image display state
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch group data from backend
  useEffect(() => {
    if (!currentUser) {
      setError('Please log in to view group details.');
      setLoading(false);
      return;
    }

    if (groupId && currentUser) {
      fetchGroupData();
    }
  }, [groupId, currentUser]);

  // ✅ PERFORMANCE FIX: Lazy load members when Members tab is activated
  useEffect(() => {
    if (activeTab === 'members' && !hasFetchedMembers) {
      fetchMembers();
    }
  }, [activeTab, hasFetchedMembers]);

  const fetchGroupData = async () => {
    if (!groupId) {
      setError('Group ID is missing. Please select a group from the Community page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ⚡ PERFORMANCE FIX: Only fetch group and posts initially (lazy load members when tab clicked)
      const [groupData, postsData] = await Promise.all([
        GroupsApi.getGroup(parseInt(groupId)),
        GroupsApi.getGroupPosts(parseInt(groupId), currentUser?.user_id, POSTS_PER_PAGE, 0)
      ]);

      // Set group data
      setGroup(groupData);

      // Set posts with pagination - Parse images if they're JSON strings
      const parsedPosts = (Array.isArray(postsData) ? postsData : []).map(post => {
        let parsedImages: string[] | undefined = post.images as any;

        // Parse images if they're a JSON string
        if (typeof post.images === 'string' && (post.images as string).trim()) {
          try {
            parsedImages = JSON.parse(post.images as string);
          } catch (e) {
            console.error('[GroupFeed] Failed to parse images for post:', post.post_id, e);
            parsedImages = [];
          }
        }

        // Ensure images is an array or undefined
        if (!Array.isArray(parsedImages)) {
          parsedImages = undefined;
        }

        return {
          ...post,
          images: parsedImages
        };
      });

      console.log('[GroupFeed] Fetched posts:', parsedPosts.map(p => ({
        post_id: p.post_id,
        hasImages: !!p.images,
        isArray: Array.isArray(p.images),
        imageCount: p.images?.length
      })));

      setGroupPosts(parsedPosts);
      setPostsOffset(POSTS_PER_PAGE);
      setHasMorePosts(postsData.length === POSTS_PER_PAGE);

      // Initialize likes and comments for posts
      const initialLikes: {[key: number]: {count: number, isLiked: boolean}} = {};
      const initialComments: {[key: number]: Array<{id: number, user: string, text: string, time: string}>} = {};

      postsData.forEach(post => {
        initialLikes[post.post_id] = {
          count: post.likes_count || 0,
          isLiked: post.is_liked || false
        };
        initialComments[post.post_id] = [];
      });

      setLikes(initialLikes);
      setComments(initialComments);

      // ✅ PERFORMANCE FIX: Check membership with lightweight API (doesn't fetch all members)
      if (currentUser) {
        try {
          const membership = await GroupsApi.checkMembership(parseInt(groupId), currentUser.user_id);
          setIsUserJoined(membership.isMember);
          setIsUserAdmin(membership.role === 'admin');
        } catch (err) {
          console.error('Failed to check membership status:', err);
        }
      }

    } catch (err: any) {
      console.error('Failed to fetch group data:', err);
      setError(err.message || 'Failed to load group');
      setGroupPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ PERFORMANCE FIX: Lazy load members only when Members tab is clicked
  const fetchMembers = async () => {
    if (!groupId || hasFetchedMembers) return;

    try {
      setLoadingMembers(true);
      const membersData = await GroupsApi.getGroupMembers(parseInt(groupId));
      setMembers(Array.isArray(membersData) ? membersData : []);

      // Check if current user is a member and their role
      if (currentUser) {
        const userMember = membersData.find(m => m.user_id === currentUser.user_id);
        setIsUserJoined(!!userMember);
        setIsUserAdmin(userMember?.role === 'admin');
      }

      setHasFetchedMembers(true);
    } catch (err: any) {
      console.error('Failed to fetch members:', err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadMorePosts = async (event: any) => {
    if (!groupId || !hasMorePosts) {
      event.target.complete();
      return;
    }

    try {
      console.log('[GroupFeed] Loading more posts...');
      const morePosts = await GroupsApi.getGroupPosts(parseInt(groupId), currentUser?.user_id, POSTS_PER_PAGE, postsOffset);

      // Parse images if they're JSON strings
      const parsedMorePosts = (Array.isArray(morePosts) ? morePosts : []).map(post => {
        let parsedImages: string[] | undefined = post.images as any;

        if (typeof post.images === 'string' && (post.images as string).trim()) {
          try {
            parsedImages = JSON.parse(post.images as string);
          } catch (e) {
            console.error('[GroupFeed] Failed to parse images for post:', post.post_id, e);
            parsedImages = [];
          }
        }

        if (!Array.isArray(parsedImages)) {
          parsedImages = undefined;
        }

        return {
          ...post,
          images: parsedImages
        };
      });

      setGroupPosts(prev => [...prev, ...parsedMorePosts]);
      setPostsOffset(prev => prev + POSTS_PER_PAGE);
      setHasMorePosts(morePosts.length === POSTS_PER_PAGE);

      // Initialize likes/comments for new posts
      morePosts.forEach(post => {
        setLikes(prev => ({
          ...prev,
          [post.post_id]: {
            count: post.likes_count || 0,
            isLiked: post.is_liked || false
          }
        }));
        setComments(prev => ({
          ...prev,
          [post.post_id]: []
        }));
      });
    } catch (err: any) {
      console.error('[GroupFeed] Failed to load more posts:', err);
    } finally {
      event.target.complete();
    }
  };

  const fetchLeaderboard = async (week: 'current' | 'last' = weekFilter) => {
    if (!groupId) return;

    try {
      setLoadingLeaderboard(true);

      // Fetch weekly leaderboard
      const leaderboardData = await GroupsApi.getLeaderboard(parseInt(groupId), week);
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);

      // Fetch last week's leaders for podium display (if the API supports it)
      if (week === 'last') {
        try {
          const leadersData = await GroupsApi.getLastWeekLeaders(parseInt(groupId));
          // Assume leadersData is an array, we'll extract top 3 for distance and time
          const topDistance = Array.isArray(leadersData) ? leadersData.slice(0, 3) : [];
          const topTime = Array.isArray(leadersData) ? leadersData.slice(0, 3) : [];
          setLastWeekLeaders({distance: topDistance, time: topTime});
        } catch (err) {
          console.log('Last week leaders not available');
          setLastWeekLeaders({distance: [], time: []});
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Fetch leaderboard when tab changes to leaderboard
  useEffect(() => {
    if (activeTab === 'leaderboard' && groupId) {
      fetchLeaderboard(weekFilter);
    }
  }, [activeTab, weekFilter, groupId]);

  // Debounced user search for inviting members
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (inviteSearchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const results = await UsersApi.searchUsers(inviteSearchQuery);

          // Filter out current user and existing members
          const memberIds = members.map(m => m.user_id);
          const filtered = Array.isArray(results)
            ? results.filter((u: any) =>
                u.user_id !== currentUser?.user_id &&
                !memberIds.includes(u.user_id)
              )
            : [];

          setSearchResults(filtered);
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [inviteSearchQuery, currentUser, members]);

  const handleInviteUser = async (userId: number) => {
    if (!groupId) return;

    try {
      setInvitingUsers(prev => ({ ...prev, [userId]: true }));

      await GroupsApi.inviteToGroup(parseInt(groupId), userId);

      setToastMessage('User invited successfully!');
      setToastColor('success');
      setShowToast(true);

      // Refresh members list
      fetchMembers();

      // Remove user from search results
      setSearchResults(prev => prev.filter(u => u.user_id !== userId));
    } catch (err: any) {
      console.error('Failed to invite user:', err);
      setToastMessage(err.message || 'Failed to invite user');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setInvitingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Helper function to compress image
  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.8 quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleAddPostImage = async () => {
    if (postImages.length >= 4) {
      setToastMessage('Maximum 4 images allowed');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Web fallback - use file input for desktop browsers
    if (window.navigator.userAgent.includes('Chrome') && !window.navigator.userAgent.includes('Mobile')) {
      console.log('[GroupFeed] Using web file input for desktop');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          // Check file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            setToastMessage('Image too large. Maximum 5MB allowed.');
            setToastColor('danger');
            setShowToast(true);
            return;
          }

          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            // Compress image
            const compressed = await compressImage(dataUrl);
            setPostImages(prev => [...prev, compressed]);
            setToastMessage('Image added successfully');
            setToastColor('success');
            setShowToast(true);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // Mobile - use Camera API
    try {
      console.log('[GroupFeed] Opening camera/gallery picker...');
      const image = await Camera.getPhoto({
        quality: 70, // Reduced quality for smaller file size
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });

      if (image.dataUrl) {
        // Compress image
        const compressed = await compressImage(image.dataUrl);
        setPostImages(prev => [...prev, compressed]);
        setToastMessage('Image added');
        setToastColor('success');
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('[GroupFeed] Error selecting image:', error);
      if (error.message === 'User cancelled photos app') {
        return;
      }
      setToastMessage(error?.message || 'Failed to select image');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleRemovePostImage = (index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Upload images to Supabase Storage
  const uploadImagesToSupabase = async (dataUrls: string[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    console.log('[GroupFeed] Uploading', dataUrls.length, 'images to Supabase...');

    for (let i = 0; i < dataUrls.length; i++) {
      try {
        const dataUrl = dataUrls[i];
        const blob = dataURLtoBlob(dataUrl);

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${random}.jpg`;
        const filePath = `group-posts/${fileName}`;

        console.log(`[GroupFeed] Uploading image ${i + 1}/${dataUrls.length}: ${filePath}`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('assets')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (error) {
          console.error('[GroupFeed] Upload error:', error);
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);

        console.log(`[GroupFeed] Image ${i + 1} uploaded successfully:`, urlData.publicUrl);
        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error('[GroupFeed] Failed to upload image:', error);
        throw new Error(`Failed to upload image ${i + 1}`);
      }
    }

    return uploadedUrls;
  };

  const handleCreatePost = async () => {
    // Validation
    if (!groupId) {
      setToastMessage('Group not found');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!currentUser) {
      setToastMessage('Please log in to create a post');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!postContent.trim()) {
      setToastMessage('Post content is required');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (postContent.trim().length > 5000) {
      setToastMessage('Post content too long (max 5000 characters)');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setIsCreatingPost(true);
      console.log('[GroupFeed] Creating post...', {
        groupId,
        userId: currentUser.user_id,
        contentLength: postContent.trim().length,
        imageCount: postImages.length
      });

      // Upload images to Supabase first if there are any
      let imageUrls: string[] = [];
      if (postImages.length > 0) {
        console.log('[GroupFeed] Uploading', postImages.length, 'images to Supabase...');
        setToastMessage('Uploading images...');
        setToastColor('primary');
        setShowToast(true);

        try {
          imageUrls = await uploadImagesToSupabase(postImages);
          console.log('[GroupFeed] All images uploaded successfully:', imageUrls);
        } catch (error: any) {
          console.error('[GroupFeed] Image upload failed:', error);
          setToastMessage(error.message || 'Failed to upload images');
          setToastColor('danger');
          setShowToast(true);
          setIsCreatingPost(false);
          return;
        }
      }

      const postData = {
        title: postTitle.trim() || undefined,
        content: postContent.trim(),
        images: imageUrls.length > 0 ? imageUrls : undefined,
        userId: currentUser.user_id
      };

      console.log('[GroupFeed] Sending post to backend with image URLs:', imageUrls);

      const newPost = await GroupsApi.createGroupPost(parseInt(groupId), postData);

      console.log('[GroupFeed] Post created successfully:', newPost);

      // Parse images if they're JSON strings
      let parsedImages: string[] | undefined = newPost.images as any;

      if (typeof newPost.images === 'string' && (newPost.images as string).trim()) {
        try {
          parsedImages = JSON.parse(newPost.images as string);
        } catch (e) {
          console.error('[GroupFeed] Failed to parse images for new post:', e);
          parsedImages = [];
        }
      }

      if (!Array.isArray(parsedImages)) {
        parsedImages = undefined;
      }

      const parsedNewPost = {
        ...newPost,
        images: parsedImages
      };

      console.log('[GroupFeed] Parsed new post images:', {
        original: newPost.images,
        parsed: parsedNewPost.images,
        isArray: Array.isArray(parsedNewPost.images)
      });

      // ✅ IMMEDIATELY add the new post to the state (optimistic update)
      setGroupPosts(prev => [parsedNewPost, ...prev]);

      // Initialize likes and comments for the new post
      setLikes(prev => ({
        ...prev,
        [parsedNewPost.post_id]: { count: 0, isLiked: false }
      }));
      setComments(prev => ({
        ...prev,
        [parsedNewPost.post_id]: []
      }));

      setToastMessage('Post created successfully!');
      setToastColor('success');
      setShowToast(true);

      // Close modal and reset
      setShowCreatePostModal(false);
      setPostTitle("");
      setPostContent("");
      setPostImages([]);

      // Don't fetch - trust the optimistic update to avoid cache race condition
      // Post is already in state and saved to DB, will load fresh on next visit
    } catch (err: any) {
      console.error('[GroupFeed] Failed to create post:', err);

      let errorMessage = 'Failed to create post';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (errorMessage.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (errorMessage.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setToastMessage(errorMessage);
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[GroupFeed] FCM Token received:", token);
      // Send token to your backend to register for group activity notifications
      // e.g., sendTokenToBackend(token, 'group_feed', groupId);
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[GroupFeed] Notification received:", notification);
      
      // Handle different types of group notifications
      if (notification.data?.type === 'new_post') {
        setToastMessage(`${notification.data.username} posted in the group`);
        setShowToast(true);
        setNewPostsCount(prev => prev + 1);
        
        // Add new post to feed
        const newPost: Post = {
          id: Date.now(),
          user: notification.data.username || "Group Member",
          time: "Just now",
          text: notification.body || "New post",
          image: notification.data.imageUrl || ChallengePic
        };
        setPosts(prev => [newPost, ...prev]);
        
        // Initialize likes and comments for new post
        setLikes(prev => ({ ...prev, [newPost.id]: { count: 0, isLiked: false } }));
        setComments(prev => ({ ...prev, [newPost.id]: [] }));
      } 
      else if (notification.data?.type === 'new_comment') {
        setToastMessage(`${notification.data.username} commented on a post`);
        setShowToast(true);
        
        // Add comment to the specific post
        const postId = parseInt(notification.data.postId);
        if (postId) {
          const newCommentObj = {
            id: Date.now(),
            user: notification.data.username,
            text: notification.body || "",
            time: "Just now"
          };
          setComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), newCommentObj]
          }));
        }
      }
      else if (notification.data?.type === 'post_like') {
        setToastMessage(`${notification.data.username} liked your post`);
        setShowToast(true);
      }
      else if (notification.data?.type === 'group_announcement') {
        setToastMessage(`Group Admin: ${notification.body}`);
        setShowToast(true);
      }
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[GroupFeed] Notification tapped:", notification);
      
      // Navigate to specific post if postId is provided
      if (notification.notification.data?.postId) {
        const postId = parseInt(notification.notification.data.postId);
        openComments(postId);
      }
      
      // Clear new posts count when user opens the app
      setNewPostsCount(0);
    }
  });

  const handleLike = async (postId: number) => {
    if (!currentUser) {
      setToastMessage('Please log in to like posts');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Optimistic UI update
    const wasLiked = likes[postId]?.isLiked;
    setLikes(prev => ({
      ...prev,
      [postId]: {
        count: wasLiked ? prev[postId].count - 1 : prev[postId].count + 1,
        isLiked: !wasLiked
      }
    }));

    try {
      const response = await GroupsApi.toggleLikeGroupPost(postId);
      // Update with actual count from server
      setLikes(prev => ({
        ...prev,
        [postId]: {
          count: response.likes,
          isLiked: response.liked
        }
      }));
    } catch (error: any) {
      console.error('Failed to like post:', error);
      // Revert optimistic update on error
      setLikes(prev => ({
        ...prev,
        [postId]: {
          count: wasLiked ? prev[postId].count + 1 : prev[postId].count - 1,
          isLiked: wasLiked
        }
      }));
      setToastMessage(error.message || 'Failed to like post');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  // ✅ FIX: Fetch comments when opening modal
  const openComments = async (postId: number) => {
    setSelectedPostId(postId);
    setIsCommentsOpen(true);

    // Fetch actual comments from database
    try {
      console.log('[GroupFeed] Fetching comments for post:', postId);
      const fetchedComments = await GroupsApi.getGroupPostComments(postId);

      // Transform to match local state format with actual timestamps
      const transformedComments = fetchedComments.map((c: any) => ({
        id: c.comment_id,
        user: c.name || c.username || 'Unknown',
        text: c.content,
        time: formatRelativeTime(c.created_at)  // ✅ Use actual timestamp
      }));

      setComments(prev => ({
        ...prev,
        [postId]: transformedComments
      }));

      console.log('[GroupFeed] Loaded', transformedComments.length, 'comments');
    } catch (error) {
      console.error('[GroupFeed] Failed to fetch comments:', error);
      // Keep empty array on error
    }
  };

  const closeComments = () => {
    setIsCommentsOpen(false);
    setNewComment("");
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || selectedPostId === null || !currentUser) {
      return;
    }

    const commentText = newComment.trim();
    setNewComment("");

    try {
      // ✅ FIX: Add comment and re-fetch to get actual timestamp
      await GroupsApi.commentOnGroupPost(selectedPostId, commentText);

      // Re-fetch comments to get the actual timestamp from database
      const fetchedComments = await GroupsApi.getGroupPostComments(selectedPostId);
      const transformedComments = fetchedComments.map((c: any) => ({
        id: c.comment_id,
        user: c.name || c.username || 'Unknown',
        text: c.content,
        time: formatRelativeTime(c.created_at)  // ✅ Use actual timestamp
      }));

      setComments(prev => ({
        ...prev,
        [selectedPostId]: transformedComments
      }));

      // Update comment count in the post
      setGroupPosts(prev => prev.map(post =>
        post.post_id === selectedPostId
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));

      setToastMessage('Comment added successfully!');
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      setToastMessage(error.message || 'Failed to add comment');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !currentUser) return;

    try {
      await GroupsApi.leaveGroup(parseInt(groupId), currentUser.user_id);
      setToastMessage('Left group successfully');
      setToastColor('success');
      setShowToast(true);
      setIsUserJoined(false);

      // Redirect back to community after a short delay
      setTimeout(() => {
        history.push("/community");
      }, 1000);
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      setToastMessage(error.message || 'Failed to leave group');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleDisbandGroup = async () => {
    if (!groupId) return;

    try {
      await GroupsApi.deleteGroup(parseInt(groupId));
      setToastMessage('Group disbanded successfully');
      setToastColor('success');
      setShowToast(true);

      // Redirect back to community after a short delay
      setTimeout(() => {
        history.push("/community");
      }, 1000);
    } catch (error: any) {
      console.error('Failed to disband group:', error);
      setToastMessage(error.message || 'Failed to disband group');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  // Build action sheet buttons conditionally
  const getActionSheetButtons = () => {
    const buttons = [];

    // View Members button
    buttons.push({
      text: 'View Members',
      icon: peopleOutline,
      handler: () => {
        setShowMembersModal(true);
        fetchMembers();
      }
    });

    // Invite Members button (only for admins)
    if (isUserAdmin) {
      buttons.push({
        text: 'Invite Members',
        icon: personAddOutline,
        handler: () => {
          setShowInviteModal(true);
        }
      });
    }

    // Leave Group button (only for members)
    // Disband for admins, Leave for regular members
    if (isUserAdmin) {
      buttons.push({
        text: 'Disband Group',
        role: 'destructive',
        icon: trashOutline,
        handler: () => {
          setShowDisbandAlert(true);
        }
      });
    } else if (isUserJoined) {
      buttons.push({
        text: 'Leave Group',
        role: 'destructive',
        icon: exitOutline,
        handler: () => {
          setShowLeaveAlert(true);
        }
      });
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });

    return buttons;
  };

  // Filter members based on search query (memoized for performance)
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const searchLower = memberSearchQuery.toLowerCase();
      return (
        member.users?.name.toLowerCase().includes(searchLower) ||
        member.users?.username.toLowerCase().includes(searchLower)
      );
    });
  }, [members, memberSearchQuery]);

  return (
    <IonPage className="group-feed-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" />
          </IonButtons>
          <IonTitle>
            {group?.name || 'Group Feed'}
            {newPostsCount > 0 && (
              <IonBadge color="danger" style={{ marginLeft: '8px', verticalAlign: 'super' }}>
                {newPostsCount}
              </IonBadge>
            )}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading group...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <IonButton onClick={() => fetchGroupData()} size="small" color="success">
              Retry
            </IonButton>
          </div>
        ) : !isUserJoined && !isUserAdmin ? (
          // Show join prompt for non-members - they cannot access group content
          <div className="feed-tab">
            {/* Group Info Card */}
            {group && (
              <IonCard className="group-info-card">
                <IonCardContent>
                  <h2>
                    {group.name}
                  </h2>
                  <p>
                    {group.description}
                  </p>
                  <div className="group-meta">
                    <span>{group.member_count || members.length} members</span>
                    {group.location && <span>📍 {group.location}</span>}
                    <span>{group.privacy ? '🔒 Private' : '🌐 Public'}</span>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Join Prompt - User must join to access content */}
            <IonCard style={{ marginTop: '24px', textAlign: 'center', background: '#1a1a1a' }}>
              <IonCardContent style={{ padding: '48px 24px' }}>
                <IonIcon
                  icon={peopleOutline}
                  style={{ fontSize: '80px', color: '#84cc16', marginBottom: '24px' }}
                />
                <h2 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: '0 0 12px 0' }}>
                  Join to Access Group Content
                </h2>
                <p style={{ color: '#999999', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                  You need to be a member to view posts, leaderboards, and interact with this group.
                </p>
                <IonButton
                  expand="block"
                  color="success"
                  size="large"
                  onClick={async () => {
                    try {
                      if (!groupId || !currentUser) return;
                      await GroupsApi.joinGroup(parseInt(groupId));
                      setToastMessage('Successfully joined the group!');
                      setToastColor('success');
                      setShowToast(true);
                      // Refresh group data to update membership status
                      fetchGroupData();
                    } catch (err: any) {
                      console.error('Failed to join group:', err);
                      setToastMessage(err.message || 'Failed to join group');
                      setToastColor('danger');
                      setShowToast(true);
                    }
                  }}
                  style={{
                    '--border-radius': '12px',
                    fontWeight: '700',
                    fontSize: '16px',
                    height: '48px'
                  }}
                >
                  <IonIcon icon={personAddOutline} slot="start" />
                  Join Group
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        ) : (
          <div className="feed-tab">
            {/* Group Info Card - Only visible to members */}
            {group && (
              <IonCard className="group-info-card">
                <IonCardContent>
                  <h2>
                    {group.name}
                  </h2>
                  <p>
                    {group.description}
                  </p>
                  <div className="group-meta">
                    <span>{group.member_count || members.length} members</span>
                    {group.location && <span>📍 {group.location}</span>}
                    <span>{group.privacy ? '🔒 Private' : '🌐 Public'}</span>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Tab Navigation - Only visible to members */}
            <IonSegment
              value={activeTab}
              onIonChange={(e) => setActiveTab(e.detail.value as 'posts' | 'leaderboard' | 'members')}
            >
              <IonSegmentButton value="posts">
                <IonIcon icon={documentTextOutline} />
                <IonLabel>Posts</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="leaderboard">
                <IonIcon icon={trophyOutline} />
                <IonLabel>Leaderboard</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="members">
                <IonIcon icon={peopleOutline} />
                <IonLabel>Members</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <>
                {/* Post Creation Input - Only shown if user has joined */}
                {isUserJoined && (
                  <IonCard
                    className="post-input-card"
                    onClick={() => setShowCreatePostModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <IonItem lines="none">
                      <IonAvatar slot="start">
                        <img src={getAvatarUrl(currentUser?.profile_picture)} alt="You" />
                      </IonAvatar>
                      <div style={{
                        flex: 1,
                        padding: '12px',
                        color: '#999999',
                        fontSize: '15px'
                      }}>
                        What's on your mind?
                      </div>
                    </IonItem>
                  </IonCard>
                )}

                {/* Feed Posts from Backend */}
                <div className="feed-posts">
                  {groupPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <IonIcon icon={documentTextOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
                      <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '18px' }}>No Posts Yet</h3>
                      <p style={{ color: '#999999', margin: 0, fontSize: '14px' }}>
                        {isUserJoined ? 'Be the first to share something with the group!' : 'Join the group to see posts.'}
                      </p>
                    </div>
                  ) : (
                    groupPosts.map((post) => (
                      <IonCard key={post.post_id} className="post-card">
                        <IonCardContent style={{ padding: '16px' }}>
                          <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                            <IonAvatar style={{ width: '44px', height: '44px' }}>
                              <img
                                src={getAvatarUrl((post as any).author_avatar || (post as any).users?.profile_picture)}
                                alt={post.author_name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = DEFAULT_AVATAR;
                                }}
                              />
                            </IonAvatar>
                            <div className="user-info" style={{ flex: 1 }}>
                              <div className="username" style={{fontWeight: '700', color: '#ffffff', fontSize: '15px', marginBottom: '2px'}}>
                                {post.author_name || (post as any).users?.name || 'Unknown User'}
                              </div>
                              <div className="timestamp" style={{fontSize: '13px', color: '#999999'}}>
                                {formatRelativeTime(post.created_at)}
                              </div>
                            </div>
                          </div>

                          {post.title && (
                            <h3 style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '17px', fontWeight: '700' }}>
                              {post.title}
                            </h3>
                          )}
                          <p className="post-text" style={{ color: '#ffffff', fontSize: '15px', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                            {post.content}
                          </p>

                          {/* Multi-image display (up to 4 images in grid) */}
                          {post.images && Array.isArray(post.images) && post.images.length > 0 && (
                            <div
                              className={`post-images-grid ${
                                post.images.length === 1 ? 'single-image' :
                                post.images.length === 2 ? 'two-images' :
                                post.images.length === 3 ? 'three-images' :
                                'four-plus-images'
                              }`}
                              style={{
                                display: 'grid',
                                gap: '4px',
                                marginBottom: '12px',
                                gridTemplateColumns: post.images.length === 1 ? '1fr' :
                                                   post.images.length === 2 ? '1fr 1fr' :
                                                   '1fr 1fr',
                                gridTemplateRows: post.images.length <= 2 ? 'auto' : 'auto auto'
                              }}
                            >
                              {post.images.slice(0, 4).map((img, idx) => {
                                const imageKey = `${post.post_id}-${idx}`;
                                const isLoading = imageLoadingStates[imageKey] ?? true;

                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      position: 'relative',
                                      borderRadius: '12px',
                                      overflow: 'hidden',
                                      backgroundColor: '#1a1a1a',
                                      minHeight: post.images?.length === 1 ? '250px' : '150px',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedImage(img)}
                                  >
                                    {/* Actual Image - Always in DOM so it can load */}
                                    <img
                                      src={img}
                                      alt={`Post image ${idx + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        opacity: isLoading ? 0 : 1,
                                        transition: 'opacity 0.3s ease-in-out'
                                      }}
                                      onLoad={() => {
                                        setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                                      }}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                                      }}
                                    />

                                    {/* Loading Spinner Overlay */}
                                    {isLoading && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#1a1a1a',
                                        zIndex: 1
                                      }}>
                                        <IonSpinner name="crescent" />
                                      </div>
                                    )}

                                    {/* Show "+X more" overlay on 4th image if there are more than 4 images */}
                                    {idx === 3 && post.images && post.images.length > 4 && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        fontSize: '24px',
                                        fontWeight: 'bold'
                                      }}>
                                        +{post.images.length - 4}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="post-actions" style={{
                            display: 'flex',
                            gap: '24px',
                            paddingTop: '12px',
                            borderTop: '1px solid #2a2a2a'
                          }}>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => handleLike(post.post_id)}
                              style={{ '--padding-start': '0', '--padding-end': '0', margin: 0 }}
                            >
                              <IonIcon
                                icon={likes[post.post_id]?.isLiked ? heart : heartOutline}
                                color={likes[post.post_id]?.isLiked ? "danger" : "medium"}
                                style={{ fontSize: '22px', marginRight: '6px' }}
                              />
                              <span style={{ color: '#ffffff', fontSize: '14px' }}>
                                {likes[post.post_id]?.count || 0}
                              </span>
                            </IonButton>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => openComments(post.post_id)}
                              style={{ '--padding-start': '0', '--padding-end': '0', margin: 0 }}
                            >
                              <IonIcon
                                icon={chatbubbleOutline}
                                color="medium"
                                style={{ fontSize: '22px', marginRight: '6px' }}
                              />
                              <span style={{ color: '#ffffff', fontSize: '14px' }}>
                                {post.comments_count || 0}
                              </span>
                            </IonButton>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ))
                  )}

                  {/* Infinite Scroll for Posts */}
                  <IonInfiniteScroll
                    onIonInfinite={loadMorePosts}
                    threshold="100px"
                    disabled={!hasMorePosts}
                  >
                    <IonInfiniteScrollContent
                      loadingSpinner="bubbles"
                      loadingText="Loading more posts..."
                    ></IonInfiniteScrollContent>
                  </IonInfiniteScroll>
                </div>

                {/* Legacy posts from push notifications */}
                {posts.map((post) => (
                  <IonCard key={post.id} className="post-card">
                    <IonCardHeader>
                      <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <IonAvatar>
                          <IonImg src={getAvatarUrl()} />
                        </IonAvatar>
                        <div className="user-info">
                          <div style={{fontWeight: 'bold'}}>{post.user}</div>
                          <div style={{fontSize: '0.85rem', color: '#666'}}>{post.time}</div>
                        </div>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <p className="post-text">{post.text}</p>
                      <IonImg src={post.image} className="post-image" style={{borderRadius: '8px', marginTop: '10px'}} />
                      <div className="post-actions" style={{display: 'flex', gap: '20px', marginTop: '15px', padding: '10px 0', borderTop: '1px solid #eee'}}>
                        <div
                          className="action-item"
                          onClick={() => handleLike(post.id)}
                          style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                        >
                          <IonIcon
                            icon={likes[post.id]?.isLiked ? heart : heartOutline}
                            color={likes[post.id]?.isLiked ? "danger" : "medium"}
                          />
                          <span>{likes[post.id]?.count || 0}</span>
                        </div>
                        <div
                          className="action-item"
                          onClick={() => openComments(post.id)}
                          style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                        >
                          <IonIcon icon={chatbubbleOutline} color="medium" />
                          <span>{comments[post.id]?.length || 0}</span>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div className="leaderboard-section">
                {/* Week Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  <IonButton
                    expand="block"
                    fill={weekFilter === 'current' ? 'solid' : 'outline'}
                    color="success"
                    onClick={() => setWeekFilter('current')}
                    style={{ flex: 1 }}
                  >
                    This Week
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill={weekFilter === 'last' ? 'solid' : 'outline'}
                    color="success"
                    onClick={() => setWeekFilter('last')}
                    style={{ flex: 1 }}
                  >
                    Last Week
                  </IonButton>
                </div>

                {loadingLeaderboard ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <IonSpinner name="crescent" color="success" />
                    <p style={{ color: '#999999', marginTop: '16px' }}>Loading leaderboard...</p>
                  </div>
                ) : (
                  <>
                    {/* Last Week's Top 3 Leaders - Only show for "Last Week" */}
                    {weekFilter === 'last' && lastWeekLeaders.distance.length > 0 && (
                      <>
                        <IonCard className="leaderboard-card">
                          <IonCardHeader style={{ background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', padding: '16px' }}>
                            <h3 style={{ margin: 0, color: '#000000', fontWeight: '700', fontSize: '16px' }}>
                              🏆 Last Week's Distance Leaders
                            </h3>
                          </IonCardHeader>
                          <IonCardContent>
                            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0' }}>
                              {lastWeekLeaders.distance.slice(0, 3).map((leader: any, idx: number) => (
                                <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                  </div>
                                  <IonAvatar style={{ width: '60px', height: '60px', margin: '0 auto 8px' }}>
                                    <img
                                      src={getAvatarUrl(leader.avatar || leader.profile_picture)}
                                      alt={leader.name}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = DEFAULT_AVATAR;
                                      }}
                                    />
                                  </IonAvatar>
                                  <p style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px', margin: '4px 0' }}>
                                    {leader.name}
                                  </p>
                                  <p style={{ color: '#84cc16', fontSize: '16px', fontWeight: '700', margin: '4px 0' }}>
                                    {leader.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </IonCardContent>
                        </IonCard>

                        {lastWeekLeaders.time.length > 0 && (
                          <IonCard className="leaderboard-card">
                            <IonCardHeader style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '16px' }}>
                              <h3 style={{ margin: 0, color: '#000000', fontWeight: '700', fontSize: '16px' }}>
                                ⏱️ Last Week's Time Leaders
                              </h3>
                            </IonCardHeader>
                            <IonCardContent>
                              <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0' }}>
                                {lastWeekLeaders.time.slice(0, 3).map((leader: any, idx: number) => (
                                  <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                    </div>
                                    <IonAvatar style={{ width: '60px', height: '60px', margin: '0 auto 8px' }}>
                                      <img
                                        src={getAvatarUrl(leader.avatar || leader.profile_picture)}
                                        alt={leader.name}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = DEFAULT_AVATAR;
                                        }}
                                      />
                                    </IonAvatar>
                                    <p style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px', margin: '4px 0' }}>
                                      {leader.name}
                                    </p>
                                    <p style={{ color: '#f59e0b', fontSize: '16px', fontWeight: '700', margin: '4px 0' }}>
                                      {leader.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </IonCardContent>
                          </IonCard>
                        )}
                      </>
                    )}

                    {/* Full Leaderboard Table */}
                    {leaderboard.length > 0 ? (
                      <IonCard className="leaderboard-card">
                        <IonCardHeader style={{ background: '#1a1a1a', padding: '16px' }}>
                          <h3 style={{ margin: 0, color: '#84cc16', fontWeight: '700', fontSize: '18px' }}>
                            {weekFilter === 'current' ? 'This Week' : 'Last Week'} Rankings
                          </h3>
                        </IonCardHeader>
                        <IonCardContent style={{ padding: 0 }}>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#0a0a0a', borderBottom: '2px solid #2a2a2a' }}>
                                  <th style={{ padding: '12px 8px', textAlign: 'center', color: '#999999', fontSize: '12px', fontWeight: '700' }}>RANK</th>
                                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#999999', fontSize: '12px', fontWeight: '700' }}>ATHLETE</th>
                                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#999999', fontSize: '12px', fontWeight: '700' }}>DISTANCE</th>
                                  <th style={{ padding: '12px 8px', textAlign: 'center', color: '#999999', fontSize: '12px', fontWeight: '700' }}>RUNS</th>
                                  <th style={{ padding: '12px 8px', textAlign: 'right', color: '#999999', fontSize: '12px', fontWeight: '700' }}>LONGEST</th>
                                </tr>
                              </thead>
                              <tbody>
                                {leaderboard.map((entry: any, index: number) => (
                                  <tr key={entry.user_id || index} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                      <span style={{ fontWeight: '700', color: index < 3 ? '#84cc16' : '#ffffff', fontSize: '16px' }}>
                                        {entry.rank || index + 1}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <IonAvatar style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                                          <img
                                            src={getAvatarUrl(entry.avatar || entry.profile_picture)}
                                            alt={entry.name}
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.src = DEFAULT_AVATAR;
                                            }}
                                          />
                                        </IonAvatar>
                                        <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '14px' }}>
                                          {entry.name || 'Unknown'}
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#84cc16', fontWeight: '600', fontSize: '14px' }}>
                                      {entry.distance || '0 km'}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: '#ffffff', fontSize: '14px' }}>
                                      {entry.runs || 0}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ffffff', fontSize: '14px' }}>
                                      {entry.longest || '0 km'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                        <IonIcon icon={trophyOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
                        <h3 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>No Data Yet</h3>
                        <p style={{ color: '#999999', margin: 0 }}>
                          Leaderboard will appear once members start logging runs.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <IonSearchbar
                  value={memberSearchQuery}
                  onIonInput={(e) => setMemberSearchQuery(e.detail.value || '')}
                  placeholder="Search members..."
                  style={{ padding: '8px 0' }}
                />

                {loadingMembers ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <IonSpinner name="crescent" />
                    <p>Loading members...</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <p style={{ color: 'var(--ion-color-medium)' }}>
                      {memberSearchQuery ? 'No members found' : 'No members yet'}
                    </p>
                  </div>
                ) : (
                  <IonList>
                    {filteredMembers.map((member) => (
                      <IonItem key={member.user_id}>
                        <IonAvatar slot="start" style={{ width: '48px', height: '48px' }}>
                          <img
                            src={getAvatarUrl(member.users?.profile_picture)}
                            alt={member.users?.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = DEFAULT_AVATAR;
                            }}
                          />
                        </IonAvatar>
                        <IonLabel>
                          <h2>{member.users?.name || 'Unknown User'}</h2>
                          <p>@{member.users?.username || 'username'}</p>
                          {member.users?.location && (
                            <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                              📍 {member.users.location}
                            </p>
                          )}
                        </IonLabel>
                        <IonBadge
                          slot="end"
                          color={member.role === 'admin' ? 'primary' : 'medium'}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {member.role}
                        </IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </div>
            )}
          </div>
        )}

        {/* Comments Modal */}
        <IonModal isOpen={isCommentsOpen} onDidDismiss={closeComments}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Comments</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeComments}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedPostId && comments[selectedPostId]?.map((comment) => (
              <IonCard key={comment.id}>
                <IonCardContent>
                  <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{comment.user}</div>
                  <div>{comment.text}</div>
                  <div style={{fontSize: '0.85rem', color: '#666', marginTop: '5px'}}>{comment.time}</div>
                </IonCardContent>
              </IonCard>
            ))}
            
            <div style={{position: 'fixed', bottom: '0', left: '0', right: '0', padding: '10px', background: 'black', borderTop: '1px solid #535252ff'}}>
              <IonItem>
                <IonTextarea
                  value={newComment}
                  onIonChange={(e) => setNewComment(e.detail.value || "")}
                  placeholder="Write a comment..."
                  autoGrow
                />
              </IonItem>
              <IonButton color="success" expand="block" onClick={handleAddComment} disabled={!newComment.trim()}>
                Post Comment
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Members Modal */}
        <IonModal isOpen={showMembersModal} onDidDismiss={() => setShowMembersModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Group Members ({members.length})</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMembersModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonSearchbar
              value={memberSearchQuery}
              onIonInput={(e) => setMemberSearchQuery(e.detail.value || '')}
              placeholder="Search members..."
              style={{ padding: '8px' }}
            />

            {loadingMembers ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <IonSpinner name="crescent" />
                <p>Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <p style={{ color: 'var(--ion-color-medium)' }}>
                  {memberSearchQuery ? 'No members found' : 'No members yet'}
                </p>
              </div>
            ) : (
              <IonList>
                {filteredMembers.map((member) => (
                  <IonItem key={member.user_id}>
                    <IonAvatar slot="start" style={{ width: '48px', height: '48px' }}>
                      <img
                        src={getAvatarUrl(member.users?.profile_picture)}
                        alt={member.users?.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_AVATAR;
                        }}
                      />
                    </IonAvatar>
                    <IonLabel>
                      <h2>{member.users?.name || 'Unknown User'}</h2>
                      <p>@{member.users?.username || 'username'}</p>
                      {member.users?.location && (
                        <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                          📍 {member.users.location}
                        </p>
                      )}
                    </IonLabel>
                    <IonBadge
                      slot="end"
                      color={member.role === 'admin' ? 'primary' : 'medium'}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {member.role}
                    </IonBadge>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonContent>
        </IonModal>

        {/* Create Post Modal */}
        <IonModal isOpen={showCreatePostModal} onDidDismiss={() => {
          setShowCreatePostModal(false);
          setPostTitle("");
          setPostContent("");
          setPostImages([]);
        }}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' }}>
              <IonButtons slot="start">
                <IonButton onClick={() => {
                  setShowCreatePostModal(false);
                  setPostTitle("");
                  setPostContent("");
                  setPostImages([]);
                }} style={{ color: '#3b82f6' }}>
                  Cancel
                </IonButton>
              </IonButtons>
              <IonTitle style={{ color: '#ffffff', fontWeight: '700' }}>Create Post</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={handleCreatePost}
                  disabled={!postContent.trim() || isCreatingPost}
                  style={{ color: postContent.trim() ? '#84cc16' : '#666666', fontWeight: '700' }}
                  strong
                >
                  {isCreatingPost ? 'Posting...' : 'Post'}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ '--background': '#000000' }}>
            <div style={{ padding: '16px' }}>
              <IonItem style={{ '--background': '#1a1a1a', '--border-radius': '12px', '--border-color': '#2a2a2a', '--color': '#ffffff', marginBottom: '16px' }}>
                <IonLabel position="stacked" style={{ color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
                  Title (Optional)
                </IonLabel>
                <IonInput
                  value={postTitle}
                  onIonInput={e => setPostTitle(e.detail.value!)}
                  placeholder="Add a title..."
                  maxlength={100}
                  style={{ '--color': '#ffffff', '--placeholder-color': '#666666' }}
                />
              </IonItem>
              <IonText color="medium" style={{ fontSize: '12px', padding: '0 4px', display: 'block', marginTop: '-8px', marginBottom: '16px' }}>
                {postTitle.length}/100 characters
              </IonText>

              <IonItem style={{ '--background': '#1a1a1a', '--border-radius': '12px', '--border-color': '#2a2a2a', '--color': '#ffffff' }}>
                <IonLabel position="stacked" style={{ color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
                  What's on your mind?
                </IonLabel>
                <IonTextarea
                  value={postContent}
                  onIonInput={e => setPostContent(e.detail.value!)}
                  placeholder="Share something with the group..."
                  rows={8}
                  autoGrow
                  style={{ '--color': '#ffffff', '--placeholder-color': '#666666', minHeight: '150px' }}
                />
              </IonItem>

              {/* Image Upload Section */}
              <div style={{ marginTop: '16px' }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  color="success"
                  onClick={handleAddPostImage}
                  disabled={postImages.length >= 4}
                  style={{ '--border-width': '2px' }}
                >
                  <IonIcon slot="start" icon={imagesIcon} />
                  Add Images ({postImages.length}/4)
                </IonButton>

                {/* Image Previews */}
                {postImages.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    {postImages.map((image, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #2a2a2a'
                          }}
                        />
                        <IonButton
                          fill="solid"
                          color="danger"
                          size="small"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            '--padding-start': '8px',
                            '--padding-end': '8px',
                            height: '32px',
                            minWidth: '32px'
                          }}
                          onClick={() => handleRemovePostImage(index)}
                        >
                          <IonIcon icon={close} slot="icon-only" />
                        </IonButton>
                      </div>
                    ))}
                  </div>
                )}
                <IonText color="medium" style={{ fontSize: '12px', padding: '8px 4px', display: 'block' }}>
                  You can add up to 4 images
                </IonText>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Invite Members Modal (placeholder for future implementation) */}
        <IonModal isOpen={showInviteModal} onDidDismiss={() => {
          setShowInviteModal(false);
          setInviteSearchQuery("");
          setSearchResults([]);
        }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Invite Members</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => {
                  setShowInviteModal(false);
                  setInviteSearchQuery("");
                  setSearchResults([]);
                }} color="success">
                  Done
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {/* Search Bar */}
              <IonSearchbar
                value={inviteSearchQuery}
                onIonInput={(e) => setInviteSearchQuery(e.detail.value || '')}
                placeholder="Search users by name or username..."
                debounce={0}
                style={{
                  '--background': '#1a1a1a',
                  '--color': '#ffffff',
                  '--placeholder-color': '#999999',
                  '--icon-color': '#84cc16',
                  '--border-radius': '12px',
                  padding: '8px 0'
                }}
              />

              {/* Search Results */}
              <div style={{ marginTop: '16px' }}>
                {isSearching ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <IonSpinner name="crescent" color="success" />
                    <p style={{ color: '#999999', marginTop: '12px' }}>Searching...</p>
                  </div>
                ) : inviteSearchQuery.trim().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <IonIcon icon={searchOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
                    <h3 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>Search for Users</h3>
                    <p style={{ color: '#999999', margin: 0, fontSize: '14px' }}>
                      Enter a name or username to find users to invite to this group.
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <IonIcon icon={personAddOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
                    <h3 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>No Users Found</h3>
                    <p style={{ color: '#999999', margin: 0, fontSize: '14px' }}>
                      Try a different search term.
                    </p>
                  </div>
                ) : (
                  <>
                    <p style={{ color: '#999999', fontSize: '13px', padding: '0 4px 12px 4px', margin: 0 }}>
                      {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    {searchResults.map((user: any) => (
                      <IonCard key={user.user_id} className="member-card" style={{ marginBottom: '12px' }}>
                        <IonItem lines="none">
                          <IonAvatar slot="start" style={{ width: '48px', height: '48px' }}>
                            <img src={getAvatarUrl(user.profile_picture)} alt={user.name} />
                          </IonAvatar>
                          <IonLabel>
                            <h2 style={{ color: '#ffffff', fontWeight: '600', fontSize: '15px', margin: '0 0 4px 0' }}>
                              {user.name}
                            </h2>
                            <p style={{ color: '#999999', fontSize: '13px', margin: '0 0 2px 0' }}>
                              @{user.username || 'user'}
                            </p>
                            {user.location && (
                              <p style={{ color: '#666666', fontSize: '12px', margin: '2px 0 0 0' }}>
                                📍 {user.location}
                              </p>
                            )}
                          </IonLabel>
                          <IonButton
                            slot="end"
                            color="success"
                            size="small"
                            onClick={() => handleInviteUser(user.user_id)}
                            disabled={invitingUsers[user.user_id]}
                            style={{ '--border-radius': '8px', textTransform: 'none' }}
                          >
                            {invitingUsers[user.user_id] ? (
                              <>
                                <IonSpinner name="crescent" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                Inviting...
                              </>
                            ) : (
                              <>
                                <IonIcon icon={personAddOutline} slot="start" />
                                Invite
                              </>
                            )}
                          </IonButton>
                        </IonItem>
                      </IonCard>
                    ))}
                  </>
                )}
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Action Sheet for Group Options */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={getActionSheetButtons()}
        />

        {/* Leave Group Confirmation Alert */}
        <IonAlert
          isOpen={showLeaveAlert}
          onDidDismiss={() => setShowLeaveAlert(false)}
          header="Leave Group"
          message="Are you sure you want to leave this group? You won't be able to see posts or participate anymore."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Leave',
              role: 'destructive',
              handler: handleLeaveGroup
            }
          ]}
        />

        {/* Disband Group Confirmation Alert */}
        <IonAlert
          isOpen={showDisbandAlert}
          onDidDismiss={() => setShowDisbandAlert(false)}
          header="Disband Group"
          message="Are you sure you want to disband this group? This action cannot be undone. All posts, members, and data will be permanently deleted."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Disband',
              role: 'destructive',
              handler: handleDisbandGroup
            }
          ]}
        />

        {/* Toast for Notifications and Actions */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastColor}
        />

        {/* Full-screen Image Modal */}
        <IonModal
          isOpen={!!selectedImage}
          onDidDismiss={() => setSelectedImage(null)}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: '#000000'
            }}
          >
            <IonButton
              fill="clear"
              color="light"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '30px',
                zIndex: 10
              }}
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </IonButton>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full-screen view"
                style={{
                  objectFit: 'contain',
                  maxHeight: '100%',
                  maxWidth: '100%'
                }}
              />
            )}
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default GroupFeed;
