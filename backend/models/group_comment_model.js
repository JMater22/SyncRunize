import { supabase } from "../utils/supabase.js";

// ✅ Get comments by group post with pagination (with debug logging)
export const getComments = async (groupPostId, limit = 20, offset = 0) => {
  console.log("📥 Getting comments for post:", groupPostId, "limit:", limit, "offset:", offset);

  const { data, error } = await supabase
    .from("group_comments")
    .select(`
      comment_id,
      content,
      created_at,
      updated_at,
      user_id,
      users (
        user_id,
        name,
        username,
        profile_picture
      )
    `)
    .eq("group_post_id", groupPostId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("❌ Supabase error:", error);
    throw error;
  }

  console.log("✅ Raw data from Supabase:", data);
  console.log("📊 Number of comments:", data?.length || 0);

  // Format for frontend
  const formatted = (data || []).map(comment => {
    console.log("🔄 Processing comment:", comment);
    return {
      comment_id: comment.comment_id,
      user_id: comment.user_id,
      username: comment.users?.username || comment.users?.name || "Unknown User",
      name: comment.users?.name || "Unknown User",
      avatar: comment.users?.profile_picture || null,
      content: comment.content,
      timestamp: new Date(comment.created_at).toLocaleString(),
      created_at: comment.created_at,
      updated_at: comment.updated_at
    };
  });

  console.log("✅ Formatted comments:", formatted);
  return formatted;
};

// ✅ Get comment count for a post
export const getCommentCount = async (groupPostId) => {
  console.log("📊 Counting comments for post:", groupPostId);
  
  const { count, error } = await supabase
    .from("group_comments")
    .select("*", { count: "exact", head: true })
    .eq("group_post_id", groupPostId);

  if (error) {
    console.error("❌ Count error:", error);
    throw error;
  }

  console.log("✅ Comment count:", count);
  return count || 0;
};

// ✅ Create comment (with debug logging)
export const createComment = async (groupPostId, userId, content) => {
  console.log("📝 Creating comment:", { groupPostId, userId, content });
  
  const { data, error } = await supabase
    .from("group_comments")
    .insert([{
      group_post_id: groupPostId,
      user_id: userId,
      content: content.trim(),
      created_at: new Date().toISOString()
    }])
    .select(`
      comment_id,
      content,
      created_at,
      user_id,
      users (
        name,
        username,
        profile_picture
      )
    `)
    .single();

  if (error) {
    console.error("❌ Create error:", error);
    throw error;
  }

  console.log("✅ Comment created:", data);

  // Format for frontend
  const formatted = {
    comment_id: data.comment_id,
    user_id: data.user_id,
    username: data.users?.username || data.users?.name || "Unknown User",
    name: data.users?.name || "Unknown User",
    avatar: data.users?.profile_picture || null,
    content: data.content,
    timestamp: new Date(data.created_at).toLocaleString(),
    created_at: data.created_at
  };

  console.log("✅ Formatted comment:", formatted);
  return formatted;
};

// ✅ Update comment
export const updateComment = async (commentId, content) => {
  console.log("✏️ Updating comment:", { commentId, content });
  
  const { data, error } = await supabase
    .from("group_comments")
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("comment_id", commentId)
    .select()
    .single();

  if (error) {
    console.error("❌ Update error:", error);
    throw error;
  }

  console.log("✅ Comment updated:", data);
  return data;
};

// ✅ Delete comment
export const deleteComment = async (commentId) => {
  console.log("🗑️ Deleting comment:", commentId);
  
  const { error } = await supabase
    .from("group_comments")
    .delete()
    .eq("comment_id", commentId);

  if (error) {
    console.error("❌ Delete error:", error);
    throw error;
  }

  console.log("✅ Comment deleted");
  return { message: "Group comment deleted" };
};