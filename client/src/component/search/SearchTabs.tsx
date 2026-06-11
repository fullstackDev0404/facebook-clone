"use client"

import React from 'react'

interface Props {
  activeTab: 'all' | 'people' | 'posts'
  onTabChange: (tab: 'all' | 'people' | 'posts') => void
}

export const SearchTabs = ({ activeTab, onTabChange }: Props) => {
  return (
    <div className="flex border-b border-[#f0f2f5] dark:border-[#3e4042]">
      {(['all', 'people', 'posts'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 px-6 py-4 text-sm font-medium capitalize transition-colors ${
            activeTab === tab
              ? 'text-[#1877f2] border-b-2 border-[#1877f2] bg-[#f0f2f5] dark:bg-[#3a3b3c]'
              : 'text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
