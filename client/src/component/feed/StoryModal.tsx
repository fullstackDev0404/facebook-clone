"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { avatarSrc } from '@/component/feed/feedUtils'
import type { StoryRecord } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const STORY_DURATION = 3000 // ms per story

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  stories: StoryRecord[]
  startIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdvance?: () => void
}

// ─── ActiveStoryContent ───────────────────────────────────────────────────────

function ActiveStoryContent({ story }: { story: StoryRecord }) {
  if (story.image) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={avatarSrc(story.image) ?? ''} alt="" className="w-full h-full object-contain bg-black" />
    )
  }
  return (
    <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: story.backgroundColor ?? '#ff0000' }}>
      <p className="text-2xl font-bold text-center break-words leading-snug" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
        {story.text}
      </p>
    </div>
  )
}

// ─── StoryProgressBar ─────────────────────────────────────────────────────────

function StoryProgressBar({
  stories,
  currentIndex,
  remaining,
}: {
  stories: StoryRecord[]
  currentIndex: number
  remaining: number
}) {
  return (
    <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 pt-3">
      {stories.map((_, i) => {
        // Complete before current = 100 %; current = animated fraction; future = 0
        const pct =
          i < currentIndex
            ? 100
            : i === currentIndex
              ? Math.max(0, Math.min(100, (1 - remaining) * 100))
              : 0
        return (
          <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden rounded-r-none last:rounded-r-full">
            <div className="h-full bg-white rounded-full transition-none" style={{ width: `${pct}%` }} />
          </div>
        )
      })}
    </div>
  )
}

// ─── StoryModal ───────────────────────────────────────────────────────────────

const StoryModal = ({ stories, startIndex, open, onOpenChange, onAdvance }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  // remaining[i] lives at `remainingBuffer.current[i]` so every rAF tick can
  // update all pending bars synchronously without violating the set-state-in-effect rule.
  const remainingBuffer = useRef<number[]>([])
  const [remaining, setRemaining] = useState(1) // only driven by rAF (not by useEffects)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auto-advance timer: kick a fresh one whenever `open` or `currentIndex` changes ──
  useEffect(() => {
    if (!open) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    // Push a fresh entry for the current index
    remainingBuffer.current[currentIndex] = 1

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      // Move to the next story; naturally animates remainingBuffer[currentIndex] → 0
      setCurrentIndex((prev) => {
        remainingBuffer.current[prev] = 0 // fully decayed
        if (prev < stories.length - 1) return prev + 1
        onOpenChange(false)
        return prev
      })
    }, STORY_DURATION)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [open, currentIndex, stories.length, onOpenChange])

  // ── Animate ALL remainingBuffer entries each frame ───────────────────────────
  useEffect(() => {
    if (!open) return
    const storyStart = Date.now()
    let frame = 0
    const tick = () => {
      const elapsed    = Date.now() - storyStart
      const newRemain  = Math.max(0, 1 - elapsed / STORY_DURATION)
      remainingBuffer.current[currentIndex] = newRemain
      setRemaining(newRemain)
      if (elapsed < STORY_DURATION) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [open, currentIndex])

  // ── Navigate forward (called by timer and button) ────────────────────────────
  const goNext = useCallback(
    () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setCurrentIndex((prev) => {
        remainingBuffer.current[prev] = 0
        if (prev < stories.length - 1) {
          return prev + 1
        }
        setTimeout(() => onOpenChange(false), 0)
        return prev
      })
    },
    [stories.length, onOpenChange],
  )

  const goPrev = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCurrentIndex((prev) => (remainingBuffer.current[prev] = 0, prev > 0 ? prev - 1 : prev))
  }, [])

  // ── Tap / click handler (debounced 250 ms) ───────────────────────────────────
  const handleTap = useCallback(
    (region?: 'left' | 'right') => {
      if (tapTimeout.current) clearTimeout(tapTimeout.current)
      tapTimeout.current = setTimeout(() => {
        if (region === 'left') goPrev()
        else if (region === 'right') goNext()
      }, 250)
    },
    [goPrev, goNext],
  )

  const close = useCallback(() => {
    if (timerRef.current)   clearTimeout(timerRef.current)
    if (tapTimeout.current) clearTimeout(tapTimeout.current)
    onOpenChange(false)
  }, [onOpenChange])

  const activeStory = stories[currentIndex]

  return (
    <Dialog key={`story-modal-${startIndex}`} open={open} onOpenChange={close}>
      <DialogContent
        className="max-w-none w-full h-full max-h-screen rounded-none p-0 border-0 [&_[data-slot=dialog-overlay]]:bg-black/95 [&_[data-slot=dialog-content]]:!block"
        showCloseButton={false}
      >
        <div
          className="relative w-full h-screen bg-black flex items-center justify-center select-none"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            const rect  = e.currentTarget.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            handleTap(ratio < 0.4 ? 'left' : ratio > 0.6 ? 'right' : undefined)
            // Left 40 % → prev  |  Right 40 % → next  |  Centre 20 % → pause / no-op
          }}
        >
          <StoryProgressBar stories={stories} currentIndex={currentIndex} remaining={remaining} />

          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-20"
            aria-label="Close story"
          >
            <X className="w-7 h-7" strokeWidth={1.5} />
          </button>

          {/* Author pill */}
          {activeStory && (
            <div className="absolute top-14 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border-[2px] border-[#1877f2] flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                  {activeStory.author.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarSrc(activeStory.author.avatar) ?? ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    `${activeStory.author.firstName[0] ?? ''}${activeStory.author.lastName[0] ?? ''}`.toUpperCase()
                  )}
                </div>
                <span className="text-white text-xs font-semibold">
                  {activeStory.author.firstName} {activeStory.author.lastName}
                </span>
                <span className="text-white/50 text-[10px] ml-1"> · {Math.floor(STORY_DURATION / 1000)}s</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="relative w-full h-full flex items-center justify-center px-4 py-16">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              {activeStory && <ActiveStoryContent story={activeStory} />}

              {/* Prev arrow — only show when there's something before */}
              {currentIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev() }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 hover:-translate-x-3 text-white/30 hover:text-white/80 transition-all z-20"
                  aria-label="Previous story"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {/* Next arrow — only show when there's something after */}
              {currentIndex < stories.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goNext() }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 hover:translate-x-3 text-white/30 hover:text-white/80 transition-all z-20"
                  aria-label="Next story"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 8.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Text caption underneath text-only stories */}
          {activeStory?.text && !activeStory.image && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center px-8">
              <p className="text-white/80 text-[11px] text-center line-clamp-2">{activeStory.text}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StoryModal
