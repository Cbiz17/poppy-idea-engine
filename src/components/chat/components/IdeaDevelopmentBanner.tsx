import React from 'react'
import { RefreshCw, History } from 'lucide-react'
import { Idea } from '@/hooks/useIdeas'

interface IdeaDevelopmentBannerProps {
  currentIdeaContext: Idea
  onViewHistory: () => void
}

export function IdeaDevelopmentBanner({ currentIdeaContext, onViewHistory }: IdeaDevelopmentBannerProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              Developing: {currentIdeaContext.title}
            </h3>
            <p className="text-sm text-blue-700">
              Version {currentIdeaContext.development_count || 1} • 
              {currentIdeaContext.category} • 
              All changes tracked in history
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onViewHistory}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-300 font-medium"
          >
            <History className="w-4 h-4" />
            View Full History
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full inline-block">
        💡 Tip: Your improvements will be saved as Version {(currentIdeaContext.development_count || 1) + 1}
      </div>
    </div>
  )
}
