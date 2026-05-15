"use client"
import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Search, Home, Users, Tv, Store, Bell, MessageCircle, Menu, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

const navItems = [
    { icon: Home, label: 'Home' },
    { icon: Users, label: 'Friends' },
    { icon: Tv, label: 'Watch' },
    { icon: Store, label: 'Marketplace' },
]

const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

const Header = () => {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [activeNav, setActiveNav] = useState('Home')
    const [searchFocused, setSearchFocused] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const initials = getInitials(user?.name || '')

    return (
        <header className="bg-white dark:bg-[rgb(36,37,38)] w-full shadow-md h-14 fixed top-0 left-0 z-50 px-4 flex items-center justify-between">

            {/* Left — Logo + Search */}
            <div className="flex items-center gap-2 min-w-50">
                <Image src="/images/facebook-logo.jpg" alt="Facebook" width={40} height={40} className="rounded-full cursor-pointer" onClick={() => router.push('/')} />
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search Facebook"
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                        className="pl-9 pr-3 py-2 w-44 bg-gray-100 dark:bg-[rgb(58,59,60)] rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
                    />
                    {searchFocused && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[rgb(36,37,38)] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50">
                            <p className="text-xs text-gray-500 px-2 py-1 font-semibold">Recent searches</p>
                            <div className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage className="" />
                                    <AvatarFallback className="bg-blue-500 text-white text-xs">JK</AvatarFallback>
                                </Avatar>
                                <span className="text-sm dark:text-white">Joana Kelly</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Center — Nav Icons */}
            <nav className="hidden md:flex items-center gap-1">
                {navItems.map(({ icon: Icon, label }) => (
                    <button
                        key={label}
                        onClick={() => setActiveNav(label)}
                        title={label}
                        className={`relative flex items-center justify-center w-24 h-12 rounded-lg transition-colors group
                            ${activeNav === label
                                ? 'text-blue-500 border-b-2 border-blue-500'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Icon className="w-6 h-6" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            {label}
                        </span>
                    </button>
                ))}
            </nav>

            {/* Right — Actions + Profile */}
            <div className="flex items-center gap-2 min-w-50 justify-end">
                <button className="flex items-center gap-1 bg-gray-100 dark:bg-[rgb(58,59,60)] hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-full text-sm font-medium dark:text-white transition-colors">
                    <Menu className="w-4 h-4" />
                    <span className="hidden lg:inline">Menu</span>
                </button>
                <button className="relative p-2 bg-gray-100 dark:bg-[rgb(58,59,60)] hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                    <MessageCircle className="w-5 h-5 dark:text-white" />
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                </button>
                <button className="relative p-2 bg-gray-100 dark:bg-[rgb(58,59,60)] hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                    <Bell className="w-5 h-5 dark:text-white" />
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">5</span>
                </button>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(o => !o)}
                        className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition-colors"
                    >
                        <Avatar className="w-9 h-9">
                            <AvatarImage className="" />
                            <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <ChevronDown className="w-4 h-4 text-gray-500 hidden lg:block" />
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[rgb(36,37,38)] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 z-50">
                            {/* User info */}
                            <div className="flex items-center gap-3 p-2 mb-1">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage className="" />
                                    <AvatarFallback className="bg-blue-500 text-white font-bold">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm dark:text-white">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[130px]">{user?.email}</p>
                                </div>
                            </div>
                            <hr className="border-gray-200 dark:border-gray-700 my-1" />
                            <button className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm dark:text-white">
                                <User className="w-4 h-4" /> View Profile
                            </button>
                            <button className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm dark:text-white">
                                <Settings className="w-4 h-4" /> Settings
                            </button>
                            <hr className="border-gray-200 dark:border-gray-700 my-1" />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm text-red-500"
                            >
                                <LogOut className="w-4 h-4" /> Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header
