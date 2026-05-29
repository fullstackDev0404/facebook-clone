const prisma = require('../lib/prisma')
const { emitNotificationCount } = require('../lib/socket')

// Shared author select shape
const USER_SELECT = {
  id: true, firstName: true, lastName: true, avatar: true, email: true,
}

/**
 * POST /api/friends/request
 * Body: { receiverId: string }
 * Send a friend request to another user.
 */
const sendRequest = async (req, res, next) => {
  try {
    const senderId   = req.user.id
    const { receiverId } = req.body

    if (!receiverId)            return res.status(400).json({ error: 'receiverId is required' })
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot send request to yourself' })

    // Check receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!receiver) return res.status(404).json({ error: 'User not found' })

    // Check for existing friendship in either direction
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    })

    if (existing) {
      // Option 2: Allow rejecter to send request back
      // If current user was the receiver (rejecter) and status is rejected, allow sending new request
      if (existing.status === 'rejected' && existing.receiverId === senderId) {
        // Delete the old rejected request and create a new one
        await prisma.friendship.delete({ where: { id: existing.id } })
      } 
      // Option 1: Allow re-sending after 30-day cooldown
      else if (existing.status === 'rejected' && existing.senderId === senderId) {
        const rejectionDate = new Date(existing.updatedAt)
        const cooldownDays = 30
        const cooldownExpiry = new Date(rejectionDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000)
        const now = new Date()
        
        if (now < cooldownExpiry) {
          const daysRemaining = Math.ceil((cooldownExpiry - now) / (24 * 60 * 60 * 1000))
          return res.status(409).json({ 
            error: `Request was previously rejected. You can send another request in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`,
            status: existing.status,
            cooldownRemaining: daysRemaining,
            friendshipId: existing.id
          })
        } else {
          // Cooldown expired, delete old request and allow new one
          await prisma.friendship.delete({ where: { id: existing.id } })
        }
      } else {
        const msg = {
          pending:  'Friend request already sent',
          accepted: 'Already friends',
        }[existing.status] ?? 'Friendship already exists'
        return res.status(409).json({ error: msg, status: existing.status })
      }
    }

    const friendship = await prisma.friendship.create({
      data: { senderId, receiverId, status: 'pending' },
      include: {
        receiver: { select: USER_SELECT },
        sender:   { select: USER_SELECT },
      },
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        type:     'friend_request',
        message:  `${req.user.firstName} ${req.user.lastName} sent you a friend request`,
        userId:   receiverId,
        actorId:  senderId,
        entityId: friendship.id,
      },
    })

    await emitNotificationCount(receiverId).catch(() => {})
    res.status(201).json({ friendship })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/friends/:id/respond
 * Body: { action: 'accept' | 'reject' }
 * Accept or reject a pending friend request.
 */
const respondToRequest = async (req, res, next) => {
  try {
    const { id }     = req.params
    const { action } = req.body
    const userId     = req.user.id

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "accept" or "reject"' })
    }

    const friendship = await prisma.friendship.findUnique({ where: { id } })
    if (!friendship)                        return res.status(404).json({ error: 'Friend request not found' })
    if (friendship.receiverId !== userId)   return res.status(403).json({ error: 'Not authorized' })
    if (friendship.status !== 'pending')    return res.status(409).json({ error: 'Request already responded to' })

    const updated = await prisma.friendship.update({
      where: { id },
      data:  { status: action === 'accept' ? 'accepted' : 'rejected' },
      include: {
        sender:   { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
    })

    if (action === 'accept') {
      await prisma.notification.create({
        data: {
          type:     'friend_accept',
          message:  `${req.user.firstName} ${req.user.lastName} accepted your friend request`,
          userId:   friendship.senderId,
          actorId:  userId,
          entityId: friendship.id,
        },
      })

      await emitNotificationCount(friendship.senderId).catch(() => {})
    }

    res.json({ friendship: updated })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/friends/:id
 * Remove an accepted friendship or cancel a pending request.
 */
const removeFriend = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const friendship = await prisma.friendship.findUnique({
      where: { id },
      include: {
        sender:   { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
    })
    if (!friendship) return res.status(404).json({ error: 'Friendship not found' })

    const isParty = friendship.senderId === userId || friendship.receiverId === userId
    if (!isParty) return res.status(403).json({ error: 'Not authorized' })

    // Determine which user is being removed (the one who didn't initiate the removal)
    const removedUserId = friendship.senderId === userId ? friendship.receiverId : friendship.senderId
    const removedUser = friendship.senderId === userId ? friendship.receiver : friendship.sender

    await prisma.friendship.delete({ where: { id } })

    // Only send notification if removing an accepted friendship (not canceling a pending request)
    if (friendship.status === 'accepted') {
      await prisma.notification.create({
        data: {
          type:     'friend_remove',
          message:  `${req.user.firstName} ${req.user.lastName} removed you from their friends list`,
          userId:   removedUserId,
          actorId:  userId,
          entityId: friendship.id,
        },
      })

      await emitNotificationCount(removedUserId).catch(() => {})
    }

    res.json({ message: 'Friendship removed' })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/friends/rejected/:id
 * Option 3: Delete a rejected friendship to allow sending a new request.
 */
const clearRejectedRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const friendship = await prisma.friendship.findUnique({ where: { id } })
    if (!friendship) return res.status(404).json({ error: 'Friend request not found' })

    // Only the sender can clear their own rejected request
    if (friendship.senderId !== userId) return res.status(403).json({ error: 'Not authorized' })
    if (friendship.status !== 'rejected') return res.status(400).json({ error: 'Only rejected requests can be cleared' })

    await prisma.friendship.delete({ where: { id } })
    res.json({ message: 'Rejected request cleared. You can now send a new friend request.' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/friends/requests
 * Returns all pending requests received by the logged-in user.
 */
const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await prisma.friendship.findMany({
      where:   { receiverId: req.user.id, status: 'pending' },
      include: { sender: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ requests })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/friends
 * Returns all accepted friends of the logged-in user (excluding blocked users).
 */
const getFriends = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Get IDs of users blocked by current user
    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true }
    })
    const blockedIds = new Set(blockedUsers.map(b => b.blockedId))

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender:   { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Normalize: always return the "other" user as the friend, excluding blocked users
    const friends = friendships
      .map(f => ({
        friendshipId: f.id,
        friend: f.senderId === userId ? f.receiver : f.sender,
        since:  f.updatedAt,
      }))
      .filter(f => !blockedIds.has(f.friend.id))

    res.json({ friends })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/friends/suggestions
 * Returns users who are not yet friends, have no pending request, and are not blocked.
 */
const getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Get user IDs in pending or accepted friendships with current user
    // Exclude rejected friendships so users can re-send requests
    const existing = await prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: { in: ['pending', 'accepted'] }
      },
      select: { senderId: true, receiverId: true },
    })

    // Get IDs of users blocked by current user
    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true }
    })

    const excludeIds = new Set([userId])
    existing.forEach(f => {
      excludeIds.add(f.senderId)
      excludeIds.add(f.receiverId)
    })
    blockedUsers.forEach(b => {
      excludeIds.add(b.blockedId)
    })

    const suggestions = await prisma.user.findMany({
      where:   { id: { notIn: [...excludeIds] } },
      select:  USER_SELECT,
      take:    10,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ suggestions })
  } catch (err) {
    next(err)
  }
}

module.exports = { sendRequest, respondToRequest, removeFriend, clearRejectedRequest, getPendingRequests, getFriends, getSuggestions }
