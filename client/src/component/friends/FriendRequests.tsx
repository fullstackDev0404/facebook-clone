"use client"
import React, { useEffect, useState } from 'react'
import { Loader2, UserCheck, UserX } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { friendsApi } from '@/lib/api'
import type { Author } from '@/types'

interface PendingRequest {
  id: string
  sender: Author
  createdAt: string
}

interface Props {
  onCountChange?: (count: number) => void
}

const initials = (a: Author) =>
  `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase()

const FriendRequests = ({ onCountChange }: Props) => {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState<string | null>(null)

  useEffect(() => {
    friendsApi.getPendingRequests()
      .then(d => {
        setRequests(d.requests)
        onCountChange?.(d.requests.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const respond = async (id: string, action: 'accept' | 'reject') => {
    setActing(id)
    try {
      await friendsApi.respond(id, action)
      setRequests(prev => {
        const next = prev.filter(r => r.id !== id)
        onCountChange?.(next.length)
        return next
      })
    } catch { /* silent */ } finally { setActing(null) }
  }

  if (loading) return (
    <div className="flex justify-center py-6">
      <Loader2 className="w-6 h-6 animate-spin text-[#1877f2]" />
    </div>
  )

  if (requests.length === 0) return (
    <p className="text-[14px] text-[#65676b] text-center py-4">No pending friend requests.</p>
  )

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042]">
          <Avatar className="w-12 h-12 shrink-0">
            <AvatarImage src={req.sender.avatar ?? undefined} className="" />
            <AvatarFallback className="bg-[#1877f2] text-white font-semibold">
              {initials(req.sender)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] text-[#050505] dark:text-[#e4e6eb] truncate">
              {req.sender.firstName} {req.sender.lastName}
            </p>
            <p className="text-[12px] text-[#65676b]">Wants to be your friend</p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => respond(req.id, 'accept')}
              disabled={acting === req.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-50 text-white text-[13px] font-semibold rounded-lg transition-colors"
            >
              {acting === req.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <UserCheck className="w-3.5 h-3.5" />}
              Confirm
            </button>
            <button
              onClick={() => respond(req.id, 'reject')}
              disabled={acting === req.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[13px] font-semibold rounded-lg transition-colors"
            >
              <UserX className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FriendRequests
