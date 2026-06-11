"use client"

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  iconBgColor: string
  iconColor: string
  children?: React.ReactNode
}

export const SettingsSection = ({ icon: Icon, title, description, iconBgColor, iconColor, children }: Props) => {
  return (
    <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] shadow-sm">
      <div className="px-5 py-4 border-b border-[#ced0d4] dark:border-[#3e4042]">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#050505] dark:text-[#e4e6eb]">{title}</h2>
            <p className="text-[13px] text-[#65676b]">{description}</p>
          </div>
        </div>
      </div>
      {children || (
        <div className="p-5 text-center text-[#65676b] text-[14px]">
          More {title.toLowerCase()} settings coming soon...
        </div>
      )}
    </div>
  )
}
