const prisma = require('../lib/prisma')

// Shared Prisma include shape for post queries
const POST_INCLUDE = {
    author: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
    },
    _count: {
        select: { likes: true, comments: true },
    },
    tags: {
        include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
    },
}

/**
 * GET /api/posts/feed?page=1&limit=10
 * Returns a paginated feed of posts from the logged-in user and their accepted friends,
 * ordered newest-first.
 */
const getFeed = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1)
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
        const skip  = (page - 1) * limit

        const userId = req.user.id

        // Collect IDs of accepted friends (both directions)
        const friendships = await prisma.friendship.findMany({
            where: {
                status: 'accepted',
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            select: { senderId: true, receiverId: true },
        })

        const friendIds = friendships.map((f) =>
            f.senderId === userId ? f.receiverId : f.senderId
        )

        // Feed = own posts + friends' posts, respecting privacy settings
        const authorIds = [userId, ...friendIds]

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: {
                    authorId: { in: authorIds },
                    OR: [
                        { privacy: 'public' },
                        { privacy: 'friends', authorId: userId },
                        { privacy: 'friends', authorId: { in: friendIds } },
                        { privacy: 'private', authorId: userId },
                    ],
                },
                include: POST_INCLUDE,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.post.count({
                where: {
                    authorId: { in: authorIds },
                    OR: [
                        { privacy: 'public' },
                        { privacy: 'friends', authorId: userId },
                        { privacy: 'friends', authorId: { in: friendIds } },
                        { privacy: 'private', authorId: userId },
                    ],
                },
            }),
        ])

        // Now re-query user reactions for the actual post IDs (fix bug: earlier we queried by author IDs)
        const postIds = posts.map(p => p.id)
        const reactions = await prisma.like.findMany({ where: { postId: { in: postIds }, userId }, select: { postId: true, type: true } })

        // Attach user's reaction type to each post
        const postsWithReaction = posts.map(post => {
            const userReaction = reactions.find(r => r.postId === post.id)
            return {
                ...post,
                userReactionType: userReaction ? userReaction.type : null,
            }
        })

        res.json({
            posts: postsWithReaction,
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

module.exports = { getFeed, POST_INCLUDE }
