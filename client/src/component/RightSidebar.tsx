"use client"
import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MoreHorizontal, Video } from 'lucide-react'

const contacts = [
    { name: 'Alice Johnson', online: true, fallback: 'AJ' },
    { name: 'Bob Smith', online: true, fallback: 'BS' },
    { name: 'Carol White', online: false, fallback: 'CW' },
    { name: 'David Lee', online: true, fallback: 'DL' },
    { name: 'Emma Davis', online: false, fallback: 'ED' },
    { name: 'Frank Miller', online: true, fallback: 'FM' },
    { name: 'Grace Wilson', online: true, fallback: 'GW' },
    { name: 'Henry Moore', online: false, fallback: 'HM' },
    { name: 'Isla Taylor', online: true, fallback: 'IT' },
    { name: 'Jack Anderson', online: false, fallback: 'JA' },
]

const avatarColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500',
]

const RightSidebar = () => {
    const [searchQuery, setSearchQuery] = useState('')

    const filtered = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <aside className="hidden xl:flex flex-col w-[280px] h-[calc(100vh-56px)] sticky top-14 overflow-y-auto p-2 scrollbar-hide">

            {/* Sponsored */}
            <div className="mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-sm px-2 mb-2">Sponsored</h3>
                <div className="flex gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                    <div className="w-28 h-28 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium dark:text-white">Sponsored Ad</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">sponsor.example.com</p>
                        <p className="text-xs text-gray-400 mt-1">Check out our latest deals and offers!</p>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 mb-3" />

            {/* Contacts */}
            <div>
                <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-sm">Contacts</h3>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <Video className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Search contacts */}
                <div className="relative px-2 mb-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search contacts"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-100 dark:bg-[rgb(58,59,60)] rounded-full text-xs outline-none dark:text-white dark:placeholder-gray-400"
                    />
                </div>

                {/* Contact list */}
                <div className="space-y-0.5">
                    {filtered.map((contact, i) => (
                        <button
                            key={contact.name}
                            className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left"
                        >
                            <div className="relative">
                                <Avatar className="w-9 h-9">
                                    <AvatarImage />
                                    <AvatarFallback className={`${avatarColors[i % avatarColors.length]} text-white text-xs font-bold`}>
                                        {contact.fallback}
                                    </AvatarFallback>
                                </Avatar>
                                {contact.online && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[rgb(36,37,38)] rounded-full" />
                                )}
                            </div>
                            <span className="text-sm font-medium dark:text-white">{contact.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    )
}

export default RightSidebar
