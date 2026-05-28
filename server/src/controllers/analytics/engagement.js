const prisma = require('../../lib/prisma')

/**
 * GET /api/analytics/engagement
 * Get engagement analytics
 */
const getEngagementAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.id
        const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30))

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get likes received on user's posts
        const userPostIds = await prisma.post.findMany({
            where: { authorId: userId },
            select: { id: true },
        })

        const postIds = userPostIds.map(p => p.id)

        const [likesReceived, commentsReceived] = await Promise.all([
            prisma.like.count({
                where: {
                    postId: { in: postIds },
                    createdAt: { gte: startDate },
                },
            }),
            prisma.comment.count({
                where: {
                    postId: { in: postIds },
                    createdAt: { gte: startDate },
                },
            }),
        ])

        // Get user's engagement (likes given, comments made)
        const [likesGiven, commentsMade] = await Promise.all([
            prisma.like.count({
                where: {
                    userId,
                    createdAt: { gte: startDate },
                },
            }),
            prisma.comment.count({
                where: {
                    authorId: userId,
                    createdAt: { gte: startDate },
                },
            }),
        ])

        res.json({
            period: `${days} days`,
            received: {
                likes: likesReceived,
                comments: commentsReceived,
            },
            given: {
                likes: likesGiven,
                comments: commentsMade,
            },
        })
    } catch (err) {
        next(err)
    }
}

module.exports = { getEngagementAnalytics }
