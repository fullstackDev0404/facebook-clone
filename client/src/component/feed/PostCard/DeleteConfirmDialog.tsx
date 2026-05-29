"use client"
import React from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  deleting: boolean
}

const DeleteConfirmDialog = ({ open, onOpenChange, onDelete, deleting }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-sm" aria-describedby="delete-post-description">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-1">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle className="text-center text-[17px]">Delete post?</DialogTitle>
          <DialogDescription id="delete-post-description" className="text-center text-[14px]">
            This will permanently remove your post. You can&apos;t undo this.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <button
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteConfirmDialog
