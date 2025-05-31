import React from 'react'
import { AlertCircle } from 'lucide-react'
import { ContinuationDetectionResult } from '@/hooks/useContinuation'

interface ContinuationBannerProps {
  continuationContext: ContinuationDetectionResult
  onDismiss: () => void
}

export function ContinuationBanner({ continuationContext, onDismiss }: ContinuationBannerProps) {
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            This conversation might be related to your idea: 
            <span className="font-medium"> "{continuationContext.relatedIdeaTitle}"</span>
            <span className="text-blue-600 ml-2">({Math.round(continuationContext.confidence * 100)}% match)</span>
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
