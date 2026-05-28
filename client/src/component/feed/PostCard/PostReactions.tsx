"use client"
import React, { useRef, useEffect } from 'react'
import { ThumbsUp } from 'lucide-react'

interface Props {
  liked: boolean
  reactionType: string | null
  reactionCounts: Record<string, number>
  reactionTotal: number
  commentCount: number
  onLike: () => void
  onReactionSelect: (type: string) => void
  onShowReactionsChange: (show: boolean) => void
  onToggleComments: () => void
}

const reactionMap: { [key: string]: string } = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
}

const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry']

const PostReactions = ({
  liked,
  reactionType,
  reactionCounts,
  reactionTotal,
  commentCount,
  onLike,
  onReactionSelect,
  onShowReactionsChange,
  onToggleComments,
}: Props) => {
  const [showReactions, setShowReactions] = React.useState(false)
  const reactionsRef = useRef<HTMLDivElement | null>(null)
  const longPressTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => { if (longPressTimer.current) window.clearTimeout(longPressTimer.current) }
  }, [])

  const handleReactionSelect = (type: string) => {
    onReactionSelect(type)
    setShowReactions(false)
  }

  return (
    <>
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
            <button onClick={onToggleComments} className="text-[13px] text-[#65676b] hover:underline">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      <div className="mx-4 border-t border-[#ced0d4] dark:border-[#3e4042]" />

      <div className="flex items-center px-2 py-1">
        <div className="relative flex-1 flex items-center justify-center">
          <button
            onClick={onLike}
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
                  onClick={() => handleReactionSelect(type)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-[18px] transition-transform hover:scale-110 ${reactionType === type ? 'ring-2 ring-[#1877f2]' : ''}`}
                >
                  <span>{emoji}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PostReactions
