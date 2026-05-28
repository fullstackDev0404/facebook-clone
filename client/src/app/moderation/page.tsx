"use client"
import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle, Flag, Trash2, Eye, TrendingUp } from 'lucide-react'
import ProtectedRoute from '@/component/ProtectedRoute'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import { moderationApi } from '@/lib/api'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'

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

const ModerationPage = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const vw = useViewport()

  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  useEffect(() => {
    loadReports()
    loadStats()
  }, [filter])

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

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header onMenuClick={() => setDrawerOpen(o => !o)} />

        <div className="flex pt-14 w-full min-h-[calc(100vh-56px)]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          {/* Mobile drawer */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
              drawerOpen && !showLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setDrawerOpen(false)}
          />
          <div className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-[#242526] shadow-2xl transition-transform duration-300 ease-in-out ${
            drawerOpen && !showLeft ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <LeftSidebar onClose={() => setDrawerOpen(false)} showCloseButton />
          </div>

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb] mb-2 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-[#1877f2]" />
                  Content Moderation
                </h1>
                <p className="text-[#65676b] dark:text-[#b0b3b8]">Review and manage reported content</p>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Flag className="w-6 h-6 text-blue-600" />
                      </div>
                      <TrendingUp className="w-5 h-5 text-[#65676b]" />
                    </div>
                    <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb]">{stats.totalReports}</h3>
                    <p className="text-sm text-[#65676b]">Total Reports</p>
                  </div>

                  <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb]">{stats.pendingReports}</h3>
                    <p className="text-sm text-[#65676b]">Pending Review</p>
                  </div>

                  <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb]">{stats.resolvedReports}</h3>
                    <p className="text-sm text-[#65676b]">Resolved</p>
                  </div>

                  <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb]">{stats.dismissedReports}</h3>
                    <p className="text-sm text-[#65676b]">Dismissed</p>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    filter === 'pending'
                      ? 'bg-[#e7f3ff] text-[#1877f2]'
                      : 'bg-white dark:bg-[#242526] text-[#65676b] hover:bg-[#f0f2f5]'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    filter === 'all'
                      ? 'bg-[#e7f3ff] text-[#1877f2]'
                      : 'bg-white dark:bg-[#242526] text-[#65676b] hover:bg-[#f0f2f5]'
                  }`}
                >
                  All Reports
                </button>
              </div>

              {/* Reports List */}
              {loading ? (
                <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center">
                  <div className="w-8 h-8 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : reports.length === 0 ? (
                <div className="bg-white dark:bg-[#242526] rounded-xl p-12 text-center">
                  <Shield className="w-16 h-16 text-[#bcc0c4] mx-auto mb-4" />
                  <p className="text-[16px] font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
                    No reports to review
                  </p>
                  <p className="text-[14px] text-[#65676b]">
                    {filter === 'pending' ? 'All caught up!' : 'No reports found.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
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
                        onClick={() => setSelectedReport(report)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] hover:bg-[#e4e6eb] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                      <button
                        onClick={() => handleDeleteContent(report)}
                        disabled={processing === report.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Content
                      </button>
                      <button
                        onClick={() => handleDismiss(report.id)}
                        disabled={processing === report.id}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-[#3a3b3c] rounded-lg text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Dismiss
                      </button>
                    </div>
                  )}
                  </div>
                ))}
              </div>
              )}
            </div>
          </main>

          {showRight && <RightSidebar />}

          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default ModerationPage
