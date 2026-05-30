"use client"
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

const VerifyEmailPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/verify-email?token=${token}`)
        const data = await res.json()
        
        if (res.ok) {
          setStatus('success')
          setMessage('Email verified successfully!')
          setTimeout(() => router.push('/'), 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-[#1877f2]" />
            <p className="text-[#65676b] text-lg">Verifying your email...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-16 h-16 text-[#42b72a]" />
            <h2 className="text-2xl font-bold text-[#1c1e21]">Success!</h2>
            <p className="text-[#65676b]">{message}</p>
            <p className="text-[#8a8d91] text-sm">Redirecting to home...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-[#dc3545]" />
            <h2 className="text-2xl font-bold text-[#1c1e21]">Error</h2>
            <p className="text-[#65676b]">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
