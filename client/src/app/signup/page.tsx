"use client"
import React, { useState } from 'react'
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

type Fields = { firstName: string; lastName: string; email: string; password: string; dob: string; gender: string }

const SignupPage = () => {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [fields, setFields]     = useState<Fields>({ firstName: '', lastName: '', email: '', password: '', dob: '', gender: '' })

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

            <div className="text-center border-t border-[#dddfe2] pt-4">
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
