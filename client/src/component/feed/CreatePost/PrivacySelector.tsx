"use client"
import React, { useRef, useEffect } from 'react'
import { Globe, Users, Lock } from 'lucide-react'

interface Props {
  value: 'public' | 'friends' | 'private'
  onChange: (value: 'public' | 'friends' | 'private') => void
}

const PrivacySelector = ({ value, onChange }: Props) => {
  const [showMenu, setShowMenu] = React.useState(false)
  const privacyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (privacyRef.current && !privacyRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const privacyOptions = [
    { value: 'public' as const, icon: Globe, label: 'Public', description: 'Anyone can see' },
    { value: 'friends' as const, icon: Users, label: 'Friends', description: 'Only friends' },
    { value: 'private' as const, icon: Lock, label: 'Private', description: 'Only you' },
  ]

  const selectedPrivacy = privacyOptions.find(p => p.value === value) || privacyOptions[0]

  return (
    <div ref={privacyRef} className="relative">
      <button
        onClick={() => setShowMenu(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]"
      >
        <selectedPrivacy.icon className="w-5 h-5" style={{ color: '#65676b' }} />
        <span className="text-sm font-medium text-[#65676b] hidden sm:inline">{selectedPrivacy.label}</span>
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#242526] rounded-xl shadow-lg border border-[#ced0d4] dark:border-[#3e4042] overflow-hidden z-10">
          {privacyOptions.map(option => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setShowMenu(false) }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors text-left"
            >
              <option.icon className="w-5 h-5 text-[#65676b]" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#050505] dark:text-[#e4e6eb]">{option.label}</div>
                <div className="text-xs text-[#65676b]">{option.description}</div>
              </div>
              {value === option.value && (
                <div className="w-2 h-2 bg-[#1877f2] rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PrivacySelector
