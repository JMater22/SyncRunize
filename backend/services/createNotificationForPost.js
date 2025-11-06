// backend/services/createNotificationForPost.js
// Centralized notification fanout with strong debug logs.
// Always set user_id = recipient, actor_id = performer.

import { supabase } from "../utils/supabase.js";

/**
 * @typedef {(
 *  'like'|
 *  'comment'|
 *  'group_like'|
 *  'group_comment'|
 *  'badge_earned'|
 *  'challenge_progress'|
 *  'system'
 * )} NotificationType
 */

/**
 * @typedef {Object} CreateArgs
 * @property {NotificationType} type
 * @property {number} actorId
 * @property {number=} postId
 * @property {number=} groupPostId
 * @property {number=} groupId
 * @property {string=} badgeName
 * @property {string=} badgeImageUrl
 * @property {string=} messageOverride
 */

export async function createNotificationForPost(args) {
  const {
    type,
    actorId,
    postId,
    groupPostId,
    groupId,
    badgeName,
    badgeImageUrl,
    messageOverride,
  } = args;

  const distinct = (arr) => Array.from(new Set(arr));
  let postAuthorId = null;
  let previousCommenters = [];
  let recipients = [];

  try {
    // Resolve author + prior commenters based on type
    if (type === "like" || type === "comment") {
      if (!postId) throw new Error("postId is required for like/comment");
      const { data: postRow, error: postErr } = await supabase
        .from("posts")
        .select("post_id, user_id")
        .eq("post_id", postId)
        .single();
      if (postErr || !postRow) throw new Error(`Post not found: ${postErr?.message}`);
      postAuthorId = postRow.user_id;

      if (type === "comment") {
        const { data: commentersRows, error: commentersErr } = await supabase
          .from("comments")
          .select("user_id")
          .eq("post_id", postId);
        if (commentersErr) throw new Error(`Commenters fetch failed: ${commentersErr.message}`);
        previousCommenters = distinct((commentersRows || []).map((r) => r.user_id));
      }
    } else if (type === "group_like" || type === "group_comment") {
      if (!groupPostId) throw new Error("groupPostId is required for group_like/group_comment");
      const { data: gpRow, error: gpErr } = await supabase
        .from("group_posts")
        .select("group_post_id, user_id, group_id")
        .eq("group_post_id", groupPostId)
        .single();
      if (gpErr || !gpRow) throw new Error(`Group post not found: ${gpErr?.message}`);
      postAuthorId = gpRow.user_id;
      if (!groupId) args.groupId = gpRow.group_id;

      if (type === "group_comment") {
        const { data: commentersRows, error: commentersErr } = await supabase
          .from("group_comments")
          .select("user_id")
          .eq("group_post_id", groupPostId);
        if (commentersErr) throw new Error(`Group commenters fetch failed: ${commentersErr.message}`);
        previousCommenters = distinct((commentersRows || []).map((r) => r.user_id));
      }
    } else if (type === "badge_earned") {
      postAuthorId = null;
    }

    // Recipients
    if (type === "like") {
      recipients = postAuthorId ? [postAuthorId] : [];
      recipients = recipients.filter((uid) => uid !== actorId);
    } else if (type === "comment") {
      recipients = (postAuthorId ? [postAuthorId] : []).filter((uid) => uid !== actorId);
    } else if (type === "group_like") {
      recipients = postAuthorId ? [postAuthorId] : [];
      recipients = recipients.filter((uid) => uid !== actorId);
    } else if (type === "group_comment") {
      // Author + previous commenters, excluding the actor
      recipients = distinct([postAuthorId, ...previousCommenters])
        .filter(Boolean)
        .filter((uid) => uid !== actorId);
    } else if (type === "badge_earned") {
      recipients = [actorId];
    }

    // Messages
    let defaultMessage = "";
    switch (type) {
      case "like":
        defaultMessage = "liked your post";
        break;
      case "comment":
        defaultMessage = "commented on your post";
        break;
      case "group_like":
        defaultMessage = "liked your group post";
        break;
      case "group_comment":
        defaultMessage = "commented on your group post";
        break;
      case "badge_earned": {
        const raw = (badgeName || "").trim();
        const cleaned = raw.toLowerCase().endsWith(" badge") ? raw.slice(0, -6) : raw;
        defaultMessage = cleaned
          ? `You earned the ${cleaned} badge!`
          : "You earned a new badge!";
        break;
      }
        break;
      case "challenge_progress":
        defaultMessage = "made progress on a challenge";
        break;
      default:
        defaultMessage = "system notification";
    }
    const finalMessage = messageOverride || defaultMessage;

    // Consolidate likes into a single container per post for each recipient
    if ((type === 'like' || type === 'group_like') && recipients.length) {
      const results = [];
      for (const recipientId of recipients) {
        try {
          let existing = null;
          if (type === 'like') {
            const sel = await supabase
              .from('notifications')
              .select('notification_id, like_count')
              .eq('user_id', recipientId)
              .eq('type', 'like')
              .eq('post_id', postId)
              .eq('is_read', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            existing = sel.data || null;
            console.log('[Notif.debug] Like selection (post):', {
              recipientId,
              postId,
              existingId: existing?.notification_id || null,
              existingCount: existing?.like_count || null,
              error: sel.error || null,
            });
          } else {
            const sel = await supabase
              .from('notifications')
              .select('notification_id, like_count')
              .eq('user_id', recipientId)
              .eq('type', 'group_like')
              .eq('group_post_id', groupPostId)
              .eq('is_read', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            existing = sel.data || null;
            console.log('[Notif.debug] Like selection (group):', {
              recipientId,
              groupPostId,
              existingId: existing?.notification_id || null,
              existingCount: existing?.like_count || null,
              error: sel.error || null,
            });
          }

          if (existing) {
            const newCount = (existing.like_count || 1) + 1;
            const msg = type === 'like'
              ? (newCount === 2 ? 'and 1 other liked your post' : `and ${newCount - 1} others liked your post`)
              : (newCount === 2 ? 'and 1 other liked your group post' : `and ${newCount - 1} others liked your group post`);

            const upd = await supabase
              .from('notifications')
              .update({
                actor_id: actorId,
                like_count: newCount,
                message: msg,
                created_at: new Date().toISOString(),
              })
              .eq('notification_id', existing.notification_id)
              .select();
            if (upd.error) {
              console.error('[Notif.error] Update like notification failed:', upd.error);
              throw upd.error;
            }
            results.push(...(upd.data || []));
            console.log('[Notif.success] Updated like notification', existing.notification_id, '->', newCount);
          } else {
            const insPayload = {
              user_id: recipientId,
              actor_id: actorId,
              message: finalMessage,
              type,
              post_id: postId ?? null,
              group_post_id: groupPostId ?? null,
              group_id: groupId ?? null,
              badge_name: badgeName ?? null,
              badge_image_url: badgeImageUrl ?? null,
              like_count: 1,
              is_read: false,
              push_status: 'pending',
            };
            const insRow = await supabase.from('notifications').insert(insPayload).select();
            if (insRow.error) {
              console.error('[Notif.error] Insert like notification failed:', insRow.error, 'payload:', insPayload);
              throw insRow.error;
            }
            results.push(...(insRow.data || []));
            console.log('[Notif.success] Created like notification');
          }
        } catch (e) {
          console.error('[Notif.error] Consolidating like failed for recipient', recipientId, e);
        }
      }
      return results;
    }

    const payloads = (recipients || []).map((recipientId) => ({
      user_id: recipientId,
      actor_id: actorId,
      message: finalMessage,
      type,
      post_id: postId ?? null,
      group_post_id: groupPostId ?? null,
      group_id: groupId ?? null,
      badge_name: badgeName ?? null,
      badge_image_url: badgeImageUrl ?? null,
      is_read: false,
      push_status: "pending",
    }));

    // Debug logs
    console.log("[Notif.debug] Args:", args);
    console.log("[Notif.debug] Actor ID:", actorId);
    console.log("[Notif.debug] Post author ID:", postAuthorId);
    console.log("[Notif.debug] Previous commenters:", previousCommenters);
    console.log("[Notif.debug] Recipient list:", recipients);
    console.log("[Notif.debug] Notification payloads:", payloads);

    if (!payloads.length) {
      console.log("[Notif.debug] No recipients. Skipping insert.");
      return [];
    }

    const { data, error } = await supabase.from("notifications").insert(payloads).select();
    if (error) {
      console.error('[Notif.error] Insert notifications failed:', error, 'payloads:', payloads);
      throw new Error(error.message);
    }
    console.log("[Notif.success] Inserted notifications:", data?.length);
    return data;
  } catch (err) {
    console.error("[Notif.error] createNotificationForPost failed:", err?.message, err);
    throw err;
  }
}

