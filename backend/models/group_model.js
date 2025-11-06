import { supabase } from "../utils/supabase.js";

// Get all groups
export const getAllGroups = async () => {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get a group by ID with member count
export const getGroupById = async (groupId) => {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("group_id", groupId)
    .single();

  if (error) throw error;

  const { count, error: countError } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (countError) {
    console.error("[GroupModel] Error counting members:", countError);
    return { ...data, member_count: 0 };
  }

  return { ...data, member_count: count || 0 };
};

// Create a new group
export const createGroup = async ({ name, description, privacy, group_picture, created_by }) => {
  console.log('[GroupModel] createGroup args:', { name, description, privacy, group_picture, created_by });
  const banner_link = "https://hooceemtoyucadhxuevx.supabase.co/storage/v1/object/public/assets/Default-banner/Banner%20UP.png";
  const { data, error } = await supabase
    .from("groups")
    .insert([
      {
        name,
        description,
        privacy: Boolean(privacy),
        group_picture: group_picture || "https://i.pinimg.com/736x/43/a5/4b/43a54b5ac213b39d702b16a503738437.jpg",
        created_by,
        banner_link,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update group details
export const updateGroup = async (groupId, name, description) => {
  const { data, error } = await supabase
    .from("groups")
    .update({ name, description })
    .eq("group_id", groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete group
export const deleteGroup = async (groupId) => {
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("group_id", groupId);

  if (error) throw error;
  return { message: "Group deleted successfully" };
};

// Weekly leaderboard
export const getWeeklyLeaderboard = async (groupId, week = "current") => {
  try {
    const now = new Date();
    let startDate, endDate;

    if (week === "current") {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diff - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log('[GroupModel] Leaderboard date range:', { startDate, endDate, week });

    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    const userIds = members.map((m) => m.user_id);

    const { data: routes, error: routesError } = await supabase
      .from("user_routes")
      .select(`
        user_id,
        distance_km,
        duration_seconds,
        users (
          user_id,
          name,
          profile_picture
        )
      `)
      .in("user_id", userIds)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (routesError) throw routesError;
    if (!routes || routes.length === 0) return [];

    const userStats = {};
    routes.forEach((route) => {
      const userId = route.user_id;
      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          name: route.users?.name || "Unknown User",
          avatar: route.users?.profile_picture || null,
          total_distance: 0,
          runs: 0,
          longest_run: 0,
          total_time: 0,
        };
      }
      userStats[userId].total_distance += route.distance_km || 0;
      userStats[userId].runs += 1;
      userStats[userId].total_time += route.duration_seconds || 0;
      if ((route.distance_km || 0) > userStats[userId].longest_run) {
        userStats[userId].longest_run = route.distance_km || 0;
      }
    });

    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.total_distance - a.total_distance)
      .map((user, index) => ({
        rank: index + 1,
        user_id: user.user_id,
        name: user.name,
        avatar: user.avatar,
        distance: `${user.total_distance.toFixed(1)} km`,
        runs: user.runs,
        longest: `${user.longest_run.toFixed(1)} km`,
        total_time: formatDuration(user.total_time),
      }));

    return leaderboard;
  } catch (error) {
    console.error("[GroupModel] Error getting weekly leaderboard:", error);
    throw error;
  }
};

// Last week's leaders (top 3 for distance and time)
export const getLastWeekLeaders = async (groupId) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startDate = new Date(now);
    startDate.setDate(now.getDate() + diff - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    console.log("[GroupModel] Last week's leaders date range:", { startDate, endDate });

    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      return { distance: [], time: [] };
    }

    const userIds = members.map((m) => m.user_id);

    const { data: routes, error: routesError } = await supabase
      .from("user_routes")
      .select(`
        user_id,
        distance_km,
        duration_seconds,
        users (
          user_id,
          name,
          profile_picture
        )
      `)
      .in("user_id", userIds)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (routesError) throw routesError;
    if (!routes || routes.length === 0) {
      return { distance: [], time: [] };
    }

    const userStats = {};
    routes.forEach((route) => {
      const userId = route.user_id;
      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          name: route.users?.name || "Unknown User",
          avatar: route.users?.profile_picture || null,
          total_distance: 0,
          total_time: 0,
        };
      }
      userStats[userId].total_distance += route.distance_km || 0;
      userStats[userId].total_time += route.duration_seconds || 0;
    });

    const distanceLeaders = Object.values(userStats)
      .sort((a, b) => b.total_distance - a.total_distance)
      .slice(0, 3)
      .map((user) => ({
        user_id: user.user_id,
        name: user.name,
        avatar: user.avatar,
        value: `${user.total_distance.toFixed(1)} km`,
      }));

    const timeLeaders = Object.values(userStats)
      .sort((a, b) => b.total_time - a.total_time)
      .slice(0, 3)
      .map((user) => ({
        user_id: user.user_id,
        name: user.name,
        avatar: user.avatar,
        value: formatDuration(user.total_time),
      }));

    return { distance: distanceLeaders, time: timeLeaders };
  } catch (error) {
    console.error("[GroupModel] Error getting last week's leaders:", error);
    throw error;
  }
};

// Helper function to format duration (seconds to HH:MM:SS)
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return "0:00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

