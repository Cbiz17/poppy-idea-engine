'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  ArrowLeft, MessageCircle, Sparkles, Edit2, 
  History, Trash2, GitBranch, Clock, Pin, Archive
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConversationAuditTrail from './ConversationAuditTrail'
import EditIdeaModal from './EditIdeaModal'

interface IdeaDetailViewProps {
  user: User
  idea: {
    id: string
    title: string
    content: string
    category: string
    created_at: string
    updated_at: string
    development_count?: number
    pinned?: boolean
    archived?: boolean
    idea_development_history?: any[]
  }
}

const CATEGORIES = ['General', 'Business', 'Creative', 'Technology', 'Personal Growth', 'Learning', 'Health & Wellness', 'Productivity', 'Finance', 'Travel']

export default function IdeaDetailView({ user, idea: initialIdea }: IdeaDetailViewProps) {
  const [idea, setIdea] = useState(initialIdea)
  const [showHistory, setShowHistory] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSaveIdea = async (updatedData: { title: string; content: string; category: string }, saveType: 'update' | 'new' | 'merge') => {
    try {
      if (saveType === 'new') {
        // Create a new idea based on this one
        const response = await fetch(`/api/ideas/${idea.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updatedData,
            saveType: 'new',
            originalId: idea.id
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create new idea')
        }

        const { idea: newIdea } = await response.json()
        
        // Navigate to the new idea
        router.push(`/ideas/${newIdea.id}`)
        
      } else {
        // Update existing idea (for both 'update' and 'merge' types)
        const response = await fetch(`/api/ideas/${idea.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        })

        if (!response.ok) {
          throw new Error('Failed to update idea')
        }

        const { idea: updatedIdea } = await response.json()
        
        // Update local state
        setIdea(updatedIdea)
      }
      
      // Close the modal
      setShowEditModal(false)
      
      // Show success
      alert('Idea saved successfully!')
      
    } catch (error) {
      console.error('Error saving idea:', error)
      throw error // Re-throw to be handled by the modal
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', idea.id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      alert('Idea deleted successfully!')
      router.push('/ideas')
      
    } catch (error) {
      console.error('Error deleting idea:', error)
      alert('Failed to delete idea. Please try again.')
    }
  }

  const handlePinToggle = async () => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ pinned: !idea.pinned })
        .eq('id', idea.id)
        .eq('user_id', user.id)

      if (!error) {
        setIdea({ ...idea, pinned: !idea.pinned })
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const handleArchiveToggle = async () => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ archived: !idea.archived })
        .eq('id', idea.id)
        .eq('user_id', user.id)

      if (!error) {
        setIdea({ ...idea, archived: !idea.archived })
      }
    } catch (error) {
      console.error('Error toggling archive:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const recentHistory = idea.idea_development_history?.slice(0, 5) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/ideas" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            Back to Gallery
          </Link>
          
          <Link href="/chat" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Poppy Idea Engine</h1>
          </Link>

          <div className="flex items-center gap-2">
            {user.user_metadata?.avatar_url && (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Idea Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{idea.title}</h1>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={handlePinToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    idea.pinned 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={idea.pinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className={`w-5 h-5 ${idea.pinned ? 'rotate-45' : ''}`} />
                </button>
                <button
                  onClick={handleArchiveToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    idea.archived 
                      ? 'bg-gray-600 text-white' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={idea.archived ? 'Unarchive' : 'Archive'}
                >
                  <Archive className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <Link
                  href={`/chat?idea=${idea.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  Continue in Chat
                </Link>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Created: {formatDate(idea.created_at)}
              </div>
              {idea.updated_at !== idea.created_at && (
                <div className="flex items-center gap-1">
                  <Edit2 className="w-4 h-4" />
                  Updated: {formatDate(idea.updated_at)}
                </div>
              )}
              {idea.development_count && idea.development_count > 0 && (
                <div className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  {idea.development_count} developments
                </div>
              )}
            </div>

            {/* Category */}
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {idea.category}
              </span>
            </div>
          </div>

          {/* Idea Content */}
          <div className="p-6">
            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
              {idea.content}
            </div>
          </div>

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Developments
                </h3>
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  View Full History
                </button>
              </div>
              
              <div className="space-y-2">
                {recentHistory.map((entry: any) => (
                  <div key={entry.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-gray-700">
                        {entry.change_summary || `${entry.development_type.replace(/_/g, ' ')}`}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(entry.created_at).toLocaleDateString()} • Version {entry.version_number}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" />
                  Full History
                </button>
              </div>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Idea
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <EditIdeaModal
        idea={idea}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveIdea}
        categories={CATEGORIES}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Idea?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{idea.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <ConversationAuditTrail
          ideaId={idea.id}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}
