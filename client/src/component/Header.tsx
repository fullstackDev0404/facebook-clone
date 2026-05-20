"use client"
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
    Search, Home, Users, Tv, Store, Bell, MessageCircle,
    Menu, LogOut, Settings, User, X,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { notificationsApi } from '@/lib/api'
import NotificationsPanel from './notifications/NotificationsPanel'

const NAV_ITEMS = [
    { icon: Home,  label: 'Home',        href: '/'        },
    { icon: Users, label: 'Friends',     href: '/friends' },
    { icon: Tv,    label: 'Watch',       href: null       },
    { icon: Store, label: 'Marketplace', href: null       },
]

const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    const [searchFocused, setSearchFocused] = useState(false)
    const [searchQuery, setSearchQuery]     = useState('')
    const [profileOpen, setProfileOpen]     = useState(false)
    const [notifOpen, setNotifOpen]         = useState(false)
    const [unreadCount, setUnreadCount]     = useState(0)

    const profileRef = useRef<HTMLDivElement>(null)
    const notifRef   = useRef<HTMLDivElement>(null)

    // Determine active nav based on current pathname
    const getActiveNav = (): string => {
        if (pathname === '/') return 'Home'
        if (pathname === '/friends') return 'Friends'
        if (pathname === '/watch') return 'Watch'
        if (pathname === '/marketplace') return 'Marketplace'
        return 'Home'
    }

    const activeNav = getActiveNav()

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node))
                setProfileOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Close notifications panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node))
                setNotifOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Fetch unread count on mount
    useEffect(() => {
        notificationsApi.getAll({ limit: 1 })
            .then(d => setUnreadCount(d.unreadCount))
            .catch(() => {})
    }, [])

    const handleLogout = () => { logout(); router.push('/login') }
    const initials = getInitials(user?.name || '')

    const handleNavClick = (_label: string, href: string | null) => {
        if (href) router.push(href)
    }

    return (
        <header
            className="bg-white dark:bg-[#242526] w-full fixed top-0 left-0 z-50 border-b border-[#dddfe2] dark:border-[#3e4042]"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
        >
            {/* ── DESKTOP ROW ── */}
            <div className="flex items-stretch h-14 px-4 gap-2">

                {/* Left: Logo + Search */}
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => router.push('/')} className="shrink-0">
                        <Image src="/images/facebook-logo.jpg" alt="Facebook" width={40} height={40} className="rounded-full" />
                    </button>

                    <div className="relative">
                        <div className={`flex items-center gap-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full px-3 py-2 transition-all duration-200 ${searchFocused ? 'w-52' : 'w-44'}`}>
                            <Search className="w-4 h-4 text-[#65676b] shrink-0" />
                            <input
                                type="text"
                                placeholder="Search Facebook"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                className="bg-transparent outline-none text-[14px] text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b] w-full min-w-0"
                            />
                            {searchFocused && searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="shrink-0">
                                    <X className="w-3.5 h-3.5 text-[#65676b]" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center: Nav icons — desktop only */}
                <nav className="hidden md:flex flex-1 items-stretch">
                    {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
                        <button
                            key={label}
                            onClick={() => handleNavClick(label, href)}
                            title={label}
                            className={`relative flex flex-1 items-center justify-center transition-colors group ${
                                activeNav === label
                                    ? 'text-[#1877f2]'
                                    : 'text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                            }`}
                        >
                            <Icon className="w-6 h-6" strokeWidth={activeNav === label ? 2.5 : 2} />
                            {activeNav === label && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#1877f2] rounded-t-sm" />
                            )}
                            <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-[#1c1e21] text-white text-[11px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                                {label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0 ml-auto">
                    {/* Hamburger — mobile only */}
                    <button onClick={onMenuClick}
                        className="flex md:hidden items-center justify-center w-10 h-10 bg-[#f0f2f5] dark:bg-[#3a3b3c] hover:bg-[#e4e6eb] rounded-full text-[#050505] dark:text-[#e4e6eb] transition-colors"
                        title="Menu">
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Messenger */}
                    <button
                        onClick={() => router.push('/messages')}
                        className="relative flex items-center justify-center w-10 h-10 bg-[#f0f2f5] dark:bg-[#3a3b3c] hover:bg-[#e4e6eb] rounded-full transition-colors"
                        title="Messenger"
                    >
                        <MessageCircle className="w-5 h-5 text-[#050505] dark:text-[#e4e6eb]" />
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setNotifOpen(o => !o)}
                            className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                                notifOpen ? 'bg-[#e7f3ff] dark:bg-[#263951]' : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] hover:bg-[#e4e6eb]'
                            }`}
                        >
                            <Bell className="w-5 h-5 text-[#050505] dark:text-[#e4e6eb]" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 leading-none">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <NotificationsPanel
                                panelRef={notifRef}
                                onClose={() => {
                                    setNotifOpen(false)
                                    setUnreadCount(0)
                                }}
                            />
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setProfileOpen(o => !o)}
                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                                profileOpen ? 'bg-[#e7f3ff] dark:bg-[#263951]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                            }`}
                        >
                            <Avatar className="w-9 h-9">
                                <AvatarImage className="" />
                                <AvatarFallback className="bg-[#1877f2] text-white text-sm font-bold">{initials}</AvatarFallback>
                            </Avatar>
                        </button>

                        {profileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#242526] rounded-2xl p-2 z-50"
                                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
                                <button 
                                    onClick={() => {
                                        router.push(`/profile/${user?.id}`)
                                        setProfileOpen(false)
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl cursor-pointer transition-colors w-full text-left">
                                    <Avatar className="w-14 h-14 shrink-0">
                                        <AvatarImage className="" />
                                        <AvatarFallback className="bg-[#1877f2] text-white text-xl font-bold">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-[15px] text-[#050505] dark:text-[#e4e6eb]">{user?.name}</p>
                                        <p className="text-[13px] text-[#1877f2] font-medium mt-0.5">See your profile</p>
                                    </div>
                                </button>

                                <div className="h-px bg-[#f0f2f5] dark:bg-[#3e4042] my-2" />

                                <button 
                                    onClick={() => {
                                        router.push('/profile/edit')
                                        setProfileOpen(false)
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors text-[14px] text-[#050505] dark:text-[#e4e6eb] font-medium">
                                    <div className="w-9 h-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] flex items-center justify-center shrink-0">
                                        <Settings className="w-5 h-5 text-[#050505] dark:text-[#e4e6eb]" />
                                    </div>
                                    Settings & privacy
                                </button>

                                <button 
                                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors text-[14px] text-[#050505] dark:text-[#e4e6eb] font-medium">
                                    <div className="w-9 h-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-[#050505] dark:text-[#e4e6eb]" />
                                    </div>
                                    Help & support
                                </button>

                                <div className="h-px bg-[#f0f2f5] dark:bg-[#3e4042] my-2" />

                                <button onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors text-[14px] text-[#050505] dark:text-[#e4e6eb] font-medium">
                                    <div className="w-9 h-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] flex items-center justify-center shrink-0">
                                        <LogOut className="w-5 h-5 text-[#050505] dark:text-[#e4e6eb]" />
                                    </div>
                                    Log out
                                </button>

                                <p className="text-[11px] text-[#8a8d91] px-3 pt-3 pb-1 leading-relaxed">
                                    Privacy · Terms · Advertising · Cookies · More · Meta © {new Date().getFullYear()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── MOBILE ROW 2: Nav icons ── */}
            <div className="flex md:hidden items-center border-t border-[#f0f2f5] dark:border-[#3e4042]" style={{ height: 48 }}>
                {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
                    <button
                        key={label}
                        onClick={() => handleNavClick(label, href)}
                        className={`relative flex flex-1 items-center justify-center h-full transition-colors ${
                            activeNav === label
                                ? 'text-[#1877f2]'
                                : 'text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                        }`}
                    >
                        <Icon className="w-6 h-6" strokeWidth={activeNav === label ? 2.5 : 2} />
                        {activeNav === label && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#1877f2] rounded-t-sm" />
                        )}
                    </button>
                ))}
            </div>
        </header>
    )
}

export default Header
