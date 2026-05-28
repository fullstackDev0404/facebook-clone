"use client"
import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Loader2, Image as ImageIcon, Video } from 'lucide-react'
import { avatarSrc } from '../feedUtils'

interface Props {
  content: string | null
  image: string | null
  video: string | null
  editing: boolean
  editText: string
  onEditTextChange: (text: string) => void
  onEditImageChange: (file: File | null) => void
  onEditVideoChange: (file: File | null) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  saving: boolean
  editError: string
}

const PostContent = ({
  content,
  image,
  video,
  editing,
  editText,
  onEditTextChange,
  onEditImageChange,
  onEditVideoChange,
  onSaveEdit,
  onCancelEdit,
  saving,
  editError,
}: Props) => {
  const [previewImage, setPreviewImage] = useState<string | null>(image ? avatarSrc(image) : null)
  const [previewVideo, setPreviewVideo] = useState<string | null>(video ? avatarSrc(video) : null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Update preview when image/video props change
  React.useEffect(() => {
    setPreviewImage(image ? avatarSrc(image) : null)
    setPreviewVideo(video ? avatarSrc(video) : null)
  }, [image, video])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewImage(URL.createObjectURL(file))
      onEditImageChange(file)
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewVideo(URL.createObjectURL(file))
      onEditVideoChange(file)
    }
  }

  const removeImage = () => {
    setPreviewImage(null)
    onEditImageChange(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const removeVideo = () => {
    setPreviewVideo(null)
    onEditVideoChange(null)
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  if (editing) {
    return (
      <div className="px-4 pb-4">
        <textarea
          value={editText}
          onChange={e => onEditTextChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-2xl bg-[#f0f2f5] dark:bg-[#3a3b3c] outline-none text-[15px] text-[#050505] dark:text-[#e4e6eb] resize-none focus:ring-2 focus:ring-[#1877f2]/30 transition-all shadow-sm"
          placeholder="What's on your mind?"
          autoFocus
        />
        
        {/* Media Preview */}
        {(previewImage || previewVideo) && (
          <div className="mt-3 relative rounded-2xl overflow-hidden bg-[#f0f2f5] dark:bg-[#3a3b3c]">
            {previewImage && (
              <div className="relative">
                <Image
                  src={previewImage}
                  alt="Preview"
                  width={600}
                  height={400}
                  className="w-full object-cover max-h-80"
                  unoptimized
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {previewVideo && (
              <div className="relative">
                <video
                  src={previewVideo}
                  controls
                  className="w-full max-h-80 object-contain"
                />
                <button
                  onClick={removeVideo}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Media Upload Buttons */}
        <div className="flex gap-2 mt-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-[13px] font-semibold transition-colors"
          >
            <ImageIcon className="w-4 h-4" /> Photo
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-[13px] font-semibold transition-colors"
          >
            <Video className="w-4 h-4" /> Video
          </button>
        </div>

        {editError && <p className="text-red-500 text-[13px] mt-2">{editError}</p>}
        
        <div className="flex gap-2 mt-3 justify-end">
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-[14px] font-semibold transition-colors"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={onSaveEdit}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white text-[14px] font-semibold transition-colors shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {content && (
        <p className="px-4 pb-4 text-[15px] text-[#050505] dark:text-[#e4e6eb] leading-relaxed">{content}</p>
      )}
      {image && (
        <div className="w-full bg-[#f0f2f5] dark:bg-[#1a1a1a] overflow-hidden">
          <Image src={avatarSrc(image) ?? ''} alt="Post" width={600} height={400} className="w-full object-cover max-h-96" unoptimized />
        </div>
      )}
      {video && (
        <div className="w-full bg-black overflow-hidden">
          <video
            src={avatarSrc(video)}
            controls
            className="w-full max-h-96 object-contain"
          />
        </div>
      )}
    </>
  )
}

export default PostContent
