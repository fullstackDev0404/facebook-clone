"use client"
import React, { useState } from 'react'
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
  const { login } = useAuth()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [submitted, setSubmitted]   = useState(false)
  const [loading, setLoading]       = useState(false)

  const err = (k: string) => (submitted ? errors[k] : undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateLogin(email, password)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      const { token, user } = await authApi.login(email, password)
      login(user, token)
      router.push('/')
    } catch (e) {
      setErrors({ api: e instanceof Error ? e.message : 'Login failed' })
    } finally { setLoading(false) }
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
              <button type="submit" disabled={loading}
                className="w-full bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-[17px] transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log in'}
              </button>
            </form>
            <div className="text-center">
              <Link href="/forgot-password" className="text-[#1877f2] text-[14px] font-medium hover:underline">Forgot password?</Link>
            </div>
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#dddfe2]" />
              <span className="text-[#8a8d91] text-[13px]">or</span>
              <div className="flex-1 h-px bg-[#dddfe2]" />
            </div>
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
