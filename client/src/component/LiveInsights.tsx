"use client"

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Bell, PlusCircle, Users, Wifi } from 'lucide-react'
import { connectSocket } from '@/lib/socket'
import { notificationsApi } from '@/lib/api'

const BUCKET_COUNT = 6

const LiveInsights = () => {
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [signupsLastHour, setSignupsLastHour] = useState(0)
  const [signupHistory, setSignupHistory] = useState<number[]>(Array(BUCKET_COUNT).fill(0))
  const [unreadCount, setUnreadCount] = useState(0)

  const chartValues = useMemo(() => {
    const values = signupHistory.slice(-BUCKET_COUNT)
    return Array.from({ length: BUCKET_COUNT }, (_, index) => values[index] ?? 0)
  }, [signupHistory])

  useEffect(() => {
    notificationsApi.getAll({ limit: 1 })
      .then(data => setUnreadCount(data.unreadCount))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const socket = connectSocket()
    if (!socket) return

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)

    const handleDashboard = (payload: any) => {
      if (payload?.onlineUsers !== undefined) setOnlineUsers(payload.onlineUsers)
      if (payload?.signupsLastHour !== undefined) setSignupsLastHour(payload.signupsLastHour)
      if (Array.isArray(payload.signupHistory)) setSignupHistory(payload.signupHistory)
      if (payload?.unreadCount !== undefined) setUnreadCount(payload.unreadCount)
    }

    const handleNotification = (payload: any) => {
      if (payload?.unreadCount !== undefined) {
        setUnreadCount(payload.unreadCount)
      } else {
        setUnreadCount(prev => prev + 1)
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('dashboard:update', handleDashboard)
    socket.on('notification:unread_count', handleNotification)
    socket.on('notification:new', handleNotification)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('dashboard:update', handleDashboard)
      socket.off('notification:unread_count', handleNotification)
      socket.off('notification:new', handleNotification)
    }
  }, [])

  const maxChartValue = Math.max(...chartValues, 1)

  return (
    <section className="mb-5 rounded-3xl border border-[#d8dce7] bg-white/90 p-4 shadow-sm shadow-[#0000000d] dark:border-[#3e4042] dark:bg-[#242526]/95">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#65676b] dark:text-[#b0b3b8]">Live insights</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[#050505] dark:text-[#e4e6eb]">Realtime site health</h2>
          <p className="mt-2 max-w-2xl text-[14px] text-[#65676b] dark:text-[#b0b3b8]">
            Live charting, online user count, signups, and notification status update automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-2xl bg-[#f0f2f5] dark:bg-[#323436] px-3 py-2">
            <Wifi className="w-4 h-4 text-[#1877f2]" />
            <div>
              <p className="text-xs text-[#65676b] dark:text-[#b0b3b8]">Connection</p>
              <p className={`text-sm font-semibold ${connected ? 'text-[#1877f2]' : 'text-[#65676b]'}`}>
                {connected ? 'Live' : 'Disconnected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-[#f0f2f5] dark:bg-[#323436] px-3 py-2">
            <Users className="w-4 h-4 text-[#1877f2]" />
            <div>
              <p className="text-xs text-[#65676b] dark:text-[#b0b3b8]">Online users</p>
              <p className="text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">{onlineUsers}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-[#f0f2f5] dark:bg-[#323436] px-3 py-2">
            <PlusCircle className="w-4 h-4 text-[#1877f2]" />
            <div>
              <p className="text-xs text-[#65676b] dark:text-[#b0b3b8]">New signups</p>
              <p className="text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">{signupsLastHour}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-[#f0f2f5] dark:bg-[#323436] px-3 py-2">
            <Bell className="w-4 h-4 text-[#1877f2]" />
            <div>
              <p className="text-xs text-[#65676b] dark:text-[#b0b3b8]">Unread notifications</p>
              <p className="text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">{unreadCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-[#f8f9fb] dark:bg-[#1f2023] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#65676b] dark:text-[#b0b3b8] text-[13px]">
            <BarChart3 className="w-4 h-4" />
            <span>Signups chart</span>
          </div>
          <span className="text-[12px] uppercase tracking-[0.18em] text-[#8f95a1]">Last 30 min</span>
        </div>

        <div className="mt-4 flex items-end gap-2 h-24">
          {chartValues.map((value, idx) => (
            <div key={idx} className="flex-1 rounded-full bg-[#dce2ef] dark:bg-[#2d2f33]">
              <div
                className="h-full rounded-full bg-[#1877f2] transition-all"
                style={{ height: `${Math.max(8, (value / maxChartValue) * 100)}%` }}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
          <span>Zero</span>
          <span>{Math.max(...chartValues)} signups</span>
        </div>
      </div>
    </section>
  )
}

export default LiveInsights
