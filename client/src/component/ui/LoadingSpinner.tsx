"use client"

import React from 'react'

export const LoadingSpinner = () => {
  return (
    <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center">
      <div className="w-8 h-8 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )
}
