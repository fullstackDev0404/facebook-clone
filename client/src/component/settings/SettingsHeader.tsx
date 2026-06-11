"use client"

import React from 'react'
import { Settings } from 'lucide-react'

export const SettingsHeader = () => {
  return (
    <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] shadow-sm">
      <div className="px-5 py-4 border-b border-[#ced0d4] dark:border-[#3e4042]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#e7f3ff] flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#1877f2]" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[#050505] dark:text-[#e4e6eb]">Settings</h1>
            <p className="text-[14px] text-[#65676b]">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>
    </div>
  )
}
