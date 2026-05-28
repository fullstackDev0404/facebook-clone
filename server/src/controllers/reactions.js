const prisma = require('../lib/prisma')
const { VALID_REACTIONS } = require('../lib/constants')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')

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

        // Log post like activity
        logActivity(userId, ACTIVITY_TYPES.POST_LIKE, 'post', postId, {
            reactionType: type,
        }).catch(() => {})

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

        // Log post unlike activity
        logActivity(userId, ACTIVITY_TYPES.POST_UNLIKE, 'post', postId).catch(() => {})

        res.json({ message: 'Like removed' })
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

module.exports = { likePost, unlikePost, getPostLikes }
