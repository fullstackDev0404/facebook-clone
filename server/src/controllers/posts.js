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

/**
 * POST /api/posts/:id/like
 * Body: { type?: string } — defaults to "like", can be "love", "haha", "wow", "sad", "angry"
 * Creates or updates the user's reaction on a post.
 */
const likePost = async (req, res, next) => {
    try {
        const postId = req.params.id
        const userId = req.user.id
        const type   = req.body.type || 'like'

        // Validate reaction type
        const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry']
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid reaction type' })
        }

        // Check post exists
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: 'Post not found' })

        // Upsert the like (update type if already exists, create if not)
        const like = await prisma.like.upsert({
            where: {
                userId_postId: { userId, postId },
            },
            update: { type },
            create: { userId, postId, type },
        })

        res.json({ like })
    } catch (err) {
        next(err)
    }
}

/**
 * DELETE /api/posts/:id/like
 * Removes the user's reaction from a post.
 */
const unlikePost = async (req, res, next) => {
    try {
        const postId = req.params.id
        const userId = req.user.id

        const like = await prisma.like.findUnique({
            where: { userId_postId: { userId, postId } },
        })

        if (!like) {
            return res.status(404).json({ error: 'Like not found' })
        }

        await prisma.like.delete({
            where: { userId_postId: { userId, postId } },
        })

        res.json({ message: 'Like removed' })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/posts/:id/comments
 * Returns all top-level comments for a post (parentId = null), ordered oldest-first.
 * Includes nested replies.
 */
const getComments = async (req, res, next) => {
    try {
        const postId = req.params.id

        // Check post exists
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: 'Post not found' })

        const comments = await prisma.comment.findMany({
            where: { postId, parentId: null },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
                replies: {
                    include: {
                        author: {
                            select: { id: true, firstName: true, lastName: true, avatar: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'asc' },
        })

        res.json({ comments })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/posts/:id/comments
 * Body: { content: string, parentId?: string }
 * Creates a new comment (or reply if parentId is provided).
 */
const createComment = async (req, res, next) => {
    try {
        const postId   = req.params.id
        const userId   = req.user.id
        const content  = req.body.content?.trim()
        const parentId = req.body.parentId || null

        if (!content) {
            return res.status(400).json({ error: 'Comment content is required' })
        }

        // Check post exists
        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return res.status(404).json({ error: 'Post not found' })

        // If parentId provided, check it exists and belongs to this post
        if (parentId) {
            const parent = await prisma.comment.findUnique({ where: { id: parentId } })
            if (!parent || parent.postId !== postId) {
                return res.status(400).json({ error: 'Invalid parent comment' })
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                authorId: userId,
                postId,
                parentId,
            },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
        })

        res.status(201).json({ comment })
    } catch (err) {
        next(err)
    }
}

module.exports = { createPost, getFeed, likePost, unlikePost, getComments, createComment }
