const prisma = require('../lib/prisma')
const { getIo } = require('../lib/socket')
const uploadAvatar = require('../lib/uploadAvatar') // provides `toUrlPath`

/**
 * Normalise a user-shaped object so avatar paths always use forward slashes
 * and every user has predictable `name`, `initials`, and `avatarUrl` fields.
 */
function normaliseUser(u) {
  if (!u) return u
  return {
    ...u,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
    initials: `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?',
    avatar: u.avatar ? uploadAvatar.toUrlPath(u.avatar) : null,
  }
}

/**
 * GET /api/messages/:userId
 * Returns the chat history between the logged-in user and another user.
 */
const getChatHistory = async (req, res, next) => {
  try {
    const userId       = req.user.id
    const otherUserId  = req.params.userId

    if (userId === otherUserId) {
      return res.status(400).json({ error: 'Cannot fetch a conversation with yourself' })
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, firstName: true, lastName: true, avatar: true },
    })

    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender:   { select: { id: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    })

    // Normalise avatar paths on sender / receiver objects
    const cleanMessages = messages.map((m) => ({
      ...m,
      sender:   normaliseUser(m.sender),
      receiver: normaliseUser(m.receiver),
    }))

    res.json({ conversation: { participant: normaliseUser(otherUser), messages: cleanMessages } })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/messages
 * Sends a message from the logged-in user to another user.
 * Body: { receiverId: string, content: string }
 */
const sendMessage = async (req, res, next) => {
  try {
    const senderId   = req.user.id
    const { receiverId, content } = req.body

    if (!receiverId || typeof receiverId !== 'string') {
      return res.status(400).json({ error: 'receiverId is required' })
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    if (receiverId === senderId) {
      return res.status(400).json({ error: 'Cannot send a message to yourself' })
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    })

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' })
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender:   { select: { id: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    })

    // Normalise avatar paths before broadcasting
    const normalised = {
      ...message,
      sender:   normaliseUser(message.sender),
      receiver: normaliseUser(message.receiver),
    }

    try {
      const io = getIo()
      io.to(receiverId).emit('message:new', { message: normalised })
      io.to(senderId).emit('message:new', { message: normalised })
    } catch (err) {
      // Socket.io may not be initialized in some test or startup contexts.
    }

    res.status(201).json({ message: normalised })
  } catch (err) {
    next(err)
  }
}

module.exports = { getChatHistory, sendMessage }
