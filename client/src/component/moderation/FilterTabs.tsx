"use client"

import React from 'react'

type Filter = 'pending' | 'all'

interface Props {
  filter: Filter
  onFilterChange: (filter: Filter) => void
}

export const FilterTabs = ({ filter, onFilterChange }: Props) => {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onFilterChange('pending')}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          filter === 'pending'
            ? 'bg-[#e7f3ff] text-[#1877f2]'
            : 'bg-white dark:bg-[#242526] text-[#65676b] hover:bg-[#f0f2f5]'
        }`}
      >
        Pending
      </button>
      <button
        onClick={() => onFilterChange('all')}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          filter === 'all'
            ? 'bg-[#e7f3ff] text-[#1877f2]'
            : 'bg-white dark:bg-[#242526] text-[#65676b] hover:bg-[#f0f2f5]'
        }`}
      >
        All Reports
      </button>
    </div>
  )
}
