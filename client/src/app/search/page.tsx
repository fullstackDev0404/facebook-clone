"use client"
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import ProtectedRoute from '@/component/ProtectedRoute'
import PostCard from '@/component/feed/PostCard'
import { useAuth } from '@/context/AuthContext'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'
import { Search } from 'lucide-react'
import { SearchHeader } from '@/component/search/SearchHeader'
import { UserResultCard } from '@/component/search/UserResultCard'
import { PostResultSection } from '@/component/search/PostResultSection'
import { useSearch } from '@/hooks/useSearch'
import { MobileSidebarDrawer } from '@/component/layout/MobileSidebarDrawer'

const SearchPage = () => {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts'>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const search = useSearch(query, activeTab)

  const vw = useViewport()
  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  const handleUserClick = (userId: string) => {
    window.location.href = `/profile/${userId}`
  }

  const handleAddFriend = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    search.handleAddFriend(userId)
  }

  if (!user) {
    return null
  }

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

          <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} showLeft={showLeft} />

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <SearchHeader query={query} activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Results */}
              {search.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* People */}
                  {(activeTab === 'all' || activeTab === 'people') && search.results.users && search.results.users.length > 0 && (
                    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden">
                      {activeTab === 'all' && (
                        <div className="px-4 py-3 border-b border-[#f0f2f5] dark:border-[#3e4042]">
                          <h2 className="text-lg font-semibold text-[#050505] dark:text-[#e4e6eb]">People</h2>
                        </div>
                      )}
                      {search.results.users.map((user) => (
                        <UserResultCard
                          key={user.id}
                          user={user}
                          isBlocked={search.blockedUsers.has(user.id)}
                          friendStatus={search.friendStatus.get(user.id) || 'none'}
                          isSending={search.sendingRequest.has(user.id)}
                          onUserClick={handleUserClick}
                          onAddFriend={handleAddFriend}
                        />
                      ))}
                    </div>
                  )}

                  {/* Posts */}
                  {(activeTab === 'all' || activeTab === 'posts') && search.results.posts && search.results.posts.length > 0 && (
                    <PostResultSection posts={search.results.posts} activeTab={activeTab} query={query} />
                  )}

                  {/* No results */}
                  {!search.loading && (!search.results.users || search.results.users.length === 0) && (!search.results.posts || search.results.posts.length === 0) && (
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
