"use client"
import React, { useState } from 'react'
import Header        from '@/component/Header'
import LeftSidebar   from '@/component/LeftSidebar'
import RightSidebar  from '@/component/RightSidebar'
import Feed          from '@/component/Feed'
import ProtectedRoute from '@/component/ProtectedRoute'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS, HEADER_HEIGHT } from '@/lib/constants'

const Homepage = () => {
  const vw = useViewport()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const showLeft  = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter    = calcGutter(vw)

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
            <Feed />
          </main>

          {showRight && <RightSidebar />}

          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Homepage
