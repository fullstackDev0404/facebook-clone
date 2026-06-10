"use client"

import { useEffect, useState } from 'react'
import { moderationApi } from '@/lib/api'

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

interface ModerationStats {
  totalReports: number
  pendingReports: number
  resolvedReports: number
  dismissedReports: number
}

export const useModeration = (filter: 'pending' | 'all') => {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const loadReports = async () => {
    try {
      const data = await moderationApi.getReports({ status: filter === 'pending' ? 'pending' : undefined })
      setReports(data.reports)
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await moderationApi.getStats()
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleResolve = async (reportId: string, resolution: string) => {
    setProcessing(reportId)
    try {
      await moderationApi.updateReport(reportId, { status: 'resolved', resolution })
      await loadReports()
      await loadStats()
      setSelectedReport(null)
    } catch (error) {
      console.error('Failed to resolve report:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleDismiss = async (reportId: string) => {
    setProcessing(reportId)
    try {
      await moderationApi.updateReport(reportId, { status: 'dismissed', resolution: 'No action needed' })
      await loadReports()
      await loadStats()
      setSelectedReport(null)
    } catch (error) {
      console.error('Failed to dismiss report:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteContent = async (report: Report) => {
    setProcessing(report.id)
    try {
      await moderationApi.createAction({
        entityType: report.entityType,
        entityId: report.entityId,
        action: 'delete',
        reason: report.reason
      })
      await handleResolve(report.id, 'Content deleted')
    } catch (error) {
      console.error('Failed to delete content:', error)
    } finally {
      setProcessing(null)
    }
  }

  useEffect(() => {
    loadReports()
    loadStats()
  }, [filter])

  return {
    reports,
    stats,
    loading,
    selectedReport,
    setSelectedReport,
    processing,
    handleResolve,
    handleDismiss,
    handleDeleteContent,
  }
}

export type { Report, ModerationStats }
