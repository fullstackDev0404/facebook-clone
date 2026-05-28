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

  update: (postId: string, data: string | FormData) => {
    const token = getToken()
    if (data instanceof FormData) {
      return fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data,
      }).then(async (res) => {
        const result = await res.json().catch(() => ({}))
        if (!res.ok) throw new ApiError(result.error || 'Something went wrong', res.status)
        return result as { post: import('@/types').PostRecord }
      })
    }
    return request<{ post: import('@/types').PostRecord }>(`/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content: data }),
    })
  },

  delete: (postId: string) =>
    request<{ message: string }>(`/posts/${postId}`, { method: 'DELETE' }),

  getComments: (postId: string) =>
    request<{ comments: import('@/types').Comment[] }>(`/posts/${postId}/comments`),

  getReactions: (postId: string) =>
    request<{ breakdown: Record<string, number> }>(`/posts/${postId}/likes`),

  createComment: (postId: string, { content, parentId }: { content: string; parentId?: string }) =>
    request<{ comment: import('@/types').Comment }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    }),
}

// ─── Stories ────────────────────────────────────────────────────────────────────

export const storiesApi = {
  getFeed: () =>
    request<{ stories: import('@/types').StoryRecord[] }>(`/stories/feed`),

  create: (image: File | undefined, text?: string, backgroundColor?: string) => {
    const token = getToken()
    const form = new FormData()
    if (image)   form.append('image', image)
    if (text)    form.append('text', text)
    if (backgroundColor) form.append('backgroundColor', backgroundColor)
    return fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new ApiError(data.error || 'Something went wrong', res.status)
      return data as { story: import('@/types').StoryRecord }
    })
  },

  delete: (id: string) =>
    request<{ message: string }>(`/stories/${id}`, { method: 'DELETE' }),
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
export const usersApi = {
  getProfile: (id: string) =>
    request<{ user: UserProfile; recentPosts: import('@/types').PostRecord[] }>(`/users/${id}`),
}

export const messagesApi = {
  getChatHistory: (userId: string) =>
    request<ConversationResponse>(`/messages/${userId}`),

  send: (receiverId: string, content: string) =>
    request<{ message: MessageRecord }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    }),
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

export interface FriendEntry {
  friendshipId: string
  friend: import('@/types').Author
  since: string
}

export interface MessageRecord {
  id: string
  content: string
  createdAt: string
  senderId: string
  receiverId: string
  sender: import('@/types').Author
  receiver: import('@/types').Author
}

export interface ConversationResponse {
  conversation: {
    participant: import('@/types').Author
    messages: MessageRecord[]
  }
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  coverPhoto: string | null
  bio: string | null
  dob: string | null
  gender: string | null
  createdAt: string
  postsCount: number
  friendsCount: number
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

// ─── Search ─────────────────────────────────────────────────────────────────────

export const searchApi = {
  users: (query: string, limit = 10) =>
    request<{ users: import('@/types').Author[] }>(`/search/users?q=${encodeURIComponent(query)}&limit=${limit}`),

  posts: (query: string, limit = 10) =>
    request<{ posts: import('@/types').PostRecord[] }>(`/search/posts?q=${encodeURIComponent(query)}&limit=${limit}`),

  global: (query: string, type = 'all', limit = 5) =>
    request<{ users?: import('@/types').Author[]; posts?: import('@/types').PostRecord[] }>(
      `/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`
    ),
}

// ─── Analytics ───────────────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: () =>
    request<{ overview: { postsCount: number; commentsCount: number; likesGiven: number; friendsCount: number }; recentActivity: Record<string, number> }>('/analytics/overview'),

  activityTimeline: (days = 30) =>
    request<{ timeline: Record<string, any[]>; totalActivities: number }>(`/analytics/activity?days=${days}`),

  posts: () =>
    request<{ totalPosts: number; totalLikes: number; totalComments: number; avgLikesPerPost: number; avgCommentsPerPost: number; mostLikedPost: any }>('/analytics/posts'),

  engagement: (days = 30) =>
    request<{ period: string; received: { likes: number; comments: number }; given: { likes: number; comments: number } }>(`/analytics/engagement?days=${days}`),
}

// ─── Moderation ─────────────────────────────────────────────────────────────────

export interface Report {
  id: string
  entityType: string
  entityId: string
  reason: string
  description: string | null
  status: string
  createdAt: string
  reporter: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  reviewer: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export const moderationApi = {
  createReport: (data: { entityType: string; entityId: string; reason: string; description?: string }) =>
    request<{ report: Report }>('/moderation/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReports: ({ status, page = 1, limit = 20 }: { status?: string; page?: number; limit?: number } = {}) =>
    request<{ reports: Report[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean } }>(
      `/moderation/reports${status ? `?status=${status}` : '?status=all'}&page=${page}&limit=${limit}`
    ),

  getReport: (id: string) =>
    request<{ report: Report; entityDetails: any }>(`/moderation/reports/${id}`),

  updateReport: (id: string, data: { status: string; resolution?: string }) =>
    request<{ report: Report }>(`/moderation/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createAction: (data: { entityType: string; entityId: string; action: string; reason?: string }) =>
    request<{ moderationAction: any; result: any }>('/moderation/moderation/actions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStats: () =>
    request<{ stats: { totalReports: number; pendingReports: number; resolvedReports: number; dismissedReports: number }; reportsByReason: { reason: string; count: number }[]; recentActions: any[] }>('/moderation/moderation/stats'),

  analyzeText: (text: string) =>
    request<{ safe: boolean; profanityDetected: boolean; spamDetected: boolean; profanityWords: string[]; spamReasons: string[]; censoredText: string; shouldFlag: boolean }>('/moderation/moderation/analyze', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
}

// ─── Blocks ─────────────────────────────────────────────────────────────────────

export interface Block {
  id: string
  blockerId: string
  blockedId: string
  createdAt: string
  blocked: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
    username: string | null
  }
}

export const blocksApi = {
  blockUser: (blockedId: string) =>
    request<{ block: Block }>('/blocks', {
      method: 'POST',
      body: JSON.stringify({ blockedId }),
    }),

  unblockUser: (blockedId: string) =>
    request<{ message: string }>(`/blocks/${blockedId}`, {
      method: 'DELETE',
    }),

  getBlockedUsers: ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) =>
    request<{ blocks: Block[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean } }>(
      `/blocks?page=${page}&limit=${limit}`
    ),

  checkBlock: (userId: string) =>
    request<{ isBlocked: boolean }>(`/blocks/check/${userId}`),

  getBlockedBy: ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) =>
    request<{ blocks: Block[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean } }>(
      `/blocks/blocked-by?page=${page}&limit=${limit}`
    ),
}
