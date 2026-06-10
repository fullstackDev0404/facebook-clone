"use client"

import React from 'react'
import { Shield } from 'lucide-react'

interface Props {
  filter: 'pending' | 'all'
}

export const EmptyState = ({ filter }: Props) => {
  return (
    <div className="bg-white dark:bg-[#242526] rounded-xl p-12 text-center">
      <Shield className="w-16 h-16 text-[#bcc0c4] mx-auto mb-4" />
      <p className="text-[16px] font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
        No reports to review
      </p>
      <p className="text-[14px] text-[#65676b]">
        {filter === 'pending' ? 'All caught up!' : 'No reports found.'}
      </p>
    </div>
  )
}
