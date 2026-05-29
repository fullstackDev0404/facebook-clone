"use client"

import React, { useEffect, useState } from 'react'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import ProtectedRoute from '@/component/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { blocksApi, Block } from '@/lib/api'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'
import { avatarSrc } from '@/component/feed/feedUtils'
import { UserCheck, Loader2, UserX } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const BlockedUsersPage = () => {
  const { user } = useAuth()
  const [blockedUsers, setBlockedUsers] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unblockOpen, setUnblockOpen] = useState(false)
  const [unblocking, setUnblocking] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Block | null>(null)

  const vw = useViewport()
  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

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

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header />

        {/* ── Unblock confirmation dialog ── */}
        <Dialog open={unblockOpen} onOpenChange={setUnblockOpen}>
          <DialogContent showCloseButton={false} className="max-w-sm" aria-describedby="unblock-description">
            <DialogHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-1">
                <UserCheck className="w-6 h-6 text-green-500" />
              </div>
              <DialogTitle className="text-center text-[17px]">Unblock user?</DialogTitle>
              <DialogDescription id="unblock-description" className="text-center text-[14px]">
                {selectedUser && `${selectedUser.blocked.firstName} ${selectedUser.blocked.lastName}`} will be able to see your posts and message you again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 sm:flex-row">
              <button
                onClick={() => setUnblockOpen(false)}
                disabled={unblocking}
                className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnblock}
                disabled={unblocking}
                className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {unblocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                Unblock
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex pt-14 w-full min-h-[calc(100vh-56px)]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] shadow-sm">
                <div className="px-5 py-4 border-b border-[#ced0d4] dark:border-[#3e4042]">
                  <h1 className="text-[24px] font-bold text-[#050505] dark:text-[#e4e6eb]">Blocked Users</h1>
                  <p className="text-[14px] text-[#65676b] mt-1">
                    Manage users you've blocked from seeing your content and messaging you.
                  </p>
                </div>

                {loading && (
                  <div className="p-8 text-center text-[#65676b]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading blocked users...
                  </div>
                )}

                {error && (
                  <div className="p-6 text-center text-red-500">
                    {error}
                  </div>
                )}

                {!loading && !error && blockedUsers.length === 0 && (
                  <div className="p-10 text-center text-[#65676b]">
                    <UserX className="w-16 h-16 mx-auto mb-3 text-[#65676b]" />
                    <p className="text-[15px]">No blocked users yet.</p>
                  </div>
                )}

                {!loading && !error && blockedUsers.length > 0 && (
                  <div className="divide-y divide-[#ced0d4] dark:divide-[#3e4042]">
                    {blockedUsers.map((block) => (
                      <div key={block.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#f7f8f9] dark:hover:bg-[#18191a] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#e4e6eb]">
                            {block.blocked.avatar ? (
                              <img src={avatarSrc(block.blocked.avatar)} alt="Avatar" className="object-cover w-full h-full" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-[#1877f2] font-semibold text-lg bg-white">
                                {block.blocked.firstName[0]}{block.blocked.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[15px] text-[#050505] dark:text-[#e4e6eb]">
                              {block.blocked.firstName} {block.blocked.lastName}
                            </p>
                            <p className="text-[13px] text-[#65676b]">
                              Blocked {new Date(block.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => openUnblockDialog(block)}
                          className="px-4 py-2 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-[14px] font-semibold transition-colors flex items-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>

          {showRight && <RightSidebar />}
          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default BlockedUsersPage
