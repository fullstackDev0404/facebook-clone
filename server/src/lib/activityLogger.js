const prisma = require('./prisma')

/**
 * Log user activity
 * @param {string} userId - User ID
 * @param {string} action - Action type (login, post_create, post_like, etc.)
 * @param {string} entityType - Entity type (post, comment, user, etc.)
 * @param {string} entityId - Entity ID
 * @param {object} metadata - Additional metadata (IP, user agent, etc.)
 */
const logActivity = async (userId, action, entityType = null, entityId = null, metadata = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata || {},
      },
    })
  } catch (error) {
    // Log error but don't throw - activity logging shouldn't break the main flow
    console.error('Failed to log activity:', error)
  }
}

/**
 * Activity types
 */
const ACTIVITY_TYPES = {
  REGISTER: 'register',
  LOGIN: 'login',
  LOGOUT: 'logout',
  POST_CREATE: 'post_create',
  POST_DELETE: 'post_delete',
  POST_UPDATE: 'post_update',
  POST_LIKE: 'post_like',
  POST_UNLIKE: 'post_unlike',
  COMMENT_CREATE: 'comment_create',
  COMMENT_DELETE: 'comment_delete',
  FRIEND_REQUEST_SEND: 'friend_request_send',
  FRIEND_REQUEST_ACCEPT: 'friend_request_accept',
  FRIEND_REQUEST_REJECT: 'friend_request_reject',
  FRIEND_REMOVE: 'friend_remove',
  STORY_CREATE: 'story_create',
  STORY_VIEW: 'story_view',
  STORY_DELETE: 'story_delete',
  MESSAGE_SEND: 'message_send',
  PROFILE_UPDATE: 'profile_update',
  PROFILE_VIEW: 'profile_view',
  REPORT_CREATE: 'report_create',
  MODERATION_ACTION: 'moderation_action',
  CONTENT_FLAGGED: 'content_flagged',
}

module.exports = { logActivity, ACTIVITY_TYPES }
