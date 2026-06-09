import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] p-6">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <WifiOff className="w-20 h-20 text-[#65676b] mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-[#050505] dark:text-[#e4e6eb] mb-3">
          You're offline
        </h1>
        <p className="text-[#65676b] dark:text-[#b0b3b8] mb-6">
          Check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
