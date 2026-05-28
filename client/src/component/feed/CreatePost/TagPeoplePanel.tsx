"use client"
import React, { useEffect, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { friendsApi } from '@/lib/api'
import type { Author } from '@/types'
import { avatarSrc, initials } from '../feedUtils'

interface Props {
  show: boolean
  onClose: () => void
  tagged: Author[]
  onToggleTag: (friend: Author) => void
}

const TagPeoplePanel = ({ show, onClose, tagged, onToggleTag }: Props) => {
  const [tagSearch, setTagSearch] = useState('')
  const [friends, setFriends] = useState<Author[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)

  useEffect(() => {
    if (!show || friends.length > 0) return
    setLoadingFriends(true)
    friendsApi.getFriends()
      .then(d => setFriends(d.friends.map(f => f.friend)))
      .catch(() => {})
      .finally(() => setLoadingFriends(false))
  }, [show, friends.length])

  const filteredFriends = friends.filter(f =>
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !tagged.find(t => t.id === f.id)
  )

  if (!show) return null

  return (
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
              onClick={() => onToggleTag(friend)}
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
            onClick={onClose}
            className="text-xs font-semibold text-[#1877f2] hover:underline"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

export default TagPeoplePanel
