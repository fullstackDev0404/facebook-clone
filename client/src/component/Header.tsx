"use client"
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Bell, MessageCircle, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { avatarSrc } from '@/component/feed/feedUtils'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { notificationsApi } from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import NotificationsPanel from './notifications/NotificationsPanel'
import SearchBar from './Header/SearchBar'
import Navigation from './Header/Navigation'
import ProfileDropdown from './Header/ProfileDropdown'



const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    const [profileOpen, setProfileOpen]     = useState(false)
    const [notifOpen, setNotifOpen]         = useState(false)
    const [unreadCount, setUnreadCount]     = useState(0)
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

    const notifRef   = useRef<HTMLDivElement>(null)
    const notifTimerRef = useRef<number | null>(null)

    // Determine active nav based on current pathname
    const getActiveNav = (): string => {
        if (pathname === '/') return 'Home'
        if (pathname === '/friends') return 'Friends'
        if (pathname === '/watch') return 'Watch'
        if (pathname === '/marketplace') return 'Marketplace'
        return 'Home'
    }

    const activeNav = getActiveNav()


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

    // Fetch unread message notifications on mount
    useEffect(() => {
        notificationsApi.getAll({ page: 1, limit: 100, unreadOnly: true })
            .then(d => {
                const messages = d.notifications?.filter((n: any) => n.type === 'message') ?? []
                setUnreadMessagesCount(messages.length)
            })
            .catch(() => {})
    }, [])

    // Subscribe to socket notification updates
    useEffect(() => {
        const socket = connectSocket()
        if (!socket) return

        const handleNotificationUpdate = (payload: any) => {
            if (payload?.unreadCount !== undefined) {
                setUnreadCount(payload.unreadCount)
            }
        }

        const handleMessageNotification = (payload: any) => {
            // increment unread badge (notifications bell) and briefly open the notifications panel as a subtle cue
            setUnreadCount(c => c + 1)
            setNotifOpen(true)
            // Clear existing timer before setting a new one
            if (notifTimerRef.current) {
                clearTimeout(notifTimerRef.current)
            }
            notifTimerRef.current = window.setTimeout(() => setNotifOpen(false), 2500)
        }

        const handleMessageNew = (payload: any) => {
            // payload.message.sender/receiver are normalised in server
            const msg = payload?.message
            if (!msg) return
            // Only increment if current user is the receiver and not already viewing messages
            if (user && msg.receiver?.id === user.id && pathname !== '/messages') {
                setUnreadMessagesCount(c => c + 1)
            }
        }

        socket.on('notification:unread_count', handleNotificationUpdate)
        socket.on('notification:new', handleNotificationUpdate)
        socket.on('notification:message', handleMessageNotification)
        socket.on('message:new', handleMessageNew)

        return () => {
            socket.off('notification:unread_count', handleNotificationUpdate)
            socket.off('notification:new', handleNotificationUpdate)
            socket.off('notification:message', handleMessageNotification)
            socket.off('message:new', handleMessageNew)
            // Cleanup timer
            if (notifTimerRef.current) {
                clearTimeout(notifTimerRef.current)
            }
        }
    }, [])

    // Reset unread messages count when navigating to messages page
    useEffect(() => {
        if (pathname === '/messages') {
            setUnreadMessagesCount(0)
        }
    }, [pathname])

    const handleLogout = () => { logout(); router.push('/login') }
    const headerAvatarSrc = avatarSrc(user?.avatar ?? null)

    const handleNavClick = (_label: string, href: string | null) => {
        if (href) router.push(href)
    }

    const handleNavigate = (path: string) => {
        router.push(path)
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
                    <SearchBar onNavigate={handleNavigate} />
                </div>

                {/* Center: Nav icons — desktop only */}
                <Navigation activeNav={activeNav} onNavClick={handleNavClick} />

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
                        {unreadMessagesCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 bg-[#1877f2] text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 leading-none">
                                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                            </span>
                        )}
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
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(o => !o)}
                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                                profileOpen ? 'bg-[#e7f3ff] dark:bg-[#263951]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                            }`}
                        >
                        <Avatar className="w-9 h-9">
                            <AvatarImage src={headerAvatarSrc} className="" />
                            <AvatarFallback className="bg-[#1877f2] text-white text-sm font-bold">{user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        </button>
                        <ProfileDropdown
                            open={profileOpen}
                            onOpenChange={setProfileOpen}
                            user={user}
                            onNavigate={handleNavigate}
                            onLogout={handleLogout}
                        />
                    </div>
                </div>
            </div>

            {/* ── MOBILE ROW 2: Nav icons ── */}
            <Navigation activeNav={activeNav} onNavClick={handleNavClick} isMobile />
        </header>
    )
}

export default Header
