"use client"

import React from 'react'
import LeftSidebar from '@/component/LeftSidebar'

interface Props {
  open: boolean
  onClose: () => void
  showLeft: boolean
}

export const MobileSidebarDrawer = ({ open, onClose, showLeft }: Props) => {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open && !showLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-[#242526] shadow-2xl transition-transform duration-300 ease-in-out ${
        open && !showLeft ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <LeftSidebar onClose={onClose} showCloseButton />
      </div>
    </>
  )
}
