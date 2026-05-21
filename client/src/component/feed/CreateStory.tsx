"use client"
import React, { useRef, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { storiesApi } from '@/lib/api'
import { initials, avatarSrc } from './feedUtils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface Props {
  onStoryCreated: (story: import('@/types').StoryRecord) => void
}

const CreateStory = ({ onStoryCreated }: Props) => {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) { setError('Only JPEG, PNG, GIF, or WebP allowed.'); return }
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setError(null)
  }

  const removeImage = () => {
    setImage(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!image) { setError('Select an image to share as a story.'); return }
    setLoading(true); setError(null)
    try {
      const data = await storiesApi.create(image)
      setImage(null); removeImage(); setExpanded(false)
      if (data?.story) onStoryCreated(data.story)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story.')
    } finally { setLoading(false) }
  }

  if (!expanded) {
    return (
      <div className="flex gap-3 items-center bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] dark:border-[#3e4042] p-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={user?.avatar ?? undefined} />
          <AvatarFallback>{user ? initials(user.firstName, user.lastName) : 'U'}</AvatarFallback>
        </Avatar>
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 text-left bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full px-4 py-2.5 text-[15px] text-[#65676b] hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50] transition-colors"
        >
          Create a story
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] dark:border-[#3e4042] p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={user?.avatar ?? undefined} />
          <AvatarFallback>{user ? initials(user.firstName, user.lastName) : 'U'}</AvatarFallback>
        </Avatar>
        <span className="text-[15px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">{user ? `${user.firstName} ${user.lastName}` : 'You'}</span>
        <button onClick={() => { setExpanded(false); removeImage() }} className="ml-auto text-[#65676b] hover:text-[#050505] dark:hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {!preview ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-44 flex flex-col items-center justify-center gap-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-2xl border-2 border-dashed border-[#ced0d4] dark:border-[#4e4f50] hover:border-[#1877f2] transition-colors"
        >
          <Plus className="w-8 h-8 text-[#65676b]" strokeWidth={1.5} />
          <span className="text-sm text-[#65676b]">Add photo to your story</span>
        </button>
      ) : (
        <div className="relative w-full h-44 rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Story preview" className="w-full h-full object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFile}
      />

      {error && <p className="text-red-500 text-xs px-1">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => { setExpanded(false); removeImage() }}
          className="px-4 py-2 text-[15px] font-medium text-[#65676b] hover:bg-[#f0f2f5] rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !image}
          className="px-4 py-2 text-[15px] font-semibold bg-[#1877f2] text-white rounded-full hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Sharing…' : 'Share to Story'}
        </button>
      </div>
    </div>
  )
}

export default CreateStory
