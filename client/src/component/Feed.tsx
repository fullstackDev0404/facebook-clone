"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
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

interface Comment {
    id: string
    content: string
    createdAt: string
    author: Author
    replies?: Comment[]
}

const PostCard = ({ post: initialPost }: { post: PostRecord }) => {
    const { user } = useAuth()
    const [post, setPost] = useState(initialPost)
    const [liked, setLiked] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [comments, setComments] = useState<Comment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)

    const name = `${post.author.firstName} ${post.author.lastName}`
    const fb   = initials(post.author.firstName, post.author.lastName)
    const API  = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000'

    const handleLike = async () => {
        try {
            if (liked) {
                await postsApi.unlike(post.id)
                setLiked(false)
                setPost((p) => ({
                    ...p,
                    _count: { ...p._count, likes: Math.max(0, (p._count?.likes ?? 0) - 1) },
                }))
            } else {
                await postsApi.like(post.id)
                setLiked(true)
                setPost((p) => ({
                    ...p,
                    _count: { ...p._count, likes: (p._count?.likes ?? 0) + 1 },
                }))
            }
        } catch (err) {
            console.error('Failed to toggle like:', err)
        }
    }

    const loadComments = async () => {
        if (comments.length > 0) return // already loaded
        setLoadingComments(true)
        try {
            const data = await postsApi.getComments(post.id)
            setComments(data.comments ?? [])
        } catch (err) {
            console.error('Failed to load comments:', err)
        } finally {
            setLoadingComments(false)
        }
    }

    const handleCommentClick = () => {
        setShowComments((prev) => !prev)
        if (!showComments) loadComments()
    }

    const handleSubmitComment = async () => {
        const trimmed = commentText.trim()
        if (!trimmed) return

        setSubmittingComment(true)
        try {
            const data = await postsApi.createComment(post.id, { content: trimmed })
            setComments((prev) => [...prev, data.comment])
            setCommentText('')
            setPost((p) => ({
                ...p,
                _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 },
            }))
        } catch (err) {
            console.error('Failed to post comment:', err)
        } finally {
            setSubmittingComment(false)
        }
    }

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
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 flex-1 justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                        liked ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{liked ? 'Liked' : 'Like'}</span>
                </button>
                <button
                    onClick={handleCommentClick}
                    className="flex items-center gap-2 flex-1 justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Comment</span>
                </button>
                <button className="flex items-center gap-2 flex-1 justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Share</span>
                </button>
            </div>

            {/* Comments section */}
            {showComments && (
                <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                    {/* Comment input */}
                    <div className="flex items-start gap-2 mb-3">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={user?.avatar ?? undefined} />
                            <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                                {user ? initials(user.firstName, user.lastName) : 'Y'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                                placeholder="Write a comment..."
                                className="flex-1 bg-gray-100 dark:bg-[rgb(58,59,60)] rounded-full px-4 py-2 text-sm outline-none dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            {commentText.trim() && (
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={submittingComment}
                                    className="text-blue-500 hover:text-blue-600 disabled:opacity-50 text-sm font-semibold"
                                >
                                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Comments list */}
                    {loadingComments && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    )}

                    {!loadingComments && comments.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first!</p>
                    )}

                    {!loadingComments && comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2 mb-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.author.avatar ? `${API}/${comment.author.avatar}` : undefined} />
                                <AvatarFallback className="bg-gray-400 text-white text-xs font-bold">
                                    {initials(comment.author.firstName, comment.author.lastName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="bg-gray-100 dark:bg-[rgb(58,59,60)] rounded-2xl px-3 py-2">
                                    <p className="text-xs font-semibold dark:text-white">
                                        {comment.author.firstName} {comment.author.lastName}
                                    </p>
                                    <p className="text-sm dark:text-gray-200">{comment.content}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 px-3">{timeAgo(comment.createdAt)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

const Feed = () => {
    const [posts, setPosts]           = useState<PostRecord[]>([])
    const [page, setPage]             = useState(1)
    const [hasNextPage, setHasNextPage] = useState(true)
    const [loadingFeed, setLoadingFeed] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [feedError, setFeedError]   = useState<string | null>(null)

    // Sentinel ref for IntersectionObserver-based infinite scroll
    const sentinelRef = useRef<HTMLDivElement>(null)

    const loadPage = useCallback(async (pageNum: number) => {
        try {
            const data = await postsApi.getFeed({ page: pageNum, limit: 10 })
            setPosts((prev) => pageNum === 1 ? data.posts : [...prev, ...data.posts])
            setHasNextPage(data.pagination.hasNextPage)
            setPage(pageNum)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load feed.'
            setFeedError(msg)
        }
    }, [])

    // Initial load
    useEffect(() => {
        setLoadingFeed(true)
        loadPage(1).finally(() => setLoadingFeed(false))
    }, [loadPage])

    // Infinite scroll — observe sentinel
    useEffect(() => {
        if (!sentinelRef.current) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !loadingMore && !loadingFeed) {
                    setLoadingMore(true)
                    loadPage(page + 1).finally(() => setLoadingMore(false))
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(sentinelRef.current)
        return () => observer.disconnect()
    }, [hasNextPage, loadingMore, loadingFeed, page, loadPage])

    const handlePostCreated = (newPost: PostRecord) => {
        setPosts((prev) => [newPost, ...prev])
    }

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <StoriesRow />
            <CreatePost onPostCreated={handlePostCreated} />

            {/* Initial load skeleton */}
            {loadingFeed && (
                <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="bg-white dark:bg-[rgb(36,37,38)] rounded-xl shadow p-4 animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Feed error */}
            {feedError && !loadingFeed && (
                <div className="bg-white dark:bg-[rgb(36,37,38)] rounded-xl shadow p-6 text-center">
                    <p className="text-sm text-red-500 mb-3">{feedError}</p>
                    <button
                        onClick={() => { setFeedError(null); setLoadingFeed(true); loadPage(1).finally(() => setLoadingFeed(false)) }}
                        className="text-sm text-blue-500 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Posts */}
            {!loadingFeed && posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}

            {/* Empty state */}
            {!loadingFeed && !feedError && posts.length === 0 && (
                <div className="bg-white dark:bg-[rgb(36,37,38)] rounded-xl shadow p-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No posts yet. Be the first to share something!
                    </p>
                </div>
            )}

            {/* Infinite scroll sentinel + load-more spinner */}
            <div ref={sentinelRef} className="flex justify-center py-4">
                {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
                {!hasNextPage && posts.length > 0 && !loadingFeed && (
                    <p className="text-xs text-gray-400">You&apos;re all caught up</p>
                )}
            </div>
        </div>
    )
}

export default Feed
