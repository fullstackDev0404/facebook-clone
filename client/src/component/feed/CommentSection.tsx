"use client"
import React, { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { postsApi } from '@/lib/api'
import type { Comment } from '@/types'
import { avatarSrc, initials, timeAgo } from './feedUtils'

interface Props {
  postId: string
  onCommentAdded: () => void
}

const CommentSection = ({ postId, onCommentAdded }: Props) => {
  const { user } = useAuth()
  const [comments, setComments]     = useState<Comment[]>([])
  const [loading, setLoading]       = useState(false)
  const [loaded, setLoaded]         = useState(false)
  const [text, setText]             = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load on first render of this component
  React.useEffect(() => {
    if (loaded) return
    setLoading(true)
    postsApi.getComments(postId)
      .then(d => { setComments(d.comments ?? []); setLoaded(true) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [postId, loaded])

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const data = await postsApi.createComment(postId, { content: trimmed })
      setComments(p => [...p, data.comment])
      setText('')
      onCommentAdded()
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  const userInitials = user ? initials(user.firstName, user.lastName) : 'U'

  return (
    <div className="px-4 pb-3 border-t border-[#ced0d4] dark:border-[#3e4042] pt-3 space-y-3">
      {/* Input */}
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={user?.avatar ?? undefined} className="" />
          <AvatarFallback className="bg-[#1877f2] text-white text-xs font-semibold">{userInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center gap-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full px-4 py-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Write a comment…"
            className="flex-1 bg-transparent outline-none text-[13px] text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b]"
          />
          {text.trim() && (
            <button onClick={handleSubmit} disabled={submitting} className="text-[#1877f2] disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {loading && <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-[#65676b]" /></div>}
      {!loading && comments.length === 0 && (
        <p className="text-[13px] text-[#65676b] text-center py-1">No comments yet. Be the first!</p>
      )}

      {comments.map(comment => (
        <div key={comment.id} className="flex items-start gap-2">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={avatarSrc(comment.author.avatar)} className="" />
            <AvatarFallback className="bg-[#65676b] text-white text-xs font-semibold">
              {initials(comment.author.firstName, comment.author.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-2xl px-3 py-2 inline-block">
              <p className="text-[13px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {comment.author.firstName} {comment.author.lastName}
              </p>
              <p className="text-[14px] text-[#050505] dark:text-[#e4e6eb]">{comment.content}</p>
            </div>
            <p className="text-[11px] text-[#65676b] mt-1 px-2">{timeAgo(comment.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CommentSection
