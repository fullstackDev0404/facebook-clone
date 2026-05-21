"use client"
import React, { useRef, useState } from 'react'
import { ImagePlus, Loader2, Type, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { storiesApi } from '@/lib/api'
import type { StoryRecord } from '@/types'

type Mode = 'image' | 'text'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStoryCreated: (story: StoryRecord) => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const PRESET_COLORS = [
  { name: 'Red',    value: '#ff0000' },
  { name: 'Orange', value: '#f57024' },
  { name: 'Amber',  value: '#f0b429' },
  { name: 'Green',  value: '#117a26' },
  { name: 'Blue',   value: '#1877f2' },
  { name: 'Purple', value: '#6c5ce7' },
  { name: 'Pink',   value: '#e84393' },
  { name: 'Dark',   value: '#1a1a2e' },
] as const

const CreateStoryModal = ({ open, onOpenChange, onStoryCreated }: Props) => {
  const [mode, setMode] = useState<Mode>('image')
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState('#ff0000')
  const [customColor, setCustomColor] = useState('#ff0000')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setMode('image')
    setText('')
    setImage(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setBgColor('#ff0000')
    setCustomColor('#ff0000')
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) reset()
    onOpenChange(val)
  }

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
    if (mode === 'image' && !image) { setError('Select an image to share.'); return }
    if (mode === 'text' && !text.trim()) { setError('Write something for your story.'); return }
    setLoading(true); setError(null)
    try {
      const activeBgColor = mode === 'text' ? bgColor : undefined
      const data = await storiesApi.create(image ?? undefined, text.trim() || undefined, activeBgColor)
      reset()
      onOpenChange(false)
      if (data?.story) onStoryCreated(data.story)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story.')
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[430px] overflow-hidden rounded-2xl [&_[data-slot=dialog-overlay]]:bg-black/60"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#ced0d4] dark:border-[#3e4042] pb-3">
          <DialogTitle className="text-center text-xl font-bold text-[#050505] dark:text-white">Create Story</DialogTitle>
          <DialogDescription className="text-center text-[#65676b]">Share a moment with your friends</DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] p-1">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'image' ? 'bg-white dark:bg-[#4e4f50] text-[#050505] dark:text-white shadow-sm' : 'text-[#65676b]'}`}
          >
            <ImagePlus className="w-4 h-4" /> Photo
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'text' ? 'bg-white dark:bg-[#4e4f50] text-[#050505] dark:text-white shadow-sm' : 'text-[#65676b]'}`}
          >
            <Type className="w-4 h-4" /> Text Card
          </button>
        </div>

        {/* Image mode */}
        {mode === 'image' && (
          <div className="space-y-3">
            {!preview ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-48 flex flex-col items-center justify-center gap-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-2xl border-2 border-dashed border-[#ced0d4] dark:border-[#4e4f50] hover:border-[#1877f2] transition-colors"
              >
                <ImagePlus className="w-9 h-9 text-[#65676b]" strokeWidth={1.5} />
                <span className="text-sm text-[#65676b]">Click to upload a photo</span>
              </button>
            ) : (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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
            <p className="text-xs text-[#65676b] text-center">Your story will be visible for 24 hours.</p>
          </div>
        )}

        {/* Text mode */}
        {mode === 'text' && (
          <div className="space-y-3">
            {/* Live preview card */}
            <div
              className="w-full h-48 rounded-2xl flex items-center justify-center p-6 transition-colors"
              style={{ backgroundColor: bgColor }}
            >
              {text.trim() ? (
                <p className="text-white text-2xl font-bold text-center break-words drop-shadow-lg leading-snug" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.45)' }}>
                  {text}
                </p>
              ) : (
                <p className="text-white/60 text-sm text-center drop-shadow">
                  Your story text will appear here
                </p>
              )}
            </div>

            {/* Text input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write something…"
              maxLength={200}
              rows={2}
              className="w-full resize-none rounded-xl border border-[#ced0d4] dark:border-[#3e4042] bg-white dark:bg-[#242526] px-3 py-2 text-sm text-[#050505] dark:text-white placeholder:text-[#65676b] outline-none focus:ring-2 focus:ring-[#1877f2]"
            />
            <p className="text-xs text-[#65676b] text-right">{text.length}/200</p>

            {/* Color picker */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-[#65676b] w-16">Background</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setBgColor(c.value)}
                  title={c.name}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === c.value ? 'border-[#050505] dark:border-white ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#242526] ring-[#1877f2]' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <div className="relative w-7 h-7 rounded-full border-2 border-[#ced0d4] dark:border-[#4e4f50] overflow-hidden">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => { setCustomColor(e.target.value); setBgColor(e.target.value) }}
                  className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
                  title="Custom color"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-xs px-1">{error}</p>
        )}

        <DialogFooter className="flex-row-reverse sm:flex-row sm:justify-center gap-2 border-t border-[#ced0d4] dark:border-[#3e4042] pt-3 -mx-4 -mb-4 sm:mx-0 sm:mb-0">
          <button
            onClick={() => handleOpenChange(false)}
            className="px-5 py-2 text-sm font-semibold text-[#65676b] bg-transparent rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-[#1877f2] text-white rounded-full hover:bg-[#166fe5] disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Sharing…' : 'Share to Story'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateStoryModal
