const prisma = require('../../lib/prisma')

/**
 * GET /api/analytics/overview
 * Get overview analytics for the current user
 */
const getOverview = async (req, res, next) => {
    try {
        const userId = req.user.id

        // Get user's activity counts
        const [postsCount, commentsCount, likesGiven, friendsCount] = await Promise.all([
            prisma.post.count({ where: { authorId: userId } }),
            prisma.comment.count({ where: { authorId: userId } }),
            prisma.like.count({ where: { userId } }),
            prisma.friendship.count({
                where: {
                    status: 'accepted',
                    OR: [{ senderId: userId }, { receiverId: userId }],
                },
            }),
        ])

        // Get activity from last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentActivity = await prisma.activityLog.groupBy({
            by: ['action'],
            where: {
                userId,
                createdAt: { gte: sevenDaysAgo },
            },
            _count: { action: true },
        })

        const activityBreakdown = recentActivity.reduce((acc, item) => {
            acc[item.action] = item._count.action
            return acc
        }, {})

        res.json({
            overview: {
                postsCount,
                commentsCount,
                likesGiven,
                friendsCount,
            },
            recentActivity: activityBreakdown,
        })
    } catch (err) {
        next(err)
    }
}

module.exports = { getOverview }
