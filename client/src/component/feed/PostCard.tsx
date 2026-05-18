"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { MessageCircle, MoreHorizontal, Share2, ThumbsUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { postsApi } from '@/lib/api'
import type { PostRecord } from '@/types'
import { avatarSrc, initials, timeAgo } from './feedUtils'
import CommentSection from './CommentSection'

interface Props { post: PostRecord }

const PostCard = ({ post: initial }: Props) => {
  const [post, setPost]               = useState(initial)
  const [liked, setLiked]             = useState(false)
  const [showComments, setShowComments] = useState(false)

  const name = `${post.author.firstName} ${post.author.lastName}`
  const fb   = initials(post.author.firstName, post.author.lastName)
  const likeCount    = post._count?.likes    ?? 0
  const commentCount = post._count?.comments ?? 0

  const handleLike = async () => {
    try {
      if (liked) {
        await postsApi.unlike(post.id)
        setLiked(false)
        setPost(p => ({ ...p, _count: { ...p._count, likes: Math.max(0, (p._count?.likes ?? 0) - 1), comments: p._count?.comments ?? 0 } }))
      } else {
        await postsApi.like(post.id)
        setLiked(true)
        setPost(p => ({ ...p, _count: { ...p._count, likes: (p._count?.likes ?? 0) + 1, comments: p._count?.comments ?? 0 } }))
      }
    } catch { /* silent */ }
  }

  const onCommentAdded = () =>
    setPost(p => ({ ...p, _count: { ...p._count, likes: p._count?.likes ?? 0, comments: (p._count?.comments ?? 0) + 1 } }))

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] dark:border-[#3e4042] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarSrc(post.author.avatar)} className="" />
            <AvatarFallback className="bg-[#1877f2] text-white font-semibold text-sm">{fb}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[14px] text-[#050505] dark:text-[#e4e6eb]">{name}</p>
            <p className="text-[12px] text-[#65676b] flex items-center gap-1">
              {timeAgo(post.createdAt)} · <span>Public</span>
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-[#65676b]" />
        </button>
      </div>

      {post.content && (
        <p className="px-4 pb-3 text-[15px] text-[#050505] dark:text-[#e4e6eb] leading-relaxed">{post.content}</p>
      )}

      {post.image && (
        <div className="w-full bg-[#f0f2f5]">
          <Image src={avatarSrc(post.image) ?? ''} alt="Post" width={600} height={400} className="w-full object-cover max-h-[500px]" unoptimized />
        </div>
      )}

      {(likeCount > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2">
          {likeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[#1877f2] flex items-center justify-center">
                <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
              </div>
              <span className="text-[13px] text-[#65676b]">{likeCount}</span>
            </div>
          )}
          {commentCount > 0 && (
            <button onClick={() => setShowComments(p => !p)} className="ml-auto text-[13px] text-[#65676b] hover:underline">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      <div className="mx-4 border-t border-[#ced0d4] dark:border-[#3e4042]" />

      <div className="flex items-center px-2 py-1">
        {[
          { label: 'Like',    icon: ThumbsUp,      onClick: handleLike,                    active: liked },
          { label: 'Comment', icon: MessageCircle,  onClick: () => setShowComments(p => !p), active: false },
          { label: 'Share',   icon: Share2,         onClick: () => {},                       active: false },
        ].map(({ label, icon: Icon, onClick, active }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-xl transition-colors font-semibold text-[14px] ${
              active ? 'text-[#1877f2]' : 'text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? 'fill-[#1877f2] text-[#1877f2]' : ''}`} strokeWidth={active ? 0 : 2} />
            {label}
          </button>
        ))}
      </div>

      {showComments && <CommentSection postId={post.id} onCommentAdded={onCommentAdded} />}
    </div>
  )
}

export default PostCard
