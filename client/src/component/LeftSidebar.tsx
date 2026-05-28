"use client"
import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Home, Users, Clock, Bookmark, Flag, ChevronDown,
    Store, Tv, MessageCircle, Gamepad2, CalendarDays, X,
    BarChart3, Shield, UserX,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { avatarSrc } from '@/component/feed/feedUtils'


const navItems = [
    { icon: Home,         label: 'Home',        color: '#1877f2', bg: '#e7f3ff', href: '/'           },
    { icon: Users,        label: 'Friends',     color: '#1877f2', bg: '#e7f3ff', href: '/friends'    },
    { icon: MessageCircle,label: 'Messenger',   color: '#1877f2', bg: '#e7f3ff', href: '/messages'   },
    { icon: BarChart3,    label: 'Analytics',   color: '#1877f2', bg: '#e7f3ff', href: '/analytics'   },
    { icon: UserX,        label: 'Blocked',     color: '#dc2626', bg: '#fee2e2', href: '/blocked'     },
    { icon: Shield,       label: 'Moderation',  color: '#dc2626', bg: '#fee2e2', href: '/moderation' },
    { icon: Clock,        label: 'Memories',    color: '#e15241', bg: '#fce8e6', href: null          },
    { icon: Bookmark,     label: 'Saved',       color: '#7c3aed', bg: '#ede9fe', href: null          },
    { icon: Flag,         label: 'Pages',       color: '#f59e0b', bg: '#fef3c7', href: null          },
    { icon: Store,        label: 'Marketplace', color: '#059669', bg: '#d1fae5', href: null          },
    { icon: Tv,           label: 'Watch',       color: '#0ea5e9', bg: '#e0f2fe', href: null          },
    { icon: Gamepad2,     label: 'Gaming',      color: '#6366f1', bg: '#e0e7ff', href: null          },
    { icon: CalendarDays, label: 'Events',      color: '#e15241', bg: '#fce8e6', href: null          },
]

interface Props {
    onClose?: () => void
    showCloseButton?: boolean
}

const LeftSidebar = ({ onClose, showCloseButton }: Props) => {
    const { user } = useAuth()
    const router   = useRouter()
    const pathname = usePathname()
    const fullName = user ? `${user.firstName} ${user.lastName}` : ''
    const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'U'

    // Helper to check if nav item is active
    const isActive = (href: string | null, label: string): boolean => {
        if (href) return pathname === href
        return false
    }

    return (
        <aside className="flex flex-col w-full h-full overflow-hidden bg-white dark:bg-[#242526]">
            {/* Close button — drawer mode only */}
            {showCloseButton && (
                <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[#f0f2f5]">
                    <span className="font-bold text-[18px] text-[#050505] dark:text-[#e4e6eb]">Menu</span>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full transition-colors bg-[#e4e6eb] hover:bg-[#d8dadf]"
                    >
                        <X className="w-5 h-5 text-[#050505]" />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-hide">

                {/* Profile row */}
                <button
                    onClick={() => user && router.push(`/profile/${user.id}`)}
                    className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-left transition-colors hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]"
                >
                    <Avatar className="w-9 h-9 shrink-0">
                        <AvatarImage src={avatarSrc(user?.avatar ?? null)} />
                        <AvatarFallback className="bg-[#1877f2] text-white font-bold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold truncate text-[15px] text-[#050505] dark:text-[#e4e6eb]">
                        {fullName || 'Your Name'}
                    </span>
                </button>

                <div className="my-2 mx-1 h-px bg-[#f0f2f5]" />

                {/* Nav items */}
                <nav className="space-y-0.5">
                    {navItems.map(({ icon: Icon, label, color, bg, href }) => {
                        const active = isActive(href, label)
                        return (
                            <button
                                key={label}
                                onClick={() => { if (href) router.push(href) }}
                                className={`flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-left transition-colors hover:bg-[#f0f2f5] ${active ? 'bg-[#e7f3ff]' : ''}`}
                            >
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: bg }}
                                >
                                    <Icon className="w-[18px] h-[18px]" style={{ color }} strokeWidth={active ? 2.5 : 2} />
                                </div>
                                <span
                                    className="truncate"
                                    style={{
                                        fontSize: 15,
                                        fontWeight: active ? 600 : 500,
                                        color: active ? '#1877f2' : '#050505',
                                    }}
                                >
                                    {label}
                                </span>
                            </button>
                        )
                    })}

                    {/* See more */}
                    <button
                        className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-left transition-colors hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]"
                    >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#e4e6eb]">
                            <ChevronDown className="w-[18px] h-[18px] text-[#65676b]" />
                        </div>
                        <span className="text-[15px] font-medium text-[#050505] dark:text-[#e4e6eb]">See more</span>
                    </button>
                </nav>

                <div className="my-3 mx-1 h-px bg-[#f0f2f5]" />

                {/* Shortcuts */}
                <div className="px-2">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-[#65676b] uppercase tracking-wider">
                            Your shortcuts
                        </span>
                        <button className="text-[12px] text-[#1877f2] font-medium">Edit</button>
                    </div>
                    <p className="text-[12px] text-[#8a8d91]">Shortcuts you add will appear here.</p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-3 pb-6 pt-2 shrink-0">
                <p className="text-[11px] text-[#8a8d91] leading-relaxed">
                    Privacy · Terms · Advertising · Cookies · More · Meta © {new Date().getFullYear()}
                </p>
            </div>
        </aside>
    )
}

export default LeftSidebar

