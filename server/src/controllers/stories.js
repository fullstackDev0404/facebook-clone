const prisma = require('../lib/prisma')

/**
 * POST /api/stories
 * Body (multipart/form-data): image (file, optional), text (string, optional),
 *                              backgroundColor (string, optional, hex)
 * At least one of image or text must be present.
 * Requires auth middleware — req.user is populated
 */
const createStory = async (req, res, next) => {
    try {
        const imageFile       = req.file || null
        const text            = req.body.text?.trim() || null
        const backgroundColor = req.body.backgroundColor || '#ff0000'

        // At least one of image or text must be present
        if (!imageFile && !text) {
            return res.status(400).json({ error: 'Story must have an image or text content' })
        }

        const imagePath = imageFile ? `uploads/stories/${imageFile.filename}` : null

        // Stories expire 24 hours from now
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

        const story = await prisma.story.create({
            data: {
                image: imagePath,
                text,
                backgroundColor,
                authorId: req.user.id,
                expiresAt,
            },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
        })

        res.status(201).json({ story })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/stories/feed
 * Returns stories from the logged-in user and their accepted friends that haven't expired,
 * ordered newest-first.
 */
const getFeed = async (req, res, next) => {
    try {
        const userId = req.user.id
        const now = new Date()

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

        // Feed = own stories + friends' stories, excluding expired stories
        const authorIds = [userId, ...friendIds]

        const stories = await prisma.story.findMany({
            where: {
                    authorId: { in: authorIds },
                    expiresAt: { gt: now },
                },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        res.json({ stories })
    } catch (err) {
        next(err)
    }
}

/**
 * DELETE /api/stories/:id
 * Delete a story. Only the author can delete.
 */
const deleteStory = async (req, res, next) => {
    try {
        const { id } = req.params
        const userId = req.user.id

        const story = await prisma.story.findUnique({ where: { id } })
        if (!story)                    return res.status(404).json({ error: 'Story not found' })
        if (story.authorId !== userId) return res.status(403).json({ error: 'Not authorized' })

        await prisma.story.delete({ where: { id } })
        res.json({ message: 'Story deleted' })
    } catch (err) {
        next(err)
    }
}

module.exports = { createStory, getFeed, deleteStory }
