"use client"
import React, { useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Settings, LogOut, User, BarChart3 } from 'lucide-react'
import { avatarSrc } from '../feed/feedUtils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  onNavigate: (path: string) => void
  onLogout: () => void
}

const ProfileDropdown = ({ open, onOpenChange, user, onNavigate, onLogout }: Props) => {
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        onOpenChange(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOpenChange])

  const fullName = user ? `${user.firstName} ${user.lastName}` : ''
  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'U'
  const headerAvatarSrc = avatarSrc(user?.avatar ?? null)

  if (!open) return null

  return (
    <div ref={profileRef} className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#242526] rounded-2xl p-2 z-50"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
      <button 
        onClick={() => {
          onNavigate(`/profile/${user?.id}`)
          onOpenChange(false)
        }}
        className="flex items-center gap-3 p-3 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl cursor-pointer transition-colors w-full text-left">
        <Avatar className="w-14 h-14 shrink-0">
          <AvatarImage src={headerAvatarSrc} className="" />
          <AvatarFallback className="bg-[#1877f2] text-white text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-[15px] text-[#050505] dark:text-[#e4e6eb]">{fullName}</p>
          {user?.username && (
            <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] font-medium">@{user.username}</p>
          )}
          <p className="text-[13px] text-[#1877f2] font-medium mt-0.5">See your profile</p>
        </div>
      </button>

      <div className="h-px bg-[#f0f2f5] dark:bg-[#3e4042] my-2" />

      <button
        onClick={() => {
          onNavigate('/profile/edit')
          onOpenChange(false)
        }}
        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors text-[14px] text-[#050505] dark:text-[#e4e6eb] font-medium">
        <div className="w-9 h-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 text-[#050505] dark:text-[#e4e6eb]" />
        </div>
        <div className="text-left">
          <p className="text-[14px] font-medium text-[#050505] dark:text-[#e4e6eb]">Edit profile</p>
          <p className="text-[12px] text-[#65676b]">Name, username, avatar, bio</p>
        </div>
      </button>

      <button
        onClick={() => {
          onNavigate('/analytics')
          onOpenChange(false)
        }}
        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors text-[14px] text-[#050505] dark:text-[#e4e6eb] font-medium">
        <div className="w-9 h-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] flex items-center justify-center shrink-0">
          <BarChart3 className="w-5 h-5 text-[#050505] dark:text-[#e4e6eb]" />
        </div>
        <div className="text-left">
          <p className="text-[14px] font-medium text-[#050505] dark:text-[#e4e6eb]">Analytics</p>
          <p className="text-[12px] text-[#65676b]">View your activity stats</p>
        </div>
      </button>

      <button
        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors text-[14px] text-[#050505] dark:text-[#e4e6eb] font-medium">
        <div className="w-9 h-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-[#050505] dark:text-[#e4e6eb]" />
        </div>
        Help & support
      </button>

      <div className="h-px bg-[#f0f2f5] dark:bg-[#3e4042] my-2" />

      <button onClick={onLogout}
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
  )
}

export default ProfileDropdown
