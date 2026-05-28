"use client"
import React from 'react'

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

interface Props {
  show: boolean
  selected: { emoji: string; label: string } | null
  onSelect: (feeling: { emoji: string; label: string }) => void
}

const FeelingPicker = ({ show, selected, onSelect }: Props) => {
  if (!show) return null

  return (
    <div className="mb-3 p-3 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-xl">
      <p className="text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wide">How are you feeling?</p>
      <div className="flex flex-wrap gap-2">
        {FEELINGS.map(f => (
          <button
            key={f.label}
            onClick={() => onSelect(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selected?.label === f.label
                ? 'bg-[#1877f2] text-white'
                : 'bg-white dark:bg-[#242526] text-[#050505] dark:text-[#e4e6eb] hover:bg-[#e7f3ff] hover:text-[#1877f2]'
            }`}
          >
            <span>{f.emoji}</span> {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default FeelingPicker
