"use client"
import React, { useEffect, useState } from 'react'
import { Users, UserPlus, UserCheck } from 'lucide-react'
import ProtectedRoute from '@/component/ProtectedRoute'
import Header         from '@/component/Header'
import FriendsList       from '@/component/friends/FriendsList'
import FriendRequests    from '@/component/friends/FriendRequests'
import FriendSuggestions from '@/component/friends/FriendSuggestions'
import { friendsApi } from '@/lib/api'

type Tab = 'friends' | 'requests' | 'suggestions'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'friends',     label: 'Friends',     icon: Users      },
  { id: 'requests',    label: 'Requests',    icon: UserCheck  },
  { id: 'suggestions', label: 'Suggestions', icon: UserPlus   },
]

const FriendsPage = () => {
  const [tab, setTab]             = useState<Tab>('friends')
  const [requestCount, setRequestCount] = useState(0)

  // Badge count for pending requests
  useEffect(() => {
    friendsApi.getPendingRequests()
      .then(d => setRequestCount(d.requests.length))
      .catch(() => {})
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header />

        <div className="max-w-3xl mx-auto px-4 pt-20 pb-10">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-[24px] font-bold text-[#050505] dark:text-[#e4e6eb]">Friends</h1>
          </div>

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
                  <span className="absolute top-1.5 right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {requestCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'friends'     && <FriendsList />}
          {tab === 'requests'    && <FriendRequests onCountChange={setRequestCount} />}
          {tab === 'suggestions' && <FriendSuggestions />}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default FriendsPage
