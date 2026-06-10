"use client"
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import ProtectedRoute from '@/component/ProtectedRoute'
import PostCard from '@/component/feed/PostCard'
import { useAuth } from '@/context/AuthContext'
import { searchApi, blocksApi, friendsApi } from '@/lib/api'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'
import { avatarSrc } from '@/component/feed/feedUtils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserX, UserPlus, UserCheck } from 'lucide-react'

const SearchPage = () => {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<{ users?: any[]; posts?: any[] }>({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts'>('all')
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set())
  const [friendStatus, setFriendStatus] = useState<Map<string, 'none' | 'pending' | 'accepted' | 'rejected'>>(new Map())
  const [sendingRequest, setSendingRequest] = useState<Set<string>>(new Set())

  const vw = useViewport()
  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] })
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const data = await searchApi.global(query, activeTab === 'all' ? 'all' : activeTab)
        // Filter out the current user from search results
        const filteredUsers = data.users ? data.users.filter(u => u.id !== user?.id) : []
        setResults({ ...data, users: filteredUsers })
        
        // Check block status for users
        if (filteredUsers && user) {
          const blockChecks = await Promise.all(
            filteredUsers.map(u => blocksApi.checkBlock(u.id).catch(() => ({ isBlocked: false })))
          )
          const blockedIds = new Set(
            blockChecks
              .filter((check, index) => check.isBlocked && filteredUsers[index].id !== user.id)
              .map((_, index) => filteredUsers[index].id)
          )
          setBlockedUsers(blockedIds)

          // Check friend status for users
          const friendsData = await friendsApi.getFriends().catch(() => ({ friends: [] }))
          const friendIds = new Set(friendsData.friends?.map((f: any) => f.friend.id) || [])
          const pendingData = await friendsApi.getPendingRequests().catch(() => ({ requests: [] }))
          const pendingIds = new Set(
            pendingData.requests
              ?.filter((r: any) => r.senderId === user.id || r.receiverId === user.id)
              .map((r: any) => r.senderId === user.id ? r.receiverId : r.senderId) || []
          )
          
          const statusMap = new Map<string, 'none' | 'pending' | 'accepted' | 'rejected'>()
          filteredUsers.forEach((u: any) => {
            if (friendIds.has(u.id)) {
              statusMap.set(u.id, 'accepted')
            } else if (pendingIds.has(u.id)) {
              statusMap.set(u.id, 'pending')
            } else {
              statusMap.set(u.id, 'none')
            }
          })
          setFriendStatus(statusMap)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults({ users: [], posts: [] })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query, activeTab, user])

  const handleUserClick = (userId: string) => {
    window.location.href = `/profile/${userId}`
  }

  const handlePostClick = (postId: string) => {
    window.location.href = `/`
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleAddFriend = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSendingRequest(prev => new Set(prev).add(userId))
    try {
      await friendsApi.sendRequest(userId)
      setFriendStatus(prev => new Map(prev).set(userId, 'pending'))
    } catch (error) {
      console.error('Failed to send friend request:', error)
    } finally {
      setSendingRequest(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header />

        <div className="flex w-full min-h-[calc(100vh-104px)] pt-[56px]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              {/* Search Header */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden mb-4">
                <div className="p-4 border-b border-[#f0f2f5] dark:border-[#3e4042]">
                  <h1 className="text-2xl font-bold text-[#050505] dark:text-[#e4e6eb]">
                    Search Results for "{query}"
                  </h1>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-[#f0f2f5] dark:border-[#3e4042]">
                  {(['all', 'people', 'posts'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-6 py-4 text-sm font-medium capitalize transition-colors ${
                        activeTab === tab
                          ? 'text-[#1877f2] border-b-2 border-[#1877f2] bg-[#f0f2f5] dark:bg-[#3a3b3c]'
                          : 'text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* People */}
                  {(activeTab === 'all' || activeTab === 'people') && results.users && results.users.length > 0 && (
                    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden">
                      {activeTab === 'all' && (
                        <div className="px-4 py-3 border-b border-[#f0f2f5] dark:border-[#3e4042]">
                          <h2 className="text-lg font-semibold text-[#050505] dark:text-[#e4e6eb]">People</h2>
                        </div>
                      )}
                      {results.users.map((user) => {
                        const isBlocked = blockedUsers.has(user.id)
                        const status = friendStatus.get(user.id) || 'none'
                        const isSending = sendingRequest.has(user.id)
                        return (
                          <div
                            key={user.id}
                            className="flex items-center gap-4 p-4 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors border-b border-[#f0f2f5] dark:border-[#3e4042] last:border-0"
                          >
                            <button
                              onClick={() => handleUserClick(user.id)}
                              className="flex items-center gap-4 flex-1 min-w-0 text-left"
                            >
                              <Avatar className="w-12 h-12 shrink-0">
                                <AvatarImage src={avatarSrc(user.avatar ?? null)} />
                                <AvatarFallback className="bg-[#1877f2] text-white text-sm font-bold">
                                  {user.firstName[0]}{user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base text-[#050505] dark:text-[#e4e6eb] flex items-center gap-2">
                                  {user.firstName} {user.lastName}
                                  {isBlocked && (
                                    <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                                      <UserX className="w-3 h-3" />
                                      Blocked
                                    </span>
                                  )}
                                </p>
                                {user.bio && (
                                  <p className="text-sm text-[#65676b] dark:text-[#b0b3b8] line-clamp-1">{user.bio}</p>
                                )}
                              </div>
                            </button>
                            {status === 'none' && !isBlocked && (
                              <button
                                onClick={(e) => handleAddFriend(user.id, e)}
                                disabled={isSending}
                                className="shrink-0 px-4 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isSending ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus className="w-4 h-4" />
                                    Add Friend
                                  </>
                                )}
                              </button>
                            )}
                            {status === 'pending' && (
                              <button
                                disabled
                                className="shrink-0 px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#65676b] dark:text-[#b0b3b8] text-sm font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
                              >
                                <UserCheck className="w-4 h-4" />
                                Request Sent
                              </button>
                            )}
                            {status === 'accepted' && (
                              <button
                                disabled
                                className="shrink-0 px-4 py-2 bg-[#e7f3ff] dark:bg-[#263951] text-[#1877f2] text-sm font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
                              >
                                <UserCheck className="w-4 h-4" />
                                Friends
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Posts */}
                  {(activeTab === 'all' || activeTab === 'posts') && results.posts && results.posts.length > 0 && (
                    <div className="space-y-4">
                      {activeTab === 'all' && (
                        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden">
                          <div className="px-4 py-3 border-b border-[#f0f2f5] dark:border-[#3e4042]">
                            <h2 className="text-lg font-semibold text-[#050505] dark:text-[#e4e6eb]">Posts</h2>
                          </div>
                        </div>
                      )}
                      {results.posts.map((post) => (
                        <div key={post.id} className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden">
                          <PostCard post={post} highlightQuery={query} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {!loading && (!results.users || results.users.length === 0) && (!results.posts || results.posts.length === 0) && (
                    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden p-12">
                      <div className="flex flex-col items-center justify-center text-[#65676b] dark:text-[#b0b3b8]">
                        <Search className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No results found</p>
                        <p className="text-sm mt-1">Try a different search term</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {showRight && (
            <div className="w-80 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto" style={{ marginLeft: gutter }}>
              <RightSidebar />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default SearchPage
