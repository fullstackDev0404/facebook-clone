"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { postsApi } from '@/lib/api'
import type { PostRecord } from '@/types'
import StoriesRow from './feed/StoriesRow'
import CreatePost from './feed/CreatePost'
import PostCard   from './feed/PostCard'

const LIMIT = 10

const Feed = () => {
  const [posts, setPosts]     = useState<PostRecord[]>([])
  const [page, setPage]       = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const initialized           = useRef(false)

  const fetchPosts = async (pageNum: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await postsApi.getFeed({ page: pageNum, limit: LIMIT })
      const incoming = data.posts ?? []
      setPosts(prev => pageNum === 1 ? incoming : [...prev, ...incoming])
      setHasMore(incoming.length === LIMIT)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount — guard prevents double-fetch in React strict mode
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    fetchPosts(1)
  }, []) 

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPosts(next)
  }

  return (
    <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full">
      <StoriesRow />
      <CreatePost onPostCreated={post => setPosts(prev => [post, ...prev])} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      {loading && page === 1 && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#1877f2]" />
        </div>
      )}

      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
        />
      ))}

      {!loading && posts.length === 0 && !error && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#ced0d4] p-8 text-center">
          <p className="text-[15px] text-[#65676b]">No posts yet. Be the first to share something!</p>
        </div>
      )}

      {hasMore && !loading && posts.length > 0 && (
        <button
          onClick={loadMore}
          className="w-full py-2.5 bg-white dark:bg-[#242526] border border-[#ced0d4] rounded-2xl text-[#1877f2] font-semibold text-sm hover:bg-[#f0f2f5] transition-colors"
        >
          Load more
        </button>
      )}

      {loading && page > 1 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#1877f2]" />
        </div>
      )}
    </div>
  )
}

export default Feed
