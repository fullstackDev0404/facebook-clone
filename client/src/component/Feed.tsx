"use client"
import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    ImageIcon, Video, Smile, ThumbsUp, MessageCircle,
    Share2, MoreHorizontal, Plus, X, Loader2,
} from 'lucide-react'
import { postsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
}

interface PostRecord {
    id: string
    content: string | null
    image: string | null
    authorId: string
    createdAt: string
    updatedAt: string
    author: Author
    _count?: { likes: number; comments: number }
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const stories = [
    { name: 'Your Story', fallback: 'Y', color: 'bg-blue-500', isCreate: true },
    { name: 'Alice J.',   fallback: 'AJ', color: 'bg-pink-500' },
    { name: 'Bob S.',     fallback: 'BS', color: 'bg-green-500' },
    { name: 'Carol W.',   fallback: 'CW', color: 'bg-purple-500' },
    { name: 'David L.',   fallback: 'DL', color: 'bg-orange-500' },
]

const DUMMY_POSTS: PostRecord[] = [
    {
        id: '1',
        author: { id: 'a1', firstName: 'Alice', lastName: 'Johnson', avatar: null },
        authorId: 'a1',
        content: 'Just had an amazing day at the beach! 🌊☀️ The weather was perfect and the vibes were immaculate.',
        image: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { likes: 42, comments: 8 },
    },
    {
        id: '2',
        author: { id: 'a2', firstName: 'Bob', lastName: 'Smith', avatar: null },
        authorId: 'a2',
        content: 'Finally finished my side project after 3 months of work. Shipping is the best feeling in the world. 🚀',
        image: null,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { likes: 128, comments: 24 },
    },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const initials = (first: string, last: string) =>
    `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()

// ─── Stories Row ─────────────────────────────────────────────────────────────

const StoriesRow = () => (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {stories.map((story) => (
            <div
                key={story.name}
                className="relative shrink-0 w-24 h-40 rounded-xl overflow-hidden cursor-pointer group"
            >
                <div className={`absolute inset-0 ${story.color} opacity-80`} />
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/50" />
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
                <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold px-1 leading-tight">
                    {story.name}
                </p>
            </div>
        ))}
    </div>
)

// ─── Create Post Box ──────────────────────────────────────────────────────────

interface CreatePostProps {
    onPostCreated: (post: PostRecord) => void
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
    const { user } = useAuth()
    const [expanded, setExpanded]     = useState(false)
    const [content, setContent]       = useState('')
    const [image, setImage]           = useState<File | null>(null)
    const [preview, setPreview]       = useState<string | null>(null)
    const [loading, setLoading]       = useState(false)
    const [error, setError]           = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        if (!file) return

        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowed.includes(file.type)) {
            setError('Only JPEG, PNG, GIF, or WebP images are allowed.')
            return
        }

        setImage(file)
        setPreview(URL.createObjectURL(file))
        setError(null)
    }

    const removeImage = () => {
        setImage(null)
        if (preview) URL.revokeObjectURL(preview)
        setPreview(null)
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleSubmit = async () => {
        const trimmed = content.trim()
        if (!trimmed && !image) {
            setError('Please add some text or a photo before posting.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const data = await postsApi.create({ content: trimmed, image })
            // Reset form regardless of response shape
            setContent('')
            removeImage()
            setExpanded(false)
            if (data?.post) onPostCreated(data.post)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to create post.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const userInitials = user ? initials(user.firstName, user.lastName) : 'Y'

    return (
        <div className="bg-white dark:bg-[rgb(36,37,38)] rounded-xl shadow p-3">
            {/* Top row */}
            <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.avatar ?? undefined} />
                    <AvatarFallback className="bg-blue-500 text-white font-bold">
                        {userInitials}
                    </AvatarFallback>
                </Avatar>
                {!expanded ? (
                    <button
                        onClick={() => setExpanded(true)}
                        className="flex-1 bg-gray-100 dark:bg-[rgb(58,59,60)] hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-4 py-2.5 text-left text-sm text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        What&apos;s on your mind?
                    </button>
                ) : (
                    <textarea
                        autoFocus
                        value={content}
                        onChange={(e) => { setContent(e.target.value); setError(null) }}
                        placeholder="What's on your mind?"
                        rows={3}
                        className="flex-1 bg-transparent resize-none outline-none text-sm dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                )}
            </div>

            {/* Image preview */}
            {preview && (
                <div className="relative mb-3 rounded-xl overflow-hidden">
                    <Image
                        src={preview}
                        alt="Preview"
                        width={600}
                        height={400}
                        className="w-full object-cover max-h-72"
                        unoptimized
                    />
                    <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                        aria-label="Remove image"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="text-xs text-red-500 mb-2 px-1">{error}</p>
            )}

            <hr className="border-gray-200 dark:border-gray-700 mb-2" />

            {/* Action buttons */}
            <div className="flex items-center justify-around">
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-1 justify-center">
                    <Video className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Live video</span>
                </button>

                {/* Hidden file input */}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => { setExpanded(true); fileRef.current?.click() }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-1 justify-center"
                >
                    <ImageIcon className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Photo/video</span>
                </button>

                <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-1 justify-center">
                    <Smile className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Feeling</span>
                </button>

                {/* Post button — only visible when expanded */}
                {expanded && (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="ml-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Post
                    </button>
                )}
            </div>
        </div>
    )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

const PostCard = ({ post }: { post: PostRecord }) => {
    const name = `${post.author.firstName} ${post.author.lastName}`
    const fb   = initials(post.author.firstName, post.author.lastName)
    const API  = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000'

    return (
        <div className="bg-white dark:bg-[rgb(36,37,38)] rounded-xl shadow">
            {/* Header */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author.avatar ? `${API}/${post.author.avatar}` : undefined} />
                        <AvatarFallback className="bg-blue-500 text-white font-bold text-sm">{fb}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm dark:text-white">{name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(post.createdAt)} · 🌐</p>
                    </div>
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
            </div>

            {/* Content */}
            {post.content && (
                <p className="px-4 pb-3 text-sm dark:text-white leading-relaxed">{post.content}</p>
            )}

            {/* Image */}
            {post.image && (
                <div className="relative w-full">
                    <Image
                        src={`${API}/${post.image}`}
                        alt="Post image"
                        width={600}
                        height={400}
                        className="w-full object-cover"
                        unoptimized
                    />
                </div>
            )}

            {/* Counts */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1">
                    <span className="text-xs">👍❤️😂</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{post._count?.likes ?? 0}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{post._count?.comments ?? 0} comments</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center px-2 py-1">
                {[
                    { icon: <ThumbsUp className="w-5 h-5" />, label: 'Like' },
                    { icon: <MessageCircle className="w-5 h-5" />, label: 'Comment' },
                    { icon: <Share2 className="w-5 h-5" />, label: 'Share' },
                ].map(({ icon, label }) => (
                    <button
                        key={label}
                        className="flex items-center gap-2 flex-1 justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                    >
                        {icon}
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

const Feed = () => {
    const [posts, setPosts] = useState<PostRecord[]>(DUMMY_POSTS)

    const handlePostCreated = (newPost: PostRecord) => {
        setPosts((prev) => [newPost, ...prev])
    }

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <StoriesRow />
            <CreatePost onPostCreated={handlePostCreated} />
            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    )
}

export default Feed
