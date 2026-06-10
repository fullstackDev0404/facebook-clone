"use client"
import React from 'react'
import { ThumbsUp, MessageCircle, Share2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { PostRecord } from '@/types'
import CommentSection from './CommentSection'
import PostHeader from './PostCard/PostHeader'
import PostMenu from './PostCard/PostMenu'
import PostContent from './PostCard/PostContent'
import DeleteConfirmDialog from './PostCard/DeleteConfirmDialog'
import ReportDialog from './PostCard/ReportDialog'
import BlockDialog from './PostCard/BlockDialog'
import { usePostCard } from './PostCard/usePostCard'

interface Props {
  post: PostRecord
  onDeleted?: (id: string) => void
  highlightQuery?: string
}

const PostCard = ({ post: initial, onDeleted, highlightQuery }: Props) => {
  const { user } = useAuth()

  if (!initial || !initial.id || !initial.author) {
    return null
  }

  const postCard = usePostCard(initial, onDeleted)
  const isOwner = user?.id === initial.author.id

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
        open={postCard.deleteOpen}
        onOpenChange={postCard.setDeleteOpen}
        onDelete={postCard.handleDelete}
        deleting={postCard.deleting}
      />

      <ReportDialog
        open={postCard.reportOpen}
        onOpenChange={postCard.setReportOpen}
        onReport={postCard.handleReport}
        reporting={postCard.reporting}
        reportReason={postCard.reportReason}
        onReportReasonChange={postCard.setReportReason}
        reportDescription={postCard.reportDescription}
        onReportDescriptionChange={postCard.setReportDescription}
      />

      <BlockDialog
        open={postCard.blockOpen}
        onOpenChange={postCard.setBlockOpen}
        onBlock={postCard.handleBlock}
        blocking={postCard.blocking}
        userName={`${initial.author.firstName} ${initial.author.lastName}`}
      />

      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] dark:border-[#3e4042] overflow-hidden">
        <div className="relative">
          <PostHeader
            post={initial}
            onMenuClick={() => postCard.setMenuOpen(o => !o)}
            menuOpen={postCard.menuOpen}
          />
          <PostMenu
            menuOpen={postCard.menuOpen}
            onClose={() => postCard.setMenuOpen(false)}
            isOwner={isOwner}
            onEdit={() => { postCard.setEditing(true); postCard.setEditText(initial.content ?? ''); postCard.setMenuOpen(false) }}
            onDelete={() => { postCard.setMenuOpen(false); postCard.setDeleteOpen(true) }}
            onReport={() => { postCard.setMenuOpen(false); postCard.setReportOpen(true) }}
            onBlock={() => { postCard.setMenuOpen(false); postCard.setBlockOpen(true) }}
            onHide={() => postCard.setMenuOpen(false)}
          />
        </div>

        <PostContent
          content={initial.content}
          image={initial.image}
          video={initial.video}
          editing={postCard.editing}
          editText={postCard.editText}
          onEditTextChange={postCard.setEditText}
          onEditImageChange={postCard.setEditImageFile}
          onEditVideoChange={postCard.setEditVideoFile}
          onSaveEdit={postCard.handleSaveEdit}
          onCancelEdit={() => { postCard.setEditing(false); postCard.setEditError(''); postCard.setEditImageFile(null); postCard.setEditVideoFile(null) }}
          saving={postCard.saving}
          editError={postCard.editError}
          highlightQuery={highlightQuery}
        />

        {(Object.values(postCard.reactionCounts).some(c => c > 0) || postCard.commentCount > 0) && (
          <div className="flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#ced0d4] dark:border-[#3e4042]">
            <div className="flex flex-wrap gap-2">
              {postCard.validTypes.map(type => (
                postCard.reactionCounts[type] > 0 ? (
                  <div key={type} className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3 py-1 text-[13px] text-[#050505] dark:text-[#e4e6eb]">
                    <span>{reactionMap[type]}</span>
                    <span className="font-semibold">{postCard.reactionCounts[type]}</span>
                  </div>
                ) : null
              ))}
            </div>
            {postCard.commentCount > 0 && (
              <button onClick={() => postCard.setShowComments(p => !p)} className="text-[13px] text-[#65676b] hover:underline">
                {postCard.commentCount} {postCard.commentCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center px-4 py-2 gap-1 border-t border-[#ced0d4] dark:border-[#3e4042]">
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={postCard.handleLike}
              aria-label={postCard.liked ? 'Unlike' : 'Like'}
              title={postCard.liked ? 'Unlike' : 'Like'}
              className={`tap-target flex items-center gap-2 justify-center w-full py-2 rounded-lg transition-all duration-150 text-[15px] font-medium ${
                postCard.liked ? 'text-[#1877f2] hover:bg-[#e7f3ff] dark:hover:bg-[#1877f2]/10' : 'text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${postCard.liked ? 'fill-[#1877f2] text-[#1877f2]' : ''}`} strokeWidth={postCard.liked ? 0 : 2} />
              Like
            </button>
          </div>
          <button onClick={() => postCard.setShowComments(p => !p)} className="tap-target flex items-center gap-2 flex-1 justify-center py-2 rounded-lg transition-colors text-[15px] font-medium text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]">
            <MessageCircle className="w-5 h-5" /> Comment
          </button>
          <button
            onClick={postCard.handleShare}
            className="tap-target flex items-center gap-2 flex-1 justify-center py-2 rounded-lg transition-colors text-[15px] font-medium text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]"
          >
            <Share2 className="w-5 h-5" /> {postCard.shareStatus}
          </button>
        </div>

        {postCard.showComments && <CommentSection postId={initial.id} onCommentAdded={postCard.onCommentAdded} />}
      </div>
    </>
  )
}

export default PostCard
