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

export { ApiError }
