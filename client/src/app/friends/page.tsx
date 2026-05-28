"use client"
import { useEffect, useState } from 'react'
import { Users, UserPlus, UserCheck } from 'lucide-react'
import ProtectedRoute    from '@/component/ProtectedRoute'
import Header            from '@/component/Header'
import LeftSidebar       from '@/component/LeftSidebar'
import RightSidebar      from '@/component/RightSidebar'
import FriendsList       from '@/component/friends/FriendsList'
import FriendRequestCard from '@/component/friends/FriendRequestCard'
import FriendSuggestions from '@/component/friends/FriendSuggestions'
import { friendsApi } from '@/lib/api'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'
import type { Author } from '@/types'

type Tab = 'friends' | 'requests' | 'suggestions'

interface PendingRequest { id: string; sender: Author; createdAt: string }

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'friends',     label: 'Friends',     icon: Users     },
  { id: 'requests',    label: 'Requests',    icon: UserCheck },
  { id: 'suggestions', label: 'Suggestions', icon: UserPlus  },
]

// ─── Skeleton card ────────────────────────────────────────────────────────────
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

// ─── Requests tab ─────────────────────────────────────────────────────────────
const RequestsTab = ({ onCountChange }: { onCountChange: (n: number) => void }) => {
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

// ─── Page ─────────────────────────────────────────────────────────────────────
const FriendsPage = () => {
  const [tab, setTab]               = useState<Tab>('friends')
  const [requestCount, setRequestCount] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const vw = useViewport()

  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  useEffect(() => {
    friendsApi.getPendingRequests()
      .then(d => setRequestCount(d.requests.length))
      .catch(() => {})
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header onMenuClick={() => setDrawerOpen(o => !o)} />

        <div className="flex pt-14 w-full min-h-[calc(100vh-56px)]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          {/* Mobile drawer */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
              drawerOpen && !showLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setDrawerOpen(false)}
          />
          <div className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-[#242526] shadow-2xl transition-transform duration-300 ease-in-out ${
            drawerOpen && !showLeft ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <LeftSidebar onClose={() => setDrawerOpen(false)} showCloseButton />
          </div>

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-[24px] font-bold text-[#050505] dark:text-[#e4e6eb] mb-6">Friends</h1>

              {/* Tabs */}
              <div className="flex gap-1 bg-white dark:bg-[#242526] rounded-2xl p-1 border border-[#ced0d4] dark:border-[#3e4042] mb-6">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                  tab === id
                    ? 'bg-[#e7f3ff] text-[#1877f2]'
                    : 'text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === 'requests' && requestCount > 0 && (
                  <span className="absolute top-1.5 right-3 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {requestCount}
                  </span>
                )}
              </button>
            ))}
              </div>

              {tab === 'friends'     && <FriendsList />}
              {tab === 'requests'    && <RequestsTab onCountChange={setRequestCount} />}
              {tab === 'suggestions' && <FriendSuggestions />}
            </div>
          </main>

          {showRight && <RightSidebar />}

          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default FriendsPage
