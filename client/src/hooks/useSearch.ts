"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { searchApi, blocksApi, friendsApi } from '@/lib/api'

interface User {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  bio?: string
}

interface Post {
  id: string
  [key: string]: any
}

interface SearchResults {
  users?: User[]
  posts?: Post[]
}

export const useSearch = (query: string, activeTab: 'all' | 'people' | 'posts') => {
  const { user } = useAuth()
  const [results, setResults] = useState<SearchResults>({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set())
  const [friendStatus, setFriendStatus] = useState<Map<string, 'none' | 'pending' | 'accepted' | 'rejected'>>(new Map())
  const [sendingRequest, setSendingRequest] = useState<Set<string>>(new Set())

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

  const handleAddFriend = async (userId: string) => {
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

  return {
    results,
    loading,
    blockedUsers,
    friendStatus,
    sendingRequest,
    handleAddFriend,
  }
}
