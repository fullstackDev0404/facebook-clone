const prisma = require('../lib/prisma')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const uploadAvatar = require('../lib/uploadAvatar')

// Public profile data
const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params

    // Attempt to read optional Authorization header to determine relationship
    let viewerId = null
    try {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        viewerId = decoded.userId
      }
    } catch (err) {
      // ignore token errors for optional auth
      viewerId = null
    }

    // Fetch basic user info and counts
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        dob: true,
        gender: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    // Count posts separately (explicitly) and accepted friends count
    const [postsCount, friendsCount] = await Promise.all([
      prisma.post.count({ where: { authorId: id } }),
      prisma.friendship.count({
        where: {
          status: 'accepted',
          OR: [{ senderId: id }, { receiverId: id }],
        },
      }),
    ])

    // Recent posts (public view) — latest 10
    const recentPosts = await prisma.post.findMany({
      where: { authorId: id },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Relationship status relative to viewer
    let relationship = 'none' // none | self | friends | pending_sent | pending_received
    if (viewerId) {
      if (viewerId === id) relationship = 'self'
      else {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { senderId: viewerId, receiverId: id },
              { senderId: id, receiverId: viewerId },
            ],
          },
        })

        if (friendship) {
          if (friendship.status === 'accepted') relationship = 'friends'
          else if (friendship.status === 'pending') {
            relationship = friendship.senderId === viewerId ? 'pending_sent' : 'pending_received'
          }
        }
      }
    }

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        dob: user.dob,
        gender: user.gender,
        createdAt: user.createdAt,
        postsCount,
        friendsCount,
      },
      recentPosts,
      relationship,
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/users/profile
// Body (multipart/form-data): firstName (optional), lastName (optional), bio (optional), avatar (file, optional)
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { firstName, lastName, bio } = req.body

    const data = {}
    if (typeof firstName === 'string' && firstName.trim().length) data.firstName = firstName.trim()
    if (typeof lastName === 'string' && lastName.trim())   data.lastName  = lastName.trim()
    if (typeof bio === 'string')                           data.bio       = bio.trim()

    if (req.file) {
      // /avatars/* to db — always forward-slashes for browser URLs
      const avatarPath = uploadAvatar.toUrlPath(path.join('uploads', 'avatars', req.file.filename))

      // remove previous avatar file if exists and is local (async)
      const current = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } })
      if (current?.avatar?.startsWith('uploads/')) {
        // normalize any legacy backslash path before building the FS path
        const cleanPath = current.avatar.replace(/\\/g, '/')
        const oldPath   = path.join(process.cwd(), cleanPath)
        try {
          await fs.promises.unlink(oldPath)
        } catch (e) {
          // ignore errors (file may already be removed)
        }
      }

      data.avatar = avatarPath
    }

    const updated = await prisma.user.update({ where: { id: userId }, data, select: { id: true, firstName: true, lastName: true, bio: true, avatar: true, email: true } })

    res.json({ user: updated })
  } catch (err) {
    next(err)
  }
}

module.exports = { getProfile, updateProfile }

