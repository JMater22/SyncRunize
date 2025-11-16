import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Post = {
  post_id: number;
  title?: string | null;
  content?: string | null;
  body?: string | null; // fallback if body field is used
  user_id: number;
  created_at: string;
  author?: {
    user_id: number;
    username?: string | null;
    name?: string | null;
    profile_picture?: string | null;
  } | null;
};

// Displays a single post by id. Expects backend route GET /api/posts/:id
const ViewPost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const base = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || '/api';
        const res = await fetch(`${base}/posts/${postId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (active) setPost(data);
      } catch (err) {
        console.error("[ViewPost] load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (postId) load();
    return () => { active = false; };
  }, [postId]);

  if (loading) return <div style={{ padding: 16 }}>Loading post…</div>;
  if (!post) return <div style={{ padding: 16 }}>Post not found.</div>;

  const title = post.title || `Post #${post.post_id}`;
  const body = post.content ?? post.body ?? "";
  const authorName = post.author?.username || post.author?.name || `User ${post.user_id}`;

  return (
    <div style={{ padding: 16 }}>
      <h2>{title}</h2>
      <div style={{ color: "#666", marginBottom: 8 }}>
        By {authorName} • {new Date(post.created_at).toLocaleString()}
      </div>
      <div>{body}</div>
    </div>
  );
};

export default ViewPost;
