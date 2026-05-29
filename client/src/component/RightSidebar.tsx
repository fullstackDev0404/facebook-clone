"use client"
import React, { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MoreHorizontal, Video, Loader2, UserPlus, X, UserSearch } from 'lucide-react'
import { friendsApi, searchApi } from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import type { Author } from '@/types'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

// Shared utility for generating initials
const getInitials = (author: Author): string =>
    `${author.firstName[0] ?? ''}${author.lastName[0] ?? ''}`.toUpperCase()

// ─── Contacts section (real friends from API) ─────────────────────────────────
const ContactsList = () => {
    const [friends, setFriends] = useState<{ friendshipId: string; friend: Author }[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch]   = useState('')
    const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        friendsApi.getFriends()
            .then(d => setFriends(d.friends))
            .catch(err => console.error('Failed to load friends:', err))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        const socket = connectSocket()
        if (!socket) return

        const handleOnlineInit = (payload: { onlineUserIds: string[] }) => {
            setOnlineFriendIds(new Set(payload.onlineUserIds))
        }

        const handleUserOnline = ({ userId }: { userId: string }) => {
            setOnlineFriendIds(prev => new Set([...prev, userId]))
        }

        const handleUserOffline = ({ userId }: { userId: string }) => {
            setOnlineFriendIds(prev => {
                const next = new Set(prev)
                next.delete(userId)
                return next
            })
        }

        socket.on('online:init', handleOnlineInit)
        socket.on('user:online', handleUserOnline)
        socket.on('user:offline', handleUserOffline)

        return () => {
            socket.off('online:init', handleOnlineInit)
            socket.off('user:online', handleUserOnline)
            socket.off('user:offline', handleUserOffline)
            socket.disconnect()
        }
    }, [])

    const filtered = friends.filter(({ friend }) =>
        `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="px-3">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-[#8a8d91] uppercase tracking-wider">Contacts</p>
                <div className="flex items-center gap-0.5">
                    <button className="p-1.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors" aria-label="Video call">
                        <Video className="w-4 h-4 text-[#65676b] dark:text-[#b0b3b8]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors" aria-label="More options">
                        <MoreHorizontal className="w-4 h-4 text-[#65676b] dark:text-[#b0b3b8]" />
                    </button>
                </div>
            </div>

            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#65676b]" />
                <input
                    type="text"
                    placeholder="Search contacts"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full text-[13px] outline-none text-[#050505] dark:text-[#e4e6eb] placeholder-[#8a8d91] focus:ring-2 focus:ring-[#1877f2]/20 transition-all"
                />
            </div>

            {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1877f2]" />
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <p className="text-[13px] text-[#65676b] text-center py-3">
                    {search ? 'No contacts match.' : 'No friends yet.'}
                </p>
            )}

            <div className="space-y-0.5">
                {filtered.map(({ friendshipId, friend }) => (
                    <button
                        key={friendshipId}
                        className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors text-left group"
                        aria-label={`Chat with ${friend.firstName} ${friend.lastName}`}
                    >
                        <div className="relative shrink-0">
                             <Avatar className="w-9 h-9">
                                 <AvatarImage src={friend.avatar ?? undefined} />
                                 <AvatarFallback className="bg-[#1877f2] text-white text-xs font-bold">
                                     {getInitials(friend)}
                                 </AvatarFallback>
                             </Avatar>
                             {onlineFriendIds.has(friend.id) && (
                                 <span
                                     className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#31a24c] border-2 border-white dark:border-[#242526] rounded-full shadow-sm ring-1 ring-white"
                                     aria-label="Online"
                                 />
                             )}
                         </div>
                        <span className="text-[14px] font-medium text-[#050505] dark:text-[#e4e6eb] truncate group-hover:text-[#1877f2] transition-colors">
                            {friend.firstName} {friend.lastName}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── User Search section ───────────────────────────────────────────────────────
type SearchReqState = 'idle' | 'loading' | 'sent'

const FindFriends = () => {
    const { user } = useAuth()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Author[]>([])
    const [loading, setLoading] = useState(false)
    const [states, setStates] = useState<Record<string, SearchReqState>>({})
    const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())

    useEffect(() => {
        // Load pending requests on mount to check if users already have requests
        friendsApi.getPendingRequests()
            .then(data => {
                const requestIds = new Set(data.requests.map(r => r.senderId))
                setPendingRequests(requestIds)
            })
            .catch(err => console.error('Failed to load pending requests:', err))
    }, [])

    const handleSearch = async (value: string) => {
        setQuery(value)
        if (value.trim().length < 2) {
            setResults([])
            return
        }
        setLoading(true)
        try {
            const data = await searchApi.users(value, 5)
            // Filter out the current user from search results
            setResults(data.users.filter(u => u.id !== user?.id))
        } catch (err) {
            console.error('Search failed:', err)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    const sendRequest = async (id: string) => {
        // Prevent sending if request already exists (either from API or current session)
        if (pendingRequests.has(id) || states[id] === 'sent') {
            toast.info('Friend request already sent')
            return
        }

        setStates(s => ({ ...s, [id]: 'loading' }))
        try {
            const result = await friendsApi.sendRequest(id)
            if ((result as any).previouslyRejected) {
                setStates(s => ({ ...s, [id]: 'idle' }))
                const cooldownDays = (result as any).cooldownRemaining
                if (cooldownDays) {
                    toast.info(`Request was previously rejected. You can send another request in ${cooldownDays} day${cooldownDays > 1 ? 's' : ''}.`)
                } else {
                    toast.info('This request was previously rejected')
                }
            } else {
                setStates(s => ({ ...s, [id]: 'sent' }))
                setPendingRequests(prev => new Set([...prev, id]))
                toast.success('Friend request sent!')
            }
        } catch (err: any) {
            setStates(s => ({ ...s, [id]: 'idle' }))
            const errorMessage = err?.message || 'Failed to send friend request'
            toast.error(errorMessage)
            console.error('Friend request error:', err)
        }
    }

    return (
        <div className="px-3 mb-4">
            <p className="text-[11px] font-semibold text-[#8a8d91] uppercase tracking-wider mb-2">Find Friends</p>
            <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <UserSearch className="w-3.5 h-3.5 text-[#65676b]" />
                </span>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full text-[13px] outline-none text-[#050505] dark:text-[#e4e6eb] placeholder-[#8a8d91] focus:ring-2 focus:ring-[#1877f2]/20 transition-all"
                />
            </div>

            {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1877f2]" />
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="space-y-1">
                    {results.map(user => {
                        const state = states[user.id] ?? 'idle'
                        const hasPendingRequest = pendingRequests.has(user.id)
                        const showSent = state === 'sent' || hasPendingRequest
                        return (
                            <div key={user.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors">
                                <Avatar className="w-9 h-9 shrink-0">
                                    <AvatarImage src={user.avatar ?? undefined} />
                                    <AvatarFallback className="bg-[#1877f2] text-white text-xs font-bold">
                                        {getInitials(user)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[#050505] dark:text-[#e4e6eb] truncate">
                                        {user.firstName} {user.lastName}
                                    </p>
                                </div>
                                {showSent ? (
                                    <span className="text-[11px] text-[#1877f2] font-semibold">Sent</span>
                                ) : (
                                    <button
                                        onClick={() => sendRequest(user.id)}
                                        disabled={state === 'loading'}
                                        className="p-1.5 bg-[#e7f3ff] hover:bg-[#cce4ff] disabled:opacity-50 text-[#1877f2] rounded-full transition-colors"
                                        aria-label={`Add friend ${user.firstName} ${user.lastName}`}
                                    >
                                        {state === 'loading'
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <UserPlus className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
                <p className="text-[13px] text-[#65676b] text-center py-3">
                    No users found.
                </p>
            )}
        </div>
    )
}

// ─── People You May Know section ──────────────────────────────────────────────
type ReqState = 'idle' | 'loading' | 'sent'

const PeopleYouMayKnow = () => {
    const [people, setPeople]   = useState<Author[]>([])
    const [loading, setLoading] = useState(true)
    const [states, setStates]   = useState<Record<string, ReqState>>({})

    useEffect(() => {
        friendsApi.getSuggestions()
            .then(d => setPeople(d.suggestions.slice(0, 5)))
            .catch(err => console.error('Failed to load suggestions:', err))
            .finally(() => setLoading(false))
    }, [])

    const dismiss = (id: string) => setPeople(p => p.filter(u => u.id !== id))

    const sendRequest = async (id: string) => {
        // Prevent sending if request already exists
        if (states[id] === 'sent') {
            toast.info('Friend request already sent')
            return
        }

        setStates(s => ({ ...s, [id]: 'loading' }))
        try {
            const result = await friendsApi.sendRequest(id)
            if ((result as any).previouslyRejected) {
                setStates(s => ({ ...s, [id]: 'idle' }))
                const cooldownDays = (result as any).cooldownRemaining
                if (cooldownDays) {
                    toast.info(`Request was previously rejected. You can send another request in ${cooldownDays} day${cooldownDays > 1 ? 's' : ''}.`)
                } else {
                    toast.info('This request was previously rejected')
                }
            } else {
                setStates(s => ({ ...s, [id]: 'sent' }))
                toast.success('Friend request sent!')
            }
        } catch (err: any) {
            setStates(s => ({ ...s, [id]: 'idle' }))
            const errorMessage = err?.message || 'Failed to send friend request'
            toast.error(errorMessage)
            console.error('Friend request error:', err)
        }
    }

    if (loading) return (
        <div className="px-3 mb-4">
            <p className="text-[11px] font-semibold text-[#8a8d91] uppercase tracking-wider mb-2">People You May Know</p>
            <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#1877f2]" />
            </div>
        </div>
    )

    if (people.length === 0) return null

    return (
        <div className="px-3 mb-4">
            <p className="text-[11px] font-semibold text-[#8a8d91] uppercase tracking-wider mb-2">People You May Know</p>
            <div className="space-y-1">
                {people.map(user => {
                    const state = states[user.id] ?? 'idle'
                    return (
                        <div key={user.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors">
                            <Avatar className="w-9 h-9 shrink-0">
                                <AvatarImage src={user.avatar ?? undefined} />
                                <AvatarFallback className="bg-[#1877f2] text-white text-xs font-bold">
                                    {getInitials(user)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[#050505] dark:text-[#e4e6eb] truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {state === 'sent' ? (
                                    <span className="text-[11px] text-[#1877f2] font-semibold">Sent</span>
                                ) : (
                                    <button
                                        onClick={() => sendRequest(user.id)}
                                        disabled={state === 'loading'}
                                        className="p-1.5 bg-[#e7f3ff] hover:bg-[#cce4ff] disabled:opacity-50 text-[#1877f2] rounded-full transition-colors"
                                        aria-label={`Add friend ${user.firstName} ${user.lastName}`}
                                    >
                                        {state === 'loading'
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <UserPlus className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                                <button
                                    onClick={() => dismiss(user.id)}
                                    className="p-1.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors"
                                    aria-label="Dismiss suggestion"
                                >
                                    <X className="w-3.5 h-3.5 text-[#65676b]" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── RightSidebar ─────────────────────────────────────────────────────────────
const RightSidebar = () => {
    return (
        <aside className="shrink-0 w-72 sticky top-14 h-[calc(100vh-56px)] bg-white dark:bg-[#242526] overflow-y-auto scrollbar-hide">
            <div className="py-4 space-y-4">

                {/* Find Friends */}
                <FindFriends />

                <div className="h-px bg-[#dddfe2] dark:bg-[#3e4042] mx-3" />

                {/* People You May Know */}
                <PeopleYouMayKnow />

                <div className="h-px bg-[#dddfe2] dark:bg-[#3e4042] mx-3" />

                {/* Contacts (real friends) */}
                <ContactsList />

            </div>
        </aside>
    )
}

export default RightSidebar

