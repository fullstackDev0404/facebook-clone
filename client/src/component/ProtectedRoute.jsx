"use client"
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
                <div className="w-10 h-10 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) return null

    return <>{children}</>
}

export default ProtectedRoute
