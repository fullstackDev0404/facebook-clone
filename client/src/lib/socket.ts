import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL, STORAGE_KEYS } from './constants'

let socket: Socket | null = null

const getSocketBaseUrl = (): string => API_BASE_URL.replace(/\/api$/, '')

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
    })
  }

  return socket
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
  }
}
