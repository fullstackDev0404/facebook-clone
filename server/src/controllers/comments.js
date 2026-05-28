const prisma = require('../lib/prisma')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')
const { moderateContent } = require('../lib/contentModeration')

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

module.exports = { getComments, createComment }
