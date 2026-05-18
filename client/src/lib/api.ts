import { API_BASE_URL, MEDIA_BASE_URL, STORAGE_KEYS } from './constants'

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getToken = (): string | null => {
  try { return localStorage.getItem(STORAGE_KEYS.TOKEN) } catch { return null }
}

const request = async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong', res.status)
  return data as T
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: import('@/types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (fields: Record<string, string>) =>
    request<{ token: string; user: import('@/types').User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(fields),
    }),

  me: () =>
    request<{ user: import('@/types').User }>('/auth/me'),
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export const postsApi = {
  getFeed: ({ page = 1, limit = 10 } = {}) =>
    request<{ posts: import('@/types').PostRecord[] }>(`/posts/feed?page=${page}&limit=${limit}`),

  create: ({ content, image }: { content?: string; image?: File | null }) => {
    const token = getToken()
    const form = new FormData()
    if (content) form.append('content', content)
    if (image)   form.append('image', image)
    return fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new ApiError(data.error || 'Something went wrong', res.status)
      return data as { post: import('@/types').PostRecord }
    })
  },

  like: (postId: string, { type = 'like' } = {}) =>
    request(`/posts/${postId}/like`, { method: 'POST', body: JSON.stringify({ type }) }),

  unlike: (postId: string) =>
    request(`/posts/${postId}/like`, { method: 'DELETE' }),

  update: (postId: string, content: string) =>
    request<{ post: import('@/types').PostRecord }>(`/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  delete: (postId: string) =>
    request<{ message: string }>(`/posts/${postId}`, { method: 'DELETE' }),

  getComments: (postId: string) =>
    request<{ comments: import('@/types').Comment[] }>(`/posts/${postId}/comments`),

  createComment: (postId: string, { content, parentId }: { content: string; parentId?: string }) =>
    request<{ comment: import('@/types').Comment }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    }),
}

export { MEDIA_BASE_URL }

// ─── Friends ──────────────────────────────────────────────────────────────────

export const friendsApi = {
  sendRequest: (receiverId: string) =>
    request<{ friendship: FriendshipRecord }>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    }),

  respond: (id: string, action: 'accept' | 'reject') =>
    request<{ friendship: FriendshipRecord }>(`/friends/request/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    }),

  remove: (id: string) =>
    request<{ message: string }>(`/friends/${id}`, { method: 'DELETE' }),

  getPendingRequests: () =>
    request<{ requests: PendingRequest[] }>('/friends/requests'),

  getFriends: () =>
    request<{ friends: FriendEntry[] }>('/friends'),

  getSuggestions: () =>
    request<{ suggestions: import('@/types').Author[] }>('/friends/suggestions'),
}

// ─── Friend types (local to api.ts) ──────────────────────────────────────────

interface FriendshipRecord {
  id: string
  senderId: string
  receiverId: string
  status: string
  createdAt: string
  updatedAt: string
  sender?: import('@/types').Author
  receiver?: import('@/types').Author
}

interface PendingRequest {
  id: string
  senderId: string
  receiverId: string
  status: string
  createdAt: string
  sender: import('@/types').Author
}

interface FriendEntry {
  friendshipId: string
  friend: import('@/types').Author
  since: string
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationRecord {
  id: string
  type: string        // like | comment | friend_request | friend_accept | message
  message: string
  read: boolean
  userId: string
  actorId: string | null
  entityId: string | null
  createdAt: string
}

interface NotificationsResponse {
  notifications: NotificationRecord[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
}

export const notificationsApi = {
  getAll: ({ page = 1, limit = 20, unreadOnly = false } = {}) =>
    request<NotificationsResponse>(
      `/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`
    ),

  markRead: (id: string) =>
    request<{ notification: NotificationRecord }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllRead: () =>
    request<{ message: string; count: number }>('/notifications/read-all', {
      method: 'PUT',
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
}
