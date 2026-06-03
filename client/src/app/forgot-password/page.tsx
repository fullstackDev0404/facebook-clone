"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { isValidEmailOrPhone, inputCls } from '@/lib/validation'
import { AuthFooter, FieldError } from '@/component/auth/AuthLayout'
import { authApi } from '@/lib/api'

const ForgotPasswordPage = () => {
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim())              { setError('Please enter your email or phone number'); return }
    if (!isValidEmailOrPhone(email)) { setError('Enter a valid email address or phone number'); return }
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      setMessage('If an account exists with this email, a password reset link has been sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) return
    setResending(true)
    try {
      await authApi.forgotPassword(email)
      setMessage('Reset link resent successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend reset link')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        {!sent ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Find your account</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your email or mobile number to search for your account.</p>
            </div>
            <form onSubmit={handleSubmit} noValidate className="p-6 flex flex-col gap-4">
              <div>
                <input type="text" placeholder="Email address or phone number" value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  autoComplete="email" className={inputCls(!!error)} />
                <FieldError message={error} />
              </div>
              <div className="flex justify-end gap-3">
                <Link href="/login" className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                  Cancel
                </Link>
                <button type="submit" disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-70 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Check your inbox</h2>
            <p className="text-sm text-gray-500">
              We sent a reset link to <span className="font-semibold text-gray-700">{email}</span>.
            </p>
            {message && <p className="text-sm text-green-600">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-70 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend reset link'}
              </button>
              <Link href="/login" className="w-full py-3 rounded-lg bg-[#f0f2f5] hover:bg-[#e4e6eb] text-[#1c1e21] font-bold text-sm transition-colors text-center block">
                Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
      <AuthFooter />
    </div>
  )
}

export default ForgotPasswordPage
