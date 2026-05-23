const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../lib/prisma')
const logger = require('../lib/logger')

let io
const onlineUsers = new Map()
const signupHistory = []
const HISTORY_BUCKET_MS = 5 * 60 * 1000
const MAX_HISTORY_POINTS = 12

const pruneSignupHistory = () => {
  const threshold = Date.now() - MAX_HISTORY_POINTS * HISTORY_BUCKET_MS
  while (signupHistory.length > 0 && signupHistory[0].timestamp < threshold) {
    signupHistory.shift()
  }
}

const getSignupSummary = () => {
  pruneSignupHistory()
  const history = signupHistory.slice(-MAX_HISTORY_POINTS)
  const signupsLastHour = history.reduce((sum, bucket) => sum + bucket.count, 0)
  return {
    onlineUsers: onlineUsers.size,
    signupsLastHour,
    signupHistory: history.map(bucket => bucket.count),
    signupBuckets: history,
  }
}

const broadcastDashboardUpdate = async () => {
  if (!io) return
  const payload = getSignupSummary()
  io.emit('dashboard:update', payload)
}

const recordSignup = async () => {
  const now = Date.now()
  const lastBucket = signupHistory[signupHistory.length - 1]

  if (lastBucket && now - lastBucket.timestamp < HISTORY_BUCKET_MS) {
    lastBucket.count += 1
  } else {
    signupHistory.push({ timestamp: now, count: 1 })
  }

  pruneSignupHistory()
  await broadcastDashboardUpdate()
}

const emitNotificationCount = async (userId) => {
  if (!io) return
  const unreadCount = await prisma.notification.count({ where: { userId, read: false } })
  io.to(userId).emit('notification:unread_count', { unreadCount })
  io.to(userId).emit('notification:new', { unreadCount })
}

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (!token) throw new Error('No token provided')

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, firstName: true, lastName: true, avatar: true },
      })

      if (!user) throw new Error('User not found')
      socket.user = user
      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    socket.requestId = crypto.randomUUID()
    const connectionCount = (onlineUsers.get(socket.user.id) ?? 0) + 1
    onlineUsers.set(socket.user.id, connectionCount)
    socket.join(socket.user.id)
    socket.emit('socket:connected', { userId: socket.user.id })
    socket.emit('online:init', { onlineUserIds: Array.from(onlineUsers.keys()) })
    socket.emit('dashboard:update', getSignupSummary())
    logger.info({ event: 'socket:connected', socketId: socket.id, userId: socket.user.id, reqId: socket.requestId })

    socket.broadcast.emit('user:online', { userId: socket.user.id })
    broadcastDashboardUpdate().catch(err => logger.error({ event: 'dashboard:update:error', error: err.message }))

    socket.on('disconnect', () => {
      const currentCount = onlineUsers.get(socket.user.id) ?? 0
      if (currentCount <= 1) {
        onlineUsers.delete(socket.user.id)
        socket.broadcast.emit('user:offline', { userId: socket.user.id })
      } else {
        onlineUsers.set(socket.user.id, currentCount - 1)
      }
      broadcastDashboardUpdate().catch(err => logger.error({ event: 'dashboard:update:error', error: err.message }))
    })

    socket.on('send_message', async (payload, callback) => {
      logger.info({ event: 'socket:send_message', socketId: socket.id, userId: socket.user.id, reqId: socket.requestId, payload: { receiverId: payload?.receiverId } })
      try {
        const { receiverId, content } = payload || {}
        if (!receiverId || typeof receiverId !== 'string') {
          throw new Error('receiverId is required')
        }
        if (!content || typeof content !== 'string' || !content.trim()) {
          throw new Error('Message content is required')
        }
        if (receiverId === socket.user.id) {
          throw new Error('Cannot send a message to yourself')
        }

        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
          select: { id: true, firstName: true, lastName: true, avatar: true },
        })
        if (!receiver) {
          throw new Error('Receiver not found')
        }

        const message = await prisma.message.create({
          data: {
            senderId: socket.user.id,
            receiverId,
            content: content.trim(),
          },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        })

        io.to(receiverId).emit('message:new', { message })
        io.to(socket.user.id).emit('message:new', { message })

        logger.info({ event: 'message:sent', socketId: socket.id, userId: socket.user.id, receiverId, reqId: socket.requestId })
        callback?.({ success: true, message })
      } catch (err) {
        logger.error({ event: 'message:error', socketId: socket.id, userId: socket.user.id, error: err.message, reqId: socket.requestId })
        if (typeof callback === 'function') callback({ success: false, error: err.message })
      }
    })

    socket.on('disconnect', () => {
      logger.info({ event: 'socket:disconnected', socketId: socket.id, userId: socket.user.id, reqId: socket.requestId })
      onlineUsers.delete(socket.user.id)
      broadcastDashboardUpdate().catch(err => logger.error({ event: 'dashboard:update:error', error: err.message }))
      socket.leave(socket.user.id)
    })
  })

  return io
}

const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

module.exports = {
  initSocket,
  getIo,
  broadcastDashboardUpdate,
  recordSignup,
  emitNotificationCount,
}
