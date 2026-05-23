const prisma = require('../lib/prisma')
const { VALID_REACTIONS } = require('../lib/constants')
const { emitNotificationCount } = require('../lib/socket')

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

/**
 * POST /api/posts
 * Body (multipart/form-data): content (string, optional), image (file, optional)
 * Requires auth middleware — req.user is populated
 */
const createPost = async (req, res, next) => {
    try {
        const content = req.body.content?.trim() || null
        const feeling = req.body.feeling?.trim() || null
        // Safely parse tagged IDs (may be JSON string from multipart form)
        let taggedIds = []
        if (req.body.taggedIds) {
            try {
                const parsed = JSON.parse(req.body.taggedIds)
                if (Array.isArray(parsed)) taggedIds = parsed.filter(Boolean)
            } catch (e) {
                // malformed input — treat as no tags
                taggedIds = []
            }
        }
        const imagePath = req.file ? `uploads/posts/${req.file.filename}` : null

        const isVideo = req.file && req.file.mimetype.startsWith('video/')
        const videoPath = isVideo ? imagePath : null
        const photoPath = isVideo ? null : imagePath

        if (!content && !photoPath && !videoPath && !feeling) {
            return res.status(400).json({ error: 'Post must have text, an image, a video, or a feeling' })
        }

        const finalContent = feeling
            ? `${content ?? ''}${content ? ' — ' : ''}feeling ${feeling}`
            : content

        // Create post and notifications in a transaction so we don't end up
        // with orphaned notifications or partial state on errors.
        const post = await prisma.$transaction(async (tx) => {
            const p = await tx.post.create({
                data: {
                    content: finalContent,
                    image: photoPath,
                    video: videoPath,
                    authorId: req.user.id,
                    tags: taggedIds.length
                        ? { create: taggedIds.map(uid => ({ userId: uid })) }
                        : undefined,
                },
                include: POST_INCLUDE,
            })

            if (taggedIds.length) {
                await tx.notification.createMany({
                    data: taggedIds.map(uid => ({
                        type: 'tag',
                        message: `${req.user.firstName} ${req.user.lastName} tagged you in a post`,
                        userId: uid,
                        actorId: req.user.id,
                        entityId: p.id,
                    })),
                    skipDuplicates: true,
                })
            }

            return p
        })

        if (taggedIds.length) {
            await Promise.all(taggedIds.map(uid => emitNotificationCount(uid).catch(() => {})))
        }

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
        if (!VALID_REACTIONS.includes(type)) {
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

/**
 * PATCH /api/posts/:id
 * Body: { content: string }
 * Edit a post's text content. Only the author can edit.
 */
const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params
        const userId  = req.user.id
        const content = req.body.content?.trim() || null

        const post = await prisma.post.findUnique({ where: { id } })
        if (!post)                    return res.status(404).json({ error: 'Post not found' })
        if (post.authorId !== userId) return res.status(403).json({ error: 'Not authorized' })
        if (!content && !post.image)  return res.status(400).json({ error: 'Post must have text content or an image' })

        const updated = await prisma.post.update({
            where: { id },
            data:  { content },
            include: POST_INCLUDE,
        })

        res.json({ post: updated })
    } catch (err) {
        next(err)
    }
}

/**
 * DELETE /api/posts/:id
 * Delete a post. Only the author can delete.
 */
const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params
        const userId  = req.user.id

        const post = await prisma.post.findUnique({ where: { id } })
        if (!post)                    return res.status(404).json({ error: 'Post not found' })
        if (post.authorId !== userId) return res.status(403).json({ error: 'Not authorized' })

        await prisma.post.delete({ where: { id } })
        res.json({ message: 'Post deleted' })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/posts/:id/likes
 * Returns reaction breakdown by type for a post.
 */
const getPostLikes = async (req, res, next) => {
  try {
    const postId = req.params.id

    // Check post exists
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return res.status(404).json({ error: 'Post not found' })

        // Group likes by type and count
        const likes = await prisma.like.groupBy({
            by: ['type'],
            where: { postId },
            _count: { type: true },
        })

        // Build breakdown object
        const breakdown = {}
        for (const { type, _count } of likes) {
            // _count is an object like { type: number }
            breakdown[type] = (_count && typeof _count.type === 'number') ? _count.type : 0
        }

    // Ensure all reaction types are present (with zero count)
    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry']
    validTypes.forEach(type => {
      if (!(type in breakdown)) {
        breakdown[type] = 0
      }
    })

    res.json({ breakdown })
  } catch (err) {
    next(err)
  }
}

module.exports = { createPost, getFeed, likePost, unlikePost, getComments, createComment, updatePost, deletePost, getPostLikes }
