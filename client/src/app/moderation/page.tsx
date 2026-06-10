"use client"
import { useState } from 'react'
import { Shield } from 'lucide-react'
import ProtectedRoute from '@/component/ProtectedRoute'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import { MobileSidebarDrawer } from '@/component/layout/MobileSidebarDrawer'
import { ModerationStats } from '@/component/moderation/ModerationStats'
import { FilterTabs } from '@/component/moderation/FilterTabs'
import { ReportCard } from '@/component/moderation/ReportCard'
import { EmptyState } from '@/component/moderation/EmptyState'
import { LoadingSpinner } from '@/component/ui/LoadingSpinner'
import { useModeration, type Report } from '@/hooks/useModeration'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'

const ModerationPage = () => {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const vw = useViewport()

  const moderation = useModeration(filter)

  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header onMenuClick={() => setDrawerOpen(o => !o)} />

        <div className="flex w-full min-h-[calc(100vh-104px)] pt-[56px]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} showLeft={showLeft} />

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
              {moderation.stats && (
                <ModerationStats
                  totalReports={moderation.stats.totalReports}
                  pendingReports={moderation.stats.pendingReports}
                  resolvedReports={moderation.stats.resolvedReports}
                  dismissedReports={moderation.stats.dismissedReports}
                />
              )}

              {/* Filter Tabs */}
              <FilterTabs filter={filter} onFilterChange={setFilter} />

              {/* Reports List */}
              {moderation.loading ? (
                <LoadingSpinner />
              ) : moderation.reports.length === 0 ? (
                <EmptyState filter={filter} />
              ) : (
                <div className="space-y-4">
                  {moderation.reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      processing={moderation.processing}
                      onReview={() => moderation.setSelectedReport(report)}
                      onDelete={moderation.handleDeleteContent}
                      onDismiss={moderation.handleDismiss}
                    />
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
