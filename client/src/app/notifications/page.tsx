"use client"
import { useEffect, useRef, useState } from 'react'
import { Bell, Check, Filter, Loader2 } from 'lucide-react'
import ProtectedRoute  from '@/component/ProtectedRoute'
import Header          from '@/component/Header'
import LeftSidebar     from '@/component/LeftSidebar'
import RightSidebar    from '@/component/RightSidebar'
import NotificationItem from '@/component/notifications/NotificationItem'
import { notificationsApi, type NotificationRecord } from '@/lib/api'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'

type Filter = 'all' | 'unread'

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] shrink-0" />
    <div className="flex-1 space-y-2 pt-1">
      <div className="h-3.5 bg-[#e4e6eb] dark:bg-[#3a3b3c] rounded-full w-4/5" />
      <div className="h-3 bg-[#e4e6eb] dark:bg-[#3a3b3c] rounded-full w-1/4" />
    </div>
  </div>
)

const NotificationsPage = () => {
  const [items, setItems]       = useState<NotificationRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [marking, setMarking]   = useState(false)
  const [filter, setFilter]     = useState<Filter>('all')
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initialized             = useRef(false)
  const vw = useViewport()

  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  const fetchPage = async (pageNum: number, currentFilter: Filter, replace = false) => {
    pageNum === 1 ? setLoading(true) : setLoadingMore(true)
    try {
      const data = await notificationsApi.getAll({
        page: pageNum,
        limit: 20,
        unreadOnly: currentFilter === 'unread',
      })
      const incoming = data.notifications
      setItems(prev => replace ? incoming : [...prev, ...incoming])
      setHasMore(data.pagination.hasNextPage)
    } catch { /* silent */ } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    fetchPage(1, 'all', true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (f: Filter) => {
    setFilter(f)
    setPage(1)
    fetchPage(1, f, true)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPage(next, filter)
  }

  const handleRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id)
      setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* silent */ }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id)
      setItems(prev => prev.filter(n => n.id !== id))
    } catch { /* silent */ }
  }

  const handleMarkAll = async () => {
    setMarking(true)
    try {
      await notificationsApi.markAllRead()
      setItems(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* silent */ } finally { setMarking(false) }
  }

  const unreadCount = items.filter(n => !n.read).length

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
            <div className="max-w-4xl mx-auto">
              {/* Page header */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-[24px] font-bold text-[#050505] dark:text-[#e4e6eb]">Notifications</h1>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAll}
                    disabled={marking}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-[#1877f2] hover:bg-white dark:hover:bg-[#242526] rounded-xl transition-colors disabled:opacity-50"
                  >
                    {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 mb-4">
                {(['all', 'unread'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold transition-colors ${
                      filter === f
                        ? 'bg-[#e7f3ff] text-[#1877f2]'
                        : 'bg-white dark:bg-[#242526] text-[#65676b] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                    }`}
                  >
                    {f === 'unread' && <Filter className="w-3.5 h-3.5" />}
                    {f === 'all' ? 'All' : 'Unread'}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#ced0d4] dark:border-[#3e4042] overflow-hidden">
                {loading && (
                  <div className="divide-y divide-[#f0f2f5] dark:divide-[#3e4042]">
                    {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
                  </div>
                )}

                {!loading && items.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Bell className="w-12 h-12 text-[#bcc0c4]" />
                    <p className="text-[16px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                      {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                    </p>
                    <p className="text-[14px] text-[#65676b]">
                      {filter === 'unread' ? 'You have no unread notifications.' : 'When you get notifications, they\'ll appear here.'}
                    </p>
                  </div>
                )}

                {!loading && (
                  <div className="divide-y divide-[#f0f2f5] dark:divide-[#3e4042]">
                {items.map(n => (
                  <NotificationItem key={n.id} n={n} onRead={handleRead} onDelete={handleDelete} />
                  ))}
                </div>
              )}

              {hasMore && !loading && (
                <div className="p-3 border-t border-[#f0f2f5] dark:border-[#3e4042]">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-2.5 text-[14px] font-semibold text-[#1877f2] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
                  </button>
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

export default NotificationsPage
