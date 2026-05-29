"use client"
import React, { useEffect, useState } from 'react'
import { Loader2, UserMinus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { friendsApi } from '@/lib/api'
import type { Author } from '@/types'
import { connectSocket } from '@/lib/socket'

interface FriendEntry {
  friendshipId: string
  friend: Author
  since: string
}

const initials = (a: Author) =>
  `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase()

const FriendsList = () => {
  const [friends, setFriends]   = useState<FriendEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [friendToRemove, setFriendToRemove] = useState<FriendEntry | null>(null)

  useEffect(() => {
    friendsApi.getFriends()
      .then(d => setFriends(d.friends))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const socket = connectSocket()
    if (!socket) return

    const handleOnlineInit = (payload: { onlineUserIds: string[] }) => setOnlineFriendIds(new Set(payload.onlineUserIds))
    const handleUserOnline = ({ userId }: { userId: string }) => setOnlineFriendIds(prev => new Set(prev).add(userId))
    const handleUserOffline = ({ userId }: { userId: string }) => setOnlineFriendIds(prev => { const next = new Set(prev); next.delete(userId); return next })

    socket.on('online:init', handleOnlineInit)
    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)

    return () => {
      socket.off('online:init', handleOnlineInit)
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
    }
  }, [])

  const unfriend = (friend: FriendEntry) => {
    setFriendToRemove(friend)
    setShowConfirm(true)
  }

  const confirmUnfriend = async () => {
    if (!friendToRemove) return
    setRemoving(friendToRemove.friendshipId)
    try {
      await friendsApi.remove(friendToRemove.friendshipId)
      setFriends(prev => prev.filter(f => f.friendshipId !== friendToRemove.friendshipId))
      setShowConfirm(false)
      setFriendToRemove(null)
    } catch { /* silent */ } finally { setRemoving(null) }
  }

  const cancelUnfriend = () => {
    setShowConfirm(false)
    setFriendToRemove(null)
  }

  const filtered = friends.filter(({ friend }) =>
    `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-7 h-7 animate-spin text-[#1877f2]" />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search friends…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#ced0d4] dark:border-[#3e4042] outline-none text-[14px] text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b] focus:ring-2 focus:ring-[#1877f2]/20 transition-all"
      />

      {filtered.length === 0 && (
        <p className="text-[14px] text-[#65676b] text-center py-6">
          {search ? 'No friends match your search.' : 'No friends yet.'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(({ friendshipId, friend, since }) => (
          <div key={friendshipId} className="flex items-center gap-3 p-3 bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042] hover:shadow-sm transition-shadow">
<div className="relative">
               <Avatar className="w-12 h-12 shrink-0">
                 <AvatarImage src={friend.avatar ?? undefined} className="" />
                 <AvatarFallback className="bg-[#1877f2] text-white font-semibold">
                   {initials(friend)}
                 </AvatarFallback>
               </Avatar>
               {onlineFriendIds.has(friend.id) && (
                 <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#31a24c] border-2 border-white dark:border-[#242526] rounded-full shadow-sm ring-1 ring-white" />
               )}
             </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] text-[#050505] dark:text-[#e4e6eb] truncate">
                {friend.firstName} {friend.lastName}
              </p>
              <p className="text-[12px] text-[#65676b]">
                Friends since {new Date(since).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => unfriend({ friendshipId, friend, since })}
              disabled={removing === friendshipId}
              title="Unfriend"
              className="p-2 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors disabled:opacity-50 shrink-0"
            >
              {removing === friendshipId
                ? <Loader2 className="w-4 h-4 animate-spin text-[#65676b]" />
                : <UserMinus className="w-4 h-4 text-[#65676b]" />}
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent showCloseButton={false} className="max-w-sm" aria-describedby="unfriend-description">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-1">
              <UserMinus className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-center text-[17px]">Unfriend {friendToRemove?.friend.firstName} {friendToRemove?.friend.lastName}?</DialogTitle>
            <DialogDescription id="unfriend-description" className="text-center text-[14px]">
              Are you sure you want to unfriend this person? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <button
              onClick={cancelUnfriend}
              disabled={removing !== null}
              className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmUnfriend}
              disabled={removing !== null}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
              Unfriend
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FriendsList
