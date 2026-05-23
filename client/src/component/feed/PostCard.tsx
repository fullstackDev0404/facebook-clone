"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { MessageCircle, MoreHorizontal, Pencil, Share2, ThumbsUp, Trash2, X, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { postsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { PostRecord } from '@/types'
import { avatarSrc, initials, timeAgo } from './feedUtils'
import CommentSection from './CommentSection'

interface Props {
  post: PostRecord
  onDeleted?: (id: string) => void
}

const PostCard = ({ post: initial, onDeleted }: Props) => {
  const { user }                          = useAuth()
  
  // Guard against undefined post
  if (!initial || !initial.id || !initial.author) {
    return null
  }
  
  const [post, setPost]                   = useState(initial)
  const [liked, setLiked]                 = useState(Boolean(initial.userReactionType))
  const [reactionType, setReactionType]   = useState<string | null>(initial.userReactionType ?? null)
  const [showComments, setShowComments]   = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [editing, setEditing]             = useState(false)
  const [editText, setEditText]           = useState(post.content ?? '')
  const [saving, setSaving]               = useState(false)
  const [deleteOpen, setDeleteOpen]       = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [shareStatus, setShareStatus]     = useState<'Share' | 'Copied!' | 'Shared'>('Share')
  const [editError, setEditError]         = useState('')
  const menuRef                           = useRef<HTMLDivElement>(null)
  const reactionsRef                       = useRef<HTMLDivElement | null>(null)
  const longPressTimer                     = useRef<number | null>(null)

  const isOwner = user?.id === post.author.id
  const name    = `${post.author.firstName} ${post.author.lastName}`
  const fb      = initials(post.author.firstName, post.author.lastName)

  const menuItemBase = 'flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-colors text-[14px] font-medium'
  const menuItemHover = 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
  const destructiveMenuItem = `${menuItemBase} bg-transparent dark:bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`
  const standardMenuItem = `${menuItemBase} ${menuItemHover} text-[#050505] dark:text-[#e4e6eb]`

  const reactionMap: { [key: string]: string } = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡',
  }

  const validTypes = ['like','love','haha','wow','sad','angry']

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#post-${post.id}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          text: post.content ? post.content.slice(0, 120) : 'Check out this post',
          url: shareUrl,
        })
        setShareStatus('Shared')
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShareStatus('Copied!')
      }
    } catch (error) {
      setShareStatus('Share')
    }

    window.setTimeout(() => setShareStatus('Share'), 1500)
  }

  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {}
    validTypes.forEach(t => base[t] = 0)
    return base
  })

  const reactionTotal = Object.values(reactionCounts).reduce((sum, value) => sum + value, 0)
  const likeCount    = reactionTotal || (post._count?.likes ?? 0)
  const commentCount = post._count?.comments ?? 0

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cleanup any timers on unmount
  useEffect(() => {
    return () => { if (longPressTimer.current) window.clearTimeout(longPressTimer.current) }
  }, [])

  const handleLike = async () => {
    try {
      if (liked) {
        await postsApi.unlike(post.id)
        setReactionCounts(rc => {
          const next = { ...rc }
          if (reactionType) next[reactionType] = Math.max(0, (next[reactionType] ?? 1) - 1)
          return next
        })
        setLiked(false)
        setReactionType(null)
        setPost(p => ({ ...p, _count: { ...p._count, likes: Math.max(0, (p._count?.likes ?? 0) - 1), comments: p._count?.comments ?? 0 } }))
      } else {
        await postsApi.like(post.id, { type: 'like' })
        setReactionCounts(rc => ({ ...rc, like: (rc.like ?? 0) + 1 }))
        setLiked(true)
        setReactionType('like')
        setPost(p => ({ ...p, _count: { ...p._count, likes: (p._count?.likes ?? 0) + 1, comments: p._count?.comments ?? 0 } }))
      }
    } catch { /* silent */ }
  }

  // Fetch reaction breakdown for this post
  useEffect(() => {
    let mounted = true
    postsApi.getReactions(post.id)
      .then(d => {
        if (!mounted) return
        const base: Record<string, number> = {}
        validTypes.forEach(t => base[t] = d.breakdown?.[t] ?? 0)
        setReactionCounts(base)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [post.id])

  const selectReaction = async (type: string) => {
    const prev = reactionType
    try {
      await postsApi.like(post.id, { type })
      // update counts locally
      setReactionCounts(rc => {
        const next = { ...rc }
        if (prev) next[prev] = Math.max(0, (next[prev] ?? 1) - 1)
        next[type] = (next[type] ?? 0) + 1
        return next
      })
      // if user previously had no reaction, increment total likes
      if (!liked) {
        setPost(p => ({ ...p, _count: { ...p._count, likes: (p._count?.likes ?? 0) + 1, comments: p._count?.comments ?? 0 } }))
      }
      setLiked(true)
      setReactionType(type)
    } catch {
      // silent
    } finally {
      setShowReactions(false)
    }
  }

  const handleSaveEdit = async () => {
    const trimmed = editText.trim()
    if (!trimmed && !post.image) { setEditError('Post must have text or an image.'); return }
    setSaving(true)
    setEditError('')
    try {
      const { post: updated } = await postsApi.update(post.id, trimmed)
      setPost(updated)
      setEditing(false)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await postsApi.delete(post.id)
      setDeleteOpen(false)
      onDeleted?.(post.id)
    } catch { setDeleting(false) }
  }

  const onCommentAdded = () =>
    setPost(p => ({ ...p, _count: { ...p._count, likes: p._count?.likes ?? 0, comments: (p._count?.comments ?? 0) + 1 } }))

  return (
    <>
      {/* ── Delete confirmation modal ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-1">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-center text-[17px]">Delete post?</DialogTitle>
            <DialogDescription className="text-center text-[14px]">
              This will permanently remove your post. You can&apos;t undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Post card ── */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] dark:border-[#3e4042]">
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

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className={`p-2 rounded-full transition-colors ${menuOpen ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-[#65676b]'}`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#242526] rounded-2xl py-1 z-50"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              >
                {isOwner ? (
                  <>
                    <button
                      onClick={() => { setEditing(true); setEditText(post.content ?? ''); setMenuOpen(false) }}
                      className={standardMenuItem}
                    >
                      <Pencil className="w-4 h-4 text-[#65676b]" />
                      Edit post
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                      className={destructiveMenuItem}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete post
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setMenuOpen(false)}
                    className={standardMenuItem}
                  >
                    Hide post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit mode */}
        {editing ? (
          <div className="px-4 pb-3">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] outline-none text-[15px] text-[#050505] dark:text-[#e4e6eb] resize-none focus:ring-2 focus:ring-[#1877f2]/30 transition-all"
              placeholder="What's on your mind?"
              autoFocus
            />
            {editError && <p className="text-red-500 text-[12px] mt-1">{editError}</p>}
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => { setEditing(false); setEditError('') }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-[13px] font-semibold transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white text-[13px] font-semibold transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        ) : (
          post.content && (
            <p className="px-4 pb-3 text-[15px] text-[#050505] dark:text-[#e4e6eb] leading-relaxed">{post.content}</p>
          )
        )}

        {post.image && (
          <div className="w-full bg-[#f0f2f5] overflow-hidden">
            <Image src={avatarSrc(post.image) ?? ''} alt="Post" width={600} height={400} className="w-full object-cover max-h-125" unoptimized />
          </div>
        )}

        {post.video && (
          <div className="w-full bg-black overflow-hidden">
            <video
              src={avatarSrc(post.video)}
              controls
              className="w-full max-h-125 object-contain"
            />
          </div>
        )}

        {(Object.values(reactionCounts).some(c => c > 0) || commentCount > 0) && (
          <div className="flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {validTypes.map(type => (
                reactionCounts[type] > 0 ? (
                  <div key={type} className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3 py-1 text-[13px] text-[#050505] dark:text-[#e4e6eb]">
                    <span>{reactionMap[type]}</span>
                    <span className="font-semibold">{reactionCounts[type]}</span>
                  </div>
                ) : null
              ))}
            </div>
            {commentCount > 0 && (
              <button onClick={() => setShowComments(p => !p)} className="text-[13px] text-[#65676b] hover:underline">
                {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        <div className="mx-4 border-t border-[#ced0d4] dark:border-[#3e4042]" />

        <div className="flex items-center px-2 py-1">
          {/* Like button with reaction picker */}
          <div className="relative flex-1 flex items-center justify-center">
            <button
              onClick={handleLike}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              onPointerDown={() => {
                longPressTimer.current = window.setTimeout(() => setShowReactions(true), 400)
              }}
              onPointerUp={() => { if (longPressTimer.current) { window.clearTimeout(longPressTimer.current); longPressTimer.current = null } }}
              aria-label={liked ? 'Unlike' : 'Like'}
              title={liked ? 'Unlike' : 'Like'}
              className={`tap-target flex items-center gap-2 justify-center w-full rounded-xl border transition-all duration-150 text-[14px] ${
                liked ? 'border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]' : 'border-transparent text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-[#1877f2] text-[#1877f2]' : ''}`} strokeWidth={liked ? 0 : 2} />
              Like
            </button>

            {showReactions && (
              <div
                ref={reactionsRef}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-white dark:bg-[#242526] rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl z-50"
                style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}
              >
                {Object.entries(reactionMap).map(([type, emoji]) => (
                  <button
                    key={type}
                    onClick={() => selectReaction(type)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-[18px] transition-transform hover:scale-110 ${reactionType === type ? 'ring-2 ring-[#1877f2]' : ''}`}
                  >
                    <span>{emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment and Share buttons */}
          <button onClick={() => setShowComments(p => !p)} className="tap-target flex items-center gap-2 flex-1 justify-center rounded-xl transition-colors font-semibold text-[14px] text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]">
            <MessageCircle className="w-4 h-4" /> Comment
          </button>
          <button
            onClick={handleShare}
            className="tap-target flex items-center gap-2 flex-1 justify-center rounded-xl transition-colors font-semibold text-[14px] text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]"
          >
            <Share2 className="w-4 h-4" /> {shareStatus}
          </button>
        </div>

        {showComments && <CommentSection postId={post.id} onCommentAdded={onCommentAdded} />}
      </div>
    </>
  )
}

export default PostCard
