const prisma = require('../lib/prisma')

// Shared Prisma include shape for post queries
const POST_INCLUDE = {
    author: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
    },
    _count: {
        select: { likes: true, comments: true },
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

        // Feed = own posts + friends' posts
        const authorIds = [userId, ...friendIds]

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: { authorId: { in: authorIds } },
                include: POST_INCLUDE,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.post.count({
                where: { authorId: { in: authorIds } },
            }),
        ])

        res.json({
            posts,
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
 * POST /api/posts
 * Body (multipart/form-data): content (string, optional), image (file, optional)
 * Requires auth middleware — req.user is populated
 */
const createPost = async (req, res, next) => {
    try {
        const content = req.body.content?.trim() || null
        const imagePath = req.file ? `uploads/posts/${req.file.filename}` : null

        // At least one of content or image must be present
        if (!content && !imagePath) {
            return res.status(400).json({ error: 'Post must have text content or an image' })
        }

        const post = await prisma.post.create({
            data: {
                content,
                image: imagePath,
                authorId: req.user.id,
            },
            include: POST_INCLUDE,
        })

        res.status(201).json({ post })
    } catch (err) {
        next(err)
    }
}

module.exports = { createPost, getFeed }
