"use client"
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, X, Save } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'

const getInitials = (name: string) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

export default function EditProfilePage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be less than 5MB' })
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setMessage({ type: '', text: '' })
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })

      // Prepare form data for multipart upload
      const data = new FormData()
      
      // Add text fields only if changed
      if (formData.firstName !== user?.firstName) data.append('firstName', formData.firstName)
      if (formData.lastName !== user?.lastName) data.append('lastName', formData.lastName)
      if (formData.bio !== user?.bio) data.append('bio', formData.bio)
      
      // Add avatar if changed
      if (avatarFile) {
        data.append('avatar', avatarFile)
      }

      // Only send if there are actual changes
      if (data.entries().next().done && !avatarFile) {
        setMessage({ type: 'info', text: 'No changes to save' })
        return
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
        },
        body: data
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedUser = await response.json()
      login(updatedUser.user, localStorage.getItem(STORAGE_KEYS.TOKEN) || '')
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      setTimeout(() => {
        router.push(`/profile/${updatedUser.user.id}`)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const currentInitials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#242526] border-b border-[#dddfe2] dark:border-[#3e4042] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-[#050505] dark:text-[#e4e6eb]">Edit Profile</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Avatar Section */}
        <div className="bg-white dark:bg-[#242526] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-[#050505] dark:text-[#e4e6eb] mb-4">Profile Picture</h2>
          
          <div className="flex items-center gap-6">
            {/* Avatar Display */}
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="bg-[#1877f2] text-white text-3xl font-bold">
                  {currentInitials}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload Button */}
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 w-10 h-10 bg-[#1877f2] rounded-full flex items-center justify-center text-white hover:bg-[#165ec7] transition-colors shadow-lg"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-[14px] text-[#65676b] dark:text-[#b0b3b8] mb-3">
                Upload a JPG, GIF or PNG. Max file size 5MB.
              </p>
              
              {avatarPreview && (
                <button
                  onClick={removeAvatar}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-[14px] font-medium"
                >
                  <X className="w-4 h-4" />
                  Remove Avatar
                </button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Basic Info Section */}
        <div className="bg-white dark:bg-[#242526] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-[#050505] dark:text-[#e4e6eb] mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-[14px] font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#dddfe2] dark:border-[#3e4042] rounded-lg text-[#050505] dark:text-[#e4e6eb] focus:outline-none focus:border-[#1877f2]"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-[14px] font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#dddfe2] dark:border-[#3e4042] rounded-lg text-[#050505] dark:text-[#e4e6eb] focus:outline-none focus:border-[#1877f2]"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[14px] font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                rows={4}
                className="w-full px-4 py-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#dddfe2] dark:border-[#3e4042] rounded-lg text-[#050505] dark:text-[#e4e6eb] focus:outline-none focus:border-[#1877f2] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-2.5 bg-[#e4e6eb] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] font-semibold rounded-lg hover:bg-[#d0d2d7] dark:hover:bg-[#4a4c50] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1877f2] text-white font-semibold rounded-lg hover:bg-[#165ec7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
