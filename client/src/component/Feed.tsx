"use client"
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Image, Video, Smile, ThumbsUp, MessageCircle, Share2, MoreHorizontal, Plus } from 'lucide-react'

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const stories = [
    { name: 'Your Story', fallback: 'Y', color: 'bg-blue-500', isCreate: true },
    { name: 'Alice J.', fallback: 'AJ', color: 'bg-pink-500' },
    { name: 'Bob S.', fallback: 'BS', color: 'bg-green-500' },
    { name: 'Carol W.', fallback: 'CW', color: 'bg-purple-500' },
    { name: 'David L.', fallback: 'DL', color: 'bg-orange-500' },
]

const posts = [
    {
        id: 1,
        author: 'Alice Johnson',
        fallback: 'AJ',
        color: 'bg-pink-500',
        time: '2 hours ago',
        content: 'Just had an amazing day at the beach! 🌊☀️ The weather was perfect and the vibes were immaculate.',
        likes: 42,
        comments: 8,
        shares: 3,
    },
    {
        id: 2,
        author: 'Bob Smith',
        fallback: 'BS',
        color: 'bg-green-500',
        time: '4 hours ago',
        content: 'Finally finished my side project after 3 months of work. Shipping is the best feeling in the world. 🚀',
        likes: 128,
        comments: 24,
        shares: 15,
    },
    {
        id: 3,
        author: 'Carol White',
        fallback: 'CW',
        color: 'bg-purple-500',
        time: 'Yesterday',
        content: 'Cooking experiment of the week: homemade ramen from scratch. Took 6 hours but totally worth it! 🍜',
        likes: 76,
        comments: 12,
        shares: 5,
    },
]

// ─── Stories Row ─────────────────────────────────────────────────────────────

const StoriesRow = () => (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {stories.map((story, i) => (
            <div
                key={story.name}
                className="relative flex-shrink-0 w-24 h-40 rounded-xl overflow-hidden cursor-pointer group"
            >
                {/* Background gradient */}
                <div className={`absolute inset-0 ${story.color} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />

                {/* Avatar */}
                <div className="absolute top-3 left-3">
                    {story.isCreate ? (
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow">
                            <Plus className="w-5 h-5 text-blue-500" />
                        </div>
                    ) : (
                        <div className={`w-10 h-10 rounded-full ${story.color} border-4 border-blue-500 flex items-center justify-center text-white text-xs font-bold`}>
                            {story.fallback}
                        </div>
                    )}
                </div>

                {/* Name */}
                <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold px-1 leading-tight">
                    {story.name}
                </p>
            </div>
        ))}
    </div>
)

// ─── Create Post Box ──────────────────────────────────────────────────────────

const CreatePost = () => (
    <div className="bg-white dark:bg-[rgb(36,37,38)] rounded-xl shadow p-3">
        <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
                <AvatarImage />
                <AvatarFallback className="bg-blue-500 text-white font-bold">Y</AvatarFallback>
            </Avatar>
            <button className="flex-1 bg-gray-100 dark:bg-[rgb(58,59,60)] hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-4 py-2.5 text-left text-sm text-gray-500 dark:text-gray-400 transition-colors">
                What&apos;s on your mind?
            </button>
        </div>
        <hr className="border-gray-200 dark:border-gray-700 mb-2" />
        <div className="flex items-center justify-around">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-1 justify-center">
                <Video className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Live video</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-1 justify-center">
                <Image className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Photo/video</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-1 justify-center">
                <Smile className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Feeling</span>
            </button>
        </div>
    </div>
)

// ─── Post Card ────────────────────────────────────────────────────────────────

const PostCard = ({ post }: { post: typeof posts[0] }) => (
    <div className="bg-white dark:bg-[rgb(36,37,38)] rounded-xl shadow">
        {/* Post Header */}
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarImage />
                    <AvatarFallback className={`${post.color} text-white font-bold text-sm`}>
                        {post.fallback}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm dark:text-white">{post.author}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{post.time} · 🌐</p>
                </div>
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
        </div>

        {/* Post Content */}
        <p className="px-4 pb-3 text-sm dark:text-white leading-relaxed">{post.content}</p>

        {/* Reaction counts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1">
                <span className="text-xs">👍❤️😂</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{post.likes}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>{post.comments} comments</span>
                <span>{post.shares} shares</span>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center px-2 py-1">
            <button className="flex items-center gap-2 flex-1 justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ThumbsUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Like</span>
            </button>
            <button className="flex items-center gap-2 flex-1 justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Comment</span>
            </button>
            <button className="flex items-center gap-2 flex-1 justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Share2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Share</span>
            </button>
        </div>
    </div>
)

// ─── Feed ─────────────────────────────────────────────────────────────────────

const Feed = () => {
    return (
        <div className="max-w-xl mx-auto space-y-4">
            <StoriesRow />
            <CreatePost />
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    )
}

export default Feed
