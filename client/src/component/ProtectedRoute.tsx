"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  // Still checking auth — show spinner
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f0f2f5]">
      <div className="w-10 h-10 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
      <p className="text-[14px] text-[#65676b]">Signing you in...</p>
    </div>
  )

  // Auth resolved but no user — redirect in progress, render nothing
  if (!user) return null

  return <>{children}</>
}

export default ProtectedRoute
