"use client"
import React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { PostRecord } from '@/types'
import { avatarSrc, initials, timeAgo } from '../feedUtils'

interface Props {
  post: PostRecord
  onMenuClick: () => void
  menuOpen: boolean
}

const PostHeader = ({ post, onMenuClick, menuOpen }: Props) => {
  const name = `${post.author.firstName} ${post.author.lastName}`
  const fb = initials(post.author.firstName, post.author.lastName)
  const privacy = (post as any).privacy || 'public'

  const privacyConfig = {
    public: { icon: ({ className }: { className?: string }) => <span className={className}>🌐</span>, label: 'Public' },
    friends: { icon: ({ className }: { className?: string }) => <span className={className}>👥</span>, label: 'Friends' },
    private: { icon: ({ className }: { className?: string }) => <span className={className}>🔒</span>, label: 'Private' },
  }
  const currentPrivacy = privacyConfig[privacy as keyof typeof privacyConfig] || privacyConfig.public

  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatarSrc(post.author.avatar)} className="" />
          <AvatarFallback className="bg-[#1877f2] text-white font-semibold text-sm">{fb}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-[14px] text-[#050505] dark:text-[#e4e6eb]">{name}</p>
          <p className="text-[12px] text-[#65676b] flex items-center gap-1">
            {timeAgo(post.createdAt)} · <span className="flex items-center gap-1"><currentPrivacy.icon className="w-3 h-3" /> {currentPrivacy.label}</span>
          </p>
        </div>
      </div>

      <button
        onClick={onMenuClick}
        className={`p-2 rounded-full transition-colors ${menuOpen ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-[#65676b]'}`}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  )
}

export default PostHeader
