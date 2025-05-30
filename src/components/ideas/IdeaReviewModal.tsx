'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Edit3, GitBranch } from 'lucide-react'

interface SuggestedIdea {
  title: string;
  content: string;
  category: string;
  isBranch?: boolean;
  parentIdeaTitle?: string;
  branchNote?: string;
}

interface OriginalIdea {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface IdeaReviewModalProps {
  isOpen: boolean;
  suggestedIdea: SuggestedIdea | null;
  originalIdea?: OriginalIdea | null; // The idea we're continuing from
  onClose: () => void;
  onSave: (editedIdea: SuggestedIdea, saveType: 'update' | 'new' | 'branch') => void;
  categories: string[];
}

export default function IdeaReviewModal({
  isOpen,
  suggestedIdea,
  originalIdea,
  onClose,
  onSave,
  categories
}: IdeaReviewModalProps) {
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedCategory, setEditedCategory] = useState('')
  const [saveType, setSaveType] = useState<'update' | 'new'>('update')
  const [showPreview, setShowPreview] = useState(false)
  const [mergedContent, setMergedContent] = useState('')

  const isContinuation = !!originalIdea
  const isBranch = suggestedIdea?.isBranch || false

  useEffect(() => {
    if (suggestedIdea) {
      setEditedTitle(suggestedIdea.title)
      setEditedContent(suggestedIdea.content)
      setEditedCategory(suggestedIdea.category)
      
      // If continuing an idea, default to update mode
      if (isContinuation) {
        setSaveType('update')
        // Generate preview of merged content
        generateMergedContent()
      } else {
        setSaveType('new')
      }
    } else {
      setEditedTitle('')
      setEditedContent('')
      setEditedCategory(categories.length > 0 ? categories[0] : 'General')
    }
  }, [suggestedIdea, originalIdea, categories, isOpen])

  const generateMergedContent = async () => {
    if (!originalIdea || !suggestedIdea) return
    
    // Simple merge logic for now - we'll enhance this with AI later
    const merged = `${originalIdea.content}

--- Recent Development ---
${suggestedIdea.content}`
    setMergedContent(merged)
  }

  const handlePreviewToggle = () => {
    setShowPreview(!showPreview)
    if (!showPreview && saveType === 'update') {
      generateMergedContent()
    }
  }

  const handleSubmit = () => {
    const finalContent = saveType === 'update' && isContinuation ? mergedContent : editedContent
    onSave({
      title: editedTitle,
      content: finalContent,
      category: editedCategory,
    }, saveType)
  }

  if (!isOpen || !suggestedIdea) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isBranch ? 'Create Branched Idea' : isContinuation ? 'Update Your Idea' : 'Save New Idea'}
        </h2>
        
        {/* Branch explanation */}
        {isBranch && suggestedIdea.parentIdeaTitle && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <GitBranch className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Branching from: "{suggestedIdea.parentIdeaTitle}"
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {suggestedIdea.branchNote || 'This will create a new idea that explores a different direction while keeping the original intact.'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Save Type Selection - only show if continuing an idea and NOT branching */}
        {isContinuation && !isBranch && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">How would you like to save this?</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="saveType"
                  value="update"
                  checked={saveType === 'update'}
                  onChange={(e) => setSaveType(e.target.value as 'update' | 'new')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Update existing idea</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Recommended</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Enhance "{originalIdea?.title}" with new insights and preserve development history
                  </p>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="saveType"
                  value="new"
                  checked={saveType === 'new'}
                  onChange={(e) => setSaveType(e.target.value as 'update' | 'new')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">Save as new variation</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a separate idea tile for this different direction
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Preview Toggle - only show for updates */}
        {isContinuation && saveType === 'update' && (
          <div className="mb-4">
            <button
              onClick={handlePreviewToggle}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
            >
              <Edit3 className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Show'} merged content preview
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
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="ideaContent" className="block text-sm font-medium text-gray-700 mb-1">
              {saveType === 'update' && isContinuation ? 'Content (will be merged with original)' : 'Content'}
            </label>
            
            {/* Show preview for updates */}
            {showPreview && saveType === 'update' && isContinuation ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Preview of Updated Content:</h4>
                  <div className="text-sm text-blue-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {mergedContent}
                  </div>
                </div>
                <textarea
                  id="ideaContent"
                  value={editedContent}
                  onChange={(e) => {
                    setEditedContent(e.target.value)
                    // Update merged content when user edits
                    const updated = `${originalIdea?.content}

--- Recent Development ---
${e.target.value}`
                    setMergedContent(updated)
                  }}
                  rows={4}
                  placeholder="Add new insights, features, or developments..."
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                />
              </div>
            ) : (
              <textarea
                id="ideaContent"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
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
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
          >
            {saveType === 'update' && isContinuation ? 'Update Idea' : 'Save New Idea'}
          </button>
        </div>
      </div>
    </div>
  )
}
