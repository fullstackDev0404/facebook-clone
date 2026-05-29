"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Play, Trash2 } from 'lucide-react'
import { storiesApi } from '@/lib/api'
import { initials, avatarSrc } from './feedUtils'
import { useAuth } from '@/context/AuthContext'
import StoryModal from './StoryModal'
import CreateStoryModal from './CreateStoryModal'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { StoryRecord } from '@/types'

// ─── StoryCard ────────────────────────────────────────────────────────────────

function StoryCard({ story, onClick, onDelete }: { story: StoryRecord; onClick?: () => void; onDelete?: (storyId: string) => void }) {
  const { user } = useAuth()
  const name = `${story.author.firstName} ${story.author.lastName}`.trim() || 'Unknown'
  const isOwner = user?.id === story.author.id

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) onDelete(story.id)
  }

  return (
    <div className="relative shrink-0 w-28 h-44 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      <button
        onClick={onClick}
        className="absolute inset-0 w-full h-full cursor-pointer"
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

      {/* Delete button for owner */}
      {isOwner && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center text-white transition-colors z-10"
          aria-label="Delete story"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
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
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null)
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

  const handleStoryDeleted = async (storyId: string) => {
    setStoryToDelete(storyId)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!storyToDelete) return
    setDeleting(true)
    try {
      await storiesApi.delete(storyToDelete)
      setStories(prev => {
        const filtered = prev.filter(s => s.id !== storyToDelete)
        // Adjust viewer index if needed
        setViewerIndex(current => Math.max(0, Math.min(current, filtered.length - 1)))
        return filtered
      })
      setDeleteOpen(false)
      setStoryToDelete(null)
    } catch (err) {
      console.error('Failed to delete story:', err)
    } finally {
      setDeleting(false)
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
            <StoryCard key={story.id} story={story} onClick={() => openViewer(idx)} onDelete={handleStoryDeleted} />
          ))
        )}
      </div>

      <StoryModal
        stories={stories}
        startIndex={viewerIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onAdvance={advanceViewer}
        onStoryDeleted={handleStoryDeleted}
      />

      <CreateStoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStoryCreated={handleStoryCreated}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm" aria-describedby="delete-description">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-1">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-center text-[17px]">Delete story?</DialogTitle>
            <DialogDescription id="delete-description" className="text-center text-[14px]">
              This will permanently remove your story. You can&apos;t undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default StoriesRow
