const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../lib/prisma')
const logger = require('../lib/logger')

let io
const userConnections = new Map() // Track connections per user for connection pooling
const typingUsers = new Map() // Track typing status: Map<receiverId, Map<senderId, timeoutId>>

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (!token) throw new Error('No token provided')

      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: false })
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, firstName: true, lastName: true, avatar: true },
      })

      if (!user) throw new Error('User not found')
      socket.user = user
      socket.tokenExpiry = decoded.exp * 1000 // Store expiry timestamp
      next()
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        next(new Error('Token expired'))
      } else {
        next(new Error('Authentication error'))
      }
    }
  })

  io.on('connection', (socket) => {
    socket.requestId = crypto.randomUUID()
    socket.join(socket.user.id)
    
    // Track connection for connection pooling
    const userId = socket.user.id
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set())
    }
    userConnections.get(userId).add(socket)
    
    socket.emit('socket:connected', { userId: socket.user.id })
    logger.info({ event: 'socket:connected', socketId: socket.id, userId: socket.user.id, reqId: socket.requestId, connections: userConnections.get(userId)?.size })

    // Check token expiry periodically
    const tokenCheckInterval = setInterval(() => {
      if (socket.tokenExpiry && Date.now() > socket.tokenExpiry - 60000) { // 1 minute before expiry
        socket.emit('token:expiring', { expiresIn: socket.tokenExpiry - Date.now() })
      }
    }, 30000) // Check every 30 seconds

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

    // Typing indicator events
    socket.on('typing', (payload) => {
      const { receiverId } = payload || {}
      if (!receiverId || typeof receiverId !== 'string') {
        logger.warn({ event: 'socket:typing:invalid', socketId: socket.id, userId: socket.user.id, reqId: socket.requestId, payload })
        return
      }
      if (receiverId === socket.user.id) {
        return
      }

      logger.info({ event: 'socket:typing', socketId: socket.id, userId: socket.user.id, receiverId, reqId: socket.requestId })

      // Clear existing timeout if any
      if (typingUsers.has(receiverId) && typingUsers.get(receiverId).has(socket.user.id)) {
        clearTimeout(typingUsers.get(receiverId).get(socket.user.id))
      }

      // Set up typing status for this receiver
      if (!typingUsers.has(receiverId)) {
        typingUsers.set(receiverId, new Map())
      }
      typingUsers.get(receiverId).set(socket.user.id, null)

      // Emit typing indicator to receiver
      io.to(receiverId).emit('user:typing', {
        senderId: socket.user.id,
        senderName: `${socket.user.firstName} ${socket.user.lastName}`,
        senderAvatar: socket.user.avatar,
      })
    })

    socket.on('stop_typing', (payload) => {
      const { receiverId } = payload || {}
      if (!receiverId || typeof receiverId !== 'string') {
        logger.warn({ event: 'socket:stop_typing:invalid', socketId: socket.id, userId: socket.user.id, reqId: socket.requestId, payload })
        return
      }
      if (receiverId === socket.user.id) {
        return
      }

      logger.info({ event: 'socket:stop_typing', socketId: socket.id, userId: socket.user.id, receiverId, reqId: socket.requestId })

      // Clear typing status
      if (typingUsers.has(receiverId) && typingUsers.get(receiverId).has(socket.user.id)) {
        const timeoutId = typingUsers.get(receiverId).get(socket.user.id)
        if (timeoutId) clearTimeout(timeoutId)
        typingUsers.get(receiverId).delete(socket.user.id)

        // Emit stop typing indicator to receiver
        io.to(receiverId).emit('user:stop_typing', {
          senderId: socket.user.id,
        })
      }
    })

    socket.on('mark_messages_read', async (payload, callback) => {
      const { senderId } = payload || {}
      if (!senderId || typeof senderId !== 'string') {
        logger.warn({ event: 'socket:mark_messages_read:invalid', socketId: socket.id, userId: socket.user.id, reqId: socket.requestId, payload })
        return callback?.({ success: false, error: 'senderId is required' })
      }
      if (senderId === socket.user.id) {
        return callback?.({ success: false, error: 'Cannot mark your own messages as read' })
      }

      logger.info({ event: 'socket:mark_messages_read', socketId: socket.id, userId: socket.user.id, senderId, reqId: socket.requestId })

      try {
        // Update all unread messages from the sender to the current user
        const result = await prisma.message.updateMany({
          where: {
            senderId: senderId,
            receiverId: socket.user.id,
            read: false,
          },
          data: {
            read: true,
          },
        })

        // Emit seen status update to the sender so they can update their UI
        io.to(senderId).emit('message:seen', {
          senderId: senderId,
          receiverId: socket.user.id,
          count: result.count
        })

        logger.info({ event: 'message:marked_read', socketId: socket.id, userId: socket.user.id, senderId, count: result.count, reqId: socket.requestId })
        callback?.({ success: true, count: result.count })
      } catch (err) {
        logger.error({ event: 'message:mark_read_error', socketId: socket.id, userId: socket.user.id, senderId, error: err.message, reqId: socket.requestId })
        callback?.({ success: false, error: err.message })
      }
    })

    socket.on('disconnect', (reason) => {
      clearInterval(tokenCheckInterval)

      // Clean up typing status for this user
      typingUsers.forEach((sendersMap, receiverId) => {
        if (sendersMap.has(socket.user.id)) {
          const timeoutId = sendersMap.get(socket.user.id)
          if (timeoutId) clearTimeout(timeoutId)
          sendersMap.delete(socket.user.id)
          io.to(receiverId).emit('user:stop_typing', { senderId: socket.user.id })
        }
      })

      // Remove from connection pool
      if (userConnections.has(userId)) {
        userConnections.get(userId).delete(socket)
        if (userConnections.get(userId).size === 0) {
          userConnections.delete(userId)
        }
      }

      logger.info({ event: 'socket:disconnected', socketId: socket.id, userId: socket.user.id, reqId: socket.requestId, reason, remainingConnections: userConnections.get(userId)?.size })
      socket.leave(socket.user.id)
    })
  })

  return io
}

const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

const getUserConnections = (userId) => {
  return userConnections.get(userId)?.size || 0
}

const emitNotificationCount = async (userId) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    })
    io.to(userId).emit('notification:unread_count', { unreadCount })
    return true
  } catch (err) {
    logger.error({ event: 'notification:count:error', userId, error: err.message })
    return false
  }
}

module.exports = { initSocket, getIo, getUserConnections, emitNotificationCount }
