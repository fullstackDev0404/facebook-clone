"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Bell, Check, Loader2, Trash2, X } from 'lucide-react'
import { notificationsApi, type NotificationRecord } from '@/lib/api'

// ─── Icon map per notification type ──────────────────────────────────────────
const TYPE_STYLES: Record<string, { emoji: string; bg: string }> = {
  like:           { emoji: '👍', bg: 'bg-[#1877f2]' },
  comment:        { emoji: '💬', bg: 'bg-[#45bd62]' },
  friend_request: { emoji: '👤', bg: 'bg-[#f59e0b]' },
  friend_accept:  { emoji: '🤝', bg: 'bg-[#059669]' },
  message:        { emoji: '✉️', bg: 'bg-[#e15241]' },
}

const timeAgo = (iso: string): string => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Single notification row ──────────────────────────────────────────────────
interface RowProps {
  n: NotificationRecord
  onRead:   (id: string) => void
  onDelete: (id: string) => void
}

const NotificationRow = ({ n, onRead, onDelete }: RowProps) => {
  const style = TYPE_STYLES[n.type] ?? { emoji: '🔔', bg: 'bg-[#65676b]' }

  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
      n.read ? 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]' : 'bg-[#e7f3ff] dark:bg-[#263951] hover:bg-[#dce9f9] dark:hover:bg-[#1e3048]'
    }`}>
      {/* Type icon */}
      <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center text-lg shrink-0`}>
        {style.emoji}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug ${n.read ? 'text-[#65676b] dark:text-[#b0b3b8]' : 'text-[#050505] dark:text-[#e4e6eb] font-medium'}`}>
          {n.message}
        </p>
        <p className={`text-[11px] mt-0.5 ${n.read ? 'text-[#8a8d91]' : 'text-[#1877f2] font-semibold'}`}>
          {timeAgo(n.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!n.read && (
          <button onClick={() => onRead(n.id)} title="Mark as read"
            className="p-1.5 hover:bg-[#1877f2]/10 rounded-full transition-colors">
            <Check className="w-3.5 h-3.5 text-[#1877f2]" />
          </button>
        )}
        <button onClick={() => onDelete(n.id)} title="Delete"
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-[#65676b] hover:text-red-500" />
        </button>
      </div>
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────
interface PanelProps { onClose: () => void }

const NotificationsPanel = ({ onClose }: PanelProps) => {
  const [items, setItems]       = useState<NotificationRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [marking, setMarking]   = useState(false)
  const panelRef                = useRef<HTMLDivElement>(null)

  useEffect(() => {
    notificationsApi.getAll({ limit: 30 })
      .then(d => setItems(d.notifications))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

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
      <div className="max-h-[480px] overflow-y-auto p-2">
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
          <NotificationRow key={n.id} n={n} onRead={handleRead} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )
}

export default NotificationsPanel
