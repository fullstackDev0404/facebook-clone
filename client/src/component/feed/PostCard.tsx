"use client"
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ThumbsUp, MessageCircle, Share2 } from 'lucide-react'
import { postsApi, moderationApi, blocksApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { PostRecord } from '@/types'
import CommentSection from './CommentSection'
import PostHeader from './PostCard/PostHeader'
import PostMenu from './PostCard/PostMenu'
import PostContent from './PostCard/PostContent'
import DeleteConfirmDialog from './PostCard/DeleteConfirmDialog'
import ReportDialog from './PostCard/ReportDialog'
import BlockDialog from './PostCard/BlockDialog'

interface Props {
  post: PostRecord
  onDeleted?: (id: string) => void
}

const PostCard = ({ post: initial, onDeleted }: Props) => {
  const { user }                          = useAuth()

  // Valid reaction types - must be declared before use
  const validTypes = ['like','love','haha','wow','sad','angry']

  // Guard against undefined post
  if (!initial || !initial.id || !initial.author) {
    return null
  }

  const [post, setPost]                   = useState(initial)
  const [liked, setLiked]                 = useState(Boolean(initial.userReactionType))
  const [reactionType, setReactionType]   = useState<string | null>(initial.userReactionType ?? null)
  const [showComments, setShowComments]   = useState(false)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [editing, setEditing]             = useState(false)
  const [editText, setEditText]           = useState(post.content ?? '')
  const [saving, setSaving]               = useState(false)
  const [deleteOpen, setDeleteOpen]       = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [shareStatus, setShareStatus]     = useState<'Share' | 'Copied!' | 'Shared'>('Share')
  const [editError, setEditError]         = useState('')
  const [reportOpen, setReportOpen]       = useState(false)
  const [blockOpen, setBlockOpen]         = useState(false)
  const [blocking, setBlocking]           = useState(false)
  const [reporting, setReporting]         = useState(false)
  const [reportReason, setReportReason]   = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null)

  const isOwner = user?.id === post.author.id

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
      setReactionCounts(rc => {
        const next = { ...rc }
        if (prev) next[prev] = Math.max(0, (next[prev] ?? 1) - 1)
        next[type] = (next[type] ?? 0) + 1
        return next
      })
      if (!liked) {
        setPost(p => ({ ...p, _count: { ...p._count, likes: (p._count?.likes ?? 0) + 1, comments: p._count?.comments ?? 0 } }))
      }
      setLiked(true)
      setReactionType(type)
    } catch {
      // silent
    }
  }

  const handleSaveEdit = async () => {
    const trimmed = editText.trim()
    if (!trimmed && !post.image && !editImageFile && !post.video && !editVideoFile) {
      setEditError('Post must have text or an image/video.')
      return
    }
    setSaving(true)
    setEditError('')
    try {
      const formData = new FormData()
      formData.append('content', trimmed)
      if (editImageFile) formData.append('image', editImageFile)
      if (editVideoFile) formData.append('video', editVideoFile)
      
      const { post: updated } = await postsApi.update(post.id, formData)
      setPost(updated)
      setEditing(false)
      setEditImageFile(null)
      setEditVideoFile(null)
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

  const handleReport = async () => {
    if (!reportReason) return
    setReporting(true)
    try {
      await moderationApi.createReport({
        entityType: 'post',
        entityId: post.id,
        reason: reportReason,
        description: reportDescription || undefined
      })
      setReportOpen(false)
      setReportReason('')
      setReportDescription('')
      toast.success('Post reported successfully')
    } catch (err) {
      toast.error('Failed to report post')
    } finally {
      setReporting(false)
    }
  }

  const handleBlock = async () => {
    if (!user || !post.author.id) return
    setBlocking(true)
    try {
      await blocksApi.blockUser(post.author.id)
      setBlockOpen(false)
      toast.success('User blocked successfully')
      onDeleted?.(post.id)
    } catch (err) {
      toast.error('Failed to block user')
    } finally {
      setBlocking(false)
    }
  }

  const onCommentAdded = () =>
    setPost(p => ({ ...p, _count: { ...p._count, likes: p._count?.likes ?? 0, comments: (p._count?.comments ?? 0) + 1 } }))

  const reactionMap: { [key: string]: string } = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡',
  }

  return (
    <>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={handleDelete}
        deleting={deleting}
      />

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        onReport={handleReport}
        reporting={reporting}
        reportReason={reportReason}
        onReportReasonChange={setReportReason}
        reportDescription={reportDescription}
        onReportDescriptionChange={setReportDescription}
      />

      <BlockDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onBlock={handleBlock}
        blocking={blocking}
        userName={`${post.author.firstName} ${post.author.lastName}`}
      />

      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] dark:border-[#3e4042] overflow-hidden">
        <div className="relative">
          <PostHeader
            post={post}
            onMenuClick={() => setMenuOpen(o => !o)}
            menuOpen={menuOpen}
          />
          <PostMenu
            menuOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            isOwner={isOwner}
            onEdit={() => { setEditing(true); setEditText(post.content ?? ''); setMenuOpen(false) }}
            onDelete={() => { setMenuOpen(false); setDeleteOpen(true) }}
            onReport={() => { setMenuOpen(false); setReportOpen(true) }}
            onBlock={() => { setMenuOpen(false); setBlockOpen(true) }}
            onHide={() => setMenuOpen(false)}
          />
        </div>

        <PostContent
          content={post.content}
          image={post.image}
          video={post.video}
          editing={editing}
          editText={editText}
          onEditTextChange={setEditText}
          onEditImageChange={setEditImageFile}
          onEditVideoChange={setEditVideoFile}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => { setEditing(false); setEditError(''); setEditImageFile(null); setEditVideoFile(null) }}
          saving={saving}
          editError={editError}
        />

        {(Object.values(reactionCounts).some(c => c > 0) || commentCount > 0) && (
          <div className="flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#ced0d4] dark:border-[#3e4042]">
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

        <div className="flex items-center px-4 py-2 gap-1 border-t border-[#ced0d4] dark:border-[#3e4042]">
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={handleLike}
              aria-label={liked ? 'Unlike' : 'Like'}
              title={liked ? 'Unlike' : 'Like'}
              className={`tap-target flex items-center gap-2 justify-center w-full py-2 rounded-lg transition-all duration-150 text-[15px] font-medium ${
                liked ? 'text-[#1877f2] hover:bg-[#e7f3ff] dark:hover:bg-[#1877f2]/10' : 'text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-[#1877f2] text-[#1877f2]' : ''}`} strokeWidth={liked ? 0 : 2} />
              Like
            </button>
          </div>
          <button onClick={() => setShowComments(p => !p)} className="tap-target flex items-center gap-2 flex-1 justify-center py-2 rounded-lg transition-colors text-[15px] font-medium text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]">
            <MessageCircle className="w-5 h-5" /> Comment
          </button>
          <button
            onClick={handleShare}
            className="tap-target flex items-center gap-2 flex-1 justify-center py-2 rounded-lg transition-colors text-[15px] font-medium text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]"
          >
            <Share2 className="w-5 h-5" /> {shareStatus}
          </button>
        </div>

        {showComments && <CommentSection postId={post.id} onCommentAdded={onCommentAdded} />}
      </div>
    </>
  )
}

export default PostCard
