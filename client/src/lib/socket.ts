import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL, STORAGE_KEYS } from './constants'

let socket: Socket | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const INITIAL_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000

const getSocketBaseUrl = (): string => API_BASE_URL.replace(/\/api$/, '')

const getReconnectDelay = (attempt: number): number => {
  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY)
  return delay + Math.random() * 1000 // Add jitter
}

const createSocket = (): Socket | null => {
  if (typeof window === 'undefined') {
    return null
  }

  if (!socket) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) {
      return null
    }

    socket = io(getSocketBaseUrl(), {
      auth: { token },
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: getReconnectDelay(reconnectAttempts),
      reconnectionDelayMax: MAX_RECONNECT_DELAY,
    })

    socket.on('connect', () => {
      reconnectAttempts = 0
      console.debug('Socket connected successfully')
    })

    socket.on('connect_error', (err) => {
      reconnectAttempts++
      console.debug('Socket connection error:', err.message)
      
      // If error is due to authentication, try to refresh token
      if (err.message.includes('Authentication') || err.message.includes('token') || err.message.includes('expired')) {
        handleTokenRefresh()
      }
    })

    socket.on('disconnect', (reason) => {
      console.debug('Socket disconnected:', reason)
      if (reason === 'io server disconnect') {
        // Server disconnected the client, need to manually reconnect
        socket?.connect()
      }
    })

    socket.on('token:expiring', async (data) => {
      console.debug('Token expiring soon, refreshing...', data)
      await handleTokenRefresh()
    })
  }

  return socket
}

const handleTokenRefresh = async () => {
  try {
    // Try to get a new token from the auth endpoint
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token)
        // Update socket auth with new token
        if (socket) {
          socket.auth = { token: data.token }
          socket.disconnect()
          socket.connect()
        }
      }
    }
  } catch (err) {
    console.debug('Token refresh failed:', err)
  }
}

export const connectSocket = (): Socket | null => {
  const socketClient = createSocket()
  if (!socketClient) return null

  if (!socketClient.connected) {
    socketClient.connect()
  }
  return socketClient
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    reconnectAttempts = 0
  }
}
