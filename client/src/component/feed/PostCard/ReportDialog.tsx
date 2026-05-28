"use client"
import React, { useRef, useEffect } from 'react'
import { Loader2, Flag, ChevronDown, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReport: () => void
  reporting: boolean
  reportReason: string
  onReportReasonChange: (reason: string) => void
  reportDescription: string
  onReportDescriptionChange: (description: string) => void
}

const ReportDialog = ({
  open,
  onOpenChange,
  onReport,
  reporting,
  reportReason,
  onReportReasonChange,
  reportDescription,
  onReportDescriptionChange,
}: Props) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const reasons = [
    { value: '', label: 'Select a reason' },
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-1">
            <Flag className="w-6 h-6 text-orange-500" />
          </div>
          <DialogTitle className="text-center text-[17px]">Report post</DialogTitle>
          <DialogDescription className="text-center text-[14px]">
            Why are you reporting this post?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] outline-none text-[15px] text-[#050505] dark:text-[#e4e6eb] flex items-center justify-between"
            >
              <span>{reportReason ? reportReason.charAt(0).toUpperCase() + reportReason.slice(1).replace('_', ' ') : 'Select a reason'}</span>
              <ChevronDown className={`w-4 h-4 text-[#65676b] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#242526] rounded-xl shadow-lg border border-[#ced0d4] dark:border-[#3e4042] overflow-hidden">
                {reasons.map(reason => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => { onReportReasonChange(reason.value); setDropdownOpen(false) }}
                    className="w-full px-3 py-2.5 text-[15px] text-[#050505] dark:text-[#e4e6eb] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-left flex items-center gap-2"
                  >
                    {reportReason === reason.value && <Check className="w-4 h-4 text-[#1877f2]" />}
                    <span className={reportReason === reason.value ? 'text-[#1877f2]' : ''}>{reason.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            value={reportDescription}
            onChange={(e) => onReportDescriptionChange(e.target.value)}
            rows={3}
            placeholder="Additional details (optional)"
            className="w-full px-3 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] outline-none text-[15px] text-[#050505] dark:text-[#e4e6eb] resize-none"
          />
        </div>
        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <button
            onClick={() => onOpenChange(false)}
            disabled={reporting}
            className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onReport}
            disabled={reporting || !reportReason}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            Report
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReportDialog
