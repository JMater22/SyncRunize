// services/notification_service.js
// Handles in-app notifications and future push notifications

import * as NotificationModel from "../models/notification_model.js";
import { createNotificationForPost } from "./createNotificationForPost.js";

/**
 * Create a follow notification
 * @param {number} followedUserId - User who is being followed
 * @param {number} followerUserId - User who followed
 */
export const notifyFollow = async (followedUserId, followerUserId) => {
  try {
    console.log('[Notif.debug] notifyFollow CALLED:', { followedUserId, followerUserId });

    const result = await NotificationModel.createNotification({
      user_id: followedUserId,
      actor_id: followerUserId,
      message: "followed you",
      type: "follow",
      is_read: false,
      push_status: "pending",
    });

    console.log('[Notif.success] notifyFollow:', result);
  } catch (err) {
    console.error("[Notif.error] notifyFollow:", err.message, err);
  }
};

/**
 * Like → notify the post author (not the actor)
 * @param {number} postOwnerId
 * @param {number} likerId
 * @param {number} postId
 */
export const notifyLike = async (postOwnerId, likerId, postId) => {
  try {
    console.log('[Notif.debug] notifyLike CALLED:', { postOwnerId, likerId, postId });
    if (postOwnerId === likerId) {
      console.log('[Notif.debug] Skipping like (self-like).');
      return;
    }
    await createNotificationForPost({ type: 'like', actorId: likerId, postId });
    console.log('[Notif.success] notifyLike DONE');
  } catch (err) {
    console.error("[Notif.error] notifyLike:", err.message, err);
  }
};

/**
 * Comment → notify the post author + previous commenters (exclude actor)
 * @param {number} postOwnerId
 * @param {number} commenterId
 * @param {number} postId
 */
export const notifyComment = async (postOwnerId, commenterId, postId) => {
  try {
    console.log('[Notif.debug] notifyComment CALLED:', { postOwnerId, commenterId, postId });
    await createNotificationForPost({ type: 'comment', actorId: commenterId, postId });
    console.log('[Notif.success] notifyComment DONE');
  } catch (err) {
    console.error("[Notif.error] notifyComment:", err.message);
  }
};

/**
 * Group like → notify the group post author
 */
export const notifyGroupLike = async (postOwnerId, likerId, groupPostId, groupId) => {
  try {
    console.log('[Notif.debug] notifyGroupLike CALLED:', { postOwnerId, likerId, groupPostId, groupId });
    if (postOwnerId === likerId) {
      console.log('[Notif.debug] Skipping group like (self-like).');
      return;
    }
    await createNotificationForPost({ type: 'group_like', actorId: likerId, groupPostId, groupId });
    console.log('[Notif.success] notifyGroupLike DONE');
  } catch (err) {
    console.error("[Notif.error] notifyGroupLike:", err.message);
  }
};

/**
 * Group comment → notify the author + previous commenters (exclude actor)
 */
export const notifyGroupComment = async (postOwnerId, commenterId, groupPostId, groupId) => {
  try {
    await createNotificationForPost({ type: 'group_comment', actorId: commenterId, groupPostId, groupId });
  } catch (err) {
    console.error("[Notif.error] notifyGroupComment:", err.message);
  }
};

/**
 * Create a group invite notification
 * @param {number} invitedUserId - User who is being invited
 * @param {number} groupId - ID of the group
 * @param {string} groupName - Name of the group
 */
export const notifyGroupInvite = async (invitedUserId, groupId, groupName) => {
  try {
    await NotificationModel.createNotification({
      user_id: invitedUserId,
      actor_id: null,
      message: `You've been added to ${groupName}`,
      type: "group_invite",
      group_id: groupId,
      is_read: false,
      push_status: "pending",
    });
  } catch (err) {
    console.error("[Notif.error] notifyGroupInvite:", err.message);
  }
};

/**
 * Challenge completion notification
 */
export const notifyChallengeComplete = async (userId, challengeId, challengeName, badgeImageUrl) => {
  try {
    await NotificationModel.createNotification({
      user_id: userId,
      actor_id: null,
      message: `You completed ${challengeName}!`,
      type: "challenge_progress",
      challenge_id: challengeId,
      badge_image_url: badgeImageUrl,
      is_read: false,
      push_status: "pending",
    });
  } catch (err) {
    console.error("[Notif.error] notifyChallengeComplete:", err.message);
  }
};

/**
 * Badge earned (fanout handled by centralized helper — here it's self only)
 */
export const notifyBadgeEarned = async (userId, badgeName, badgeImageUrl) => {
  try {
    await createNotificationForPost({
      type: 'badge_earned',
      actorId: userId,
      badgeName,
      badgeImageUrl,
    });
  } catch (err) {
    console.error("[Notif.error] notifyBadgeEarned:", err.message);
  }
};
