const prisma = require('../lib/prisma')

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

/**
 * GET /api/analytics/posts
 * Get post analytics for the current user
 */
const getPostAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.id

        const posts = await prisma.post.findMany({
            where: { authorId: userId },
            include: {
                _count: {
                    select: { likes: true, comments: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        const totalLikes = posts.reduce((sum, post) => sum + post._count.likes, 0)
        const totalComments = posts.reduce((sum, post) => sum + post._count.comments, 0)
        const avgLikesPerPost = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0
        const avgCommentsPerPost = posts.length > 0 ? Math.round(totalComments / posts.length) : 0

        // Find most liked post
        const mostLikedPost = posts.reduce((max, post) => 
            post._count.likes > (max?._count?.likes || 0) ? post : max, null)

        res.json({
            totalPosts: posts.length,
            totalLikes,
            totalComments,
            avgLikesPerPost,
            avgCommentsPerPost,
            mostLikedPost: mostLikedPost ? {
                id: mostLikedPost.id,
                content: mostLikedPost.content,
                likes: mostLikedPost._count.likes,
                comments: mostLikedPost._count.comments,
                createdAt: mostLikedPost.createdAt,
            } : null,
        })
    } catch (err) {
        next(err)
    }
}

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

module.exports = {
    getOverview,
    getActivityTimeline,
    getPostAnalytics,
    getEngagementAnalytics,
}
