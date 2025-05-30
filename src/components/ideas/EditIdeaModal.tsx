'use client'

import { useState, useEffect } from 'react'
import { X, Save, MessageCircle, Loader2, RefreshCw, Plus, Edit3, History, TrendingUp, Check, AlertCircle, Merge } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface EditIdeaModalProps {
  idea: {
    id: string
    title: string
    content: string
    category: string
    created_at?: string
    updated_at?: string
  }
  isOpen: boolean
  onClose: () => void
  onSave: (updatedIdea: { title: string; content: string; category: string }, saveType: 'update' | 'new' | 'merge', mergeMetadata?: { mergedIdeaId: string; mergeAction: 'keep' | 'archive' | 'delete' }) => Promise<void>
  categories: string[]
}

interface DevelopmentHistory {
  date: string
  summary: string
  type: string
}

interface OtherIdea {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
  user_id: string
  contributors?: Array<{
    user_id: string
    email?: string
    full_name?: string
    avatar_url?: string
    contribution_type: string
    contributed_at: string
  }>
}

export default function EditIdeaModal({ idea, isOpen, onClose, onSave, categories }: EditIdeaModalProps) {
  const [title, setTitle] = useState(idea.title)
  const [content, setContent] = useState(idea.content)
  const [category, setCategory] = useState(idea.category)
  const [originalTitle] = useState(idea.title)
  const [originalContent] = useState(idea.content)
  const [saveType, setSaveType] = useState<'update' | 'new' | 'merge'>('update')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [mergedContent, setMergedContent] = useState('')
  const [smartInsights, setSmartInsights] = useState<string[]>([])
  const [isProcessingMerge, setIsProcessingMerge] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [developmentHistory, setDevelopmentHistory] = useState<DevelopmentHistory[]>([])
  
  // New states for idea merging
  const [showIdeaSelector, setShowIdeaSelector] = useState(false)
  const [userIdeas, setUserIdeas] = useState<OtherIdea[]>([])
  const [selectedMergeIdea, setSelectedMergeIdea] = useState<OtherIdea | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mergeAction, setMergeAction] = useState<'keep' | 'archive' | 'delete'>('archive')
  
  const supabase = createClient()

  // Reset form when idea changes
  useEffect(() => {
    setTitle(idea.title)
    setContent(idea.content)
    setCategory(idea.category)
    setHasChanges(false)
    setSaveType('update')
    setSelectedMergeIdea(null)
    fetchDevelopmentHistory()
  }, [idea])

  // Track changes
  useEffect(() => {
    const changed = title !== idea.title || content !== idea.content || category !== idea.category
    setHasChanges(changed)
  }, [title, content, category, idea])

  // Fetch user's other ideas when merge is selected
  useEffect(() => {
    if (saveType === 'merge' && userIdeas.length === 0) {
      fetchUserIdeas()
    }
  }, [saveType])

  const fetchUserIdeas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's ideas
      const { data: ownIdeas, error: ownError } = await supabase
        .from('ideas')
        .select('id, title, content, category, user_id, created_at, updated_at')
        .eq('user_id', user.id)
        .neq('id', idea.id) // Exclude current idea
        .order('updated_at', { ascending: false })

      if (ownError) {
        console.error('Error fetching own ideas:', ownError)
        return
      }

      if (ownIdeas && ownIdeas.length > 0) {
        // Fetch contributors for all ideas
        const { data: contributors } = await supabase
          .rpc('get_idea_contributors_batch', {
            idea_ids: ownIdeas.map(i => i.id)
          })
        
        if (contributors) {
          // Group contributors by idea
          const contributorsByIdea = contributors.reduce((acc: any, contributor: any) => {
            if (!acc[contributor.idea_id]) {
              acc[contributor.idea_id] = []
            }
            acc[contributor.idea_id].push(contributor)
            return acc
          }, {})
          
          // Add contributors to each idea
          const ideasWithContributors = ownIdeas.map(i => ({
            ...i,
            contributors: contributorsByIdea[i.id] || []
          }))
          
          setUserIdeas(ideasWithContributors)
        } else {
          setUserIdeas(ownIdeas)
        }
      }
    } catch (error) {
      console.error('Error fetching ideas:', error)
    }
  }

  const fetchDevelopmentHistory = async () => {
    try {
      const response = await fetch(`/api/ideas/${idea.id}/history`)
      if (response.ok) {
        const { history } = await response.json()
        setDevelopmentHistory(history || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const generateSmartMerge = async () => {
    if (!selectedMergeIdea) {
      setSmartInsights(['Please select another idea to merge with'])
      return
    }
    
    setIsProcessingMerge(true)
    try {
      const response = await fetch('/api/smart-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: content, // Use current content, not original
          newContent: selectedMergeIdea.content,
          originalTitle: title, // Use current title
          newTitle: selectedMergeIdea.title,
          mergeType: 'idea_merge'
        })
      })

      if (response.ok) {
        const { mergedContent, insights, enhancedTitle, mergeSummary } = await response.json()
        setContent(mergedContent) // Update the content field with merged result
        setSmartInsights(insights || [
          'Combined key concepts from both ideas',
          'Removed redundant information',
          'Created cohesive narrative flow'
        ])
        if (enhancedTitle) {
          setTitle(enhancedTitle)
        }
        // Show merge summary
        if (mergeSummary) {
          setSmartInsights([mergeSummary, ...insights])
        }
      } else {
        // Fallback to simple merge
        const errorData = await response.json().catch(() => ({}))
        console.error('Smart merge failed:', errorData)
        const simple = `${content}\n\n--- Merged with: ${selectedMergeIdea.title} ---\n\n${selectedMergeIdea.content}`
        setContent(simple)
        setSmartInsights(['Using simple merge - AI merge unavailable'])
      }
    } catch (error) {
      console.error('Error generating smart merge:', error)
      const simple = `${content}\n\n--- Merged with: ${selectedMergeIdea.title} ---\n\n${selectedMergeIdea.content}`
      setContent(simple)
      setSmartInsights(['Using simple merge due to error'])
    } finally {
      setIsProcessingMerge(false)
      setShowIdeaSelector(false)
    }
  }

  const handleSave = async () => {
    if (!hasChanges && saveType === 'update') return
    
    // Confirm delete action
    if (saveType === 'merge' && mergeAction === 'delete' && selectedMergeIdea) {
      const confirmDelete = confirm(`Are you sure you want to permanently delete "${selectedMergeIdea.title}" after merging? This cannot be undone.`)
      if (!confirmDelete) return
    }
    
    setIsSaving(true)
    try {
      const mergeMetadata = saveType === 'merge' && selectedMergeIdea ? {
        mergedIdeaId: selectedMergeIdea.id,
        mergeAction: mergeAction
      } : undefined
      
      await onSave({ 
        title, 
        content, 
        category 
      }, saveType, mergeMetadata)
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      if (hasChanges || saveType === 'new') handleSave()
    }
    // Escape to close
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const formatTimeDiff = (date1: string, date2: string) => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffHours = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 1) return 'just now'
    if (diffHours < 24) return `${Math.round(diffHours)} hours ago`
    const days = Math.round(diffHours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  const filteredIdeas = userIdeas.filter(otherIdea => 
    otherIdea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    otherIdea.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit & Manage Idea</h2>
            <p className="text-sm text-gray-600 mt-1">Update, merge with other ideas, or create variations</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Last Updated Info */}
          {idea.updated_at && idea.updated_at !== idea.created_at && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              Last edited {formatTimeDiff(idea.updated_at, new Date().toISOString())}
            </div>
          )}

          {/* Development History */}
          {developmentHistory.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Development History ({developmentHistory.length} updates)
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  {showHistory ? 'Hide' : 'Show'} Timeline
                </button>
              </div>
              {showHistory && (
                <div className="space-y-2 mt-3">
                  {developmentHistory.slice(0, 5).map((dev, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-600">{dev.date}</span>
                          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">{dev.type}</span>
                        </div>
                        <p className="text-gray-700">{dev.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Save Type Selection */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">How would you like to save your changes?</h3>
            <div className="space-y-3">
              
              {/* Update Existing */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="saveType"
                  value="update"
                  checked={saveType === 'update'}
                  onChange={(e) => setSaveType(e.target.value as 'update' | 'new' | 'merge')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Update existing idea</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Recommended</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Replace the current content with your edits
                  </p>
                </div>
              </label>

              {/* Smart Merge with Another Idea */}
              <label className="flex items-start gap-3 cursor-pointer border-2 border-transparent hover:border-blue-200 p-3 -m-3 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="saveType"
                  value="merge"
                  checked={saveType === 'merge'}
                  onChange={(e) => setSaveType(e.target.value as 'update' | 'new' | 'merge')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Merge className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900">Smart Merge Ideas</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">AI-Powered</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Recommended</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Intelligently combine this idea with another one from your collection.
                    Perfect for synthesizing related concepts or creating comprehensive solutions.
                  </p>
                </div>
              </label>
              
              {/* New Idea */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="saveType"
                  value="new"
                  checked={saveType === 'new'}
                  onChange={(e) => setSaveType(e.target.value as 'update' | 'new' | 'merge')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">Save as new idea</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a new idea based on this one, keeping the original intact
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Idea Selector for Merge */}
          {saveType === 'merge' && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              {!selectedMergeIdea ? (
                <div>
                  <h4 className="text-lg font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Merge className="w-5 h-5" />
                    Select an Idea to Merge
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose another idea from your collection to intelligently combine with this one.
                    The AI will create a unified concept that captures the best of both ideas.
                  </p>
                  <button
                    onClick={() => setShowIdeaSelector(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                  >
                    Browse Ideas to Merge
                  </button>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-medium text-blue-900 mb-3">Ready to Merge!</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Current Idea</p>
                      <p className="font-medium text-gray-900 text-sm">{title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{content.substring(0, 100)}...</p>
                      {idea.created_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          Created {new Date(idea.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-300">
                      <p className="text-xs text-blue-600 mb-1">Merging With</p>
                      <p className="font-medium text-gray-900 text-sm">{selectedMergeIdea.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{selectedMergeIdea.content.substring(0, 100)}...</p>
                      <div className="mt-2">
                        {selectedMergeIdea.contributors && selectedMergeIdea.contributors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-1">
                              {selectedMergeIdea.contributors.slice(0, 2).map((contributor) => (
                                <div key={contributor.user_id} className="relative">
                                  {contributor.avatar_url ? (
                                    <img
                                      src={contributor.avatar_url}
                                      alt={contributor.full_name || contributor.email}
                                      className="w-5 h-5 rounded-full border border-white"
                                      title={contributor.full_name || contributor.email}
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-gray-300 border border-white flex items-center justify-center">
                                      <span className="text-xs text-gray-600">
                                        {(contributor.full_name || contributor.email || '?')[0].toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {selectedMergeIdea.contributors.length} contributor{selectedMergeIdea.contributors.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Last updated {formatTimeDiff(selectedMergeIdea.updated_at, new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Merge Action Options */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">After merging, what should happen to "{selectedMergeIdea.title}"?</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mergeAction"
                          value="archive"
                          checked={mergeAction === 'archive'}
                          onChange={(e) => setMergeAction(e.target.value as 'keep' | 'archive' | 'delete')}
                          className="text-purple-600"
                        />
                        <span className="text-sm text-gray-700">Archive it (recommended)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mergeAction"
                          value="delete"
                          checked={mergeAction === 'delete'}
                          onChange={(e) => setMergeAction(e.target.value as 'keep' | 'archive' | 'delete')}
                          className="text-purple-600"
                        />
                        <span className="text-sm text-gray-700">Delete it permanently</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mergeAction"
                          value="keep"
                          checked={mergeAction === 'keep'}
                          onChange={(e) => setMergeAction(e.target.value as 'keep' | 'archive' | 'delete')}
                          className="text-purple-600"
                        />
                        <span className="text-sm text-gray-700">Keep both ideas separate</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedMergeIdea(null)}
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Change Selection
                    </button>
                    <button
                      onClick={generateSmartMerge}
                      disabled={isProcessingMerge}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all font-medium"
                    >
                      {isProcessingMerge ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI is Merging Ideas...
                        </>
                      ) : (
                        <>
                          <Merge className="w-4 h-4" />
                          Generate Smart Merge
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Smart Insights */}
          {smartInsights.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                AI Merge Results
              </h3>
              <ul className="space-y-1">
                {smartInsights.map((insight, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    • {insight}
                  </li>
                ))}
              </ul>
              {selectedMergeIdea && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs text-green-700">
                    ℹ️ After saving: "{selectedMergeIdea.title}" will be {mergeAction === 'delete' ? 'deleted' : mergeAction === 'archive' ? 'archived' : 'kept as a separate idea'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter idea title..."
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={12}
              placeholder="Describe your idea..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/chat?idea=${idea.id}`}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Continue in Chat
            </Link>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={(!hasChanges && saveType === 'update') || isSaving || isProcessingMerge}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {saveType === 'update' ? 'Update Idea' :
                     saveType === 'merge' ? 'Save Merged Idea' : 'Save as New'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Save hint */}
          {(hasChanges || saveType === 'new') && (
            <div className="mt-2 text-sm text-gray-500 text-right">
              💡 Tip: Press Cmd+S (Mac) or Ctrl+S (Windows) to save
            </div>
          )}
        </div>
      </div>

      {/* Idea Selector Modal */}
      {showIdeaSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Select an Idea to Merge</h3>
              <p className="text-sm text-gray-600 mt-1">
                Choose an idea to intelligently combine with "{title}". 
                You'll see who contributed to each idea and when it was last updated.
              </p>
              <input
                type="text"
                placeholder="Search ideas by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredIdeas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No ideas found</p>
              ) : (
                <div className="space-y-3">
                  {filteredIdeas.map((otherIdea) => {
                    const createdDate = new Date(otherIdea.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                    const updatedDate = new Date(otherIdea.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                    const daysSinceUpdate = Math.floor((Date.now() - new Date(otherIdea.updated_at).getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <button
                        key={otherIdea.id}
                        onClick={() => {
                          setSelectedMergeIdea(otherIdea)
                          setShowIdeaSelector(false)
                          setSearchQuery('')
                        }}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{otherIdea.title}</h4>
                          <div className="text-xs text-gray-500 text-right">
                            <div>Created: {createdDate}</div>
                            {otherIdea.created_at !== otherIdea.updated_at && (
                              <div className="text-purple-600">Updated: {daysSinceUpdate === 0 ? 'Today' : daysSinceUpdate === 1 ? 'Yesterday' : `${daysSinceUpdate} days ago`}</div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">{otherIdea.content}</p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {otherIdea.category}
                            </span>
                            
                            {/* Contributors */}
                            {otherIdea.contributors && otherIdea.contributors.length > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="flex -space-x-2">
                                  {otherIdea.contributors.slice(0, 3).map((contributor, idx) => (
                                    <div key={contributor.user_id} className="relative" style={{ zIndex: 3 - idx }}>
                                      {contributor.avatar_url ? (
                                        <img
                                          src={contributor.avatar_url}
                                          alt={contributor.full_name || contributor.email}
                                          className="w-6 h-6 rounded-full border-2 border-white"
                                          title={`${contributor.full_name || contributor.email} (${contributor.contribution_type})`}
                                        />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                                          <span className="text-xs text-gray-600">
                                            {(contributor.full_name || contributor.email || '?')[0].toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {otherIdea.contributors.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                      <span className="text-xs text-gray-600">+{otherIdea.contributors.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 ml-1">
                                  {otherIdea.contributors.length} contributor{otherIdea.contributors.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Merge indicator */}
                          <div className="text-xs text-purple-600 font-medium">
                            Select to merge →
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowIdeaSelector(false)
                  setSearchQuery('')
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
