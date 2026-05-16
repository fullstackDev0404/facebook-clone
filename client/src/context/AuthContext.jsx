"use client"
import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/lib/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Rehydrate from token on mount
    useEffect(() => {
        const rehydrate = async () => {
            try {
                const token = localStorage.getItem('fb_token')
                if (!token) return

                // Verify token is still valid by fetching current user
                const { user } = await authApi.me()
                setUser(user)
            } catch {
                // Token expired or invalid — clear it
                localStorage.removeItem('fb_token')
                localStorage.removeItem('fb_user')
            } finally {
                setLoading(false)
            }
        }
        rehydrate()
    }, [])

    const login = (userData, token) => {
        setUser(userData)
        localStorage.setItem('fb_token', token)
        localStorage.setItem('fb_user', JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('fb_token')
        localStorage.removeItem('fb_user')
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}
