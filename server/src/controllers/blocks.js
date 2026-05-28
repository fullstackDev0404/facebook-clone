const prisma = require('../lib/prisma')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')

/**
 * POST /api/blocks
 * Body: { blockedId: string }
 * Block a user
 */
const blockUser = async (req, res, next) => {
  try {
    const { blockedId } = req.body
    const blockerId = req.user.id

    // Validate input
    if (!blockedId) {
      return res.status(400).json({ error: 'User ID to block is required' })
    }

    // Cannot block yourself
    if (blockedId === blockerId) {
      return res.status(400).json({ error: 'Cannot block yourself' })
    }

    // Check if user exists
    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true, firstName: true, lastName: true }
    })

    if (!blockedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId
        }
      }
    })

    if (existingBlock) {
      return res.status(400).json({ error: 'User is already blocked' })
    }

    // Create block
    const block = await prisma.block.create({
      data: {
        blockerId,
        blockedId
      },
      include: {
        blocked: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        }
      }
    })

    // Remove any existing friendship
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId },
          { senderId: blockedId, receiverId: blockerId }
        ]
      }
    }).catch(() => {})

    // Log block action
    logActivity(blockerId, ACTIVITY_TYPES.BLOCK_CREATE, 'user', blockedId).catch(() => {})

    res.status(201).json({ block })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/blocks/:blockedId
 * Unblock a user
 */
const unblockUser = async (req, res, next) => {
  try {
    const blockedId = req.params.blockedId
    const blockerId = req.user.id

    // Check if block exists
    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId
        }
      }
    })

    if (!block) {
      return res.status(404).json({ error: 'Block not found' })
    }

    // Delete block
    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId
        }
      }
    })

    // Log unblock action
    logActivity(blockerId, ACTIVITY_TYPES.BLOCK_DELETE, 'user', blockedId).catch(() => {})

    res.json({ message: 'User unblocked successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/blocks
 * Get list of blocked users
 */
const getBlockedUsers = async (req, res, next) => {
  try {
    const blockerId = req.user.id
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const [blocks, total] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId },
        include: {
          blocked: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.block.count({ where: { blockerId } })
    ])

    res.json({
      blocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/blocks/check/:userId
 * Check if a user is blocked
 */
const checkBlock = async (req, res, next) => {
  try {
    const userId = req.params.userId
    const blockerId = req.user.id

    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: userId
        }
      }
    })

    res.json({ isBlocked: !!block })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/blocks/blocked-by
 * Get users who have blocked the current user
 */
const getBlockedBy = async (req, res, next) => {
  try {
    const blockedId = req.user.id
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const [blocks, total] = await Promise.all([
      prisma.block.findMany({
        where: { blockedId },
        include: {
          blocker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.block.count({ where: { blockedId } })
    ])

    res.json({
      blocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkBlock,
  getBlockedBy
}
