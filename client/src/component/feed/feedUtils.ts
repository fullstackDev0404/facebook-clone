import { MEDIA_BASE_URL } from '@/lib/api'

export const timeAgo = (iso: string): string => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export const initials = (first: string, last: string): string =>
  `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()

export const avatarSrc = (path: string | null): string | undefined =>
  path ? `${MEDIA_BASE_URL}/${path}` : undefined

export const STORIES = [
  { name: 'Your Story', fallback: 'Y',  color: 'from-blue-500 to-blue-600',    isCreate: true  },
  { name: 'Alice J.',   fallback: 'AJ', color: 'from-pink-500 to-rose-500',    isCreate: false },
  { name: 'Bob S.',     fallback: 'BS', color: 'from-emerald-500 to-green-600', isCreate: false },
  { name: 'Carol W.',   fallback: 'CW', color: 'from-violet-500 to-purple-600', isCreate: false },
  { name: 'David L.',   fallback: 'DL', color: 'from-orange-400 to-amber-500',  isCreate: false },
] as const
