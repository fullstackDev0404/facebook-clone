"use client"
import { useEffect, useRef, useState } from 'react'
import { Bell, Check, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { notificationsApi, type NotificationRecord } from '@/lib/api'
import NotificationItem from './NotificationItem'

interface Props {
  onClose: () => void
  panelRef: React.RefObject<HTMLDivElement | null>
}

const NotificationsPanel = ({ onClose, panelRef }: Props) => {
  const router = useRouter()
  const [items, setItems]     = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    notificationsApi.getAll({ limit: 20 })
      .then(d => setItems(d.notifications))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-[#242526] rounded-2xl z-50 overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f2f5] dark:border-[#3e4042]">
        <h3 className="font-bold text-[18px] text-[#050505] dark:text-[#e4e6eb]">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} disabled={marking}
              className="text-[13px] text-[#1877f2] font-medium hover:underline disabled:opacity-50 flex items-center gap-1">
              {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors">
            <X className="w-4 h-4 text-[#65676b]" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-120 overflow-y-auto p-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#1877f2]" />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Bell className="w-10 h-10 text-[#bcc0c4]" />
            <p className="text-[14px] text-[#65676b]">No notifications yet.</p>
          </div>
        )}
        {!loading && items.map(n => (
          <NotificationItem key={n.id} n={n} onRead={handleRead} onDelete={handleDelete} compact />
        ))}
      </div>

      {/* Footer */}
      {!loading && items.length > 0 && (
        <div className="border-t border-[#f0f2f5] dark:border-[#3e4042] p-2">
          <button
            onClick={() => { onClose(); router.push('/notifications') }}
            className="w-full py-2 text-[14px] font-semibold text-[#1877f2] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-xl transition-colors"
          >
            See all notifications
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel
