const prisma = require('../lib/prisma')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')

/**
 * POST /api/moderation/actions
 * Body: { entityType: 'post'|'comment'|'user', entityId: string, action: string, reason?: string }
 * Create a moderation action (delete, hide, warn, ban, etc.)
 */
const createModerationAction = async (req, res, next) => {
  try {
    const { entityType, entityId, action, reason } = req.body
    const moderatorId = req.user.id

    const validEntityTypes = ['post', 'comment', 'user']
    const validActions = ['delete', 'hide', 'warn', 'ban', 'suspend']

    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ error: 'Invalid entity type' })
    }
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' })
    }
    if (!entityId) {
      return res.status(400).json({ error: 'Entity ID is required' })
    }

    // Execute the action
    let result = null
    if (entityType === 'post') {
      if (action === 'delete') {
        result = await prisma.post.delete({ where: { id: entityId } })
      } else if (action === 'hide') {
        result = await prisma.post.update({
          where: { id: entityId },
          data: { content: '[Content hidden by moderator]' }
        })
      }
    } else if (entityType === 'comment') {
      if (action === 'delete') {
        result = await prisma.comment.delete({ where: { id: entityId } })
      } else if (action === 'hide') {
        result = await prisma.comment.update({
          where: { id: entityId },
          data: { content: '[Content hidden by moderator]' }
        })
      }
    } else if (entityType === 'user') {
      if (action === 'ban' || action === 'suspend') {
        result = await prisma.user.update({
          where: { id: entityId },
          data: { 
            // You might want to add a 'status' or 'banned' field to User model
            // For now, we'll just log the action
          }
        })
      }
    }

    // Create moderation action record
    const moderationAction = await prisma.moderationAction.create({
      data: {
        entityType,
        entityId,
        action,
        reason,
        moderatorId
      },
      include: {
        moderator: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    // Log moderation action
    logActivity(moderatorId, ACTIVITY_TYPES.MODERATION_ACTION, entityType, entityId, {
      action,
      reason
    }).catch(() => {})

    res.status(201).json({ moderationAction, result })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/moderation/stats
 * Get moderation statistics (admin only)
 */
const getModerationStats = async (req, res, next) => {
  try {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      recentActions
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.report.count({ where: { status: 'resolved' } }),
      prisma.report.count({ where: { status: 'dismissed' } }),
      prisma.moderationAction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          moderator: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      })
    ])

    // Reports by reason
    const reportsByReason = await prisma.report.groupBy({
      by: ['reason'],
      _count: { reason: true }
    })

    res.json({
      stats: {
        totalReports,
        pendingReports,
        resolvedReports,
        dismissedReports
      },
      reportsByReason: reportsByReason.map(r => ({
        reason: r.reason,
        count: r._count.reason
      })),
      recentActions
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/moderation/analyze
 * Body: { text: string }
 * Analyze content for moderation (profanity, spam, etc.)
 */
const analyzeText = async (req, res, next) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const analysis = moderateContent(text, {
      autoCensor: false,
      autoFlag: false,
      blockProfanity: false
    })

    res.json(analysis)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createModerationAction,
  getModerationStats,
  analyzeText
}
