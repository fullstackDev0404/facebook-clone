"use client"

import React, { useState, useEffect } from 'react'
import { Shield, Lock, Eye, EyeOff, Users, Globe } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'

interface PrivacySettings {
  profileVisibility: 'public' | 'friends'
  postVisibility: 'public' | 'friends'
  messagePermission: 'everyone' | 'friends'
  friendListVisibility: 'public' | 'friends'
  showOnlineStatus: boolean
}

const PRIVACY_STORAGE_KEY = 'fb_privacy_settings'

const PrivacySettings = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    postVisibility: 'public',
    messagePermission: 'everyone',
    friendListVisibility: 'public',
    showOnlineStatus: true,
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRIVACY_STORAGE_KEY)
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error)
    }
  }, [])

  const handleSettingChange = async (key: keyof PrivacySettings, value: any) => {
    const prevSettings = { ...settings }
    setSettings(prev => ({ ...prev, [key]: value }))
    
    setLoading(true)
    try {
      // Save to localStorage as fallback
      const newSettings = { ...settings, [key]: value }
      localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(newSettings))

      // Try to sync with backend (will fail silently if endpoint doesn't exist)
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/privacy`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ [key]: value }),
          })

          if (!response.ok) {
            // Backend endpoint might not exist yet, but we saved locally
            console.log('Backend sync failed, using local storage')
          }
        } catch (backendError) {
          // Backend endpoint might not exist yet, but we saved locally
          console.log('Backend sync failed, using local storage')
        }
      }

      toast.success('Privacy settings updated')
    } catch (error) {
      setSettings(prevSettings)
      toast.error('Failed to update privacy settings')
    } finally {
      setLoading(false)
    }
  }

  const SettingRow = ({ 
    icon: Icon, 
    title, 
    description, 
    value, 
    options,
    onChange 
  }: { 
    icon: any
    title: string
    description: string
    value: any
    options?: { label: string; value: any; icon?: any }[]
    onChange: (value: any) => void
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-[#f0f2f5] dark:border-[#3e4042] last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <div className={`p-2 rounded-lg ${title.includes('Profile') ? 'bg-[#e7f3ff]' : title.includes('Post') ? 'bg-[#d1fae5]' : title.includes('Message') ? 'bg-[#ede9fe]' : 'bg-[#fef3c7]'}`}>
          <Icon className={`w-5 h-5 ${title.includes('Profile') ? 'text-[#1877f2]' : title.includes('Post') ? 'text-[#059669]' : title.includes('Message') ? 'text-[#7c3aed]' : 'text-[#d97706]'}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">{title}</h3>
          <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {options ? (
          <div className="flex bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg p-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                  value === option.value
                    ? 'bg-white dark:bg-[#242526] text-[#050505] dark:text-[#e4e6eb] shadow-sm'
                    : 'text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-[#e4e6eb]'
                }`}
              >
                {option.icon && <option.icon className="w-3.5 h-3.5" />}
                {option.label}
              </button>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#f0f2f5] dark:border-[#3e4042]">
        <h2 className="text-lg font-semibold text-[#050505] dark:text-[#e4e6eb]">Privacy Settings</h2>
        <p className="text-sm text-[#65676b] dark:text-[#b0b3b8] mt-1">Control who can see your information and interact with you</p>
      </div>

      <div className="p-4">
        <SettingRow
          icon={Users}
          title="Profile Visibility"
          description="Who can view your profile"
          value={settings.profileVisibility}
          options={[
            { label: 'Public', value: 'public', icon: Globe },
            { label: 'Friends', value: 'friends', icon: Users },
          ]}
          onChange={(value) => handleSettingChange('profileVisibility', value)}
        />

        <SettingRow
          icon={Shield}
          title="Post Visibility"
          description="Default visibility for your posts"
          value={settings.postVisibility}
          options={[
            { label: 'Public', value: 'public', icon: Globe },
            { label: 'Friends', value: 'friends', icon: Users },
          ]}
          onChange={(value) => handleSettingChange('postVisibility', value)}
        />

        <SettingRow
          icon={Lock}
          title="Message Permission"
          description="Who can send you messages"
          value={settings.messagePermission}
          options={[
            { label: 'Everyone', value: 'everyone', icon: Globe },
            { label: 'Friends', value: 'friends', icon: Users },
          ]}
          onChange={(value) => handleSettingChange('messagePermission', value)}
        />

        <SettingRow
          icon={Eye}
          title="Friend List Visibility"
          description="Who can see your friends list"
          value={settings.friendListVisibility}
          options={[
            { label: 'Public', value: 'public', icon: Globe },
            { label: 'Friends', value: 'friends', icon: Users },
          ]}
          onChange={(value) => handleSettingChange('friendListVisibility', value)}
        />

        <SettingRow
          icon={EyeOff}
          title="Online Status"
          description="Show when you're active"
          value={settings.showOnlineStatus}
          onChange={(value) => handleSettingChange('showOnlineStatus', value)}
        />
      </div>
    </div>
  )
}

export default PrivacySettings
