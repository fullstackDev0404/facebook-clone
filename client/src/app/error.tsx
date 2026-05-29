"use client"

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18191a]">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-[#050505] dark:text-[#e4e6eb] mb-4">
          Something went wrong!
        </h2>
        <p className="text-[#65676b] dark:text-[#b0b3b8] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <Button
          onClick={reset}
          className="bg-[#1877f2] hover:bg-[#166fe5] text-white"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
