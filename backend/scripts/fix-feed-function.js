/**
 * Fix Feed Function - Update get_feed_optimized to show public posts from all users
 *
 * This script updates the get_feed_optimized function to:
 * 1. Show ALL public posts (from anyone)
 * 2. Show private posts from followed users
 * 3. Show own posts (all visibility)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../utils/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL = `
CREATE OR REPLACE FUNCTION get_feed_optimized(
  p_user_id INTEGER,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  post_id INTEGER,
  user_id INTEGER,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  route_id INTEGER,
  route_name VARCHAR,
  distance_km NUMERIC,
  duration_seconds INTEGER,
  average_pace NUMERIC,
  estimated_calories NUMERIC,
  snapshot_url TEXT,
  visibility VARCHAR,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  likes_count BIGINT,
  comments_count BIGINT,
  is_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.post_id,
    p.user_id,
    p.content,
    p.image_url,
    p.created_at,
    p.updated_at,
    p.route_id,
    p.route_name,
    p.distance_km,
    p.duration_seconds,
    p.average_pace,
    p.estimated_calories,
    p.snapshot_url,
    p.visibility,
    u.name AS author_name,
    u.username AS author_username,
    u.profile_picture AS author_avatar,
    COALESCE(lc.likes_count, 0) AS likes_count,
    COALESCE(cc.comments_count, 0) AS comments_count,
    CASE WHEN ul.like_id IS NOT NULL THEN true ELSE false END AS is_liked
  FROM posts p
  INNER JOIN users u ON p.user_id = u.user_id
  LEFT JOIN (
    SELECT l.post_id, COUNT(*) AS likes_count
    FROM likes l
    GROUP BY l.post_id
  ) lc ON p.post_id = lc.post_id
  LEFT JOIN (
    SELECT c.post_id, COUNT(*) AS comments_count
    FROM comments c
    GROUP BY c.post_id
  ) cc ON p.post_id = cc.post_id
  LEFT JOIN likes ul ON p.post_id = ul.post_id AND ul.user_id = p_user_id
  WHERE
    -- Show ALL public posts (from anyone)
    p.visibility = 'public'
    -- OR show own posts (all visibility)
    OR p.user_id = p_user_id
    -- OR show private posts from followed users
    OR (p.visibility = 'private' AND p.user_id IN (
      SELECT f.followed_id FROM follows f WHERE f.follower_id = p_user_id
    ))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
`;

async function updateFeedFunction() {
  console.log('🔧 Updating get_feed_optimized function...\n');

  try {
    // Execute SQL via Supabase
    const { data, error } = await supabase.rpc('query', {
      query_text: SQL
    });

    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      console.log('\n⚠️  Manual execution required:');
      console.log('   1. Go to: https://hooceemtoyucadhxuevx.supabase.co/project/_/sql');
      console.log('   2. Copy and paste the SQL below:');
      console.log('\n' + '='.repeat(80));
      console.log(SQL);
      console.log('='.repeat(80) + '\n');
      process.exit(1);
    }

    console.log('✅ Successfully updated get_feed_optimized function!');
    console.log('   Feed will now show:');
    console.log('   • ALL public posts (from anyone)');
    console.log('   • Private posts from followed users');
    console.log('   • Your own posts (all visibility)\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n📋 SQL to run manually:');
    console.log('='.repeat(80));
    console.log(SQL);
    console.log('='.repeat(80) + '\n');
    process.exit(1);
  }
}

updateFeedFunction();
