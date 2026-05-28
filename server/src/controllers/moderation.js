const prisma = require('../lib/prisma')
const { moderateContent } = require('../lib/contentModeration')
const { emitNotificationCount } = require('../lib/socket')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')

/**
 * POST /api/reports
 * Body: { entityType: 'post'|'comment'|'user', entityId: string, reason: string, description?: string }
 * Create a content report
 */
const createReport = async (req, res, next) => {
  try {
    const { entityType, entityId, reason, description } = req.body
    const reporterId = req.user.id

    // Validate input
    const validEntityTypes = ['post', 'comment', 'user']
    const validReasons = ['spam', 'harassment', 'inappropriate_content', 'other']

    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ error: 'Invalid entity type' })
    }
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' })
    }
    if (!entityId) {
      return res.status(400).json({ error: 'Entity ID is required' })
    }

    // Check if entity exists
    let entityExists = false
    if (entityType === 'post') {
      entityExists = await prisma.post.findUnique({ where: { id: entityId } })
    } else if (entityType === 'comment') {
      entityExists = await prisma.comment.findUnique({ where: { id: entityId } })
    } else if (entityType === 'user') {
      entityExists = await prisma.user.findUnique({ where: { id: entityId } })
    }

    if (!entityExists) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    // Check if user already reported this entity
    const existingReport = await prisma.report.findFirst({
      where: {
        entityType,
        entityId,
        reporterId,
        status: { in: ['pending', 'reviewed'] }
      }
    })

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this item' })
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        entityType,
        entityId,
        reason,
        description,
        reporterId
      },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        }
      }
    })

    // Log report creation
    logActivity(reporterId, ACTIVITY_TYPES.REPORT_CREATE, entityType, entityId, {
      reason
    }).catch(() => {})

    res.status(201).json({ report })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/reports
 * Query: ?status=pending&page=1&limit=20
 * Get all reports (admin only)
 */
const getReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit
    const status = req.query.status || 'pending'

    const where = status ? { status } : {}

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true, avatar: true }
          },
          reviewer: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.report.count({ where })
    ])

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/reports/:id
 * Get a specific report
 */
const getReport = async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    // Fetch related entity details
    let entityDetails = null
    if (report.entityType === 'post') {
      entityDetails = await prisma.post.findUnique({
        where: { id: report.entityId },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } }
        }
      })
    } else if (report.entityType === 'comment') {
      entityDetails = await prisma.comment.findUnique({
        where: { id: report.entityId },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          post: { select: { id: true, content: true } }
        }
      })
    } else if (report.entityType === 'user') {
      entityDetails = await prisma.user.findUnique({
        where: { id: report.entityId },
        select: { id: true, firstName: true, lastName: true, email: true }
      })
    }

    res.json({ report, entityDetails })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/reports/:id
 * Body: { status: 'resolved'|'dismissed', resolution?: string }
 * Update report status (admin only)
 */
const updateReport = async (req, res, next) => {
  try {
    const { status, resolution } = req.body
    const moderatorId = req.user.id

    const report = await prisma.report.findUnique({
      where: { id: req.params.id }
    })

    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        status,
        resolution,
        reviewedBy: moderatorId,
        reviewedAt: new Date()
      },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true }
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    // Log moderation action
    logActivity(moderatorId, ACTIVITY_TYPES.MODERATION_ACTION, 'report', report.id, {
      action: status,
      entityType: report.entityType,
      entityId: report.entityId
    }).catch(() => {})

    res.json({ report: updated })
  } catch (err) {
    next(err)
  }
}

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
  createReport,
  getReports,
  getReport,
  updateReport,
  createModerationAction,
  getModerationStats,
  analyzeText
}
