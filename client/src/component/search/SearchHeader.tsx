"use client"

import React from 'react'
import { SearchTabs } from './SearchTabs'

interface Props {
  query: string
  activeTab: 'all' | 'people' | 'posts'
  onTabChange: (tab: 'all' | 'people' | 'posts') => void
}

export const SearchHeader = ({ query, activeTab, onTabChange }: Props) => {
  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden mb-4">
      <div className="p-4 border-b border-[#f0f2f5] dark:border-[#3e4042]">
        <h1 className="text-2xl font-bold text-[#050505] dark:text-[#e4e6eb]">
          Search Results for "{query}"
        </h1>
      </div>
      
      <SearchTabs activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}
