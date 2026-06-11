"use client"

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserX, UserPlus, UserCheck } from 'lucide-react'
import { avatarSrc } from '@/component/feed/feedUtils'

interface User {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  bio?: string
}

interface Props {
  user: User
  isBlocked: boolean
  friendStatus: 'none' | 'pending' | 'accepted' | 'rejected'
  isSending: boolean
  onUserClick: (userId: string) => void
  onAddFriend: (userId: string, e: React.MouseEvent) => void
}

export const UserResultCard = ({ user, isBlocked, friendStatus, isSending, onUserClick, onAddFriend }: Props) => {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors border-b border-[#f0f2f5] dark:border-[#3e4042] last:border-0">
      <button
        onClick={() => onUserClick(user.id)}
        className="flex items-center gap-4 flex-1 min-w-0 text-left"
      >
        <Avatar className="w-12 h-12 shrink-0">
          <AvatarImage src={avatarSrc(user.avatar ?? null)} />
          <AvatarFallback className="bg-[#1877f2] text-white text-sm font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base text-[#050505] dark:text-[#e4e6eb] flex items-center gap-2">
            {user.firstName} {user.lastName}
            {isBlocked && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                <UserX className="w-3 h-3" />
                Blocked
              </span>
            )}
          </p>
          {user.bio && (
            <p className="text-sm text-[#65676b] dark:text-[#b0b3b8] line-clamp-1">{user.bio}</p>
          )}
        </div>
      </button>
      {friendStatus === 'none' && !isBlocked && (
        <button
          onClick={(e) => onAddFriend(user.id, e)}
          disabled={isSending}
          className="shrink-0 px-4 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Add Friend
            </>
          )}
        </button>
      )}
      {friendStatus === 'pending' && (
        <button
          disabled
          className="shrink-0 px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#65676b] dark:text-[#b0b3b8] text-sm font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          Request Sent
        </button>
      )}
      {friendStatus === 'accepted' && (
        <button
          disabled
          className="shrink-0 px-4 py-2 bg-[#e7f3ff] dark:bg-[#263951] text-[#1877f2] text-sm font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          Friends
        </button>
      )}
    </div>
  )
}
