"use client"
import React from 'react'
import { Loader2, UserX } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBlock: () => void
  blocking: boolean
  userName: string
}

const BlockDialog = ({ open, onOpenChange, onBlock, blocking, userName }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-1">
            <UserX className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle className="text-center text-[17px]">Block user?</DialogTitle>
          <DialogDescription className="text-center text-[14px]">
            You won&apos;t see posts from {userName} anymore. They won&apos;t be able to see your posts or message you.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <button
            onClick={() => onOpenChange(false)}
            disabled={blocking}
            className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onBlock}
            disabled={blocking}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {blocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
            Block
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BlockDialog
