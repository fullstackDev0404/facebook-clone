"use client"
import { useEffect, useState } from 'react'
import { connectSocket } from '@/lib/socket'
import { Loader2, UserPlus, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { friendsApi } from '@/lib/api'
import type { Author } from '@/types'

type ReqState = 'idle' | 'loading' | 'sent' | 'error'

const initials = (a: Author) =>
  `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase()

/** Compact "People You May Know" widget — used in the right sidebar or feed. */
const PeopleYouMayKnow = () => {
  const [people, setPeople]   = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [states, setStates]   = useState<Record<string, ReqState>>({})
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    friendsApi.getSuggestions()
      .then(d => setPeople(d.suggestions.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const socket = connectSocket()
    if (!socket) return

    const handleOnlineInit = (payload: { onlineUserIds: string[] }) => {
      setOnlineFriendIds(new Set(payload.onlineUserIds))
    }
    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineFriendIds(prev => new Set(prev).add(userId))
    }
    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineFriendIds(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }

    socket.on('online:init', handleOnlineInit)
    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)

    return () => {
      socket.off('online:init', handleOnlineInit)
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
    }
  }, [])

  const dismiss = (id: string) => setPeople(p => p.filter(u => u.id !== id))

  const sendRequest = async (id: string) => {
    setStates(s => ({ ...s, [id]: 'loading' }))
    try {
      await friendsApi.sendRequest(id)
      setStates(s => ({ ...s, [id]: 'sent' }))
    } catch {
      setStates(s => ({ ...s, [id]: 'error' }))
    }
  }

  if (loading) return (
    <div className="flex justify-center py-4">
      <Loader2 className="w-5 h-5 animate-spin text-[#1877f2]" />
    </div>
  )

  if (people.length === 0) return null

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042] overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="font-bold text-[17px] text-[#050505] dark:text-[#e4e6eb]">People You May Know</h3>
      </div>

      <div className="divide-y divide-[#f0f2f5] dark:divide-[#3e4042]">
        {people.map(user => {
          const state = states[user.id] ?? 'idle'
          return (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors">
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={user.avatar ?? undefined} className="" />
                  <AvatarFallback className="bg-[#1877f2] text-white font-semibold text-sm">
                    {initials(user)}
                  </AvatarFallback>
                </Avatar>
                {onlineFriendIds.has(user.id) && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#31a24c] border-2 border-white dark:border-[#242526] rounded-full shadow-sm ring-1 ring-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-[#050505] dark:text-[#e4e6eb] truncate">
                  {user.firstName} {user.lastName}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {state === 'sent' ? (
                  <span className="text-[12px] text-[#1877f2] font-medium">Sent</span>
                ) : (
                  <button
                    onClick={() => sendRequest(user.id)}
                    disabled={state === 'loading'}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#e7f3ff] hover:bg-[#cce4ff] disabled:opacity-50 text-[#1877f2] text-[13px] font-semibold rounded-lg transition-colors"
                  >
                    {state === 'loading'
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <><UserPlus className="w-3.5 h-3.5" /> Add</>}
                  </button>
                )}
                <button
                  onClick={() => dismiss(user.id)}
                  className="p-1.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5 text-[#65676b]" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PeopleYouMayKnow
