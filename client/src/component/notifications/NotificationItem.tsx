import { Check, Trash2 } from 'lucide-react'
import type { NotificationRecord } from '@/lib/api'

const TYPE_STYLES: Record<string, { emoji: string; bg: string }> = {
  like:           { emoji: '👍', bg: 'bg-[#1877f2]' },
  comment:        { emoji: '💬', bg: 'bg-[#45bd62]' },
  friend_request: { emoji: '👤', bg: 'bg-[#f59e0b]' },
  friend_accept:  { emoji: '🤝', bg: 'bg-[#059669]' },
  message:        { emoji: '✉️', bg: 'bg-[#e15241]' },
}

export const timeAgo = (iso: string): string => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

interface Props {
  n: NotificationRecord
  onRead:   (id: string) => void
  onDelete: (id: string) => void
  compact?: boolean
}

const NotificationItem = ({ n, onRead, onDelete, compact = false }: Props) => {
  const style = TYPE_STYLES[n.type] ?? { emoji: '🔔', bg: 'bg-[#65676b]' }

  return (
    <div className={`flex items-start gap-3 rounded-xl transition-colors group cursor-pointer ${
      compact ? 'px-3 py-2.5' : 'px-4 py-3'
    } ${
      n.read
        ? 'hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
        : 'bg-[#e7f3ff] dark:bg-[#263951] hover:bg-[#dce9f9] dark:hover:bg-[#1e3048]'
    }`}>
      {/* Icon */}
      <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full ${style.bg} flex items-center justify-center ${compact ? 'text-lg' : 'text-xl'} shrink-0`}>
        {style.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`leading-snug ${compact ? 'text-[13px]' : 'text-[14px]'} ${
          n.read ? 'text-[#65676b] dark:text-[#b0b3b8]' : 'text-[#050505] dark:text-[#e4e6eb] font-medium'
        }`}>
          {n.message}
        </p>
        <p className={`mt-0.5 ${compact ? 'text-[11px]' : 'text-[12px]'} ${
          n.read ? 'text-[#8a8d91]' : 'text-[#1877f2] font-semibold'
        }`}>
          {timeAgo(n.createdAt)}
        </p>
      </div>

      {/* Unread dot (full page only) */}
      {!compact && !n.read && (
        <div className="w-3 h-3 rounded-full bg-[#1877f2] shrink-0 mt-1" />
      )}

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!n.read && (
          <button
            onClick={e => { e.stopPropagation(); onRead(n.id) }}
            title="Mark as read"
            className="p-1.5 hover:bg-[#1877f2]/10 rounded-full transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-[#1877f2]" />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(n.id) }}
          title="Delete"
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#65676b]" />
        </button>
      </div>
    </div>
  )
}

export default NotificationItem
