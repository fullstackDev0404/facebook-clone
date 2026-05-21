"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Play, X } from 'lucide-react'
import { storiesApi } from '@/lib/api'
import { initials, avatarSrc } from './feedUtils'
import StoryModal from './StoryModal'
import CreateStoryModal from './CreateStoryModal'
import type { StoryRecord } from '@/types'

// ─── StoryCard ────────────────────────────────────────────────────────────────

function StoryCard({
  story,
  onClick,
}: {
  story: StoryRecord
  onClick?: () => void
}) {
  const fallback = `${story.author.firstName[0] ?? ''}${story.author.lastName[0] ?? ''}`.toUpperCase()
  const name = `${story.author.firstName} ${story.author.lastName}`

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
          {story.author.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarSrc(story.author.avatar) ?? ''} alt={name} className="w-full h-full object-cover" />
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
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
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
  }

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const advanceViewer = () => {
    if (viewerIndex < stories.length - 1) {
      setViewerIndex(prev => prev + 1)
    } else {
      setViewerOpen(false)
    }
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
            <StoryCard key={story.id} story={story} onClick={() => openViewer(idx)} />
          ))
        )}
      </div>

      {/* ── Story Viewer Modal ────────────────────────────────────────── */}
      <StoryModal
        stories={stories}
        startIndex={viewerIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onAdvance={advanceViewer}
      />

      {/* ── Create Story Modal ────────────────────────────────────────── */}
      <CreateStoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStoryCreated={handleStoryCreated}
      />
    </>
  )
}

export default StoriesRow
