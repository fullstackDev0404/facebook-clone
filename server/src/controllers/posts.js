const prisma = require('../lib/prisma')
const { emitNotificationCount } = require('../lib/socket')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')
const { moderateContent } = require('../lib/contentModeration')
const { POST_INCLUDE } = require('./feed')

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

        // Content moderation check
        const moderationResult = moderateContent(finalContent, {
            autoCensor: false,
            autoFlag: true,
            blockProfanity: false
        })

        // Log if content was flagged
        if (moderationResult.shouldFlag) {
            logActivity(req.user.id, ACTIVITY_TYPES.CONTENT_FLAGGED, 'post', null, {
                profanityDetected: moderationResult.profanityDetected,
                spamDetected: moderationResult.spamDetected,
                profanityWords: moderationResult.profanityWords,
                spamReasons: moderationResult.spamReasons
            }).catch(() => {})
        }

        // Create post and notifications in a transaction so we don't end up
        // with orphaned notifications or partial state on errors.
        const post = await prisma.$transaction(async (tx) => {
            const p = await tx.post.create({
                data: {
                    content: finalContent,
                    image: photoPath,
                    video: videoPath,
                    authorId: req.user.id,
                    privacy: req.body.privacy || 'public',
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

        // Log post creation activity
        logActivity(req.user.id, ACTIVITY_TYPES.POST_CREATE, 'post', post.id, {
            hasImage: !!photoPath,
            hasVideo: !!videoPath,
            taggedUsers: taggedIds.length,
        }).catch(() => {})

        res.status(201).json({ post })
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

module.exports = { createPost, updatePost, deletePost }
