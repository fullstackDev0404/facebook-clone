"use client"

import React from 'react'
import { UserX, UserCheck, Loader2 } from 'lucide-react'
import { Block } from '@/lib/api'
import { avatarSrc } from '@/component/feed/feedUtils'

interface Props {
  blockedUsers: Block[]
  loading: boolean
  error: string
  onUnblockClick: (block: Block) => void
}

export const BlockedUsersSection = ({ blockedUsers, loading, error, onUnblockClick }: Props) => {
  return (
    <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] shadow-sm">
      <div className="px-5 py-4 border-b border-[#ced0d4] dark:border-[#3e4042]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#fee2e2] flex items-center justify-center">
            <UserX className="w-5 h-5 text-[#dc2626]" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#050505] dark:text-[#e4e6eb]">Blocked Users</h2>
            <p className="text-[13px] text-[#65676b]">Manage users you've blocked from seeing your content</p>
          </div>
        </div>
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
                    <img src={avatarSrc(block.blocked.avatar)} alt="Avatar" className="object-cover w-full h-full" loading="lazy" />
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
                onClick={() => onUnblockClick(block)}
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
  )
}
