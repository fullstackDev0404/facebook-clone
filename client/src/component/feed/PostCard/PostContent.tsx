"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { X, Loader2 } from 'lucide-react'
import { avatarSrc } from '../feedUtils'

interface Props {
  content: string | null
  image: string | null
  video: string | null
  editing: boolean
  editText: string
  onEditTextChange: (text: string) => void
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
  onSaveEdit,
  onCancelEdit,
  saving,
  editError,
}: Props) => {
  if (editing) {
    return (
      <div className="px-4 pb-3">
        <textarea
          value={editText}
          onChange={e => onEditTextChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] outline-none text-[15px] text-[#050505] dark:text-[#e4e6eb] resize-none focus:ring-2 focus:ring-[#1877f2]/30 transition-all"
          placeholder="What's on your mind?"
          autoFocus
        />
        {editError && <p className="text-red-500 text-[12px] mt-1">{editError}</p>}
        <div className="flex gap-2 mt-2 justify-end">
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-[13px] font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            onClick={onSaveEdit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white text-[13px] font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {content && (
        <p className="px-4 pb-3 text-[15px] text-[#050505] dark:text-[#e4e6eb] leading-relaxed">{content}</p>
      )}
      {image && (
        <div className="w-full bg-[#f0f2f5] overflow-hidden">
          <Image src={avatarSrc(image) ?? ''} alt="Post" width={600} height={400} className="w-full object-cover max-h-125" unoptimized />
        </div>
      )}
      {video && (
        <div className="w-full bg-black overflow-hidden">
          <video
            src={avatarSrc(video)}
            controls
            className="w-full max-h-125 object-contain"
          />
        </div>
      )}
    </>
  )
}

export default PostContent
