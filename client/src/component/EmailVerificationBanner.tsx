"use client"
import { useState } from 'react'
import { X, Mail, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/lib/api'
import { toast } from 'sonner'

const EmailVerificationBanner = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!user || user.emailVerified) return null

  const handleResend = async () => {
    setLoading(true)
    try {
      await authApi.resendVerification()
      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      toast.error('Failed to send verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#fff3cd] border-b border-[#ffc107] px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Mail className="w-5 h-5 text-[#856404] flex-shrink-0" />
          <p className="text-sm text-[#856404]">
            Please verify your email address to access all features.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-sm font-medium text-[#856404] hover:text-[#664d03] disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationBanner
