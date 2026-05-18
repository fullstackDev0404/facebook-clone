"use client"
import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { ImageIcon, Loader2, Send, Smile, Video, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { postsApi } from '@/lib/api'
import type { PostRecord } from '@/types'
import { initials } from './feedUtils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface Props { onPostCreated: (post: PostRecord) => void }

const CreatePost = ({ onPostCreated }: Props) => {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [content, setContent]   = useState('')
  const [image, setImage]       = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
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
    const trimmed = content.trim()
    if (!trimmed && !image) { setError('Add text or a photo before posting.'); return }
    setLoading(true); setError(null)
    try {
      const data = await postsApi.create({ content: trimmed, image })
      setContent(''); removeImage(); setExpanded(false)
      if (data?.post) onPostCreated(data.post)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post.')
    } finally { setLoading(false) }
  }

  const userInitials = user ? initials(user.firstName, user.lastName) : 'U'

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] dark:border-[#3e4042] p-3">
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={user?.avatar ?? undefined} className="" />
          <AvatarFallback className="bg-[#1877f2] text-white font-semibold text-sm">{userInitials}</AvatarFallback>
        </Avatar>
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 bg-[#f0f2f5] dark:bg-[#3a3b3c] hover:bg-[#e4e6eb] rounded-full px-4 py-2.5 text-left text-sm text-[#65676b] transition-colors"
          >
            What&apos;s on your mind, {user?.firstName ?? 'you'}?
          </button>
        ) : (
          <textarea
            autoFocus
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(null) }}
            placeholder={`What's on your mind, ${user?.firstName ?? 'you'}?`}
            rows={3}
            className="flex-1 bg-transparent resize-none outline-none text-[15px] dark:text-[#e4e6eb] placeholder-[#65676b] leading-relaxed"
          />
        )}
      </div>

      {preview && (
        <div className="relative mb-3 rounded-xl overflow-hidden bg-[#f0f2f5]">
          <Image src={preview} alt="Preview" width={600} height={400} className="w-full object-cover max-h-72" unoptimized />
          <button onClick={removeImage} className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow" aria-label="Remove image">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-2 px-1">{error}</p>}

      <div className="border-t border-[#ced0d4] dark:border-[#3e4042] pt-2 mt-1 flex items-center justify-between">
        <div className="flex items-center">
          <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(',')} className="hidden" onChange={handleFile} />
          {[
            { icon: ImageIcon, color: '#45bd62', label: 'Photo/video', onClick: () => { setExpanded(true); fileRef.current?.click() } },
            { icon: Video,     color: '#f3425f', label: 'Live video',  onClick: () => setExpanded(true) },
            { icon: Smile,     color: '#f7b928', label: 'Feeling',     onClick: () => setExpanded(true) },
          ].map(({ icon: Icon, color, label, onClick }) => (
            <button key={label} onClick={onClick} className="flex items-center gap-2 px-3 py-2 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors">
              <Icon className="w-5 h-5" style={{ color }} />
              <span className="text-sm font-medium text-[#65676b] hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        {expanded && (
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post
          </button>
        )}
      </div>
    </div>
  )
}

export default CreatePost
