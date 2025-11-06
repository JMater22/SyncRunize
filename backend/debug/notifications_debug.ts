// Debugging snippet to verify recipients before inserting notifications
// Usage: import and call logNotificationRecipients with the inputs used when notifying

type NotificationType =
  | 'like'
  | 'comment'
  | 'group_like'
  | 'group_comment'
  | 'badge_earned'
  | 'challenge_progress'
  | 'system';

export function logNotificationRecipients(params: {
  type: NotificationType;
  actorId: number;
  postAuthorId?: number | null;
  previousCommenters?: number[];
  postId?: number | null;
  groupPostId?: number | null;
  groupId?: number | null;
  message?: string;
}) {
  const {
    type,
    actorId,
    postAuthorId = null,
    previousCommenters = [],
    postId = null,
    groupPostId = null,
    groupId = null,
    message = '',
  } = params;

  const distinct = (arr: number[]) => Array.from(new Set(arr));

  let recipients: number[] = [];
  if (type === 'like') {
    recipients = postAuthorId ? [postAuthorId] : [];
  } else if (type === 'comment') {
    recipients = postAuthorId ? [postAuthorId] : [];
  } else if (type === 'group_like') {
    recipients = postAuthorId ? [postAuthorId] : [];
  } else if (type === 'group_comment') {
    recipients = distinct([postAuthorId!, ...previousCommenters]).filter(Boolean) as number[];
  } else if (type === 'badge_earned') {
    recipients = [actorId];
  }
  // Exclude the actor from recipients (no self notifications)
  recipients = recipients.filter((uid) => uid !== actorId);

  const payloads = recipients.map((recipientId) => ({
    user_id: recipientId, // recipient of the notification
    actor_id: actorId,    // who performed the action
    message: message,
    type,
    post_id: postId ?? null,
    group_post_id: groupPostId ?? null,
    group_id: groupId ?? null,
  }));

  console.log('[Notif.debug.snippet] Actor ID:', actorId);
  console.log('[Notif.debug.snippet] Post author ID:', postAuthorId);
  console.log('[Notif.debug.snippet] Previous commenters:', previousCommenters);
  console.log('[Notif.debug.snippet] Recipient list:', recipients);
  console.log('[Notif.debug.snippet] Notification payloads (before insert):', payloads);

  // What to check:
  // - user_id must be each recipient (author, previous commenters)
  // - actor_id must be the performer (liker/commenter)
  // - Exclude actor from recipients to avoid self notifications
  // - Remove duplicates (use Set)
  // - Ensure correct linkage: post_id/group_post_id present for likes/comments
}

