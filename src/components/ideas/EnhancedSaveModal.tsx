'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Edit3, AlertCircle, History, Lightbulb, Check, Clock, TrendingUp, ArrowRight } from 'lucide-react'

interface SuggestedIdea {
  title: string;
  content: string;
  category: string;
  originalMessageId?: string;
}

interface OriginalIdea {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface ContinuationContext {
  relatedIdeaId: string;
  confidence: number;
  contextSummary: string;
  suggestedAction: 'update' | 'new_variation' | 'merge';
  detectionMethod: 'smart_detection' | 'url_parameter' | 'user_explicit';
  timeSinceLastUpdate?: number; // hours
  previousDevelopments?: Array<{
    date: string;
    summary: string;
    type: string;
  }>;
}

interface EnhancedSaveModalProps {
  isOpen: boolean;
  suggestedIdea: SuggestedIdea | null;
  originalIdea?: OriginalIdea | null;
  continuationContext?: ContinuationContext | null;
  conversationHistory?: Array<{role: string, content: string}>;
  onClose: () => void;
  onSave: (editedIdea: SuggestedIdea, saveType: 'update' | 'new' | 'merge', metadata?: any) => void;
  categories: string[];
}

export default function EnhancedSaveModal({
  isOpen,
  suggestedIdea,
  originalIdea,
  continuationContext,
  conversationHistory = [],
  onClose,
  onSave,
  categories
}: EnhancedSaveModalProps) {
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedCategory, setEditedCategory] = useState('')
  const [saveType, setSaveType] = useState<'update' | 'new' | 'merge'>('new')
  const [showPreview, setShowPreview] = useState(false)
  const [mergedContent, setMergedContent] = useState('')
  const [smartInsights, setSmartInsights] = useState<string[]>([])
  const [isProcessingMerge, setIsProcessingMerge] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const hasContinuationContext = !!continuationContext
  const hasOriginalIdea = !!originalIdea

  useEffect(() => {
    if (suggestedIdea) {
      setEditedTitle(suggestedIdea.title)
      setEditedContent(suggestedIdea.content)
      setEditedCategory(suggestedIdea.category)
      
      // Determine default save type based on context
      if (hasContinuationContext) {
        setSaveType(continuationContext.suggestedAction === 'new_variation' ? 'new' : continuationContext.suggestedAction)
        if (continuationContext.suggestedAction === 'update' || continuationContext.suggestedAction === 'merge') {
          generateSmartMerge()
        }
      } else if (hasOriginalIdea) {
        setSaveType('update')
        generateSmartMerge()
      } else {
        setSaveType('new')
      }
    }
  }, [suggestedIdea, originalIdea, continuationContext, isOpen])

  const generateSmartMerge = async () => {
    if (!originalIdea && !continuationContext) return
    
    setIsProcessingMerge(true)
    try {
      // Call AI service to intelligently merge content
      const response = await fetch('/api/smart-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: originalIdea?.content || '',
          newContent: suggestedIdea?.content || '',
          conversationHistory: conversationHistory.slice(-6), // Last 6 messages for context
          mergeType: saveType
        })
      })

      if (response.ok) {
        const { mergedContent: merged, insights, enhancedTitle } = await response.json()
        setMergedContent(merged)
        setSmartInsights(insights || [])
        if (enhancedTitle && enhancedTitle !== editedTitle) {
          setEditedTitle(enhancedTitle)
        }
      } else {
        // Fallback to simple merge
        const simple = `${originalIdea?.content || ''}\n\n--- Recent Development ---\n${suggestedIdea?.content || ''}`
        setMergedContent(simple)
        setSmartInsights(['Using simple merge due to processing limitations'])
      }
    } catch (error) {
      console.error('Error generating smart merge:', error)
      // Fallback to simple merge
      const simple = `${originalIdea?.content || ''}\n\n--- Recent Development ---\n${suggestedIdea?.content || ''}`
      setMergedContent(simple)
      setSmartInsights(['Using simple merge due to error'])
    } finally {
      setIsProcessingMerge(false)
    }
  }

  const handlePreviewToggle = () => {
    setShowPreview(!showPreview)
    if (!showPreview && (saveType === 'update' || saveType === 'merge')) {
      generateSmartMerge()
    }
  }

  const formatTimeSince = (hours: number) => {
    if (hours < 1) return 'just now'
    if (hours < 24) return `${Math.round(hours)} hours ago`
    const days = Math.round(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  const handleSubmit = () => {
    const finalContent = (saveType === 'update' || saveType === 'merge') && (hasOriginalIdea || hasContinuationContext) 
      ? mergedContent 
      : editedContent

    const metadata = {
      continuationContext,
      smartInsights,
      conversationLength: conversationHistory.length,
      detectionMethod: continuationContext?.detectionMethod || 'manual',
      confidence: continuationContext?.confidence || 1.0
    }

    onSave({
      title: editedTitle,
      content: finalContent,
      category: editedCategory,
    }, saveType, metadata)
  }

  if (!isOpen || !suggestedIdea) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header with Smart Detection Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {hasContinuationContext ? 'Continue Your Idea Journey' : hasOriginalIdea ? 'Update Your Idea' : 'Save New Idea'}
          </h2>
          
          {/* Smart Detection Alert */}
          {hasContinuationContext && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Smart Detection Active</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    I detected this might be related to your existing idea with {Math.round(continuationContext.confidence * 100)}% confidence.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      Detection: {continuationContext.detectionMethod.replace('_', ' ')}
                    </span>
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      Suggested: {continuationContext.suggestedAction.replace('_', ' ')}
                    </span>
                    {continuationContext.timeSinceLastUpdate && (
                      <span className="bg-blue-100 px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeSince(continuationContext.timeSinceLastUpdate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Development History Preview */}
          {continuationContext?.previousDevelopments && continuationContext.previousDevelopments.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Development History
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  {showHistory ? 'Hide' : 'Show'} Timeline
                </button>
              </div>
              {showHistory && (
                <div className="space-y-2">
                  {continuationContext.previousDevelopments.slice(0, 3).map((dev, idx) => (
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
        </div>
        
        {/* Save Type Selection */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">How would you like to save this?</h3>
          <div className="space-y-3">
            
            {/* Update Existing */}
            {(hasOriginalIdea || hasContinuationContext) && (
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
                    {hasContinuationContext && (continuationContext.suggestedAction === 'update') && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        AI Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Enhance "{originalIdea?.title || 'your existing idea'}" with new insights and preserve development history
                  </p>
                </div>
              </label>
            )}
            
            {/* Smart Merge */}
            {hasContinuationContext && (
              <label className="flex items-start gap-3 cursor-pointer">
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
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900">Smart merge</span>
                    {continuationContext.suggestedAction === 'merge' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        AI Recommended
                      </span>
                    )}
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">New</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Intelligently combine insights while removing redundancy and enhancing flow
                  </p>
                </div>
              </label>
            )}
            
            {/* New Variation */}
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
                  {(!hasContinuationContext && !hasOriginalIdea) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Default</span>
                  )}
                  {hasContinuationContext && continuationContext.suggestedAction === 'new_variation' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      AI Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Create a separate idea tile for this {hasContinuationContext ? 'different direction' : 'concept'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Smart Insights */}
        {smartInsights.length > 0 && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              AI Insights
            </h3>
            <ul className="space-y-1">
              {smartInsights.map((insight, idx) => (
                <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-0.5" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview Toggle - only show for updates/merges */}
        {(saveType === 'update' || saveType === 'merge') && (hasOriginalIdea || hasContinuationContext) && (
          <div className="mb-4">
            <button
              onClick={handlePreviewToggle}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
            >
              <Edit3 className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Show'} merged content preview
              {isProcessingMerge && <span className="text-xs">(Processing...)</span>}
            </button>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="ideaTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="ideaTitle"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              placeholder="Enter a clear, descriptive title for your idea"
            />
          </div>

          <div>
            <label htmlFor="ideaContent" className="block text-sm font-medium text-gray-700 mb-1">
              {(saveType === 'update' || saveType === 'merge') && (hasOriginalIdea || hasContinuationContext) ? 'Content (will be merged with original)' : 'Content'}
            </label>
            
            {/* Show preview for updates/merges */}
            {showPreview && (saveType === 'update' || saveType === 'merge') && (hasOriginalIdea || hasContinuationContext) ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Preview of {saveType === 'merge' ? 'Smart Merged' : 'Updated'} Content:</h4>
                  <div className="text-sm text-blue-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {mergedContent || 'Processing merge...'}
                  </div>
                </div>
                <textarea
                  id="ideaContent"
                  value={editedContent}
                  onChange={(e) => {
                    setEditedContent(e.target.value)
                    // Update merged content when user edits
                    if (saveType === 'update') {
                      const updated = `${originalIdea?.content}\n\n--- Recent Development ---\n${e.target.value}`
                      setMergedContent(updated)
                    }
                  }}
                  rows={4}
                  placeholder="Add new insights, features, or developments..."
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
              </div>
            ) : (
              <textarea
                id="ideaContent"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            )}
          </div>

          <div>
            <label htmlFor="ideaCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="ideaCategory"
              value={editedCategory}
              onChange={(e) => setEditedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessingMerge}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingMerge ? 'Processing...' : 
             saveType === 'update' && (hasOriginalIdea || hasContinuationContext) ? 'Update Idea' :
             saveType === 'merge' ? 'Smart Merge Idea' : 'Save New Idea'}
          </button>
        </div>
      </div>
    </div>
  )
}
