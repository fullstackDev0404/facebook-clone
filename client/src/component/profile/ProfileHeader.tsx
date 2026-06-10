"use client"

import React from 'react'
import Image from 'next/image'
import { UserX } from 'lucide-react'
import { avatarSrc } from '@/component/feed/feedUtils'

interface Props {
  profileName: string
  coverUrl: string | undefined
  avatarUrl: string | undefined
  bio: string | null
  postsCount: number
  friendsCount: number
  isSelfProfile: boolean
  onBlockClick: () => void
}

export const ProfileHeader = ({ profileName, coverUrl, avatarUrl, bio, postsCount, friendsCount, isSelfProfile, onBlockClick }: Props) => {
  return (
    <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] shadow-sm">
      <div className="relative h-56 bg-[#e4e6eb] dark:bg-[#1f1f1f]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt="Cover photo"
            width={1200}
            height={224}
            className="object-cover w-full h-full"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1877f2] via-[#3b82f6] to-[#85d7ff]" />
        )}
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <div className="relative -mb-12">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#18191a] overflow-hidden bg-[#f0f2f5] shadow-xl">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="object-cover w-full h-full" priority />
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
              {bio || 'No bio yet.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 rounded-full bg-[#f0f2f5] dark:bg-[#242526] text-[#050505] text-[13px] font-semibold">
              {postsCount} posts
            </span>
            <span className="px-3 py-2 rounded-full bg-[#f0f2f5] dark:bg-[#242526] text-[#050505] text-[13px] font-semibold">
              {friendsCount} friends
            </span>
            {isSelfProfile && (
              <span className="px-3 py-2 rounded-full bg-[#e7f3ff] text-[#1877f2] text-[13px] font-semibold">
                Your profile
              </span>
            )}
            {!isSelfProfile && (
              <button
                onClick={onBlockClick}
                className="px-3 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 text-[13px] font-semibold transition-colors flex items-center gap-1"
              >
                <UserX className="w-3.5 h-3.5" />
                Block
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
