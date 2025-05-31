import React from 'react'
import { Save, Plus, RefreshCw, ArrowRight } from 'lucide-react'
import { Idea } from '@/hooks/useIdeas'
import { ContinuationDetectionResult } from '@/hooks/useContinuation'

interface FloatingSaveButtonProps {
  hasValueableContent: boolean
  currentIdeaContext: Idea | null
  continuationContext: ContinuationDetectionResult | null
  onQuickSave: () => void
  onSaveAsNew: () => void
  onUpdate: () => void
  onContinue: () => void
}

export function FloatingSaveButton({
  hasValueableContent,
  currentIdeaContext,
  continuationContext,
  onQuickSave,
  onSaveAsNew,
  onUpdate,
  onContinue
}: FloatingSaveButtonProps) {
  if (!hasValueableContent) return null

  return (
    <div className="fixed bottom-24 right-4 z-40">
      <div className="relative">
        {/* Pulse indicator for new valuable content */}
        <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-75"></div>
        
        <button
          onClick={onQuickSave}
          className="relative bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-110 group"
          title="Save conversation as idea"
        >
          <Save className="w-5 h-5" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              Quick save this conversation
              <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          </div>
        </button>
        
        {/* Quick action menu */}
        <div className="absolute bottom-full right-0 mb-16 hidden group-hover:block">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 space-y-1">
            <button
              onClick={onSaveAsNew}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors text-left"
            >
              <Plus className="w-4 h-4" />
              Save as new idea
            </button>
            {currentIdeaContext && (
              <button
                onClick={onUpdate}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors text-left"
              >
                <RefreshCw className="w-4 h-4" />
                Update "{currentIdeaContext.title}"
              </button>
            )}
            {continuationContext && (
              <button
                onClick={onContinue}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors text-left"
              >
                <ArrowRight className="w-4 h-4" />
                Continue "{continuationContext.relatedIdeaTitle}"
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
