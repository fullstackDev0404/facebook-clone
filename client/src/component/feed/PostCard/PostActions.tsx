"use client"
import React from 'react'
import { MessageCircle, Share2 } from 'lucide-react'

interface Props {
  shareStatus: 'Share' | 'Copied!' | 'Shared'
  onCommentClick: () => void
  onShareClick: () => void
}

const PostActions = ({ shareStatus, onCommentClick, onShareClick }: Props) => {
  return (
    <div className="flex items-center px-2 py-1">
      <button onClick={onCommentClick} className="tap-target flex items-center gap-2 flex-1 justify-center rounded-xl transition-colors font-semibold text-[14px] text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]">
        <MessageCircle className="w-4 h-4" /> Comment
      </button>
      <button
        onClick={onShareClick}
        className="tap-target flex items-center gap-2 flex-1 justify-center rounded-xl transition-colors font-semibold text-[14px] text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]"
      >
        <Share2 className="w-4 h-4" /> {shareStatus}
      </button>
    </div>
  )
}

export default PostActions
