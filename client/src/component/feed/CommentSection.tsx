"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Loader2, Send, MessageCircle, ChevronDown, ChevronUp, ThumbsUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { postsApi } from '@/lib/api'
import type { Comment } from '@/types'
import { avatarSrc, initials, timeAgo } from './feedUtils'
import { toast } from 'sonner'

interface Props {
  postId: string
  onCommentAdded: () => void
}

interface CommentItemProps {
  comment: Comment
  postId: string
  depth?: number
  onReplyAdded: (parentId: string, reply: Comment) => void
  onLikeToggle: (commentId: string, isLiked: boolean) => void
  onCommentUpdate: (commentId: string, updatedComment: Comment) => void
  onCommentDelete: (commentId: string) => void
}

const CommentItem = ({ comment, postId, depth = 0, onReplyAdded, onLikeToggle, onCommentUpdate, onCommentDelete }: CommentItemProps) => {
  const { user } = useAuth()
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [liking, setLiking] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const hasReplies = comment.replies && comment.replies.length > 0
  const isLiked = comment.userReactionType !== null
  const isOwnComment = user?.id === comment.author.id

  const handleReplySubmit = async () => {
    const trimmed = replyText.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const data = await postsApi.createComment(postId, { content: trimmed, parentId: comment.id })
      onReplyAdded(comment.id, data.comment)
      setReplyText('')
      setShowReplyInput(false)
      setShowReplies(true)
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  const handleLikeToggle = async () => {
    if (!user) return
    setLiking(true)
    try {
      if (isLiked) {
        await postsApi.unlikeComment(comment.id)
        onLikeToggle(comment.id, false)
      } else {
        await postsApi.likeComment(comment.id)
        onLikeToggle(comment.id, true)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toast.error('Failed to update like')
    } finally { setLiking(false) }
  }

  const handleEditSubmit = async () => {
    const trimmed = editText.trim()
    if (!trimmed) return
    setEditing(true)
    try {
      const data = await postsApi.updateComment(comment.id, trimmed)
      onCommentUpdate(comment.id, data.comment)
      setIsEditing(false)
    } catch { /* silent */ } finally { setEditing(false) }
  }

  const handleDelete = async () => {
    toast.error('Are you sure you want to delete this comment?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          setDeleting(true)
          try {
            await postsApi.deleteComment(comment.id)
            onCommentDelete(comment.id)
            toast.success('Comment deleted successfully')
          } catch {
            toast.error('Failed to delete comment')
          } finally {
            setDeleting(false)
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    })
  }

  const userInitials = user ? initials(user.firstName, user.lastName) : 'U'

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-2' : ''}`}>
      <div className="flex items-start gap-2">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={avatarSrc(comment.author.avatar)} className="" />
          <AvatarFallback className="bg-[#65676b] text-white text-xs font-semibold">
            {initials(comment.author.firstName, comment.author.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="px-3 py-2 inline-block relative">
            <p className="text-[13px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
              {comment.author.firstName} {comment.author.lastName}
            </p>
            {isEditing ? (
              <div className="mt-1">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setIsEditing(false)}
                  className="w-full bg-transparent outline-none text-[14px] text-[#050505] dark:text-[#e4e6eb] resize-none min-h-[40px]"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEditSubmit}
                    disabled={editing || !editText.trim()}
                    className="text-[11px] bg-[#1877f2] text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    {editing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[11px] text-[#65676b] hover:text-[#050505] dark:hover:text-[#e4e6eb] px-3 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-[#050505] dark:text-[#e4e6eb]">{comment.content}</p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 px-2">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-[11px] text-[#65676b] hover:text-[#1877f2] font-medium flex items-center gap-1"
            >
              <MessageCircle className="w-3 h-3" />
              Reply
            </button>
            <button
              onClick={handleLikeToggle}
              disabled={liking}
              className={`text-[11px] font-medium flex items-center gap-1 ${isLiked ? 'text-[#1877f2]' : 'text-[#65676b] hover:text-[#1877f2]'} disabled:opacity-50`}
            >
              <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              {comment.likesCount || 0}
            </button>
            <p className="text-[11px] text-[#65676b]">{timeAgo(comment.createdAt)}</p>
            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-[11px] text-[#65676b] hover:text-[#1877f2] font-medium flex items-center gap-1"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    View {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </button>
            )}
            {isOwnComment && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-[11px] text-[#65676b] hover:text-[#1877f2] font-medium flex items-center gap-1 p-1 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded transition-colors"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-6 bg-white dark:bg-[#242526] shadow-lg rounded-lg py-1 z-50 min-w-[120px] border border-[#ced0d4] dark:border-[#3e4042]">
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false); setEditText(comment.content) }}
                      className="w-full px-4 py-2 text-left text-[13px] text-[#050505] dark:text-[#e4e6eb] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] flex items-center gap-2 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => { handleDelete(); setShowMenu(false) }}
                      disabled={deleting}
                      className="w-full px-4 py-2 text-left text-[13px] text-[#dc3545] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarImage src={user?.avatar ?? undefined} className="" />
                <AvatarFallback className="bg-[#1877f2] text-white text-[10px] font-semibold">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center gap-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full px-3 py-1.5">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReplySubmit()}
                  placeholder="Write a reply…"
                  className="flex-1 bg-transparent outline-none text-[12px] text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b]"
                  autoFocus
                />
                {replyText.trim() && (
                  <button onClick={handleReplySubmit} disabled={submitting} className="text-[#1877f2] disabled:opacity-50">
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {showReplies && hasReplies && (
            <div className="mt-2 space-y-2">
              {comment.replies!.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  depth={depth + 1}
                  onReplyAdded={onReplyAdded}
                  onLikeToggle={onLikeToggle}
                  onCommentUpdate={onCommentUpdate}
                  onCommentDelete={onCommentDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
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

  const handleReplyAdded = (parentId: string, reply: Comment) => {
    setComments(prev => {
      const addReplyToComment = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply]
            }
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: addReplyToComment(comment.replies)
            }
          }
          return comment
        })
      }
      return addReplyToComment(prev)
    })
    onCommentAdded()
  }

  const handleLikeToggle = (commentId: string, isLiked: boolean) => {
    setComments(prev => {
      const updateCommentLike = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likesCount: isLiked ? (comment.likesCount || 0) + 1 : Math.max(0, (comment.likesCount || 0) - 1),
              userReactionType: isLiked ? 'like' : null
            }
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentLike(comment.replies)
            }
          }
          return comment
        })
      }
      return updateCommentLike(prev)
    })
  }

  const handleCommentUpdate = (commentId: string, updatedComment: Comment) => {
    setComments(prev => {
      const updateComment = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return updatedComment
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateComment(comment.replies)
            }
          }
          return comment
        })
      }
      return updateComment(prev)
    })
  }

  const handleCommentDelete = (commentId: string) => {
    setComments(prev => {
      const deleteComment = (comments: Comment[]): Comment[] => {
        return comments.filter(comment => comment.id !== commentId).map(comment => ({
          ...comment,
          replies: comment.replies ? deleteComment(comment.replies) : undefined
        }))
      }
      return deleteComment(prev)
    })
  }

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
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          onReplyAdded={handleReplyAdded}
          onLikeToggle={handleLikeToggle}
          onCommentUpdate={handleCommentUpdate}
          onCommentDelete={handleCommentDelete}
        />
      ))}
    </div>
  )
}

export default CommentSection
