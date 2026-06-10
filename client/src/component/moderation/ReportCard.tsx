"use client"

import React from 'react'
import { Flag, Eye, Trash2, XCircle } from 'lucide-react'

interface Report {
  id: string
  entityType: string
  entityId: string
  reason: string
  description: string | null
  status: string
  createdAt: string
  reporter: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  reviewer: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface Props {
  report: Report
  processing: string | null
  onReview: (report: Report) => void
  onDelete: (report: Report) => void
  onDismiss: (id: string) => void
}

const getReasonColor = (reason: string) => {
  switch (reason) {
    case 'spam': return 'bg-yellow-100 text-yellow-800'
    case 'harassment': return 'bg-red-100 text-red-800'
    case 'inappropriate_content': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'resolved': return 'bg-green-100 text-green-800'
    case 'dismissed': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const ReportCard = ({ report, processing, onReview, onDelete, onDismiss }: Props) => {
  return (
    <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e7f3ff] rounded-full flex items-center justify-center">
            <Flag className="w-5 h-5 text-[#1877f2]" />
          </div>
          <div>
            <p className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
              {report.reporter.firstName} {report.reporter.lastName}
            </p>
            <p className="text-sm text-[#65676b]">
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getReasonColor(report.reason)}`}>
            {report.reason.replace('_', ' ')}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
            {report.status}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-[#65676b] mb-1">
          Reported {report.entityType} (ID: {report.entityId})
        </p>
        {report.description && (
          <p className="text-[#050505] dark:text-[#e4e6eb]">{report.description}</p>
        )}
      </div>

      {report.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => onReview(report)}
            className="flex items-center gap-2 px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] hover:bg-[#e4e6eb] transition-colors"
          >
            <Eye className="w-4 h-4" />
            Review
          </button>
          <button
            onClick={() => onDelete(report)}
            disabled={processing === report.id}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete Content
          </button>
          <button
            onClick={() => onDismiss(report.id)}
            disabled={processing === report.id}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-[#3a3b3c] rounded-lg text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
