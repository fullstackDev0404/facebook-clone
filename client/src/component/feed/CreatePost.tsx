"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ImageIcon, Loader2, Search, Send, Smile, Tag, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { friendsApi } from '@/lib/api'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'
import type { Author, PostRecord } from '@/types'
import { avatarSrc, initials } from './feedUtils'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]

const FEELINGS = [
  { emoji: '😊', label: 'happy' },
  { emoji: '😢', label: 'sad' },
  { emoji: '😍', label: 'in love' },
  { emoji: '😂', label: 'amused' },
  { emoji: '😎', label: 'cool' },
  { emoji: '😡', label: 'angry' },
  { emoji: '🥳', label: 'celebrating' },
  { emoji: '😴', label: 'tired' },
  { emoji: '🤒', label: 'sick' },
  { emoji: '🙏', label: 'grateful' },
  { emoji: '💪', label: 'motivated' },
  { emoji: '😤', label: 'frustrated' },
]

interface Props { onPostCreated: (post: PostRecord) => void }

const CreatePost = ({ onPostCreated }: Props) => {
  const { user } = useAuth()
  const [expanded, setExpanded]         = useState(false)
  const [content, setContent]           = useState('')
  const [file, setFile]                 = useState<File | null>(null)
  const [preview, setPreview]           = useState<string | null>(null)
  const [isVideo, setIsVideo]           = useState(false)
  const [feeling, setFeeling]           = useState<{ emoji: string; label: string } | null>(null)
  const [showFeelings, setShowFeelings] = useState(false)
  const [showTagPanel, setShowTagPanel] = useState(false)
  const [tagSearch, setTagSearch]       = useState('')
  const [friends, setFriends]           = useState<Author[]>([])
  const [tagged, setTagged]             = useState<Author[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load friends when tag panel opens
  useEffect(() => {
    if (!showTagPanel || friends.length > 0) return
    setLoadingFriends(true)
    friendsApi.getFriends()
      .then(d => setFriends(d.friends.map(f => f.friend)))
      .catch(() => {})
      .finally(() => setLoadingFriends(false))
  }, [showTagPanel]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredFriends = friends.filter(f =>
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !tagged.find(t => t.id === f.id)
  )

  const toggleTag = (friend: Author) => {
    setTagged(prev =>
      prev.find(t => t.id === friend.id)
        ? prev.filter(t => t.id !== friend.id)
        : [...prev, friend]
    )
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM) allowed.')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setIsVideo(VIDEO_TYPES.includes(f.type))
    setError(null)
    setExpanded(true)
  }

  const removeFile = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setIsVideo(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed && !file && !feeling && tagged.length === 0) {
      setError('Add text, a photo/video, a feeling, or tag someone before posting.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const form = new FormData()
      if (trimmed)        form.append('content', trimmed)
      if (file)           form.append('image', file)
      if (feeling)        form.append('feeling', feeling.label)
      if (tagged.length)  form.append('taggedIds', JSON.stringify(tagged.map(t => t.id)))

      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to create post')

      setContent('')
      removeFile()
      setFeeling(null)
      setTagged([])
      setExpanded(false)
      setShowFeelings(false)
      setShowTagPanel(false)
      if (data?.post) onPostCreated(data.post)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post.')
    } finally {
      setLoading(false)
    }
  }

  const userInitials = user ? initials(user.firstName, user.lastName) : 'U'

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] dark:border-[#3e4042] p-3">
      {/* Composer row */}
      <div className="flex items-start gap-2 mb-3">
        <Avatar className="w-10 h-10 shrink-0 mt-0.5">
          <AvatarImage src={avatarSrc(user?.avatar ?? null)} />
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
          <div className="flex-1">
            <textarea
              autoFocus
              value={content}
              onChange={e => { setContent(e.target.value); setError(null) }}
              placeholder={`What's on your mind, ${user?.firstName ?? 'you'}?`}
              rows={3}
              className="w-full bg-transparent resize-none outline-none text-[15px] dark:text-[#e4e6eb] placeholder-[#65676b] leading-relaxed"
            />

            {/* Tagged people chips */}
            {tagged.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <span className="text-sm text-[#65676b]">— with</span>
                {tagged.map(t => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 bg-[#e7f3ff] text-[#1877f2] text-sm font-semibold px-2 py-0.5 rounded-full"
                  >
                    {t.firstName} {t.lastName}
                    <button
                      onClick={() => setTagged(prev => prev.filter(x => x.id !== t.id))}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Feeling chip */}
            {feeling && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm text-[#65676b]">— feeling</span>
                <span className="text-base">{feeling.emoji}</span>
                <span className="text-sm font-medium text-[#050505] dark:text-[#e4e6eb]">{feeling.label}</span>
                <button onClick={() => setFeeling(null)} className="ml-1 text-[#65676b] hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media preview */}
      {preview && (
        <div className="relative mb-3 rounded-xl overflow-hidden bg-[#f0f2f5]">
          {isVideo ? (
            <video src={preview} controls className="w-full max-h-72" />
          ) : (
            <Image src={preview} alt="Preview" width={600} height={400} className="w-full object-cover max-h-72" unoptimized />
          )}
          <button
            onClick={removeFile}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tag People panel */}
      {showTagPanel && (
        <div className="mb-3 rounded-xl border border-[#ced0d4] dark:border-[#3e4042] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#f0f2f5] dark:border-[#3e4042]">
            <Search className="w-4 h-4 text-[#65676b] shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search friends to tag…"
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b]"
            />
            {tagSearch && (
              <button onClick={() => setTagSearch('')}>
                <X className="w-3.5 h-3.5 text-[#65676b]" />
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto">
            {loadingFriends ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#1877f2]" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <p className="text-sm text-[#65676b] text-center py-4">
                {tagSearch ? 'No friends match.' : friends.length === 0 ? 'No friends to tag yet.' : 'All friends already tagged.'}
              </p>
            ) : (
              filteredFriends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => toggleTag(friend)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors text-left"
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={avatarSrc(friend.avatar)} />
                    <AvatarFallback className="bg-[#1877f2] text-white text-xs font-bold">
                      {initials(friend.firstName, friend.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-[#050505] dark:text-[#e4e6eb] flex-1">
                    {friend.firstName} {friend.lastName}
                  </span>
                  {tagged.find(t => t.id === friend.id) && (
                    <span className="text-[#1877f2] text-xs font-semibold">Tagged ✓</span>
                  )}
                </button>
              ))
            )}
          </div>

          {tagged.length > 0 && (
            <div className="px-3 py-2 border-t border-[#f0f2f5] dark:border-[#3e4042] flex items-center justify-between">
              <span className="text-xs text-[#65676b]">{tagged.length} tagged</span>
              <button
                onClick={() => setShowTagPanel(false)}
                className="text-xs font-semibold text-[#1877f2] hover:underline"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feeling picker */}
      {showFeelings && (
        <div className="mb-3 p-3 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-xl">
          <p className="text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wide">How are you feeling?</p>
          <div className="flex flex-wrap gap-2">
            {FEELINGS.map(f => (
              <button
                key={f.label}
                onClick={() => { setFeeling(f); setShowFeelings(false); setExpanded(true) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  feeling?.label === f.label
                    ? 'bg-[#1877f2] text-white'
                    : 'bg-white dark:bg-[#242526] text-[#050505] dark:text-[#e4e6eb] hover:bg-[#e7f3ff] hover:text-[#1877f2]'
                }`}
              >
                <span>{f.emoji}</span> {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-2 px-1">{error}</p>}

      {/* Action bar */}
      <div className="border-t border-[#ced0d4] dark:border-[#3e4042] pt-2 mt-1 flex items-center justify-between">
        <div className="flex items-center">
          <input
            ref={fileRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
            onChange={handleFile}
          />
          {[
            {
              icon: ImageIcon,
              color: '#45bd62',
              label: 'Photo/Video',
              active: !!file,
              onClick: () => { setExpanded(true); fileRef.current?.click() },
            },
            {
              icon: Tag,
              color: '#1877f2',
              label: 'Tag People',
              active: showTagPanel || tagged.length > 0,
              onClick: () => { setExpanded(true); setShowTagPanel(v => !v); setShowFeelings(false) },
            },
            {
              icon: Smile,
              color: '#f7b928',
              label: 'Feeling',
              active: showFeelings || !!feeling,
              onClick: () => { setExpanded(true); setShowFeelings(v => !v); setShowTagPanel(false) },
            },
          ].map(({ icon: Icon, color, label, active, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                active ? 'bg-[#e7f3ff]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
              }`}
            >
              <Icon className="w-5 h-5" style={{ color }} />
              <span className="text-sm font-medium text-[#65676b] hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {expanded && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post
          </button>
        )}
      </div>
    </div>
  )
}

export default CreatePost
