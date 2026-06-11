"use client"

import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import ProtectedRoute from '@/component/ProtectedRoute'
import { ProfileHeader } from '@/component/profile/ProfileHeader'
import { ProfileTabs } from '@/component/profile/ProfileTabs'
import { ProfileContent } from '@/component/profile/ProfileContent'
import { useAuth } from '@/context/AuthContext'
import { usersApi, friendsApi, blocksApi } from '@/lib/api'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'
import { avatarSrc } from '@/component/feed/feedUtils'
import type { PostRecord } from '@/types'
import { UserX, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const LazyRightSidebar = lazy(() => import('@/component/RightSidebar'))

type Tab = 'posts' | 'about' | 'friends' | 'photos'

interface ProfileData {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  coverPhoto: string | null
  bio: string | null
  dob: string | null
  gender: string | null
  createdAt: string
  postsCount: number
  friendsCount: number
}

interface FriendEntry {
  friendshipId: string
  friend: { id: string; firstName: string; lastName: string; avatar: string | null }
  since: string
}

const ProfilePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { user } = useAuth()
  const resolvedParams = React.use(params)
  const [tab, setTab] = useState<Tab>('posts')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [recentPosts, setRecentPosts] = useState<PostRecord[]>([])
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [blockOpen, setBlockOpen] = useState(false)
  const [blocking, setBlocking] = useState(false)

  const vw = useViewport()
  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  const isSelfProfile = user?.id && resolvedParams?.id ? user.id === resolvedParams.id : false
  const profileName = useMemo(
    () => profile ? `${profile.firstName} ${profile.lastName}` : '',
    [profile]
  )

  const handleBlock = async () => {
    if (!user || !resolvedParams?.id) return
    setBlocking(true)
    try {
      await blocksApi.blockUser(resolvedParams.id)
      setBlockOpen(false)
      toast.success('User blocked successfully')
      window.location.href = '/'
    } catch (err) {
      toast.error('Failed to block user')
    } finally {
      setBlocking(false)
    }
  }

  useEffect(() => {
    if (!resolvedParams?.id) return

    const loadProfile = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await usersApi.getProfile(resolvedParams.id)
        setProfile(data.user)
        setRecentPosts(data.recentPosts)

        if (user?.id === resolvedParams.id) {
          const friendsData = await friendsApi.getFriends()
          setFriends(friendsData.friends.slice(0, 8))
        }
      } catch (err) {
        setError('Unable to load profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [resolvedParams?.id, user?.id])

  const coverUrl = profile?.coverPhoto ? avatarSrc(profile.coverPhoto) : undefined
  const avatarUrl = profile?.avatar ? avatarSrc(profile.avatar) : undefined

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header />

        {/* ── Block dialog ── */}
        <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
          <DialogContent showCloseButton={false} className="max-w-sm" aria-describedby="block-profile-description">
            <DialogHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-1">
                <UserX className="w-6 h-6 text-red-500" />
              </div>
              <DialogTitle className="text-center text-[17px]">Block {profileName}?</DialogTitle>
              <DialogDescription id="block-profile-description" className="text-center text-[14px]">
                You won&apos;t see posts from {profileName} anymore. They won&apos;t be able to see your posts or message you.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 sm:flex-row">
              <button
                onClick={() => setBlockOpen(false)}
                disabled={blocking}
                className="flex-1 py-2.5 rounded-xl bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-50 text-[#050505] text-[14px] font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={blocking}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {blocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                Block
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex w-full min-h-[calc(100vh-104px)] md:min-h-[calc(100vh-56px)]">
          {showLeft && (
            <div className="hidden md:flex w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          <main className="flex-1 min-w-0 py-5 px-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <ProfileHeader
                profileName={profileName}
                coverUrl={coverUrl}
                avatarUrl={avatarUrl}
                bio={profile?.bio ?? null}
                postsCount={profile?.postsCount ?? 0}
                friendsCount={profile?.friendsCount ?? 0}
                isSelfProfile={isSelfProfile}
                onBlockClick={() => setBlockOpen(true)}
              />
              <ProfileTabs activeTab={tab} onTabChange={setTab} />

              <div className="mt-5">
                {loading && (
                  <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] p-8 text-center text-[#65676b]">
                    Loading profile...
                  </div>
                )}

                {error && (
                  <div className="rounded-3xl bg-white dark:bg-[#242526] border border-red-200 text-red-700 p-6">
                    {error}
                  </div>
                )}

                {!loading && !error && (
                  <ProfileContent
                    tab={tab}
                    profile={profile}
                    recentPosts={recentPosts}
                    friends={friends}
                    isSelfProfile={isSelfProfile}
                  />
                )}
              </div>
            </div>
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

export default ProfilePage
