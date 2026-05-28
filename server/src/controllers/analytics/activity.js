const prisma = require('../../lib/prisma')

/**
 * GET /api/analytics/activity?days=30
 * Get user activity over time
 */
const getActivityTimeline = async (req, res, next) => {
    try {
        const userId = req.user.id
        const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30))

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const activities = await prisma.activityLog.findMany({
            where: {
                userId,
                createdAt: { gte: startDate },
            },
            orderBy: { createdAt: 'asc' },
            select: {
                action: true,
                entityType: true,
                entityId: true,
                createdAt: true,
            },
        })

        // Group by date
        const groupedByDate = activities.reduce((acc, activity) => {
            const date = activity.createdAt.toISOString().split('T')[0]
            if (!acc[date]) {
                acc[date] = []
            }
            acc[date].push(activity)
            return acc
        }, {})

        res.json({
            timeline: groupedByDate,
            totalActivities: activities.length,
        })
    } catch (err) {
        next(err)
    }
}

module.exports = { getActivityTimeline }
