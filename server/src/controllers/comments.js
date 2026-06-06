const prisma = require('../lib/prisma')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')
const { moderateContent } = require('../lib/contentModeration')

/**
 * Helper function to recursively fetch nested replies
 */
const fetchRepliesRecursively = async (commentId, maxDepth = 5, currentDepth = 0) => {
    if (currentDepth >= maxDepth) return []

    const replies = await prisma.comment.findMany({
        where: { parentId: commentId },
        include: {
            author: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    })

    // Recursively fetch replies for each reply
    for (const reply of replies) {
        reply.replies = await fetchRepliesRecursively(reply.id, maxDepth, currentDepth + 1)
    }

    return replies
}

/**
 * GET /api/posts/:id/comments
 * Returns all top-level comments for a post (parentId = null), ordered oldest-first.
 * Includes nested replies recursively.
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
            },
            orderBy: { createdAt: 'asc' },
        })

        // Recursively fetch all nested replies for each top-level comment
        for (const comment of comments) {
            comment.replies = await fetchRepliesRecursively(comment.id)
        }

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

        // Content moderation check
        const moderationResult = moderateContent(content, {
            autoCensor: false,
            autoFlag: true,
            blockProfanity: false
        })

        // Log if content was flagged
        if (moderationResult.shouldFlag) {
            logActivity(userId, ACTIVITY_TYPES.CONTENT_FLAGGED, 'comment', null, {
                profanityDetected: moderationResult.profanityDetected,
                spamDetected: moderationResult.spamDetected,
                profanityWords: moderationResult.profanityWords,
                spamReasons: moderationResult.spamReasons
            }).catch(() => {})
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

        // Log comment creation activity
        logActivity(userId, ACTIVITY_TYPES.COMMENT_CREATE, 'comment', comment.id, {
            postId,
            isReply: !!parentId,
        }).catch(() => {})

        res.status(201).json({ comment })
    } catch (err) {
        next(err)
    }
}

/**
 * PATCH /api/comments/:id
 * Body: { content: string }
 * Updates a comment (author only).
 */
const updateComment = async (req, res, next) => {
    try {
        const commentId = req.params.id
        const userId = req.user.id
        const content = req.body.content?.trim()

        if (!content) {
            return res.status(400).json({ error: 'Comment content is required' })
        }

        // Check comment exists and user is the author
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        })

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' })
        }

        if (comment.authorId !== userId) {
            return res.status(403).json({ error: 'You can only edit your own comments' })
        }

        // Content moderation check
        const moderationResult = moderateContent(content, {
            autoCensor: false,
            autoFlag: true,
            blockProfanity: false
        })

        // Log if content was flagged
        if (moderationResult.shouldFlag) {
            logActivity(userId, ACTIVITY_TYPES.CONTENT_FLAGGED, 'comment', commentId, {
                profanityDetected: moderationResult.profanityDetected,
                spamDetected: moderationResult.spamDetected,
                profanityWords: moderationResult.profanityWords,
                spamReasons: moderationResult.spamReasons
            }).catch(() => {})
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
        })

        res.json({ comment: updatedComment })
    } catch (err) {
        next(err)
    }
}

/**
 * DELETE /api/comments/:id
 * Deletes a comment (author only).
 */
const deleteComment = async (req, res, next) => {
    try {
        const commentId = req.params.id
        const userId = req.user.id

        // Check comment exists and user is the author
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        })

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' })
        }

        if (comment.authorId !== userId) {
            return res.status(403).json({ error: 'You can only delete your own comments' })
        }

        await prisma.comment.delete({
            where: { id: commentId },
        })

        res.status(204).send()
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/comments/:id/like
 * Body: { type?: string } // like, love, haha, wow, sad, angry (default: like)
 * Adds or updates a like/reaction on a comment.
 */
const likeComment = async (req, res, next) => {
    try {
        const commentId = req.params.id
        const userId = req.user.id
        const type = req.body.type || 'like'

        // Validate reaction type
        const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry']
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid reaction type' })
        }

        // Check comment exists
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        })

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' })
        }

        // Upsert: create or update like
        const like = await prisma.commentLike.upsert({
            where: {
                userId_commentId: {
                    userId,
                    commentId,
                },
            },
            update: { type },
            create: {
                userId,
                commentId,
                type,
            },
        })

        res.status(201).json({ like })
    } catch (err) {
        next(err)
    }
}

/**
 * DELETE /api/comments/:id/like
 * Removes a like/reaction from a comment.
 */
const unlikeComment = async (req, res, next) => {
    try {
        const commentId = req.params.id
        const userId = req.user.id

        // Check if like exists
        const like = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId,
                },
            },
        })

        if (!like) {
            return res.status(404).json({ error: 'Like not found' })
        }

        await prisma.commentLike.delete({
            where: {
                userId_commentId: {
                    userId,
                    commentId,
                },
            },
        })

        res.status(204).send()
    } catch (err) {
        next(err)
    }
}

module.exports = { getComments, createComment, updateComment, deleteComment, likeComment, unlikeComment }
