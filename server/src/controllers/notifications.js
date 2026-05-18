const prisma = require('../lib/prisma')

const NOTIFICATION_INCLUDE = {
  // actor is the user who triggered the notification (optional)
}

/**
 * GET /api/notifications?page=1&limit=20&unreadOnly=false
 * Returns paginated notifications for the logged-in user, newest first.
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId    = req.user.id
    const page      = Math.max(1, parseInt(req.query.page)  || 1)
    const limit     = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
    const skip      = (page - 1) * limit
    const unreadOnly = req.query.unreadOnly === 'true'

    const where = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ])

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification)                  return res.status(404).json({ error: 'Notification not found' })
    if (notification.userId !== userId) return res.status(403).json({ error: 'Not authorized' })

    const updated = await prisma.notification.update({
      where: { id },
      data:  { read: true },
    })

    res.json({ notification: updated })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/notifications/read-all
 * Mark all unread notifications as read for the logged-in user.
 */
const markAllRead = async (req, res, next) => {
  try {
    const { count } = await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data:  { read: true },
    })

    res.json({ message: `${count} notification(s) marked as read`, count })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a single notification.
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification)                  return res.status(404).json({ error: 'Notification not found' })
    if (notification.userId !== userId) return res.status(403).json({ error: 'Not authorized' })

    await prisma.notification.delete({ where: { id } })
    res.json({ message: 'Notification deleted' })
  } catch (err) {
    next(err)
  }
}

module.exports = { getNotifications, markRead, markAllRead, deleteNotification }
