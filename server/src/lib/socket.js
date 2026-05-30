const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../lib/prisma')
const logger = require('../lib/logger')

let io
const userConnections = new Map() // Track connections per user for connection pooling

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

    socket.on('disconnect', (reason) => {
      clearInterval(tokenCheckInterval)
      
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
