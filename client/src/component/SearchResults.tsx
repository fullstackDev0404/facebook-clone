"use client"
import { useState, useEffect } from 'react'
import { Search, User, FileText, X, UserX } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { searchApi, blocksApi } from '@/lib/api'
import { avatarSrc } from './feed/feedUtils'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface SearchResult {
  users?: import('@/types').Author[]
  posts?: import('@/types').PostRecord[]
}

const SearchResults = ({ query, onClose }: { query: string; onClose: () => void }) => {
  const { user } = useAuth()
  const [results, setResults] = useState<SearchResult>({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts'>('all')
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] })
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const data = await searchApi.global(query, activeTab === 'all' ? 'all' : activeTab)
        setResults(data)
        
        // Check block status for users
        if (data.users && user) {
          const blockChecks = await Promise.all(
            data.users.map(u => blocksApi.checkBlock(u.id).catch(() => ({ isBlocked: false })))
          )
          const blockedIds = new Set(
            blockChecks
              .filter((check, index) => check.isBlocked && data.users![index].id !== user.id)
              .map((_, index) => data.users![index].id)
          )
          setBlockedUsers(blockedIds)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults({ users: [], posts: [] })
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchResults, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, activeTab, user])

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`)
    onClose()
  }

  const handlePostClick = (postId: string) => {
    router.push(`/`)
    onClose()
  }

  if (!query.trim()) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#242526] rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-[#f0f2f5] dark:border-[#3e4042]">
        {(['all', 'users', 'posts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-[#1877f2] border-b-2 border-[#1877f2] bg-[#f0f2f5] dark:bg-[#3a3b3c]'
                : 'text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Users */}
            {(activeTab === 'all' || activeTab === 'users') && results.users && results.users.length > 0 && (
              <div className="p-2">
                {activeTab === 'all' && (
                  <div className="px-3 py-2 text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8] uppercase">
                    Users
                  </div>
                )}
                {results.users.map((user) => {
                  const isBlocked = blockedUsers.has(user.id)
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-lg transition-colors text-left"
                    >
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={avatarSrc(user.avatar ?? null)} />
                        <AvatarFallback className="bg-[#1877f2] text-white text-sm font-bold">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#050505] dark:text-[#e4e6eb] flex items-center gap-2">
                          {user.firstName} {user.lastName}
                          {isBlocked && (
                            <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                              <UserX className="w-3 h-3" />
                              Blocked
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Posts */}
            {(activeTab === 'all' || activeTab === 'posts') && results.posts && results.posts.length > 0 && (
              <div className="p-2">
                {activeTab === 'all' && (
                  <div className="px-3 py-2 text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8] uppercase">
                    Posts
                  </div>
                )}
                {results.posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className="w-full p-3 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={avatarSrc(post.author.avatar ?? null)} />
                        <AvatarFallback className="bg-[#1877f2] text-white text-xs font-bold">
                          {post.author.firstName[0]}{post.author.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-[#050505] dark:text-[#e4e6eb]">
                          {post.author.firstName} {post.author.lastName}
                        </p>
                        <p className="text-sm text-[#050505] dark:text-[#e4e6eb] line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && (!results.users || results.users.length === 0) && (!results.posts || results.posts.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 text-[#65676b] dark:text-[#b0b3b8]">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No results found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SearchResults
