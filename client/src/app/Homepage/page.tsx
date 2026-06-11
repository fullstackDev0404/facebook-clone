"use client"
import React, { useState, lazy, Suspense } from 'react'
import Header        from '@/component/Header'
import LeftSidebar   from '@/component/LeftSidebar'
import RightSidebar  from '@/component/RightSidebar'
import LiveInsights  from '@/component/LiveInsights'
import Feed          from '@/component/Feed'
import ProtectedRoute from '@/component/ProtectedRoute'
import EmailVerificationBanner from '@/component/EmailVerificationBanner'
import { MobileSidebarDrawer } from '@/component/layout/MobileSidebarDrawer'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS, HEADER_HEIGHT } from '@/lib/constants'

const LazyRightSidebar = lazy(() => import('@/component/RightSidebar'))
const LazyLiveInsights = lazy(() => import('@/component/LiveInsights'))

const Homepage = () => {
  const vw = useViewport()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const showLeft  = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter    = calcGutter(vw)

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <EmailVerificationBanner />
        <Header onMenuClick={() => setDrawerOpen(o => !o)} />

        <div className="flex w-full min-h-[calc(100vh-104px)] md:min-h-[calc(100vh-56px)] pt-[56px]">

          {showLeft && (
            <div className="hidden md:flex w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} showLeft={showLeft} />

          <main className="flex-1 min-w-0 py-5 px-6 overflow-y-auto">
            <Suspense fallback={<div className="h-20" />}>
              <LazyLiveInsights />
            </Suspense>
            <Feed />
          </main>

          {showRight && (
            <Suspense fallback={<div className="w-72" />}>
              <LazyRightSidebar />
            </Suspense>
          )}

          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Homepage
