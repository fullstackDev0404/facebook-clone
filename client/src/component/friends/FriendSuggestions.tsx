"use client"
import React, { useEffect, useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { friendsApi } from '@/lib/api'
import type { Author } from '@/types'

type RequestState = 'idle' | 'loading' | 'sent' | 'error'

const initials = (a: Author) =>
  `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase()

const FriendSuggestions = () => {
  const [suggestions, setSuggestions] = useState<Author[]>([])
  const [loading, setLoading]         = useState(true)
  const [states, setStates]           = useState<Record<string, RequestState>>({})

  useEffect(() => {
    friendsApi.getSuggestions()
      .then(d => setSuggestions(d.suggestions))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sendRequest = async (userId: string) => {
    setStates(s => ({ ...s, [userId]: 'loading' }))
    try {
      await friendsApi.sendRequest(userId)
      setStates(s => ({ ...s, [userId]: 'sent' }))
    } catch {
      setStates(s => ({ ...s, [userId]: 'error' }))
    }
  }

  if (loading) return (
    <div className="flex justify-center py-6">
      <Loader2 className="w-6 h-6 animate-spin text-[#1877f2]" />
    </div>
  )

  if (suggestions.length === 0) return (
    <p className="text-[14px] text-[#65676b] text-center py-4">No suggestions right now.</p>
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {suggestions.map(user => {
        const state = states[user.id] ?? 'idle'
        return (
          <div key={user.id} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042]">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar ?? undefined} className="" />
              <AvatarFallback className="bg-[#1877f2] text-white font-bold text-lg">
                {initials(user)}
              </AvatarFallback>
            </Avatar>

            <p className="font-semibold text-[14px] text-[#050505] dark:text-[#e4e6eb] text-center leading-tight">
              {user.firstName} {user.lastName}
            </p>

            <button
              onClick={() => sendRequest(user.id)}
              disabled={state !== 'idle'}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                state === 'sent'
                  ? 'bg-[#e7f3ff] text-[#1877f2] cursor-default'
                  : state === 'error'
                  ? 'bg-red-50 text-red-500 cursor-default'
                  : 'bg-[#e7f3ff] hover:bg-[#cce4ff] text-[#1877f2]'
              }`}
            >
              {state === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {state === 'sent'    && '✓ Request Sent'}
              {state === 'error'   && 'Failed'}
              {state === 'idle'    && <><UserPlus className="w-3.5 h-3.5" /> Add Friend</>}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default FriendSuggestions
