"use client"
import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import SearchResults from '../SearchResults'

interface Props {
  onNavigate: (path: string) => void
}

const SearchBar = ({ onNavigate }: Props) => {
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full px-3 py-2 transition-all duration-200 ${searchFocused ? 'w-52' : 'w-44'}`}>
        <Search className="w-4 h-4 text-[#65676b] shrink-0" />
        <input
          type="text"
          placeholder="Search Facebook"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          className="bg-transparent outline-none text-[14px] text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b] w-full min-w-0"
        />
        {searchFocused && searchQuery && (
          <button onClick={() => setSearchQuery('')} className="shrink-0">
            <X className="w-3.5 h-3.5 text-[#65676b]" />
          </button>
        )}
      </div>
      {searchFocused && (
        <SearchResults 
          query={searchQuery} 
          onClose={() => {
            setSearchQuery('')
            setSearchFocused(false)
          }} 
        />
      )}
    </div>
  )
}

export default SearchBar
