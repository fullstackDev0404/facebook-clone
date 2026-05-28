"use client"
import { useEffect, useState } from 'react'
import { BarChart3, MessageSquare, Heart, Users, TrendingUp } from 'lucide-react'
import { analyticsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/component/ProtectedRoute'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'

interface OverviewData {
  overview: {
    postsCount: number
    commentsCount: number
    likesGiven: number
    friendsCount: number
  }
  recentActivity: Record<string, number>
}

const AnalyticsPage = () => {
  const { user } = useAuth()
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const vw = useViewport()

  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await analyticsApi.overview()
        setOverview(data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
          <Header onMenuClick={() => setDrawerOpen(o => !o)} />
          <div className="flex pt-14 w-full min-h-[calc(100vh-56px)]">
            <main className="flex-1 min-w-0 py-5 px-4 sm:px-6 overflow-y-auto">
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const stats = [
    { label: 'Posts', value: overview?.overview.postsCount || 0, icon: BarChart3, color: 'bg-blue-500' },
    { label: 'Comments', value: overview?.overview.commentsCount || 0, icon: MessageSquare, color: 'bg-green-500' },
    { label: 'Likes Given', value: overview?.overview.likesGiven || 0, icon: Heart, color: 'bg-red-500' },
    { label: 'Friends', value: overview?.overview.friendsCount || 0, icon: Users, color: 'bg-purple-500' },
  ]

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header onMenuClick={() => setDrawerOpen(o => !o)} />

        <div className="flex pt-14 w-full min-h-[calc(100vh-56px)]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          {/* Mobile drawer */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
              drawerOpen && !showLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setDrawerOpen(false)}
          />
          <div className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-[#242526] shadow-2xl transition-transform duration-300 ease-in-out ${
            drawerOpen && !showLeft ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <LeftSidebar onClose={() => setDrawerOpen(false)} showCloseButton />
          </div>

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb] mb-2">Analytics Dashboard</h1>
                <p className="text-[#65676b] dark:text-[#b0b3b8]">Track your activity and engagement</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <TrendingUp className="w-5 h-5 text-[#65676b] dark:text-[#b0b3b8]" />
                    </div>
                    <h3 className="text-3xl font-bold text-[#050505] dark:text-[#e4e6eb] mb-1">{stat.value}</h3>
                    <p className="text-sm text-[#65676b] dark:text-[#b0b3b8]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-[#242526] rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#050505] dark:text-[#e4e6eb] mb-4">Recent Activity (Last 7 Days)</h2>
                {overview?.recentActivity && Object.keys(overview.recentActivity).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(overview.recentActivity).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between p-3 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg">
                        <span className="text-[#050505] dark:text-[#e4e6eb] capitalize">{action.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-[#1877f2]">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#65676b] dark:text-[#b0b3b8]">No recent activity</p>
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

export default AnalyticsPage
