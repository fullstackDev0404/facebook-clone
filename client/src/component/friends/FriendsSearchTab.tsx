"use client"

import React, { useState } from 'react'
import { Users, UserPlus, Search, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { friendsApi, searchApi } from '@/lib/api'
import { avatarSrc } from '@/component/feed/feedUtils'
import type { Author } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

export const FriendsSearchTab = () => {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Author[]>([])
  const [loading, setLoading] = useState(false)
  const [states, setStates] = useState<Record<string, 'idle' | 'loading' | 'sent'>>({})

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const data = await searchApi.users(value, 10)
      setResults(data.users.filter(u => u.id !== user?.id))
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const sendRequest = async (id: string) => {
    if (states[id] === 'sent') {
      toast.info('Friend request already sent')
      return
    }

    setStates(s => ({ ...s, [id]: 'loading' }))
    try {
      const result = await friendsApi.sendRequest(id)
      if ((result as any).previouslyRejected) {
        setStates(s => ({ ...s, [id]: 'idle' }))
        const cooldownDays = (result as any).cooldownRemaining
        if (cooldownDays) {
          toast.info(`Request was previously rejected. You can send another request in ${cooldownDays} day${cooldownDays > 1 ? 's' : ''}.`)
        } else {
          toast.info('This request was previously rejected')
        }
      } else {
        setStates(s => ({ ...s, [id]: 'sent' }))
        toast.success('Friend request sent!')
      }
    } catch (err: any) {
      setStates(s => ({ ...s, [id]: 'idle' }))
      const errorMessage = err?.message || 'Failed to send friend request'
      toast.error(errorMessage)
      console.error('Friend request error:', err)
    }
  }

  const initials = (a: Author) =>
    `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase()

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#65676b]" />
        <input
          type="text"
          placeholder="Search by name..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#242526] rounded-xl border border-[#ced0d4] dark:border-[#3e4042] text-[15px] outline-none text-[#050505] dark:text-[#e4e6eb] placeholder-[#8a8d91] focus:ring-2 focus:ring-[#1877f2]/20 transition-all"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#1877f2]" />
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Search className="w-12 h-12 text-[#bcc0c4]" />
          <p className="text-[16px] font-semibold text-[#050505] dark:text-[#e4e6eb]">No users found</p>
          <p className="text-[14px] text-[#65676b]">Try a different search term</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map(user => {
            const state = states[user.id] ?? 'idle'
            return (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042]">
                <Avatar className="w-14 h-14 shrink-0">
                  <AvatarImage src={avatarSrc(user.avatar ?? null)} />
                  <AvatarFallback className="bg-[#1877f2] text-white font-bold text-lg">
                    {initials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-[#050505] dark:text-[#e4e6eb] truncate">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                {state === 'sent' ? (
                  <span className="text-[12px] text-[#1877f2] font-semibold">Sent</span>
                ) : (
                  <button
                    onClick={() => sendRequest(user.id)}
                    disabled={state === 'loading'}
                    className="p-2 bg-[#e7f3ff] hover:bg-[#cce4ff] disabled:opacity-50 text-[#1877f2] rounded-full transition-colors"
                  >
                    {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && query.length < 2 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Search className="w-12 h-12 text-[#bcc0c4]" />
          <p className="text-[16px] font-semibold text-[#050505] dark:text-[#e4e6eb]">Find friends</p>
          <p className="text-[14px] text-[#65676b]">Search for people by name to send friend requests</p>
        </div>
      )}
    </div>
  )
}
