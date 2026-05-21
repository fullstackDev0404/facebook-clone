"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Play, X } from 'lucide-react'
import { storiesApi } from '@/lib/api'
import { initials, avatarSrc } from './feedUtils'
import CreateStoryModal from './CreateStoryModal'
import type { Author, StoryRecord } from '@/types'

// ─── StoryCard ────────────────────────────────────────────────────────────────

function StoryCard({
  story,
  onClick,
}: {
  story: StoryRecord
  onClick?: () => void
}) {
  const storyAuthor: Author = {
    id: story.author.id,
    firstName: story.author.firstName,
    lastName: story.author.lastName,
    avatar: story.author.avatar,
  }
  const fallback = `${storyAuthor.firstName[0] ?? ''}${storyAuthor.lastName[0] ?? ''}`.toUpperCase()
  const name = `${storyAuthor.firstName} ${storyAuthor.lastName}`

  return (
    <button
      onClick={onClick}
      className="relative shrink-0 w-28 h-44 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
    >
      {story.image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={avatarSrc(story.image) ?? 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full" style={{ backgroundColor: story.backgroundColor }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

      <div className="absolute top-3 left-3">
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border-[3px] border-[#1877f2] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
          {storyAuthor.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarSrc(storyAuthor.avatar) ?? ''} alt={name} className="w-full h-full object-cover" />
          ) : (
            fallback
          )}
        </div>
      </div>

      <div className="absolute bottom-3 left-0 right-0 text-center text-white text-[11px] font-semibold px-2 leading-tight drop-shadow">
        {name}
      </div>

      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-4 h-4 text-white fill-white" />
        </div>
      </div>
    </button>
  )
}

// ─── Create-Story Card ─────────────────────────────────────────────────────────

function CreateStoryCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative shrink-0 w-28 h-44 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/70 via-blue-600/60 to-blue-800/90" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      <div className="absolute top-3 left-3">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center">
          <X className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center text-white text-[11px] font-semibold px-2 leading-tight drop-shadow">
        Create Story
      </p>
    </div>
  )
}

// ─── StoriesRow ───────────────────────────────────────────────────────────────

const StoriesRow = () => {
  const [stories, setStories] = useState<StoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStory, setActiveStory] = useState<StoryRecord | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const initialized = useRef(false)

  const fetchStories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await storiesApi.getFeed()
      setStories(data.stories ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    fetchStories()
    const timer = setInterval(fetchStories, 60_000)
    return () => clearInterval(timer)
  }, [fetchStories])

  const handleStoryCreated = (story: StoryRecord) => {
    setStories(prev => [story, ...prev])
    setActiveStory(story)
    setCurrentIndex(0)
  }

  const openStoryAt = (index: number) => {
    setCurrentIndex(index)
    setActiveStory(stories[index])
  }

  const closeViewer = () => setActiveStory(null)

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setActiveStory(stories[currentIndex + 1])
    } else {
      setActiveStory(null)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setActiveStory(stories[currentIndex - 1])
    }
  }

  // Render story in viewer — image fallback or solid color card
  const renderViewerContent = () => {
    if (!activeStory) return null
    if (activeStory.image) {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={avatarSrc(activeStory.image) ?? ''} alt="" className="w-full h-full object-contain bg-black" />
      )
    }
    return (
      <div
        className="w-full h-full flex items-center justify-center p-8"
        style={{ backgroundColor: activeStory.backgroundColor ?? '#ff0000' }}
      >
        <p
          className="text-2xl font-bold text-center break-words leading-snug"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
        >
          {activeStory.text}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <CreateStoryCard onClick={() => setModalOpen(true)} />
        {loading && stories.length === 0 ? (
          <div className="flex items-center justify-center w-28 h-44 flex-shrink-0">
            <Loader2 className="w-5 h-5 animate-spin text-[#1877f2]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center w-28 h-44 flex-shrink-0 text-xs text-red-500 px-2 text-center">
            {error}
          </div>
        ) : (
          stories.map((story, idx) => (
            <StoryCard key={story.id} story={story} onClick={() => openStoryAt(idx)} />
          ))
        )}
      </div>

      {/* ── Story Viewer Overlay ─────────────────────────────────────── */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          {/* Close & Navigation */}
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
          >
            <X className="w-8 h-8" strokeWidth={1.5} />
          </button>
          {currentIndex > 0 && (
            <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 8.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Story Content */}
          <div className="relative w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden">
            {renderViewerContent()}

            {/* Header overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border-[3px] border-[#1877f2] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {activeStory.author.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarSrc(activeStory.author.avatar) ?? ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    `${activeStory.author.firstName[0] ?? ''}${activeStory.author.lastName[0] ?? ''}`.toUpperCase()
                  )}
                </div>
                <span className="text-white text-sm font-semibold">
                  {activeStory.author.firstName} {activeStory.author.lastName}
                </span>
                <span className="text-white/70 text-xs ml-auto">
                  {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 w-full h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${((currentIndex + 1) / stories.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Story Modal ───────────────────────────────────────── */}
      <CreateStoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStoryCreated={handleStoryCreated}
      />
    </>
  )
}

export default StoriesRow
