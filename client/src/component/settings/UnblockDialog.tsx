"use client"

import React from 'react'
import { UserCheck, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Block {
  id: string
  blockedId: string
  blocked: {
    firstName: string
    lastName: string
  }
  createdAt: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedUser: Block | null
  onUnblock: () => void
  unblocking: boolean
}

export const UnblockDialog = ({ open, onOpenChange, selectedUser, onUnblock, unblocking }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
            disabled={unblocking}
            className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUnblock}
            disabled={unblocking}
            className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {unblocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Unblock
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
