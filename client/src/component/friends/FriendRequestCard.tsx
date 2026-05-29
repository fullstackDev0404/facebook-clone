"use client"
import { useState, useEffect } from 'react'
import { Loader2, UserCheck, UserX } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { friendsApi } from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import type { Author } from '@/types'
import { toast } from 'sonner'

interface Props {
  id: string
  sender: Author
  mutualCount?: number
  onRespond?: (id: string, action: 'accept' | 'reject') => void
}

const initials = (a: Author) =>
  `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase()

const FriendRequestCard = ({ id, sender, mutualCount = 0, onRespond }: Props) => {
  const [acting, setActing] = useState<'accept' | 'reject' | null>(null)
  const [done, setDone]     = useState<'accepted' | 'rejected' | null>(null)
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set())

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

  const respond = async (action: 'accept' | 'reject') => {
    setActing(action)
    try {
      await friendsApi.respond(id, action)
      setDone(action === 'accept' ? 'accepted' : 'rejected')
      onRespond?.(id, action)
      if (action === 'accept') {
        toast.success(`You and ${sender.firstName} are now friends!`)
      } else {
        toast.info('Friend request deleted')
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to respond to friend request'
      toast.error(errorMessage)
      console.error('Friend request response error:', err)
    } finally { setActing(null) }
  }

  if (done) return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042] text-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done === 'accepted' ? 'bg-[#e7f3ff]' : 'bg-[#f0f2f5]'}`}>
        {done === 'accepted' ? <UserCheck className="w-5 h-5 text-[#1877f2]" /> : <UserX className="w-5 h-5 text-[#65676b]" />}
      </div>
      <p className="text-[13px] font-medium text-[#65676b]">
        {done === 'accepted' ? `You and ${sender.firstName} are now friends` : 'Request deleted'}
      </p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 p-3 bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042] hover:shadow-sm transition-shadow">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="w-14 h-14 shrink-0">
            <AvatarImage src={sender.avatar ?? undefined} className="" />
            <AvatarFallback className="bg-[#1877f2] text-white font-bold text-lg">
              {initials(sender)}
            </AvatarFallback>
          </Avatar>
          {onlineFriendIds.has(sender.id) && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#31a24c] border-2 border-white dark:border-[#242526] rounded-full shadow-sm ring-1 ring-white" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[15px] text-[#050505] dark:text-[#e4e6eb] truncate">
            {sender.firstName} {sender.lastName}
          </p>
          {mutualCount > 0 && (
            <p className="text-[12px] text-[#65676b] mt-0.5">
              {mutualCount} mutual friend{mutualCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => respond('accept')}
          disabled={acting !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white text-[14px] font-semibold rounded-xl transition-colors"
        >
          {acting === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
        </button>
        <button
          onClick={() => respond('reject')}
          disabled={acting !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-60 text-[#050505] text-[14px] font-semibold rounded-xl transition-colors"
        >
          {acting === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
        </button>
      </div>
    </div>
  )
}

export default FriendRequestCard
