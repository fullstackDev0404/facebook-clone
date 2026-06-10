"use client"

import { useState, useRef, useEffect } from 'react'
import { postsApi, moderationApi, blocksApi } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import type { PostRecord } from '@/types'

const validTypes = ['like','love','haha','wow','sad','angry']

export const usePostCard = (post: PostRecord, onDeleted?: (id: string) => void) => {
  const { success, error: showError, info } = useToast()
  const [liked, setLiked] = useState(Boolean(post.userReactionType))
  const [reactionType, setReactionType] = useState<string | null>(post.userReactionType ?? null)
  const [showComments, setShowComments] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(post.content ?? '')
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [shareStatus, setShareStatus] = useState<'Share' | 'Copied!' | 'Shared'>('Share')
  const [editError, setEditError] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null)
  const shareTimerRef = useRef<number | null>(null)

  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {}
    validTypes.forEach(t => base[t] = 0)
    return base
  })

  const reactionTotal = Object.values(reactionCounts).reduce((sum, value) => sum + value, 0)
  const likeCount = reactionTotal || (post._count?.likes ?? 0)
  const commentCount = post._count?.comments ?? 0

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

    if (shareTimerRef.current) {
      clearTimeout(shareTimerRef.current)
    }
    shareTimerRef.current = window.setTimeout(() => setShareStatus('Share'), 1500)
  }

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) {
        clearTimeout(shareTimerRef.current)
      }
    }
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
      } else {
        await postsApi.like(post.id, { type: 'like' })
        setReactionCounts(rc => ({ ...rc, like: (rc.like ?? 0) + 1 }))
        setLiked(true)
        setReactionType('like')
      }
    } catch { /* silent */ }
  }

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
        setLiked(true)
      }
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
      setEditing(false)
      setEditImageFile(null)
      setEditVideoFile(null)
      success('Post updated successfully!')
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save'
      setEditError(errorMessage)
      showError(errorMessage)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await postsApi.delete(post.id)
      setDeleteOpen(false)
      onDeleted?.(post.id)
      success('Post deleted successfully!')
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete post'
      showError(errorMessage)
      setDeleting(false)
    }
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
      success('Post reported successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to report post'
      showError(errorMessage)
    } finally {
      setReporting(false)
    }
  }

  const handleBlock = async () => {
    setBlocking(true)
    try {
      await blocksApi.blockUser(post.author.id)
      setBlockOpen(false)
      success('User blocked successfully')
      onDeleted?.(post.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to block user'
      showError(errorMessage)
    } finally {
      setBlocking(false)
    }
  }

  const onCommentAdded = () => {
    // This would update the comment count
  }

  return {
    liked,
    reactionType,
    showComments,
    setShowComments,
    menuOpen,
    setMenuOpen,
    editing,
    setEditing,
    editText,
    setEditText,
    saving,
    deleteOpen,
    setDeleteOpen,
    deleting,
    shareStatus,
    editError,
    setEditError,
    reportOpen,
    setReportOpen,
    blockOpen,
    setBlockOpen,
    blocking,
    reporting,
    reportReason,
    setReportReason,
    reportDescription,
    setReportDescription,
    editImageFile,
    setEditImageFile,
    editVideoFile,
    setEditVideoFile,
    reactionCounts,
    likeCount,
    commentCount,
    handleShare,
    handleLike,
    selectReaction,
    handleSaveEdit,
    handleDelete,
    handleReport,
    handleBlock,
    onCommentAdded,
    validTypes,
  }
}
