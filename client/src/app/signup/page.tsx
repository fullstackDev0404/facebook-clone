"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Info, Loader2, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { validateSignup } from '@/lib/validation'
import { authApi } from '@/lib/api'
import { AuthFooter } from '@/component/auth/AuthLayout'

const GENDERS = ['Female', 'Male', 'Custom'] as const

const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-xl text-[14px] outline-none transition-all border ${
    hasError
      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : 'border-[#dddfe2] bg-[#f5f6f7] focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20'
  } text-[#1c1e21] placeholder-[#8a8d91]`

type Fields = { firstName: string; lastName: string; username: string; email: string; password: string; dob: string; gender: string }

const SignupPage = () => {
  const router = useRouter()
  const { login } = useAuth()
  const [mounted, setMounted]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [fields, setFields]     = useState<Fields>({ firstName: '', lastName: '', username: '', email: '', password: '', dob: '', gender: '' })

  useEffect(() => {
    setMounted(true)
  }, [])

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => setFields(f => ({ ...f, [k]: e.target.value }))
  const err = (k: string) => submitted ? errors[k] : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateSignup(fields)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      const { token, user } = await authApi.register(fields)
      login(user, token)
      router.push('/')
    } catch (e) {
      setErrors({ api: e instanceof Error ? e.message : 'Registration failed' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-5">
          <div className="flex items-center gap-1">
            <Image src="/images/facebook-logo.jpg" alt="Facebook" width={40} height={40} className="rounded-full" />
            <span className="text-[#1877f2] text-4xl font-bold tracking-tight ml-1">facebook</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[#dddfe2] flex items-center justify-between">
            <div>
              <h2 className="text-[22px] font-bold text-[#1c1e21]">Create a new account</h2>
              <p className="text-[#8a8d91] text-[14px] mt-0.5">It&apos;s quick and easy.</p>
            </div>
            <Link href="/login" className="p-1.5 hover:bg-[#f0f2f5] rounded-full transition-colors">
              <X className="w-5 h-5 text-[#8a8d91]" />
            </Link>
          </div>

          <div className="px-6 py-4">
            {errors.api && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] px-4 py-3 rounded-xl mb-3">{errors.api}</div>
            )}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              <div className="flex gap-2">
                {(['firstName', 'lastName'] as const).map(k => (
                  <div key={k} className="flex-1">
                    <input type="text" placeholder={k === 'firstName' ? 'First name' : 'Last name'}
                      value={fields[k]} onChange={set(k)} className={inputCls(!!err(k))} />
                    {err(k) && <p className="text-red-500 text-[11px] mt-1 px-1">{err(k)}</p>}
                  </div>
                ))}
              </div>

              <div>
                <input type="text" placeholder="Username (e.g. john_doe)" value={fields.username}
                  onChange={set('username')} autoComplete="username" className={inputCls(!!err('username'))} />
                {err('username') && <p className="text-red-500 text-[11px] mt-1 px-1">{err('username')}</p>}
              </div>

              <div>
                <input type="text" placeholder="Mobile number or email address" value={fields.email}
                  onChange={set('email')} autoComplete="email" className={inputCls(!!err('email'))} />
                {err('email') && <p className="text-red-500 text-[11px] mt-1 px-1">{err('email')}</p>}
              </div>

              <div>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="New password" value={fields.password}
                    onChange={set('password')} autoComplete="new-password" className={inputCls(!!err('password')) + ' pr-10'} />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8d91] hover:text-[#1c1e21]">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {err('password') && <p className="text-red-500 text-[11px] mt-1 px-1">{err('password')}</p>}
              </div>

              <div>
                <label className="text-[12px] text-[#8a8d91] mb-1.5 flex items-center gap-1.5 font-medium">
                  Date of birth
                  <span title="Providing your birthday helps make sure you get the right Facebook experience.">
                    <Info className="w-3.5 h-3.5 cursor-help" />
                  </span>
                </label>
                <input type="date" value={fields.dob} onChange={set('dob')}
                  max={new Date().toISOString().split('T')[0]} className={inputCls(!!err('dob'))} />
                {err('dob') && <p className="text-red-500 text-[11px] mt-1 px-1">{err('dob')}</p>}
              </div>

              <div>
                <label className="text-[12px] text-[#8a8d91] mb-1.5 flex items-center gap-1.5 font-medium">
                  Gender
                  <span title="You can change who sees your gender on your profile.">
                    <Info className="w-3.5 h-3.5 cursor-help" />
                  </span>
                </label>
                <div className="flex gap-2">
                  {GENDERS.map(g => (
                    <label key={g} className={`flex-1 flex items-center justify-between border rounded-xl px-3 py-2.5 text-[14px] cursor-pointer transition-all ${
                      fields.gender === g ? 'border-[#1877f2] bg-[#e7f3ff] text-[#1877f2] font-medium' : 'border-[#dddfe2] bg-[#f5f6f7] text-[#1c1e21] hover:bg-[#ebedf0]'
                    }`}>
                      {g}
                      <input type="radio" name="gender" value={g} checked={fields.gender === g}
                        onChange={set('gender')} className="accent-[#1877f2] w-4 h-4" />
                    </label>
                  ))}
                </div>
                {err('gender') && <p className="text-red-500 text-[11px] mt-1 px-1">{err('gender')}</p>}
              </div>

              <p className="text-[11px] text-[#8a8d91] leading-relaxed">
                By clicking Sign Up, you agree to our{' '}
                {['Terms', 'Privacy Policy', 'Cookies Policy'].map((t, i) => (
                  <span key={t}><Link href="#" className="text-[#1877f2] hover:underline font-medium">{t}</Link>{i < 2 ? ', ' : '.'}</span>
                ))}
              </p>

              <div className="flex justify-center pt-1 pb-2">
                <button type="submit" disabled={loading}
                  className="bg-[#42b72a] hover:bg-[#36a420] disabled:opacity-60 text-white font-bold px-10 py-2.5 rounded-xl text-[17px] transition-all flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2 my-3">
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
                  Sign up with Google
                </button>
                <div className="h-3" />
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
                  Sign up with Microsoft
                </button>
              </>
            )}

            <div className="text-center border-t border-[#dddfe2] pt-4 mt-6">
              <Link href="/login" className="text-[#1877f2] text-[14px] font-semibold hover:underline">Already have an account?</Link>
            </div>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  )
}

export default SignupPage
