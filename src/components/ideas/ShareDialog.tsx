'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  X, 
  Globe, 
  Users, 
  Lock, 
  Copy, 
  Check,
  Mail,
  Eye,
  Edit3,
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  ideaId: string
  ideaTitle: string
  currentVisibility: 'private' | 'public' | 'shared'
  onVisibilityChange: (visibility: 'private' | 'public' | 'shared') => void
}

interface ShareUser {
  id: string
  email: string
  full_name?: string
  permission_level: 'view' | 'comment' | 'edit'
}

export default function ShareDialog({ 
  isOpen, 
  onClose, 
  ideaId, 
  ideaTitle,
  currentVisibility,
  onVisibilityChange
}: ShareDialogProps) {
  const [visibility, setVisibility] = useState<'private' | 'public' | 'shared'>(currentVisibility)
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('view')
  const [sharedUsers, setSharedUsers] = useState<ShareUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadSharedUsers()
      if (currentVisibility === 'public') {
        generateShareLink()
      }
    }
  }, [isOpen, ideaId])

  const loadSharedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('idea_shares')
        .select(`
          id,
          shared_with_user_id,
          shared_with_email,
          permission_level,
          profiles!shared_with_user_id (
            email,
            full_name
          )
        `)
        .eq('idea_id', ideaId)

      if (error) throw error

      const users = data?.map(share => ({
        id: share.shared_with_user_id || share.id,
        email: share.profiles?.[0]?.email || share.shared_with_email || '',
        full_name: share.profiles?.[0]?.full_name,
        permission_level: share.permission_level
      })) || []

      setSharedUsers(users)
    } catch (error) {
      console.error('Error loading shared users:', error)
    }
  }

  const generateShareLink = () => {
    const baseUrl = window.location.origin
    setShareLink(`${baseUrl}/ideas/shared/${ideaId}`)
  }

  const handleVisibilityChange = async (newVisibility: 'private' | 'public' | 'shared') => {
    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('ideas')
        .update({ visibility: newVisibility })
        .eq('id', ideaId)

      if (error) throw error

      setVisibility(newVisibility)
      onVisibilityChange(newVisibility)

      // Create discovery stats for public ideas
      if (newVisibility === 'public') {
        await supabase
          .from('idea_discovery_stats')
          .upsert({ idea_id: ideaId })
        
        generateShareLink()
      }
    } catch (error: any) {
      console.error('Error updating visibility:', error)
      setError(error.message || 'Failed to update visibility')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddUser = async () => {
    if (!email.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // Check if user exists
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('idea_shares')
        .insert({
          idea_id: ideaId,
          shared_by_user_id: currentUser?.id,
          shared_with_user_id: userData?.id,
          shared_with_email: userData ? null : email.toLowerCase(),
          permission_level: permission
        })

      if (error) {
        if (error.code === '23505') {
          setError('This user already has access to this idea')
        } else {
          throw error
        }
      } else {
        // Update visibility if needed
        if (visibility === 'private') {
          await handleVisibilityChange('shared')
        }
        
        // Reload shared users
        await loadSharedUsers()
        setEmail('')
      }
    } catch (error: any) {
      console.error('Error sharing idea:', error)
      setError(error.message || 'Failed to share idea')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('idea_shares')
        .delete()
        .eq('idea_id', ideaId)
        .eq('shared_with_user_id', userId)

      if (error) throw error

      await loadSharedUsers()
    } catch (error) {
      console.error('Error removing user:', error)
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share Idea</h2>
            <p className="text-sm text-gray-600 mt-1">{ideaTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Visibility Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Visibility</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleVisibilityChange('private')}
                disabled={isSaving}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  visibility === 'private'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Lock className={`w-5 h-5 ${visibility === 'private' ? 'text-purple-600' : 'text-gray-500'}`} />
                <div className="text-left">
                  <p className={`font-medium ${visibility === 'private' ? 'text-purple-900' : 'text-gray-900'}`}>
                    Private
                  </p>
                  <p className="text-sm text-gray-600">Only you can see this idea</p>
                </div>
              </button>

              <button
                onClick={() => handleVisibilityChange('shared')}
                disabled={isSaving}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  visibility === 'shared'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className={`w-5 h-5 ${visibility === 'shared' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div className="text-left">
                  <p className={`font-medium ${visibility === 'shared' ? 'text-blue-900' : 'text-gray-900'}`}>
                    Shared with specific people
                  </p>
                  <p className="text-sm text-gray-600">Only people you invite can see this</p>
                </div>
              </button>

              <button
                onClick={() => handleVisibilityChange('public')}
                disabled={isSaving}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  visibility === 'public'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Globe className={`w-5 h-5 ${visibility === 'public' ? 'text-green-600' : 'text-gray-500'}`} />
                <div className="text-left">
                  <p className={`font-medium ${visibility === 'public' ? 'text-green-900' : 'text-gray-900'}`}>
                    Public
                  </p>
                  <p className="text-sm text-gray-600">Anyone with the link can see this</p>
                </div>
              </button>
            </div>
          </div>

          {/* Share Link (for public ideas) */}
          {visibility === 'public' && shareLink && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Share Link</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Add People (for shared ideas) */}
          {visibility === 'shared' && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Share with People</h3>
              
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as 'view' | 'comment' | 'edit')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="view">Can view</option>
                  <option value="comment">Can comment</option>
                  <option value="edit">Can edit</option>
                </select>
                <button
                  onClick={handleAddUser}
                  disabled={isLoading || !email.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </button>
              </div>

              {/* Shared Users List */}
              {sharedUsers.length > 0 && (
                <div className="space-y-2">
                  {sharedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.full_name || user.email}
                          </p>
                          {user.full_name && (
                            <p className="text-xs text-gray-600">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          {user.permission_level === 'view' && <Eye className="w-3 h-3" />}
                          {user.permission_level === 'comment' && <MessageSquare className="w-3 h-3" />}
                          {user.permission_level === 'edit' && <Edit3 className="w-3 h-3" />}
                          <span className="capitalize">{user.permission_level}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}