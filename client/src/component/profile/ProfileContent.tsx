"use client"

import React from 'react'
import Image from 'next/image'
import { avatarSrc } from '@/component/feed/feedUtils'
import PostCard from '@/component/feed/PostCard'
import type { PostRecord } from '@/types'

type Tab = 'posts' | 'about' | 'friends' | 'photos'

interface ProfileData {
  bio: string | null
  createdAt: string
  friendsCount: number
  postsCount: number
  gender: string | null
  dob: string | null
}

interface FriendEntry {
  friendshipId: string
  friend: { id: string; firstName: string; lastName: string; avatar: string | null }
  since: string
}

interface Props {
  tab: Tab
  profile: ProfileData | null
  recentPosts: PostRecord[]
  friends: FriendEntry[]
  isSelfProfile: boolean
}

export const ProfileContent = ({ tab, profile, recentPosts, friends, isSelfProfile }: Props) => {
  const validRecentPosts = recentPosts.filter((post): post is PostRecord => Boolean(post && post.id && post.author))
  const photoPosts = validRecentPosts.filter((post) => Boolean(post.image))

  if (tab === 'posts') {
    return (
      <div className="space-y-4">
        {validRecentPosts.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] p-10 text-center text-[#65676b]">
            No posts yet.
          </div>
        ) : (
          validRecentPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    )
  }

  if (tab === 'about') {
    return (
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
    )
  }

  if (tab === 'friends') {
    return (
      <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-[#050505]">Friends</h2>
          <span className="text-[13px] text-[#65676b]">{profile?.friendsCount ?? 0} total</span>
        </div>

        {friends.length === 0 ? (
          <p className="text-[#65676b]">{isSelfProfile ? 'You have no friends yet.' : 'Friends are hidden from this profile.'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {friends.map((friendEntry) => (
              <div key={friendEntry.friend.id} className="flex items-center gap-3 p-4 rounded-3xl bg-[#f7f8f9] dark:bg-[#18191a]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#e4e6eb]">
                  {friendEntry.friend.avatar ? (
                    <img src={avatarSrc(friendEntry.friend.avatar)} alt="Friend avatar" className="object-cover w-full h-full" loading="lazy" />
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
    )
  }

  if (tab === 'photos') {
    return (
      <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] p-6 shadow-sm">
        <h2 className="text-[18px] font-semibold text-[#050505] mb-4">Photos</h2>
        {photoPosts.length === 0 ? (
          <p className="text-[#65676b]">No photo posts yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {photoPosts.map((post) => (
              <div key={post.id} className="overflow-hidden rounded-3xl bg-[#f0f2f5]">
                <Image src={avatarSrc(post.image)} alt="Post photo" width={400} height={176} className="object-cover w-full h-44" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
