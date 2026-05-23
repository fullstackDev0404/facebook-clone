import { MEDIA_BASE_URL } from '@/lib/api'

// Default avatar — a simple blue circle with a white person silhouette
// Using encodeURIComponent so special chars in the SVG are safe in a data-URI
const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="64" fill="#1877f2"/>
    <circle cx="64" cy="50" r="24" fill="white"/>
    <path d="M20 116c0-24.3 19.7-44 44-44s44 19.7 44 44" fill="white"/>
  </svg>`
)}`

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

/**
 * Build a URL for an avatar / story image.
 * - `null` / undefined → default-avatar SVG data-URI (no network request)
 * - Windows backslashes are normalised to forward slashes
 */
export const avatarSrc = (path: string | null): string => {
  if (!path) return DEFAULT_AVATAR
  const normalized = path.replaceAll('\\', '/')
  return `${MEDIA_BASE_URL}/${normalized}`
}
