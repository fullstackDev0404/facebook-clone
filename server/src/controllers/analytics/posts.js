const prisma = require('../../lib/prisma')

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

module.exports = { getPostAnalytics }
