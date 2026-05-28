"use client"
import React, { useState, useRef } from 'react'
import { ImageIcon, Loader2, Send, Smile, Tag, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'
import type { Author, PostRecord } from '@/types'
import { avatarSrc, initials } from './feedUtils'
import MediaUploader, { MediaUploaderRef } from './CreatePost/MediaUploader'
import TagPeoplePanel from './CreatePost/TagPeoplePanel'
import FeelingPicker from './CreatePost/FeelingPicker'
import PrivacySelector from './CreatePost/PrivacySelector'

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
  const [tagged, setTagged]             = useState<Author[]>([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [privacy, setPrivacy]           = useState<'public' | 'friends' | 'private'>('public')
  const mediaUploaderRef = useRef<MediaUploaderRef>(null)


  const toggleTag = (friend: Author) => {
    setTagged(prev =>
      prev.find(t => t.id === friend.id)
        ? prev.filter(t => t.id !== friend.id)
        : [...prev, friend]
    )
  }

  const handleFileChange = (f: File | null) => {
    if (!f) {
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setIsVideo(false)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setIsVideo(f.type.startsWith('video/'))
    setError(null)
    setExpanded(true)
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
      form.append('privacy', privacy)

      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to create post')

      setContent('')
      handleFileChange(null)
      setFeeling(null)
      setTagged([])
      setPrivacy('public')
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

      <MediaUploader
        ref={mediaUploaderRef}
        file={file}
        preview={preview}
        isVideo={isVideo}
        onFileChange={handleFileChange}
        onRemove={() => handleFileChange(null)}
      />

      <TagPeoplePanel
        show={showTagPanel}
        onClose={() => setShowTagPanel(false)}
        tagged={tagged}
        onToggleTag={toggleTag}
      />

      <FeelingPicker
        show={showFeelings}
        selected={feeling}
        onSelect={(f) => { setFeeling(f); setShowFeelings(false); setExpanded(true) }}
      />

      {error && <p className="text-xs text-red-500 mb-2 px-1">{error}</p>}

      <div className="border-t border-[#ced0d4] dark:border-[#3e4042] pt-2 mt-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <PrivacySelector value={privacy} onChange={setPrivacy} />
          {[
            {
              icon: ImageIcon,
              color: '#45bd62',
              label: 'Photo/Video',
              active: !!file,
              onClick: () => { setExpanded(true); mediaUploaderRef.current?.triggerFileInput() },
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
