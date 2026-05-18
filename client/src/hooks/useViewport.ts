import { useEffect, useState } from 'react'
import { BREAKPOINTS } from '@/lib/constants'

/** Returns current viewport width, updated on resize. */
export const useViewport = (): number => {
  const [vw, setVw] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.LARGE
  )

  useEffect(() => {
    const handler = () => setVw(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return vw
}

/** Fluid gutter: 272 px at ≥1600, shrinks to 0 at 1400. */
export const calcGutter = (vw: number): number => {
  if (vw >= BREAKPOINTS.LARGE)   return 272
  if (vw <= BREAKPOINTS.DESKTOP) return 0
  return Math.round(((vw - BREAKPOINTS.DESKTOP) / 200) * 272)
}
