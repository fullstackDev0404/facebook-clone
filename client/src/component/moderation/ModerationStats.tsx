"use client"

import React from 'react'
import { Flag, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

interface Props {
  totalReports: number
  pendingReports: number
  resolvedReports: number
  dismissedReports: number
}

export const ModerationStats = ({ totalReports, pendingReports, resolvedReports, dismissedReports }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Flag className="w-6 h-6 text-blue-600" />
          </div>
          <TrendingUp className="w-5 h-5 text-[#65676b]" />
        </div>
        <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb]">{totalReports}</h3>
        <p className="text-sm text-[#65676b]">Total Reports</p>
      </div>

      <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb]">{pendingReports}</h3>
        <p className="text-sm text-[#65676b]">Pending Review</p>
      </div>

      <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb]">{resolvedReports}</h3>
        <p className="text-sm text-[#65676b]">Resolved</p>
      </div>

      <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-gray-600" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb]">{dismissedReports}</h3>
        <p className="text-sm text-[#65676b]">Dismissed</p>
      </div>
    </div>
  )
}
