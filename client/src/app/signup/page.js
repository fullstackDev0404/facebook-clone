"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { validateSignup, inputCls } from '@/lib/validation'
import { AuthLogo, AuthFooter, FieldError } from '@/component/auth/AuthLayout'

const GENDERS = ['Female', 'Male', 'Custom']

const SignupPage = () => {
    const router = useRouter()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)

    const [fields, setFields] = useState({
        firstName: '', lastName: '', email: '', password: '', dob: '', gender: ''
    })
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)

    const set = (key) => (e) => setFields(f => ({ ...f, [key]: e.target.value }))
    const err = (key) => submitted && errors[key]

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitted(true)
        const errs = validateSignup(fields)
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        setLoading(true)
        await new Promise(r => setTimeout(r, 600))
        login({ name: `${fields.firstName} ${fields.lastName}`, email: fields.email })
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-4 gap-1">
                    <AuthLogo size="md" />
                    <p className="text-gray-600 text-sm">It&apos;s quick and easy.</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Create a new account</h2>
                    <p className="text-gray-500 text-sm mb-4">It&apos;s quick and easy.</p>
                    <hr className="border-gray-200 mb-4" />

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
                        {/* Name */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input type="text" placeholder="First name" value={fields.firstName}
                                    onChange={set('firstName')} autoComplete="given-name"
                                    className={inputCls(err('firstName')).replace('px-4 py-3', 'px-3 py-2')} />
                                <FieldError message={err('firstName')} />
                            </div>
                            <div className="flex-1">
                                <input type="text" placeholder="Last name" value={fields.lastName}
                                    onChange={set('lastName')} autoComplete="family-name"
                                    className={inputCls(err('lastName')).replace('px-4 py-3', 'px-3 py-2')} />
                                <FieldError message={err('lastName')} />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <input type="text" placeholder="Mobile number or email address"
                                value={fields.email} onChange={set('email')} autoComplete="email"
                                className={inputCls(err('email')).replace('px-4 py-3', 'px-3 py-2')} />
                            <FieldError message={err('email')} />
                        </div>

                        {/* Password */}
                        <div>
                            <input type="password" placeholder="New password"
                                value={fields.password} onChange={set('password')} autoComplete="new-password"
                                className={inputCls(err('password')).replace('px-4 py-3', 'px-3 py-2')} />
                            <FieldError message={err('password')} />
                        </div>

                        {/* DOB */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                Date of birth
                                <span className="text-gray-400 cursor-help" title="Providing your birthday helps make sure you get the right Facebook experience.">ⓘ</span>
                            </label>
                            <input type="date" value={fields.dob} onChange={set('dob')}
                                max={new Date().toISOString().split('T')[0]}
                                className={inputCls(err('dob')).replace('px-4 py-3', 'px-3 py-2')} />
                            <FieldError message={err('dob')} />
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                Gender
                                <span className="text-gray-400 cursor-help" title="You can change who sees your gender on your profile.">ⓘ</span>
                            </label>
                            <div className="flex gap-2">
                                {GENDERS.map(g => (
                                    <label key={g}
                                        className={`flex-1 flex items-center justify-between border rounded-lg px-3 py-2 text-sm cursor-pointer transition
                                            ${fields.gender === g ? 'border-[#1877f2] bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        {g}
                                        <input type="radio" name="gender" value={g}
                                            checked={fields.gender === g} onChange={set('gender')}
                                            className="accent-[#1877f2]" />
                                    </label>
                                ))}
                            </div>
                            <FieldError message={err('gender')} />
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-gray-500 leading-relaxed">
                            By clicking Sign Up, you agree to our{' '}
                            <Link href="#" className="text-[#1877f2] hover:underline">Terms</Link>,{' '}
                            <Link href="#" className="text-[#1877f2] hover:underline">Privacy Policy</Link> and{' '}
                            <Link href="#" className="text-[#1877f2] hover:underline">Cookies Policy</Link>.
                        </p>

                        <button type="submit" disabled={loading}
                            className="w-full bg-[#42b72a] hover:bg-[#36a420] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-lg transition-colors flex items-center justify-center gap-2 mt-1"
                        >
                            {loading
                                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : 'Sign Up'}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <Link href="/login" className="text-[#1877f2] text-sm font-semibold hover:underline">
                            Already have an account?
                        </Link>
                    </div>
                </div>
            </div>

            <AuthFooter />
        </div>
    )
}

export default SignupPage
