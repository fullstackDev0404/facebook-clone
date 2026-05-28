const prisma = require('../lib/prisma')

// Helper function to build privacy filter for feed queries
const buildPrivacyFilter = (userId, friendIds) => ({
    authorId: { in: [userId, ...friendIds] },
    OR: [
        { privacy: 'public' },
        { privacy: 'friends', authorId: userId },
        { privacy: 'friends', authorId: { in: friendIds } },
        { privacy: 'private', authorId: userId },
    ],
})

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

        const privacyFilter = buildPrivacyFilter(userId, friendIds)

        // Use raw SQL to fetch posts with user's reaction in a single query
        const postsQuery = `
            SELECT
                p.*,
                l.type as "userReactionType"
            FROM "posts" p
            LEFT JOIN "likes" l ON l."postId" = p.id AND l."userId" = $1
            WHERE p."authorId" = ANY($2)
            AND (
                p.privacy = 'public'
                OR (p.privacy = 'friends' AND p."authorId" = $1)
                OR (p.privacy = 'friends' AND p."authorId" = ANY($3))
                OR (p.privacy = 'private' AND p."authorId" = $1)
            )
            ORDER BY p."createdAt" DESC
            LIMIT $4 OFFSET $5
        `

        const countQuery = `
            SELECT COUNT(*) as count
            FROM "posts" p
            WHERE p."authorId" = ANY($2)
            AND (
                p.privacy = 'public'
                OR (p.privacy = 'friends' AND p."authorId" = $1)
                OR (p.privacy = 'friends' AND p."authorId" = ANY($3))
                OR (p.privacy = 'private' AND p."authorId" = $1)
            )
        `

        const [postsRaw, countResult] = await Promise.all([
            prisma.$queryRawUnsafe(postsQuery, userId, authorIds, friendIds, limit, skip),
            prisma.$queryRawUnsafe(countQuery, userId, authorIds, friendIds),
        ])

        const total = parseInt(countResult[0].count)

        // Fetch related data (author, counts, tags) for all posts
        const postIds = postsRaw.map(p => p.id)
        const [authors, likeCounts, commentCounts, tags] = await Promise.all([
            prisma.user.findMany({
                where: { id: { in: postsRaw.map(p => p.authorId) } },
                select: { id: true, firstName: true, lastName: true, avatar: true },
            }),
            prisma.like.groupBy({
                by: ['postId'],
                where: { postId: { in: postIds } },
                _count: true,
            }),
            prisma.comment.groupBy({
                by: ['postId'],
                where: { postId: { in: postIds } },
                _count: true,
            }),
            prisma.postTag.findMany({
                where: { postId: { in: postIds } },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                },
            }),
        ])

        const authorMap = new Map(authors.map(a => [a.id, a]))
        const likeCountMap = new Map(likeCounts.map(lc => [lc.postId, lc._count]))
        const commentCountMap = new Map(commentCounts.map(cc => [cc.postId, cc._count]))
        const tagsMap = new Map()
        tags.forEach(tag => {
            if (!tagsMap.has(tag.postId)) tagsMap.set(tag.postId, [])
            tagsMap.get(tag.postId).push(tag)
        })

        const posts = postsRaw.map(post => ({
            id: post.id,
            content: post.content,
            image: post.image,
            video: post.video,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            authorId: post.authorId,
            privacy: post.privacy,
            author: authorMap.get(post.authorId),
            _count: {
                likes: likeCountMap.get(post.id) || 0,
                comments: commentCountMap.get(post.id) || 0,
            },
            tags: tagsMap.get(post.id) || [],
            userReactionType: post.userReactionType,
        }))

        res.json({
            posts: posts,
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
