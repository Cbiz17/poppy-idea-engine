'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Shield, 
  Save, 
  Lock,
  Sparkles,
  Layout,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface ProfileClientProps {
  user: User
  profile: any
  stats: {
    ideas: number
    conversations: number
  }
}

export default function ProfileClient({ user, profile, stats }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleUpdateProfile = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)
    
    // Validation
    if (!passwords.new || passwords.new.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    
    if (passwords.new !== passwords.confirm) {
      setPasswordError('Passwords do not match')
      return
    }

    setIsChangingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setShowPasswordChange(false)
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error: any) {
      console.error('Error changing password:', error)
      setPasswordError(error.message || 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isEmailUser = user.app_metadata.provider === 'email'
  const isEmailVerified = user.email_confirmed_at !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Chat
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Your Profile</h1>
          </div>
          
          <Link 
            href="/ideas"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Layout className="w-4 h-4" /> 
            Idea Gallery
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Info Card */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-purple-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Profile Picture</p>
                  {user.app_metadata.provider === 'google' && (
                    <p className="text-xs text-gray-400 mt-1">Synced from Google</p>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-900">
                    {profile?.full_name || 'Not set'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{user.email}</p>
                  {isEmailVerified ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{formatDate(user.created_at)}</p>
                </div>
              </div>

              {/* Auth Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sign-in Method
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900 capitalize">{user.app_metadata.provider}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setFullName(profile?.full_name || '')
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ideas Created</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.ideas}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Conversations</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.conversations}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Section - Only for email users */}
        {isEmailUser && (
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Security</h3>
              {!showPasswordChange && (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordChange ? (
              <div className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{passwordError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirm your new password"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordChange(false)
                      setPasswords({ current: '', new: '', confirm: '' })
                      setPasswordError(null)
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Keep your account secure by using a strong, unique password.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}