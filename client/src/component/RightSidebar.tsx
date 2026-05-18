"use client"
import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MoreHorizontal, Video } from 'lucide-react'

const contacts = [
    { name: 'Alice Johnson', online: true,  fallback: 'AJ', color: '#1877f2' },
    { name: 'Bob Smith',     online: true,  fallback: 'BS', color: '#059669' },
    { name: 'Carol White',   online: false, fallback: 'CW', color: '#7c3aed' },
    { name: 'David Lee',     online: true,  fallback: 'DL', color: '#e15241' },
    { name: 'Emma Davis',    online: false, fallback: 'ED', color: '#f59e0b' },
    { name: 'Frank Miller',  online: true,  fallback: 'FM', color: '#0ea5e9' },
    { name: 'Grace Wilson',  online: true,  fallback: 'GW', color: '#ec4899' },
    { name: 'Henry Moore',   online: false, fallback: 'HM', color: '#6366f1' },
    { name: 'Isla Taylor',   online: true,  fallback: 'IT', color: '#14b8a6' },
    { name: 'Jack Anderson', online: false, fallback: 'JA', color: '#f97316' },
]

const RightSidebar = () => {
    const [searchQuery, setSearchQuery] = useState('')

    const filtered = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <aside className="shrink-0 w-72 sticky top-14 h-[calc(100vh-56px)] bg-white dark:bg-[#242526] overflow-y-auto scrollbar-hide">
            <div className="py-4">

                {/* Sponsored */}
                <div className="px-3 mb-4">
                    <p className="text-[11px] font-semibold text-[#8a8d91] uppercase tracking-wider mb-2">Sponsored</p>
                    <div className="rounded-xl overflow-hidden border border-[#dddfe2] dark:border-[#3e4042] hover:shadow-md transition-shadow cursor-pointer">
                        <div className="h-28 bg-linear-to-br from-blue-400 via-purple-500 to-pink-500" />
                        <div className="p-3">
                            <p className="text-[13px] font-semibold text-[#050505] dark:text-[#e4e6eb]">Discover amazing products</p>
                            <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">sponsor.example.com</p>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-[#dddfe2] dark:bg-[#3e4042] mx-3 mb-4" />

                {/* Contacts */}
                <div className="px-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-[#8a8d91] uppercase tracking-wider">Contacts</p>
                        <div className="flex items-center gap-0.5">
                            <button className="p-1.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors" title="Video call">
                                <Video className="w-4 h-4 text-[#65676b] dark:text-[#b0b3b8]" />
                            </button>
                            <button className="p-1.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors" title="Search">
                                <Search className="w-4 h-4 text-[#65676b] dark:text-[#b0b3b8]" />
                            </button>
                            <button className="p-1.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors" title="More">
                                <MoreHorizontal className="w-4 h-4 text-[#65676b] dark:text-[#b0b3b8]" />
                            </button>
                        </div>
                    </div>

                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#65676b]" />
                        <input
                            type="text"
                            placeholder="Search contacts"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full text-[13px] outline-none text-[#050505] dark:text-[#e4e6eb] placeholder-[#8a8d91] focus:ring-2 focus:ring-[#1877f2]/20 transition-all"
                        />
                    </div>

                    <div className="space-y-0.5">
                        {filtered.map((contact) => (
                            <button
                                key={contact.name}
                                className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors text-left group"
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="w-9 h-9">
                                        <AvatarImage className="" />
                                        <AvatarFallback className="text-white text-xs font-bold" style={{ backgroundColor: contact.color }}>
                                            {contact.fallback}
                                        </AvatarFallback>
                                    </Avatar>
                                    {contact.online && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31a24c] border-2 border-white dark:border-[#242526] rounded-full" />
                                    )}
                                </div>
                                <span className="text-[14px] font-medium text-[#050505] dark:text-[#e4e6eb] truncate group-hover:text-[#1877f2] transition-colors">
                                    {contact.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default RightSidebar

