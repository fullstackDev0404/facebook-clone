const prisma = require('../lib/prisma')

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
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
                _count: {
                    select: { likes: true, comments: true },
                },
            },
        })

        res.status(201).json({ post })
    } catch (err) {
        next(err)
    }
}

module.exports = { createPost }
