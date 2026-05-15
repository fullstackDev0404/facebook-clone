"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { Search, Home, Users, Tv, Store, Bell, MessageCircle, Menu, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Users, label: 'Friends' },
    { icon: Tv, label: 'Watch' },
    { icon: Store, label: 'Marketplace' },
]

const Header = () => {
    const [activeNav, setActiveNav] = useState('Home')
    const [searchFocused, setSearchFocused] = useState(false)

    return (
        <header className="bg-white dark:bg-[rgb(36,37,38)] w-full text-foreground shadow-md h-14 fixed top-0 left-0 z-50 px-4 flex items-center justify-between">

            {/* Left — Logo + Search */}
            <div className="flex items-center gap-2 min-w-[200px]">
                <Image src="/images/facebook-logo.jpg" alt="facebook_logo" width={40} height={40} className="rounded-full" />
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search Facebook"
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="pl-9 pr-3 py-2 w-44 bg-gray-100 dark:bg-[rgb(58,59,60)] rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
                    />
                    {searchFocused && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[rgb(36,37,38)] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                            <p className="text-xs text-gray-500 px-2 py-1">Recent searches</p>
                            <div className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage />
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
                        className={`relative flex items-center justify-center w-24 h-12 rounded-lg transition-colors group
                            ${activeNav === label
                                ? 'text-blue-500 border-b-2 border-blue-500'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        title={label}
                    >
                        <Icon className="w-6 h-6" />
                        {/* Tooltip */}
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {label}
                        </span>
                    </button>
                ))}
            </nav>

            {/* Right — Actions + Profile */}
            <div className="flex items-center gap-2 min-w-[200px] justify-end">
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
                <button className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition-colors">
                    <Avatar className="w-9 h-9">
                        <AvatarImage />
                        <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">Y</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-gray-500 hidden lg:block" />
                </button>
            </div>

        </header>
    )
}

export default Header
