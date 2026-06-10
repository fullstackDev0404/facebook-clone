"use client"

import React from 'react'

type Tab = 'posts' | 'about' | 'friends' | 'photos'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export const ProfileTabs = ({ activeTab, onTabChange }: Props) => {
  const tabs: Tab[] = ['posts', 'about', 'friends', 'photos']

  return (
    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`py-3 rounded-2xl text-[14px] font-semibold transition-colors ${
            activeTab === tab
              ? 'bg-[#e7f3ff] text-[#1877f2]'
              : 'bg-[#f7f8f9] dark:bg-[#18191a] text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#242526]'
          }`}
        >
          {tab === 'posts' ? 'Posts' : tab === 'about' ? 'About' : tab === 'friends' ? 'Friends' : 'Photos'}
        </button>
      ))}
    </div>
  )
}
