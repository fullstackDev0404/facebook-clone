"use client"
import { useEffect, useState, lazy, Suspense } from 'react'
import { Users, UserPlus, UserCheck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute    from '@/component/ProtectedRoute'
import Header            from '@/component/Header'
import LeftSidebar       from '@/component/LeftSidebar'
import RightSidebar      from '@/component/RightSidebar'
import FriendsList       from '@/component/friends/FriendsList'
import FriendSuggestions from '@/component/friends/FriendSuggestions'
import { FriendsSearchTab } from '@/component/friends/FriendsSearchTab'
import { FriendsRequestsTab } from '@/component/friends/FriendsRequestsTab'
import { friendsApi } from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'

const LazyRightSidebar = lazy(() => import('@/component/RightSidebar'))
const LazyFriendSuggestions = lazy(() => import('@/component/friends/FriendSuggestions'))

type Tab = 'friends' | 'requests' | 'suggestions' | 'search'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'friends',     label: 'Friends',     icon: Users     },
  { id: 'requests',    label: 'Requests',    icon: UserCheck },
  { id: 'suggestions', label: 'Suggestions', icon: UserPlus  },
  { id: 'search',      label: 'Search',      icon: UserPlus  },
]
const FriendsPage = () => {
  const searchParams = useSearchParams()
  const [tab, setTab]               = useState<Tab>('friends')
  const [requestCount, setRequestCount] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const vw = useViewport()

  // Set tab from URL query parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab
    if (tabParam && ['friends', 'requests', 'suggestions', 'search'].includes(tabParam)) {
      setTab(tabParam)
    }
  }, [searchParams])

  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  useEffect(() => {
    friendsApi.getPendingRequests()
      .then(d => setRequestCount(d.requests.length))
      .catch(() => {})
  }, [])

  // Listen for socket updates to friend request count
  useEffect(() => {
    const socket = connectSocket()
    if (!socket) return

    const handleFriendRequest = () => {
      friendsApi.getPendingRequests()
        .then(d => setRequestCount(d.requests.length))
        .catch(() => {})
    }

    socket.on('friend_request:received', handleFriendRequest)
    socket.on('friend_request:accepted', handleFriendRequest)
    socket.on('friend_request:rejected', handleFriendRequest)

    return () => {
      socket.off('friend_request:received', handleFriendRequest)
      socket.off('friend_request:accepted', handleFriendRequest)
      socket.off('friend_request:rejected', handleFriendRequest)
    }
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header onMenuClick={() => setDrawerOpen(o => !o)} />

        <div className="flex w-full min-h-[calc(100vh-104px)] pt-[56px]">
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

          <main className="flex-1 min-w-0 py-5 px-6 overflow-y-auto">
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
              {tab === 'requests'    && <FriendsRequestsTab onCountChange={setRequestCount} />}
              {tab === 'suggestions' && (
                <Suspense fallback={<div className="h-40" />}>
                  <LazyFriendSuggestions />
                </Suspense>
              )}
              {tab === 'search'      && <FriendsSearchTab />}
            </div>
          </main>

          {showRight && (
            <Suspense fallback={<div className="w-72" />}>
              <LazyRightSidebar />
            </Suspense>
          )}

          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default FriendsPage
