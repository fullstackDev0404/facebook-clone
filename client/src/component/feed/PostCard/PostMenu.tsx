"use client"
import React, { useRef, useEffect } from 'react'
import { Pencil, Trash2, Flag, UserX } from 'lucide-react'

interface Props {
  menuOpen: boolean
  onClose: () => void
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
  onBlock: () => void
  onHide: () => void
}

const menuItemBase = 'flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-colors text-[14px] font-medium'
const menuItemHover = 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
const destructiveMenuItem = `${menuItemBase} bg-transparent dark:bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`
const standardMenuItem = `${menuItemBase} ${menuItemHover} text-[#050505] dark:text-[#e4e6eb]`

const PostMenu = ({ menuOpen, onClose, isOwner, onEdit, onDelete, onReport, onBlock, onHide }: Props) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!menuOpen) return null

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#242526] rounded-2xl py-1 z-50"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
    >
      {isOwner ? (
        <>
          <button onClick={onEdit} className={standardMenuItem}>
            <Pencil className="w-4 h-4 text-[#65676b]" />
            Edit post
          </button>
          <button onClick={onDelete} className={destructiveMenuItem}>
            <Trash2 className="w-4 h-4" />
            Delete post
          </button>
        </>
      ) : (
        <>
          <button onClick={onReport} className={standardMenuItem}>
            <Flag className="w-4 h-4 text-[#65676b]" />
            Report post
          </button>
          <button onClick={onBlock} className={destructiveMenuItem}>
            <UserX className="w-4 h-4" />
            Block user
          </button>
          <button onClick={onHide} className={standardMenuItem}>
            Hide post
          </button>
        </>
      )}
    </div>
  )
}

export default PostMenu
