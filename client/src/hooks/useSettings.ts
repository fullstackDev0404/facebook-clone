"use client"

import { useState, useEffect } from 'react'
import { blocksApi, Block } from '@/lib/api'
import { toast } from 'sonner'

export const useSettings = () => {
  const [blockedUsers, setBlockedUsers] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unblockOpen, setUnblockOpen] = useState(false)
  const [unblocking, setUnblocking] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Block | null>(null)

  useEffect(() => {
    loadBlockedUsers()
  }, [])

  const loadBlockedUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await blocksApi.getBlockedUsers()
      setBlockedUsers(data.blocks)
    } catch (err) {
      setError('Unable to load blocked users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!selectedUser) return
    setUnblocking(true)
    try {
      await blocksApi.unblockUser(selectedUser.blockedId)
      setUnblockOpen(false)
      setSelectedUser(null)
      toast.success('User unblocked successfully')
      loadBlockedUsers()
    } catch (err) {
      toast.error('Failed to unblock user')
    } finally {
      setUnblocking(false)
    }
  }

  const openUnblockDialog = (block: Block) => {
    setSelectedUser(block)
    setUnblockOpen(true)
  }

  return {
    blockedUsers,
    loading,
    error,
    unblockOpen,
    setUnblockOpen,
    unblocking,
    selectedUser,
    handleUnblock,
    openUnblockDialog,
  }
}
