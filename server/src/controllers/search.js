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
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
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

        // Use raw SQL to fetch posts with user's reaction in a single query
        const postsQuery = userId ? `
            SELECT
                p.*,
                l.type as "userReactionType"
            FROM "posts" p
            LEFT JOIN "likes" l ON l."postId" = p.id AND l."userId" = $1
            WHERE p.content ILIKE $2
            ORDER BY p."createdAt" DESC
            LIMIT $3
        ` : `
            SELECT
                p.*,
                NULL as "userReactionType"
            FROM "posts" p
            WHERE p.content ILIKE $1
            ORDER BY p."createdAt" DESC
            LIMIT $2
        `

        const postsRaw = userId
            ? await prisma.$queryRawUnsafe(postsQuery, userId, `%${query}%`, limit)
            : await prisma.$queryRawUnsafe(postsQuery, `%${query}%`, limit)

        // Fetch related data (author, counts, tags) for all posts
        const postIds = postsRaw.map(p => p.id)
        const [authors, likeCounts, commentCounts, tags] = await Promise.all([
            prisma.user.findMany({
                where: { id: { in: postsRaw.map(p => p.authorId) } },
                select: { id: true, firstName: true, lastName: true, avatar: true },
            }),
            prisma.like.groupBy({
                by: ['postId'],
                where: { postId: { in: postIds } },
                _count: true,
            }),
            prisma.comment.groupBy({
                by: ['postId'],
                where: { postId: { in: postIds } },
                _count: true,
            }),
            prisma.postTag.findMany({
                where: { postId: { in: postIds } },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                },
            }),
        ])

        const authorMap = new Map(authors.map(a => [a.id, a]))
        const likeCountMap = new Map(likeCounts.map(lc => [lc.postId, lc._count]))
        const commentCountMap = new Map(commentCounts.map(cc => [cc.postId, cc._count]))
        const tagsMap = new Map()
        tags.forEach(tag => {
            if (!tagsMap.has(tag.postId)) tagsMap.set(tag.postId, [])
            tagsMap.get(tag.postId).push(tag)
        })

        const posts = postsRaw.map(post => ({
            id: post.id,
            content: post.content,
            image: post.image,
            video: post.video,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            authorId: post.authorId,
            privacy: post.privacy,
            author: authorMap.get(post.authorId),
            _count: {
                likes: likeCountMap.get(post.id) || 0,
                comments: commentCountMap.get(post.id) || 0,
            },
            tags: tagsMap.get(post.id) || [],
            userReactionType: post.userReactionType,
        }))

        res.json({ posts })
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
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } },
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
            // Use raw SQL to fetch posts with user's reaction in a single query
            const postsQuery = userId ? `
                SELECT
                    p.*,
                    l.type as "userReactionType"
                FROM "posts" p
                LEFT JOIN "likes" l ON l."postId" = p.id AND l."userId" = $1
                WHERE p.content ILIKE $2
                ORDER BY p."createdAt" DESC
                LIMIT $3
            ` : `
                SELECT
                    p.*,
                    NULL as "userReactionType"
                FROM "posts" p
                WHERE p.content ILIKE $1
                ORDER BY p."createdAt" DESC
                LIMIT $2
            `

            const postsRaw = userId
                ? await prisma.$queryRawUnsafe(postsQuery, userId, `%${query}%`, limit)
                : await prisma.$queryRawUnsafe(postsQuery, `%${query}%`, limit)

            // Fetch related data (author, counts) for all posts
            const postIds = postsRaw.map(p => p.id)
            const [authors, likeCounts, commentCounts] = await Promise.all([
                prisma.user.findMany({
                    where: { id: { in: postsRaw.map(p => p.authorId) } },
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                }),
                prisma.like.groupBy({
                    by: ['postId'],
                    where: { postId: { in: postIds } },
                    _count: true,
                }),
                prisma.comment.groupBy({
                    by: ['postId'],
                    where: { postId: { in: postIds } },
                    _count: true,
                }),
            ])

            const authorMap = new Map(authors.map(a => [a.id, a]))
            const likeCountMap = new Map(likeCounts.map(lc => [lc.postId, lc._count]))
            const commentCountMap = new Map(commentCounts.map(cc => [cc.postId, cc._count]))

            results.posts = postsRaw.map(post => ({
                id: post.id,
                content: post.content,
                image: post.image,
                video: post.video,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                authorId: post.authorId,
                privacy: post.privacy,
                author: authorMap.get(post.authorId),
                _count: {
                    likes: likeCountMap.get(post.id) || 0,
                    comments: commentCountMap.get(post.id) || 0,
                },
                userReactionType: post.userReactionType,
            }))
        }

        res.json(results)
    } catch (err) {
        next(err)
    }
}

module.exports = { searchUsers, searchPosts, globalSearch }
