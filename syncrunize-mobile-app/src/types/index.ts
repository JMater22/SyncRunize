// ========================================
// USER TYPES
// ========================================

export interface User {
  user_id: number;
  auth_id: string;
  email: string;
  name: string;
  username: string;
  profile_picture?: string | null;
  description?: string | null;
  weight_kg?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  age?: number | null;
  location?: string | null;
  activities_visibility?: 'public' | 'private';
  distance_unit?: 'km' | 'mi';
  created_at?: string;
  updated_at?: string;
}

export interface SearchUserResult {
  user_id: number;
  name: string;
  username: string;
  profile_picture?: string;
  location?: string;
}

// ========================================
// POST TYPES
// ========================================

export interface Post {
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

export interface Comment {
  comment_id: number;
  user_id: number;
  post_id?: number;
  group_post_id?: number;
  content: string;
  created_at: string;
  username: string;
  name: string;
  profile_picture?: string;
}

// ========================================
// ROUTE TYPES
// ========================================

export interface Route {
  route_id: number;
  user_id: number;
  route_name: string;
  distance_km: number;
  duration_seconds: number;
  average_pace: string;
  estimated_calories: number;
  route_type: 'run' | 'walk' | 'cycle';
  route_status: 'generated' | 'completed' | 'saved';
  chosen_path: Array<{ lat: number; lng: number }>;
  map_image_url?: string;
  snapshot_url?: string;
  description?: string;
  elevation_gain?: number;
  risk_score?: number;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

// ========================================
// CHALLENGE & BADGE TYPES
// ========================================

export interface Challenge {
  challenge_id: number;
  challenge_name: string;
  challenge_slug: string;
  challenge_description: string;
  challenge_image: string;
  challenge_duration_days: number;
  target_distance_km?: number;
  target_runs?: number;
  badge_name?: string;
  badge_tier?: 'Bronze' | 'Silver' | 'Gold';
  badge_image_url?: string;
  badge_description?: string;
}

export interface UserChallenge {
  user_challenge_id: number;
  user_id: number;
  challenge_id: number;
  challenge_name: string;
  challenge_description: string;
  challenge_image: string;
  challenge_duration_days: number;
  progress_percent: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
}

export interface Badge {
  badge_id: number;
  badge_name: string;
  badge_tier: 'Bronze' | 'Silver' | 'Gold';
  badge_image_url: string;
  badge_description: string;
  earned_at: string;
}

// ========================================
// GROUP TYPES
// ========================================

export interface Group {
  group_id: number;
  name: string;
  description: string;
  location?: string;
  group_picture: string;
  banner_link?: string;
  privacy: boolean; // true = private, false = public
  created_by: number;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  group_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: string;
  users?: {
    name: string;
    username: string;
    profile_picture: string;
    location?: string;
  };
}

export interface GroupPost {
  post_id: number;
  group_id: number;
  user_id: number;
  title?: string;
  content: string;
  images?: string[];
  created_at: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  avatar: string;
  distance: string;
  runs: number;
  longest: string;
  total_time?: string;
}

// ========================================
// FOLLOW TYPES
// ========================================

export interface FollowCounts {
  followers: number;
  following: number;
}

export interface FollowUser {
  user_id: number;
  name: string;
  username: string;
  profile_picture?: string;
  location?: string;
  isFollowedBack?: boolean;
}

// ========================================
// NOTIFICATION TYPES
// ========================================

export interface Notification {
  notification_id: number;
  user_id: number;
  actor_id?: number;
  message: string;
  type: 'follow' | 'like' | 'comment' | 'group_like' | 'group_comment' | 'group_invite' | 'challenge_progress' | 'badge_earned';
  post_id?: number;
  group_post_id?: number;
  group_id?: number;
  challenge_id?: number;
  badge_name?: string;
  badge_image_url?: string;
  like_count?: number;
  comment_count?: number;
  is_read: boolean;
  push_status: string;
  created_at: string;
  actor?: {
    user_id: number;
    name: string;
    username: string;
    profile_picture?: string;
  };
}

// ========================================
// STATS TYPES
// ========================================

export interface UserStats {
  runs_count: number;
  total_distance_km: number;
  total_time_seconds: number;
  total_calories: number;
  average_pace?: string;
  longest_run_km?: number;
}

export interface WeeklyStats {
  today: UserStats;
  week: UserStats;
  month: UserStats;
}

export interface LeaderboardUser {
  rank: number;
  user_id: number;
  name: string;
  username: string;
  profile_picture?: string;
  total_distance_km: number;
  total_runs: number;
  total_time_seconds: number;
}

// ========================================
// HAZARD TYPES
// ========================================

export interface HazardReport {
  report_id: number;
  title: string;
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
  cached_address?: string | null; // Human-readable address from reverse geocoding
  image_url?: string | null;
  reported_at: string;
  severity_weight: number;
  trust_score: number;
  status: string;
  users?: {
    username: string;
    profile_picture?: string | null;
  };
}

export interface SafetyWarning {
  segment?: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  message: string;
  advice: string;
}

export interface SafetyAnalysis {
  warnings: SafetyWarning[];
  stats: {
    total_distance_km: number;
    has_critical_warnings: boolean;
  };
}

// ========================================
// UTILITY TYPES
// ========================================

export type DistanceUnit = 'km' | 'mi';
export type Visibility = 'public' | 'private';
export type RouteType = 'run' | 'walk' | 'cycle';
export type RouteStatus = 'generated' | 'completed' | 'saved';
export type BadgeTier = 'Bronze' | 'Silver' | 'Gold';
export type NotificationType = 'follow' | 'like' | 'comment' | 'group_like' | 'group_comment' | 'group_invite' | 'challenge_progress' | 'badge_earned';
