const prisma = require('../lib/prisma')

/**
 * GET /api/search/users?q=query&limit=10
 * Search users by name, username, or email
 */
const searchUsers = async (req, res, next) => {
    try {
        const query = req.query.q?.trim() || ''
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10))

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' })
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: query } },
                    { lastName: { contains: query } },
                    { email: { contains: query } },
                ],
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                bio: true,
            },
            take: limit,
        })

        res.json({ users })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/search/posts?q=query&limit=10
 * Search posts by content
 */
const searchPosts = async (req, res, next) => {
    try {
        const query = req.query.q?.trim() || ''
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10))
        const userId = req.user?.id

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' })
        }

        const posts = await prisma.post.findMany({
            where: {
                content: { contains: query },
            },
            include: {
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
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        })

        // Attach user's reaction type if authenticated
        let postsWithReaction = posts
        if (userId) {
            const postIds = posts.map(p => p.id)
            const reactions = await prisma.like.findMany({
                where: { postId: { in: postIds }, userId },
                select: { postId: true, type: true }
            })

            postsWithReaction = posts.map(post => {
                const userReaction = reactions.find(r => r.postId === post.id)
                return {
                    ...post,
                    userReactionType: userReaction ? userReaction.type : null,
                }
            })
        }

        res.json({ posts: postsWithReaction })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/search?q=query&type=all|users|posts&limit=10
 * Global search - searches both users and posts
 */
const globalSearch = async (req, res, next) => {
    try {
        const query = req.query.q?.trim() || ''
        const type = req.query.type || 'all'
        const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5))
        const userId = req.user?.id

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' })
        }

        let results = {}

        if (type === 'all' || type === 'users') {
            results.users = await prisma.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: query } },
                        { lastName: { contains: query } },
                    ],
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    bio: true,
                },
                take: limit,
            })
        }

        if (type === 'all' || type === 'posts') {
            const posts = await prisma.post.findMany({
                where: {
                    content: { contains: query },
                },
                include: {
                    author: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                    _count: {
                        select: { likes: true, comments: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            })

            // Attach user's reaction type if authenticated
            if (userId) {
                const postIds = posts.map(p => p.id)
                const reactions = await prisma.like.findMany({
                    where: { postId: { in: postIds }, userId },
                    select: { postId: true, type: true }
                })

                results.posts = posts.map(post => {
                    const userReaction = reactions.find(r => r.postId === post.id)
                    return {
                        ...post,
                        userReactionType: userReaction ? userReaction.type : null,
                    }
                })
            } else {
                results.posts = posts
            }
        }

        res.json(results)
    } catch (err) {
        next(err)
    }
}

module.exports = { searchUsers, searchPosts, globalSearch }
