"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import { storiesApi } from '@/lib/api'
import { initials, avatarSrc } from './feedUtils'
import { useAuth } from '@/context/AuthContext'
import StoryModal from './StoryModal'
import CreateStoryModal from './CreateStoryModal'
import type { StoryRecord } from '@/types'

// ─── StoryCard ────────────────────────────────────────────────────────────────

function StoryCard({ story, onClick }: { story: StoryRecord; onClick?: () => void }) {
  const name = `${story.author.firstName} ${story.author.lastName}`.trim() || 'Unknown'

  return (
    <button
      onClick={onClick}
      className="relative shrink-0 w-28 h-44 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
    >
      {/* Background — image story or solid colour card */}
      {story.image ? (
        <div className="absolute inset-0" style={{ backgroundColor: story.backgroundColor }}>
          <img
            src={avatarSrc(story.image)}
            alt={name}
            className="w-full h-full object-cover relative z-[1]"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: story.backgroundColor }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

      {/* Author avatar (top-left circle) */}
      <div className="absolute top-3 left-3">
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border-[3px] border-[#1877f2] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
          {story.author.avatar ? (
            <img
              src={avatarSrc(story.author.avatar)}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            `${story.author.firstName[0] ?? ''}${story.author.lastName[0] ?? ''}`.toUpperCase() || '?'
          )}
        </div>
      </div>

      {/* Author name (bottom) */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-white text-[11px] font-semibold px-2 leading-tight drop-shadow">
        {name}
      </div>

      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-4 h-4 text-white fill-white" />
        </div>
      </div>
    </button>
  )
}

// ─── Create-Story Card ─────────────────────────────────────────────────────────

function CreateStoryCard({ user, onClick }: { user: { firstName: string; lastName: string; avatar: string | null } | null; onClick: () => void }) {
  if (!user) {
    return (
      <div onClick={onClick} className="relative shrink-0 w-28 h-44 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/70 via-blue-600/60 to-blue-800/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        <div className="absolute top-3 left-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-white font-bold text-sm">
            ?
          </div>
        </div>
        <p className="absolute bottom-3 left-0 right-0 text-center text-white text-[11px] font-semibold px-2 leading-tight drop-shadow">
          Create Story
        </p>
      </div>
    )
  }

  const name = `${user.firstName} ${user.lastName}`.trim() || 'You'

  return (
    <div onClick={onClick} className="relative shrink-0 w-28 h-44 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/70 via-blue-600/60 to-blue-800/90" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      <div className="absolute top-3 left-3">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img
              src={avatarSrc(user.avatar)}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <span className="text-white text-sm font-bold">
              {`${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '?'}
            </span>
          )}
        </div>
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center text-white text-[11px] font-semibold px-2 leading-tight drop-shadow">
        {name}
      </p>
    </div>
  )
}

// ─── StoriesRow ───────────────────────────────────────────────────────────────

const StoriesRow = () => {
  const { user } = useAuth()
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
    setViewerIndex(0)
    setViewerOpen(true)
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
        {/* Create-story card — REAL logged-in user identity */}
        <CreateStoryCard user={user} onClick={() => setModalOpen(true)} />

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

      <StoryModal
        stories={stories}
        startIndex={viewerIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onAdvance={advanceViewer}
      />

      <CreateStoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStoryCreated={handleStoryCreated}
      />
    </>
  )
}

export default StoriesRow
