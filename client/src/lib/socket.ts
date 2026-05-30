import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL, STORAGE_KEYS } from './constants'

let socket: Socket | null = null

const getSocketBaseUrl = (): string => API_BASE_URL.replace(/\/api$/, '')

const createSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null
  if (socket) return socket

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  if (!token) return null

  socket = io(getSocketBaseUrl(), {
    auth: { token },
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  })

  socket.on('connect', () => {
    // connected
  })

  socket.on('connect_error', () => {
    // silently handle — do NOT refresh token or reconnect manually here
    // socket.io's built-in reconnection handles retries
  })

  socket.on('disconnect', (reason) => {
    // Only reconnect if server explicitly disconnected (not a network drop)
    if (reason === 'io server disconnect') {
      socket?.connect()
    }
  })

  return socket
}

export const connectSocket = (): Socket | null => {
  const s = createSocket()
  if (!s) return null
  if (!s.connected) s.connect()
  return s
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
