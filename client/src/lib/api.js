// Centralized API client for all backend requests

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

class ApiError extends Error {
    constructor(message, status) {
        super(message)
        this.status = status
    }
}

const getToken = () => {
    try { return localStorage.getItem('fb_token') } catch { return null }
}

const request = async (path, options = {}) => {
    const token = getToken()

    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        throw new ApiError(data.error || 'Something went wrong', res.status)
    }

    return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
    login: (email, password) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    register: (fields) =>
        request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(fields),
        }),

    me: () => request('/auth/me'),
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsApi = {
    /**
     * Fetch paginated feed.
     * @param {{ page?: number, limit?: number }} params
     */
    getFeed: ({ page = 1, limit = 10 } = {}) =>
        request(`/posts/feed?page=${page}&limit=${limit}`),

    /**
     * Create a post with optional image.
     * @param {{ content?: string, image?: File | null }} params
     */
    create: ({ content, image }) => {
        const token = getToken()
        const form = new FormData()
        if (content) form.append('content', content)
        if (image)   form.append('image', image)

        return fetch(`${BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                // Do NOT set Content-Type — browser sets it with the boundary
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: form,
        }).then(async (res) => {
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new ApiError(data.error || 'Something went wrong', res.status)
            }
            return data
        })
    },

    /**
     * Add or update a reaction on a post.
     * @param {string} postId
     * @param {{ type?: string }} params — defaults to "like"
     */
    like: (postId, { type = 'like' } = {}) =>
        request(`/posts/${postId}/like`, {
            method: 'POST',
            body: JSON.stringify({ type }),
        }),

    /**
     * Remove reaction from a post.
     * @param {string} postId
     */
    unlike: (postId) =>
        request(`/posts/${postId}/like`, { method: 'DELETE' }),

    /**
     * Fetch all comments for a post.
     * @param {string} postId
     */
    getComments: (postId) =>
        request(`/posts/${postId}/comments`),

    /**
     * Create a comment or reply.
     * @param {string} postId
     * @param {{ content: string, parentId?: string }} params
     */
    createComment: (postId, { content, parentId }) =>
        request(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, parentId }),
        }),
}

export { ApiError }
