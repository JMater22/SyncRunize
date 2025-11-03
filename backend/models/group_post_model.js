import { supabase } from "../utils/supabase.js";

// ✅ Get all posts in a group with likes and comments data
export const getGroupPosts = async (groupId, limit = 20, offset = 0, currentUserId = null) => {
  const { data, error } = await supabase
    .from("group_posts")
    .select(`
      group_post_id,
      content,
      title,
      images,
      created_at,
      user_id,
      users (
        user_id,
        name,
        profile_picture
      )
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Get likes count, comments count, and check if current user liked each post
  const postsWithData = await Promise.all((data || []).map(async (post) => {
    // Get like count
    const { count: likesCount } = await supabase
      .from("group_likes")
      .select("*", { count: "exact", head: true })
      .eq("group_post_id", post.group_post_id);

    // Check if current user liked this post
    let isLiked = false;
    if (currentUserId) {
      const { data: userLike } = await supabase
        .from("group_likes")
        .select("like_id")
        .eq("group_post_id", post.group_post_id)
        .eq("user_id", currentUserId)
        .single();
      
      isLiked = !!userLike;
    }

    // Get comments count
    const { count: commentsCount } = await supabase
      .from("group_comments")
      .select("*", { count: "exact", head: true })
      .eq("group_post_id", post.group_post_id);

    return {
      post_id: post.group_post_id,
      author: post.users?.name || "Unknown User",
      author_id: post.user_id,
      avatar: post.users?.profile_picture || null,
      timestamp: new Date(post.created_at).toLocaleString(),
      content: post.content,
      title: post.title || undefined,
      images: post.images || undefined,
      likes: likesCount || 0,
      comments: commentsCount || 0,
      isLiked: isLiked
    };
  }));

  return postsWithData;
};

// ✅ Create post in group
export const createGroupPost = async (groupId, userId, content, title = null, images = null) => {
  const { data, error } = await supabase
    .from("group_posts")
    .insert([
      {
        group_id: groupId,
        user_id: userId,
        content,
        title,
        images, // Array of image URLs
        created_at: new Date().toISOString()
      },
    ])
    .select(`
      group_post_id,
      content,
      title,
      images,
      created_at,
      user_id,
      users (
        name,
        profile_picture
      )
    `)
    .single();

  if (error) throw error;

  // Format for frontend
  return {
    post_id: data.group_post_id,
    author: data.users?.name || "Unknown User",
    author_id: data.user_id,
    avatar: data.users?.profile_picture || null,
    timestamp: new Date(data.created_at).toLocaleString(),
    content: data.content,
    title: data.title || undefined,
    images: data.images || undefined,
    likes: 0,
    comments: 0,
    isLiked: false
  };
};

// ✅ Update post
export const updateGroupPost = async (postId, content, title = null, images = null) => {
  const { data, error } = await supabase
    .from("group_posts")
    .update({
      content,
      title,
      images
    })
    .eq("group_post_id", postId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ✅ Delete post
export const deleteGroupPost = async (postId) => {
  const { error } = await supabase
    .from("group_posts")
    .delete()
    .eq("group_post_id", postId);

  if (error) throw error;
  return { message: "Group post deleted" };
};