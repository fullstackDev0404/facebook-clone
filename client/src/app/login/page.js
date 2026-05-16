"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { validateLogin, inputCls } from '@/lib/validation'
import { AuthLogo, AuthFooter, FieldError } from '@/component/auth/AuthLayout'
import { authApi } from '@/lib/api'

const LoginPage = () => {
    const router = useRouter()
    const { login } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitted(true)
        const errs = validateLogin(email, password)
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        setLoading(true)
        try {
            const { token, user } = await authApi.login(email, password)
            login(user, token)
            router.push('/')
        } catch (err) {
            setErrors({ api: err.message })
        } finally {
            setLoading(false)
        }
    }

    const e = (key) => submitted && errors[key]

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-10 w-full max-w-4xl">

                {/* Left — Branding */}
                <div className="flex flex-col items-center lg:items-start lg:flex-1 gap-3">
                    <AuthLogo size="lg" />
                    <p className="text-xl text-gray-700 text-center lg:text-left max-w-sm leading-snug">
                        Connect with friends and the world around you on Facebook.
                    </p>
                </div>

                {/* Right — Login Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-4">
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
                        {/* API error */}
                        {errors.api && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
                                {errors.api}
                            </div>
                        )}
                        <div>
                            <input
                                type="text"
                                placeholder="Email address or phone number"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={inputCls(e('email'))}
                                autoComplete="email"
                            />
                            <FieldError message={e('email')} />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={inputCls(e('password'))}
                                autoComplete="current-password"
                            />
                            <FieldError message={e('password')} />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1877f2] hover:bg-[#166fe5] active:bg-[#1464d8] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : 'Log in'}
                        </button>
                    </form>

                    <div className="text-center">
                        <Link href="/forgot-password" className="text-[#1877f2] text-sm hover:underline">
                            Forgot password?
                        </Link>
                    </div>

                    <hr className="border-gray-300" />

                    <div className="flex justify-center">
                        <Link
                            href="/signup"
                            className="bg-[#42b72a] hover:bg-[#36a420] active:bg-[#2d8f1c] text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors"
                        >
                            Create new account
                        </Link>
                    </div>
                </div>
            </div>

            <AuthFooter showLanguages />
        </div>
    )
}

export default LoginPage
