// ─── App-wide constants ───────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export const MEDIA_BASE_URL =
  API_BASE_URL.replace('/api', '')

export const STORAGE_KEYS = {
  TOKEN: 'fb_token',
  USER:  'fb_user',
} as const

export const BREAKPOINTS = {
  MOBILE:  768,
  TABLET:  1024,
  DESKTOP: 1400,
  LARGE:   1600,
} as const

export const SIDEBAR = {
  LEFT_WIDTH:   240, // px — w-60
  DRAWER_WIDTH: 288, // px — w-72
  RIGHT_WIDTH:  288, // px — w-72
  MAX_GUTTER:   272, // px
} as const

export const HEADER_HEIGHT = 56 // px — h-14

export const FB_BLUE   = '#1877f2'
export const FB_GREEN  = '#42b72a'
export const FB_GRAY   = '#65676b'
export const FB_BG     = '#f0f2f5'
export const FB_DARK   = '#050505'
export const FB_BORDER = '#dddfe2'
