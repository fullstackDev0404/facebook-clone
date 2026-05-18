"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '@/lib/api'
import { STORAGE_KEYS } from '@/lib/constants'
import type { AuthContextValue, User } from '@/types'

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const rehydrate = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
        if (!token) return
        const { user } = await authApi.me()
        setUser(user)
      } catch {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
      } finally {
        setLoading(false)
      }
    }
    rehydrate()
  }, [])

  const login = (userData: User, token: string) => {
    setUser(userData)
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
