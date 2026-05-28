"use client"
import React from 'react'
import { Home, Users, Tv, Store } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Home,  label: 'Home',        href: '/'        },
  { icon: Users, label: 'Friends',     href: '/friends' },
  { icon: Tv,    label: 'Watch',       href: null       },
  { icon: Store, label: 'Marketplace', href: null       },
]

interface Props {
  activeNav: string
  onNavClick: (label: string, href: string | null) => void
  isMobile?: boolean
}

const Navigation = ({ activeNav, onNavClick, isMobile = false }: Props) => {
  if (isMobile) {
    return (
      <div className="flex md:hidden items-center border-t border-[#f0f2f5] dark:border-[#3e4042]" style={{ height: 48 }}>
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
          <button
            key={label}
            onClick={() => onNavClick(label, href)}
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
    )
  }

  return (
    <nav className="hidden md:flex flex-1 items-stretch">
      {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
        <button
          key={label}
          onClick={() => onNavClick(label, href)}
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
  )
}

export default Navigation
