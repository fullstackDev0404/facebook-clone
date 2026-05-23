"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Home, Users, Clock, Bookmark, Flag, ChevronDown,
    Store, Tv, MessageCircle, Gamepad2, CalendarDays, X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { avatarSrc } from '@/component/feed/feedUtils'


const navItems = [
    { icon: Home,         label: 'Home',        color: '#1877f2', bg: '#e7f3ff', href: '/'           },
    { icon: Users,        label: 'Friends',     color: '#1877f2', bg: '#e7f3ff', href: '/friends'    },
    { icon: MessageCircle,label: 'Messenger',   color: '#1877f2', bg: '#e7f3ff', href: '/messages'   },
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
    const fullName = user ? `${user.firstName} ${user.lastName}` : ''
    const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'U'
    const [activeItem, setActiveItem] = useState('Home')

    return (
        <aside
            className="flex flex-col w-full h-full overflow-hidden"
            style={{ backgroundColor: '#ffffff' }}
        >
            {/* Close button — drawer mode only */}
            {showCloseButton && (
                <div
                    className="flex items-center justify-between px-4 py-3 shrink-0"
                    style={{ borderBottom: '1px solid #f0f2f5' }}
                >
                    <span className="font-bold text-[18px]" style={{ color: '#050505' }}>Menu</span>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                        style={{ backgroundColor: '#e4e6eb' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d8dadf')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#e4e6eb')}
                    >
                        <X className="w-5 h-5" style={{ color: '#050505' }} />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth: 'none' }}>

                {/* Profile row */}
                <button
                    onClick={() => user && router.push(`/profile/${user.id}`)}
                    className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-left transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0f2f5')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <Avatar className="w-9 h-9 shrink-0">
                        <AvatarImage src={avatarSrc(user?.avatar ?? null)} />
                        <AvatarFallback className="bg-[#1877f2] text-white font-bold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold truncate" style={{ fontSize: 15, color: '#050505' }}>
                        {fullName || 'Your Name'}
                    </span>
                </button>

                <div className="my-2 mx-1" style={{ height: 1, backgroundColor: '#f0f2f5' }} />

                {/* Nav items */}
                <nav className="space-y-0.5">
                    {navItems.map(({ icon: Icon, label, color, bg, href }) => {
                        const isActive = activeItem === label
                        return (
                            <button
                                key={label}
                                onClick={() => { setActiveItem(label); if (href) router.push(href) }}
                                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-left transition-colors"
                                style={{ backgroundColor: isActive ? '#e7f3ff' : 'transparent' }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f0f2f5' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? '#e7f3ff' : 'transparent' }}
                            >
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: bg }}
                                >
                                    <Icon className="w-4.5 h-4.5" style={{ color }} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span
                                    className="truncate"
                                    style={{
                                        fontSize: 15,
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? '#1877f2' : '#050505',
                                    }}
                                >
                                    {label}
                                </span>
                            </button>
                        )
                    })}

                    {/* See more */}
                    <button
                        className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-left transition-colors"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0f2f5')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e4e6eb' }}>
                            <ChevronDown className="w-4.5 h-4.5" style={{ color: '#65676b' }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 500, color: '#050505' }}>See more</span>
                    </button>
                </nav>

                <div className="my-3 mx-1" style={{ height: 1, backgroundColor: '#f0f2f5' }} />

                {/* Shortcuts */}
                <div className="px-2">
                    <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#65676b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Your shortcuts
                        </span>
                        <button style={{ fontSize: 12, color: '#1877f2', fontWeight: 500 }}>Edit</button>
                    </div>
                    <p style={{ fontSize: 12, color: '#8a8d91' }}>Shortcuts you add will appear here.</p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-3 pb-6 pt-2 shrink-0">
                <p style={{ fontSize: 11, color: '#8a8d91', lineHeight: 1.6 }}>
                    Privacy · Terms · Advertising · Cookies · More · Meta © {new Date().getFullYear()}
                </p>
            </div>
        </aside>
    )
}

export default LeftSidebar

