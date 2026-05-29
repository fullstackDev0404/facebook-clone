"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import ProtectedRoute from '@/component/ProtectedRoute'
import PostCard from '@/component/feed/PostCard'
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
  const validRecentPosts = recentPosts.filter((post): post is PostRecord => Boolean(post && post.id && post.author))
  const photoPosts = validRecentPosts.filter((post) => Boolean(post.image))

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

        <div className="flex pt-14 w-full min-h-[calc(100vh-56px)]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] shadow-sm">
                <div className="relative h-56 bg-[#e4e6eb] dark:bg-[#1f1f1f]">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Cover photo"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#1877f2] via-[#3b82f6] to-[#85d7ff]" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center">
                    <div className="relative -mb-12">
                      <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#18191a] overflow-hidden bg-[#f0f2f5] shadow-xl">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-[#1877f2] text-white text-2xl font-bold">
                            {profileName.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pt-16 pb-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h1 className="text-[28px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                        {profileName || 'Loading...'}
                      </h1>
                      <p className="text-[14px] text-[#65676b] mt-1">
                        {profile?.bio || 'No bio yet.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-2 rounded-full bg-[#f0f2f5] dark:bg-[#242526] text-[#050505] text-[13px] font-semibold">
                        {profile?.postsCount ?? 0} posts
                      </span>
                      <span className="px-3 py-2 rounded-full bg-[#f0f2f5] dark:bg-[#242526] text-[#050505] text-[13px] font-semibold">
                        {profile?.friendsCount ?? 0} friends
                      </span>
                      {isSelfProfile && (
                        <span className="px-3 py-2 rounded-full bg-[#e7f3ff] text-[#1877f2] text-[13px] font-semibold">
                          Your profile
                        </span>
                      )}
                      {!isSelfProfile && (
                        <button
                          onClick={() => setBlockOpen(true)}
                          className="px-3 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 text-[13px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Block
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['posts', 'about', 'friends', 'photos'] as Tab[]).map((item) => (
                      <button
                        key={item}
                        onClick={() => setTab(item)}
                        className={`py-3 rounded-2xl text-[14px] font-semibold transition-colors ${tab === item ? 'bg-[#e7f3ff] text-[#1877f2]' : 'bg-[#f7f8f9] dark:bg-[#18191a] text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#242526]'}`}
                      >
                        {item === 'posts' ? 'Posts' : item === 'about' ? 'About' : item === 'friends' ? 'Friends' : 'Photos'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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
                  <div className="space-y-5">
                    {tab === 'posts' && (
                      <div className="space-y-4">
                        {validRecentPosts.length === 0 ? (
                          <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] p-10 text-center text-[#65676b]">
                            No posts yet.
                          </div>
                        ) : (
                          validRecentPosts.map((post) => <PostCard key={post.id} post={post} />)
                        )}
                      </div>
                    )}

                    {tab === 'about' && (
                      <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] p-6 shadow-sm">
                        <h2 className="text-[18px] font-semibold text-[#050505] mb-4">About</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-[13px] uppercase tracking-[0.2em] text-[#65676b] mb-2">Bio</p>
                            <p className="text-[15px] text-[#050505]">{profile?.bio || 'No details shared yet.'}</p>
                          </div>
                          <div>
                            <p className="text-[13px] uppercase tracking-[0.2em] text-[#65676b] mb-2">Details</p>
                            <div className="space-y-2 text-[15px] text-[#050505]">
                              <p><span className="font-semibold">Joined:</span> {new Date(profile?.createdAt ?? '').toLocaleDateString()}</p>
                              <p><span className="font-semibold">Friends:</span> {profile?.friendsCount ?? 0}</p>
                              <p><span className="font-semibold">Posts:</span> {profile?.postsCount ?? 0}</p>
                              {profile?.gender && <p><span className="font-semibold">Gender:</span> {profile.gender}</p>}
                              {profile?.dob && <p><span className="font-semibold">Birthday:</span> {new Date(profile.dob).toLocaleDateString()}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {tab === 'friends' && (
                      <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-[18px] font-semibold text-[#050505]">Friends</h2>
                          <span className="text-[13px] text-[#65676b">{profile?.friendsCount ?? 0} total</span>
                        </div>

                        {friends.length === 0 ? (
                          <p className="text-[#65676b]">{isSelfProfile ? 'You have no friends yet.' : 'Friends are hidden from this profile.'}</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {friends.map((friendEntry) => (
                              <div key={friendEntry.friend.id} className="flex items-center gap-3 p-4 rounded-3xl bg-[#f7f8f9] dark:bg-[#18191a]">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#e4e6eb]">
                                  {friendEntry.friend.avatar ? (
                                    <img src={avatarSrc(friendEntry.friend.avatar)} alt="Friend avatar" className="object-cover w-full h-full" />
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full text-[#1877f2] font-semibold text-lg bg-white">
                                      {friendEntry.friend.firstName[0]}{friendEntry.friend.lastName[0]}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#050505]">{friendEntry.friend.firstName} {friendEntry.friend.lastName}</p>
                                  <p className="text-[13px] text-[#65676b]">Friends since {new Date(friendEntry.since).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {tab === 'photos' && (
                      <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] p-6 shadow-sm">
                        <h2 className="text-[18px] font-semibold text-[#050505] mb-4">Photos</h2>
                        {photoPosts.length === 0 ? (
                          <p className="text-[#65676b]">No photo posts yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {photoPosts.map((post) => (
                              <div key={post.id} className="overflow-hidden rounded-3xl bg-[#f0f2f5]">
                                <img src={avatarSrc(post.image)} alt="Post photo" className="object-cover w-full h-44" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>

          {showRight && <RightSidebar />}
          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default ProfilePage
