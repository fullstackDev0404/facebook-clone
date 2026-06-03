"use client"
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const VerifyEmailPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'sent'>('loading')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const sent = searchParams.get('sent')
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')

    if (emailParam) setEmail(emailParam)

    if (sent === 'true') {
      setStatus('sent')
      setMessage('A verification email has been sent to your email address. Please check your inbox and click the link to verify your account.')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail(token)
        setStatus('success')
        setMessage('Email verified successfully!')
        setTimeout(() => router.push('/login'), 2000)
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Verification failed')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  const handleResend = async () => {
    if (!email) {
      setMessage('Email address is required to resend verification')
      return
    }
    setResending(true)
    try {
      await authApi.resendVerification(email)
      setMessage('Verification email resent successfully!')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to resend email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center relative">
        <div className="absolute top-4 left-4">
          <Link href="/signup" className="p-2 hover:bg-[#e4e6eb] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#1c1e21]" />
          </Link>
        </div>
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-[#1877f2]" />
            <p className="text-[#65676b] text-lg">Verifying your email...</p>
          </div>
        )}
        
        {status === 'sent' && (
          <div className="flex flex-col items-center gap-4">
            <Mail className="w-16 h-16 text-[#1877f2]" />
            <h2 className="text-2xl font-bold text-[#1c1e21]">Check your email</h2>
            <p className="text-[#65676b]">{message}</p>
            
            <div className="w-full mt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 rounded-lg border border-[#dddfe2] bg-white text-sm outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
              />
            </div>
            
            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resend verification email'}
              </button>
            </div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-16 h-16 text-[#42b72a]" />
            <h2 className="text-2xl font-bold text-[#1c1e21]">Success!</h2>
            <p className="text-[#65676b]">{message}</p>
            <p className="text-[#8a8d91] text-sm">Redirecting to login...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-[#dc3545]" />
            <h2 className="text-2xl font-bold text-[#1c1e21]">Error</h2>
            <p className="text-[#65676b]">{message}</p>
            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resend verification email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
