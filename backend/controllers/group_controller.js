import * as GroupModel from "../models/group_model.js";
import * as GroupMemberModel from "../models/group_member_model.js";
import { supabase } from "../utils/supabase.js";

// GET all groups with pagination
export const getAllGroups = async (req, res) => {
  try {
    const userId = req.user?.user_id || null;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let groups;
    if (!userId) {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('privacy', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      groups = data;
    } else {
      const joinedIds = await GroupMemberModel.getJoinedGroupIdsByUser(userId);
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .or(`privacy.eq.false,created_by.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      // Show: public OR created_by me OR where I'm a member
      groups = (data || []).filter(g => g.privacy === false || g.created_by === userId || joinedIds.includes(g.group_id));
    }
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
};

// GET group by id
export const getGroupById = async (req, res) => {
  try {
    const group = await GroupModel.getGroupById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.privacy) {
      const userId = req.user?.user_id || null;
      if (!userId) return res.status(403).json({ error: 'Private group. Authentication required.' });
      const isMember = await GroupMemberModel.isGroupMember(group.group_id, userId);
      if (!isMember && group.created_by !== userId) {
        return res.status(403).json({ error: 'Private group. Membership required.' });
      }
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group" });
  }
};

// POST create group
export const createGroup = async (req, res) => {
  try {
    const { name, description, privacy, group_picture } = req.body;
    const userId = parseInt(req.params.userId, 10);
    console.log('[GroupController] createGroup received:', { name, description, privacy, group_picture, userId });
    console.log('[GroupController] Full req.body:', req.body);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: user not authenticated" });
    }

    const defaultPicture = "https://i.pinimg.com/736x/43/a5/4b/43a54b5ac213b39d702b16a503738437.jpg";

    // 1. Create the group
    const group = await GroupModel.createGroup({
      name,
      description,
      privacy,
      group_picture: group_picture || defaultPicture,
      created_by: userId
    });

    // 2. Add the creator as admin in group_members
    await GroupMemberModel.addMember(group.group_id, userId, "admin");

    res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (err) {
    console.error('[GroupController] Error creating group:', err);
    res.status(500).json({ error: "Failed to create group" });
  }
};

// PUT update group
export const updateGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await GroupModel.updateGroup(req.params.groupId, name, description);
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to update group" });
  }
};

// DELETE group
export const deleteGroup = async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId, 10);
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const isAdmin = await GroupMemberModel.isGroupAdmin(groupId, userId);
    if (!isAdmin) return res.status(403).json({ error: 'Only group admin can delete this group' });

    const { data: posts, error: postsErr } = await supabase
      .from('group_posts')
      .select('group_post_id')
      .eq('group_id', groupId);
    if (postsErr) throw postsErr;
    const postIds = (posts || []).map(p => p.group_post_id);
    if (postIds.length) {
      const { error: likesErr } = await supabase.from('group_likes').delete().in('group_post_id', postIds);
      if (likesErr) throw likesErr;
      const { error: commentsErr } = await supabase.from('group_comments').delete().in('group_post_id', postIds);
      if (commentsErr) throw commentsErr;
      const { error: postsDelErr } = await supabase.from('group_posts').delete().in('group_post_id', postIds);
      if (postsDelErr) throw postsDelErr;
    }
    const { error: membersErr } = await supabase.from('group_members').delete().eq('group_id', groupId);
    if (membersErr) throw membersErr;
    const { error: groupErr } = await supabase.from('groups').delete().eq('group_id', groupId);
    if (groupErr) throw groupErr;
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete group" });
  }
};

// Get weekly leaderboard
// GET /api/groups/:groupId/leaderboard/weekly?week=current|last
export const getWeeklyLeaderboard = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { week } = req.query; // "current" or "last"

    const leaderboard = await GroupModel.getWeeklyLeaderboard(
      parseInt(groupId, 10),
      week || "current"
    );

    res.json(leaderboard);
  } catch (err) {
    console.error('[GroupController] Error fetching weekly leaderboard:', err);
    res.status(500).json({ error: "Failed to fetch weekly leaderboard" });
  }
};

// Get last week's leaders (top 3)
// GET /api/groups/:groupId/leaderboard/last-week/leaders
export const getLastWeekLeaders = async (req, res) => {
  try {
    const { groupId } = req.params;

    const leaders = await GroupModel.getLastWeekLeaders(parseInt(groupId, 10));

    res.json(leaders);
  } catch (err) {
    console.error("[GroupController] Error fetching last week's leaders:", err);
    res.status(500).json({ error: "Failed to fetch last week's leaders" });
  }
};
