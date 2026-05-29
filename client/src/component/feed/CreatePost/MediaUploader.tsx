"use client"
import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { avatarSrc } from '../feedUtils'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]

interface Props {
  file: File | null
  preview: string | null
  isVideo: boolean
  onFileChange: (file: File | null) => void
  onRemove: () => void
}

export interface MediaUploaderRef {
  triggerFileInput: () => void
}

const MediaUploader = forwardRef<MediaUploaderRef, Props>(({ file, preview, isVideo, onFileChange, onRemove }, ref) => {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      alert('Only images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM) allowed.')
      return
    }
    onFileChange(f)
  }

  const triggerFileInput = () => {
    fileRef.current?.click()
  }

  useImperativeHandle(ref, () => ({
    triggerFileInput
  }))

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFile}
      />
      {preview && (
        <div className="relative mb-3 rounded-xl overflow-hidden bg-[#f0f2f5]">
          {isVideo ? (
            <video src={preview} controls className="w-full max-h-72" />
          ) : (
            <Image src={preview} alt="Preview" width={600} height={400} className="w-full object-cover max-h-72" />
          )}
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
})

MediaUploader.displayName = 'MediaUploader'

export default MediaUploader
