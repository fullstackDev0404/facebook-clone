"use client"
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Clock, Bookmark, Flag, ChevronDown, Store, Tv, Gamepad2, CalendarDays } from 'lucide-react'

const shortcuts = [
    { icon: Users, label: 'Friends', color: 'text-blue-500' },
    { icon: Clock, label: 'Memories', color: 'text-red-400' },
    { icon: Bookmark, label: 'Saved', color: 'text-purple-500' },
    { icon: Flag, label: 'Pages', color: 'text-orange-400' },
    { icon: Store, label: 'Marketplace', color: 'text-green-500' },
    { icon: Tv, label: 'Watch', color: 'text-blue-400' },
    { icon: Gamepad2, label: 'Gaming', color: 'text-indigo-500' },
    { icon: CalendarDays, label: 'Events', color: 'text-red-500' },
]

const LeftSidebar = () => {
    return (
        <aside className="hidden lg:flex flex-col w-[280px] h-[calc(100vh-56px)] sticky top-14 overflow-y-auto p-2 scrollbar-hide">

            {/* Profile Link */}
            <button className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left">
                <Avatar className="w-9 h-9">
                    <AvatarImage className="" />
                    <AvatarFallback className="bg-blue-500 text-white font-bold">Y</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm dark:text-white">Your Name</span>
            </button>

            {/* Shortcuts */}
            <div className="mt-1">
                {shortcuts.map(({ icon: Icon, label, color }) => (
                    <button
                        key={label}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left"
                    >
                        <div className={`w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center ${color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium dark:text-white">{label}</span>
                    </button>
                ))}
            </div>

            {/* See More */}
            <button className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left mt-1">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-sm font-medium dark:text-white">See more</span>
            </button>

            <hr className="my-3 border-gray-200 dark:border-gray-700" />

            {/* Your Shortcuts */}
            <div>
                <div className="flex items-center justify-between px-2 mb-1">
                    <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-sm">Your shortcuts</h3>
                    <button className="text-blue-500 text-sm hover:underline">Edit</button>
                </div>
                <p className="text-xs text-gray-400 px-2 py-1">Shortcuts you add will appear here.</p>
            </div>

            {/* Footer Links */}
            <div className="mt-auto pt-4 px-2">
                <p className="text-xs text-gray-400 leading-relaxed">
                    Privacy · Terms · Advertising · Ad Choices · Cookies · More · Meta © 2024
                </p>
            </div>
        </aside>
    )
}

export default LeftSidebar
