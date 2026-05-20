import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL, STORAGE_KEYS } from './constants'

let socket: Socket | null = null

const getSocketBaseUrl = (): string => API_BASE_URL.replace(/\/api$/, '')

const createSocket = (): Socket => {
  if (typeof window === 'undefined') {
    throw new Error('Socket can only be created in the browser')
  }

  if (!socket) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) {
      throw new Error('Missing auth token for socket connection')
    }

    socket = io(getSocketBaseUrl(), {
      auth: { token },
      autoConnect: false,
      transports: ['websocket'],
    })
  }

  return socket
}

export const connectSocket = (): Socket => {
  const socketClient = createSocket()
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
