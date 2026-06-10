"use client"

import React, { useEffect, useState } from 'react'
import { UserCheck, Loader2 } from 'lucide-react'
import { friendsApi } from '@/lib/api'
import FriendRequestCard from '@/component/friends/FriendRequestCard'
import type { Author } from '@/types'

interface PendingRequest { id: string; sender: Author; createdAt: string }

interface Props {
  onCountChange: (n: number) => void
}

const SkeletonCard = () => (
  <div className="flex flex-col gap-3 p-3 bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042] animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#e4e6eb] dark:bg-[#3a3b3c] rounded-full w-3/4" />
        <div className="h-3 bg-[#e4e6eb] dark:bg-[#3a3b3c] rounded-full w-1/2" />
      </div>
    </div>
    <div className="flex gap-2">
      <div className="flex-1 h-9 bg-[#e4e6eb] dark:bg-[#3a3b3c] rounded-xl" />
      <div className="flex-1 h-9 bg-[#e4e6eb] dark:bg-[#3a3b3c] rounded-xl" />
    </div>
  </div>
)

export const FriendsRequestsTab = ({ onCountChange }: Props) => {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    friendsApi.getPendingRequests()
      .then(d => {
        setRequests(d.requests)
        onCountChange(d.requests.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync count to parent after requests list changes (skip initial empty state)
  useEffect(() => {
    if (!loading) onCountChange(requests.length)
  }, [requests]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRespond = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )

  if (requests.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <UserCheck className="w-12 h-12 text-[#bcc0c4]" />
      <p className="text-[16px] font-semibold text-[#050505] dark:text-[#e4e6eb]">No pending requests</p>
      <p className="text-[14px] text-[#65676b]">When someone sends you a friend request, it will appear here.</p>
    </div>
  )

  return (
    <div>
      <p className="text-[13px] text-[#65676b] mb-3">{requests.length} pending request{requests.length !== 1 ? 's' : ''}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requests.map(req => (
          <FriendRequestCard
            key={req.id}
            id={req.id}
            sender={req.sender}
            onRespond={(id, _action) => handleRespond(id)}
          />
        ))}
      </div>
    </div>
  )
}
