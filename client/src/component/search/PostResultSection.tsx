"use client"

import React from 'react'
import PostCard from '@/component/feed/PostCard'

interface Props {
  posts: any[]
  activeTab: 'all' | 'people' | 'posts'
  query: string
}

export const PostResultSection = ({ posts, activeTab, query }: Props) => {
  return (
    <div className="space-y-4">
      {activeTab === 'all' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f0f2f5] dark:border-[#3e4042]">
            <h2 className="text-lg font-semibold text-[#050505] dark:text-[#e4e6eb]">Posts</h2>
          </div>
        </div>
      )}
      {posts.map((post) => (
        <div key={post.id} className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden">
          <PostCard post={post} highlightQuery={query} />
        </div>
      ))}
    </div>
  )
}
