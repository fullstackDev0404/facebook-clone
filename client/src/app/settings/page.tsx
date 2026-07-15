"use client"

import React, { useState } from 'react'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import ProtectedRoute from '@/component/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'
import { Shield, Bell, Lock } from 'lucide-react'
import { SettingsHeader } from '@/component/settings/SettingsHeader'
import { UnblockDialog } from '@/component/settings/UnblockDialog'
import { BlockedUsersSection } from '@/component/settings/BlockedUsersSection'
import { SettingsSection } from '@/component/settings/SettingsSection'
import { useSettings } from '@/hooks/useSettings'
import { MobileSidebarDrawer } from '@/component/layout/MobileSidebarDrawer'
import PrivacySettings from '@/component/settings/PrivacySettings'

const SettingsPage = () => {
  const { user } = useAuth()
  const settings = useSettings()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const vw = useViewport()
  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header onMenuClick={() => setDrawerOpen(o => !o)} />

        <UnblockDialog
          open={settings.unblockOpen}
          onOpenChange={settings.setUnblockOpen}
          selectedUser={settings.selectedUser}
          onUnblock={settings.handleUnblock}
          unblocking={settings.unblocking}
        />

        <div className="flex w-full min-h-[calc(100vh-104px)] pt-[56px]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          <MobileSidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} showLeft={showLeft} />

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-4">
              <SettingsHeader />

              <BlockedUsersSection
                blockedUsers={settings.blockedUsers}
                loading={settings.loading}
                error={settings.error}
                onUnblockClick={settings.openUnblockDialog}
              />

              <PrivacySettings />

              <NotificationSettings />

              {/* Placeholder for other settings sections */}
              <SettingsSection
                icon={Lock}
                title="Security"
                description="Manage your account security"
                iconBgColor="bg-[#d1fae5]"
                iconColor="text-[#059669]"
              />
            </div>
          </main>

          {showRight && <RightSidebar />}
          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default SettingsPage
