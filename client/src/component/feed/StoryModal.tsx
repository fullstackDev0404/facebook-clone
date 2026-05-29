"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { avatarSrc } from '@/component/feed/feedUtils'
import { storiesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { StoryRecord } from '@/types'

const STORY_DURATION = 5000 // ms per story

interface Props {
  stories: StoryRecord[]
  startIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdvance?: () => void
  onStoryDeleted?: (storyId: string) => void
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ count, current, progress }: { count: number; current: number; progress: number }) {
  return (
    <div className="flex gap-1 px-3 pt-3 pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-0.75 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{
              width: i < current ? '100%' : i === current ? `${progress * 100}%` : '0%',
              transition: i === current ? 'none' : undefined,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── StoryModal ───────────────────────────────────────────────────────────────
const StoryModal = ({ stories, startIndex, open, onOpenChange, onStoryDeleted }: Props) => {
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [progress, setProgress]         = useState(0)
  const [deleting, setDeleting]         = useState(false)
  const startTimeRef = useRef<number>(0)
  const rafRef       = useRef<number>(0)
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  const story = stories[currentIndex]
  const isOwner = user?.id === story?.author.id

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    cancelAnimationFrame(rafRef.current)
  }

  const goNext = useCallback(() => {
    clearTimers()
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onOpenChange(false)
    }
  }, [stories.length, onOpenChange, currentIndex])

  const goPrev = useCallback(() => {
    clearTimers()
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }, [])

  const close = useCallback(() => {
    clearTimers()
    onOpenChange(false)
  }, [onOpenChange])

  const handleDelete = async () => {
    if (!story || !isOwner) return
    setDeleting(true)
    try {
      await storiesApi.delete(story.id)
      onStoryDeleted?.(story.id)
      close()
    } catch (err) {
      console.error('Failed to delete story:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Reset index when modal opens with a new startIndex
  useEffect(() => {
    if (open) setCurrentIndex(startIndex)
  }, [open, startIndex])

  // Animate progress bar + auto-advance
  useEffect(() => {
    if (!open) { clearTimers(); setProgress(0); return }

    setProgress(0)
    startTimeRef.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current
      const p = Math.min(elapsed / STORY_DURATION, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    timerRef.current = setTimeout(goNext, STORY_DURATION)

    return clearTimers
  }, [open, currentIndex, goNext])

  if (!story) return null

  const authorName = `${story.author.firstName} ${story.author.lastName}`
  const authorInitials = `${story.author.firstName[0] ?? ''}${story.author.lastName[0] ?? ''}`.toUpperCase()
  const imageUrl = story.image ? avatarSrc(story.image) : null

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        className="p-0 border-0 bg-black/90 shadow-none max-w-none w-screen h-screen rounded-none flex items-center justify-center"
        aria-describedby="story-description"
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">{authorName}&apos;s story</DialogTitle>
        <DialogDescription id="story-description" className="sr-only">Viewing {authorName}&apos;s story</DialogDescription>

        {/* Story card — fixed phone-like dimensions */}
        <div
          className="relative flex flex-col"
          style={{ width: 'min(100vw, 400px)', height: 'min(100vh, 700px)' }}
        >
          {/* Background */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ backgroundColor: story.backgroundColor ?? '#000' }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={authorName}
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            {/* Text overlay for text-only stories */}
            {!imageUrl && story.text && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <p
                  className="text-white text-2xl font-bold text-center wrap-break-word leading-snug"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                >
                  {story.text}
                </p>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/30 rounded-2xl" />
          </div>

          {/* Progress bars */}
          <div className="relative z-10">
            <ProgressBar count={stories.length} current={currentIndex} progress={progress} />
          </div>

          {/* Header: author + close/delete */}
          <div className="relative z-10 flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#1877f2] overflow-hidden bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {story.author.avatar ? (
                  <img
                    src={avatarSrc(story.author.avatar)}
                    alt={authorName}
                    className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                ) : authorInitials}
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none drop-shadow">{authorName}</p>
                <p className="text-white/60 text-[11px] mt-0.5">{Math.round(STORY_DURATION / 1000)}s</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-8 h-8 rounded-full bg-black/30 hover:bg-red-500/80 flex items-center justify-center text-white transition-colors disabled:opacity-50"
                  aria-label="Delete story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tap zones — left / right */}
          <div className="absolute inset-0 z-20 flex rounded-2xl overflow-hidden">
            <button
              className="w-1/3 h-full"
              onClick={goPrev}
              aria-label="Previous story"
              disabled={currentIndex === 0}
            />
            <div className="flex-1" /> {/* centre — no action */}
            <button
              className="w-1/3 h-full"
              onClick={goNext}
              aria-label="Next story"
            />
          </div>

          {/* Nav arrows (visible) */}
          {currentIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); goPrev() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
              aria-label="Previous"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); goNext() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
              aria-label="Next"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 8.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StoryModal
