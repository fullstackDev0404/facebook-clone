"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { validateLogin } from '@/lib/validation'
import { authApi } from '@/lib/api'
import { AuthFooter } from '@/component/auth/AuthLayout'

const inputCls = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all border ${
    hasError
      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : 'border-[#dddfe2] bg-[#f5f6f7] focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20'
  } text-[#1c1e21] placeholder-[#8a8d91]`

const LoginPage = () => {
  const router = useRouter()
  const { login, user, loading } = useAuth()
  const [mounted, setMounted]       = useState(false)
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [submitted, setSubmitted]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect already-logged-in users away from login page
  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [user, loading, router])

  const err = (k: string) => (submitted ? errors[k] : undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateLogin(email, password)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSubmitting(true)
    try {
      const { token, user } = await authApi.login(email, password)
      login(user, token)
      router.push('/')
    } catch (e) {
      setErrors({ api: e instanceof Error ? e.message : 'Login failed' })
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 py-8 gap-8 max-w-5xl mx-auto w-full">

        {/* Branding */}
        <div className="flex flex-col items-center lg:items-start lg:flex-1 gap-4 lg:pb-16">
          <div className="flex items-center gap-1">
            <Image src="/images/facebook-logo.jpg" alt="Facebook" width={52} height={52} className="rounded-full" />
            <span className="text-[#1877f2] text-5xl font-bold tracking-tight ml-1">facebook</span>
          </div>
          <p className="text-[#1c1e21] text-xl leading-relaxed text-center lg:text-left max-w-xs">
            Connect with friends and the world around you on Facebook.
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-4 shadow-lg flex flex-col gap-3">
            {errors.api && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] px-4 py-3 rounded-xl">{errors.api}</div>
            )}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              <div>
                <input type="text" placeholder="Email address or phone number" value={email}
                  onChange={e => setEmail(e.target.value)} autoComplete="email" className={inputCls(!!err('email'))} />
                {err('email') && <p className="text-red-500 text-[12px] mt-1 px-1">{err('email')}</p>}
              </div>
              <div>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
                    onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    className={inputCls(!!err('password')) + ' pr-12'} />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8d91] hover:text-[#1c1e21] p-1">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {err('password') && <p className="text-red-500 text-[12px] mt-1 px-1">{err('password')}</p>}
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-[17px] transition-all flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log in'}
              </button>
            </form>
            <div className="text-center">
              <Link href="/forgot-password" className="text-[#1877f2] text-[14px] font-medium hover:underline">Forgot password?</Link>
            </div>
            <div className="h-3" />
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#dddfe2]" />
              <span className="text-[#8a8d91] text-[13px]">or</span>
              <div className="flex-1 h-px bg-[#dddfe2]" />
            </div>
            <div className="h-2" />
            {mounted && (
              <>
                <button
                  type="button"
                  onClick={() => authApi.googleAuth()}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-[#dddfe2] hover:bg-[#f5f6f7] text-[#1c1e21] font-semibold py-3 rounded-xl text-[15px] transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="h-2" />
                <button
                  type="button"
                  onClick={() => authApi.microsoftAuth()}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-[#dddfe2] hover:bg-[#f5f6f7] text-[#1c1e21] font-semibold py-3 rounded-xl text-[15px] transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Continue with Microsoft
                </button>
              </>
            )}
            <div className="flex justify-center pb-1">
              <Link href="/signup" className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold px-6 py-3 rounded-xl text-[15px] transition-all">
                Create new account
              </Link>
            </div>
          </div>
          <p className="text-center text-[13px] text-[#8a8d91] mt-5">
            <span className="font-semibold text-[#1c1e21]">Create a Page</span> for a celebrity, brand or business.
          </p>
        </div>
      </div>
      <AuthFooter showLanguages />
    </div>
  )
}

export default LoginPage
