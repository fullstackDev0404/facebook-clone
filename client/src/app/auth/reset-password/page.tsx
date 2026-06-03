"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { authApi } from '@/lib/api'

const ResetPasswordPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Invalid reset link')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full relative">
        <div className="absolute top-4 left-4">
          <Link href="/login" className="p-2 hover:bg-[#e4e6eb] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#1c1e21]" />
          </Link>
        </div>

        {status === 'idle' && (
          <>
            <h2 className="text-2xl font-bold text-[#1c1e21] text-center mb-2">Reset Password</h2>
            <p className="text-[#65676b] text-center mb-6">Enter your new password</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="w-full px-4 py-3 rounded-lg border border-[#dddfe2] bg-white text-sm outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                  className="w-full px-4 py-3 rounded-lg border border-[#dddfe2] bg-white text-sm outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="w-16 h-16 text-[#42b72a]" />
            <h2 className="text-2xl font-bold text-[#1c1e21]">Password Reset!</h2>
            <p className="text-[#65676b]">Your password has been successfully reset.</p>
            <Link
              href="/login"
              className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-3 rounded-lg transition-all text-center block"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="w-16 h-16 text-[#dc3545]" />
            <h2 className="text-2xl font-bold text-[#1c1e21]">Error</h2>
            <p className="text-[#65676b]">{error}</p>
            <Link
              href="/forgot-password"
              className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-3 rounded-lg transition-all text-center block"
            >
              Try Again
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
