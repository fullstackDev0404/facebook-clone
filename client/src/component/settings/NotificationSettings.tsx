"use client"

import React, { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Volume2, VolumeX, Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'

interface NotificationSettings {
  pushEnabled: boolean
  emailEnabled: boolean
  inAppEnabled: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  notifications: {
    likes: boolean
    comments: boolean
    friendRequests: boolean
    mentions: boolean
    messages: boolean
  }
}

const NOTIFICATION_STORAGE_KEY = 'fb_notification_settings'

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: false,
    inAppEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    notifications: {
      likes: true,
      comments: true,
      friendRequests: true,
      mentions: true,
      messages: true,
    },
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }, [])

  const handleSettingChange = async (key: keyof NotificationSettings, value: any) => {
    const prevSettings = { ...settings }
    setSettings(prev => ({ ...prev, [key]: value }))
    
    setLoading(true)
    try {
      // Save to localStorage as fallback
      const newSettings = { ...settings, [key]: value }
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newSettings))

      // Try to sync with backend (will fail silently if endpoint doesn't exist)
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/notifications`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ [key]: value }),
          })

          if (!response.ok) {
            console.log('Backend sync failed, using local storage')
          }
        } catch (backendError) {
          console.log('Backend sync failed, using local storage')
        }
      }

      toast.success('Notification settings updated')
    } catch (error) {
      setSettings(prevSettings)
      toast.error('Failed to update notification settings')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationTypeChange = async (type: keyof NotificationSettings['notifications'], value: boolean) => {
    const prevSettings = { ...settings }
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: value }
    }))
    
    setLoading(true)
    try {
      // Save to localStorage as fallback
      const newSettings = {
        ...settings,
        notifications: { ...settings.notifications, [type]: value }
      }
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newSettings))

      // Try to sync with backend
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/notifications`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ notifications: { [type]: value } }),
          })

          if (!response.ok) {
            console.log('Backend sync failed, using local storage')
          }
        } catch (backendError) {
          console.log('Backend sync failed, using local storage')
        }
      }

      toast.success('Notification settings updated')
    } catch (error) {
      setSettings(prevSettings)
      toast.error('Failed to update notification settings')
    } finally {
      setLoading(false)
    }
  }

  const ToggleRow = ({ 
    icon: Icon, 
    title, 
    description, 
    value, 
    onChange,
    iconBgColor = 'bg-[#ede9fe]',
    iconColor = 'text-[#7c3aed]'
  }: { 
    icon: any
    title: string
    description: string
    value: boolean
    onChange: (value: boolean) => void
    iconBgColor?: string
    iconColor?: string
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-[#f0f2f5] dark:border-[#3e4042] last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">{title}</h3>
          <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value ? 'bg-[#1877f2]' : 'bg-[#ccc]'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            value ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  )

  const NotificationTypeRow = ({ 
    icon: Icon, 
    title, 
    value, 
    onChange 
  }: { 
    icon: any
    title: string
    value: boolean
    onChange: (value: boolean) => void
  }) => (
    <div className="flex items-center justify-between py-3 px-4 bg-[#f7f8fa] dark:bg-[#2a2b2c] rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-[#65676b] dark:text-[#b0b3b8]" />
        <span className="text-[14px] text-[#050505] dark:text-[#e4e6eb]">{title}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        disabled={loading}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          value ? 'bg-[#1877f2]' : 'bg-[#ccc]'
        }`}
      >
        <span
          className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${
            value ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#f0f2f5] dark:border-[#3e4042]">
        <h2 className="text-lg font-semibold text-[#050505] dark:text-[#e4e6eb]">Notification Settings</h2>
        <p className="text-sm text-[#65676b] dark:text-[#b0b3b8] mt-1">Manage how you receive notifications</p>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-[#65676b] dark:text-[#b0b3b8] mb-3 uppercase tracking-wide">Delivery Methods</h3>
        
        <ToggleRow
          icon={Smartphone}
          title="Push Notifications"
          description="Receive notifications on your device"
          value={settings.pushEnabled}
          onChange={(value) => handleSettingChange('pushEnabled', value)}
          iconBgColor="bg-[#dbeafe]"
          iconColor="text-[#2563eb]"
        />

        <ToggleRow
          icon={Mail}
          title="Email Notifications"
          description="Receive notifications via email"
          value={settings.emailEnabled}
          onChange={(value) => handleSettingChange('emailEnabled', value)}
          iconBgColor="bg-[#fce7f3]"
          iconColor="text-[#db2777]"
        />

        <ToggleRow
          icon={Bell}
          title="In-App Notifications"
          description="Show notifications within the app"
          value={settings.inAppEnabled}
          onChange={(value) => handleSettingChange('inAppEnabled', value)}
          iconBgColor="bg-[#ede9fe]"
          iconColor="text-[#7c3aed]"
        />

        <div className="my-6 border-t border-[#f0f2f5] dark:border-[#3e4042]" />

        <h3 className="text-sm font-semibold text-[#65676b] dark:text-[#b0b3b8] mb-3 uppercase tracking-wide">Sound & Vibration</h3>

        <ToggleRow
          icon={Volume2}
          title="Notification Sound"
          description="Play sound for notifications"
          value={settings.soundEnabled}
          onChange={(value) => handleSettingChange('soundEnabled', value)}
          iconBgColor="bg-[#fef3c7]"
          iconColor="text-[#d97706]"
        />

        <ToggleRow
          icon={VolumeX}
          title="Vibration"
          description="Vibrate for notifications"
          value={settings.vibrationEnabled}
          onChange={(value) => handleSettingChange('vibrationEnabled', value)}
          iconBgColor="bg-[#d1fae5]"
          iconColor="text-[#059669]"
        />

        <div className="my-6 border-t border-[#f0f2f5] dark:border-[#3e4042]" />

        <h3 className="text-sm font-semibold text-[#65676b] dark:text-[#b0b3b8] mb-3 uppercase tracking-wide">Notification Types</h3>

        <div className="space-y-2">
          <NotificationTypeRow
            icon={Heart}
            title="Likes"
            value={settings.notifications.likes}
            onChange={(value) => handleNotificationTypeChange('likes', value)}
          />

          <NotificationTypeRow
            icon={MessageCircle}
            title="Comments"
            value={settings.notifications.comments}
            onChange={(value) => handleNotificationTypeChange('comments', value)}
          />

          <NotificationTypeRow
            icon={UserPlus}
            title="Friend Requests"
            value={settings.notifications.friendRequests}
            onChange={(value) => handleNotificationTypeChange('friendRequests', value)}
          />

          <NotificationTypeRow
            icon={AtSign}
            title="Mentions"
            value={settings.notifications.mentions}
            onChange={(value) => handleNotificationTypeChange('mentions', value)}
          />

          <NotificationTypeRow
            icon={MessageCircle}
            title="Messages"
            value={settings.notifications.messages}
            onChange={(value) => handleNotificationTypeChange('messages', value)}
          />
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings
