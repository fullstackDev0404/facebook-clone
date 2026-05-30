"use client"
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/lib/api'
import { STORAGE_KEYS } from '@/lib/constants'
import { Loader2 } from 'lucide-react'

const AuthCallbackPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  // Guard — run the callback handler exactly once
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = searchParams.get('token')

    if (!token) {
      router.replace('/login?error=no_token')
      return
    }

    // Store token first so authApi.me() can use it
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    authApi.me()
      .then(({ user }) => {
        login(user, token)
        router.replace('/')
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        router.replace('/login?error=auth_failed')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — we only want this to run once on mount

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#1877f2]" />
        <p className="text-[#65676b] text-lg">Signing you in...</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
