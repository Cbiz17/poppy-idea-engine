'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'

export default function FeedbackTooltip() {
  const [showTooltip, setShowTooltip] = useState(false)
  
  useEffect(() => {
    // Check if user has seen the tooltip before
    const hasSeenTooltip = localStorage.getItem('poppy-feedback-tooltip-seen')
    
    if (!hasSeenTooltip) {
      // Show tooltip after 3 seconds on first visit
      const timer = setTimeout(() => {
        setShowTooltip(true)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [])
  
  const dismissTooltip = () => {
    setShowTooltip(false)
    localStorage.setItem('poppy-feedback-tooltip-seen', 'true')
  }
  
  if (!showTooltip) return null
  
  return (
    <div className="fixed bottom-4 right-4 max-w-sm animate-slide-up z-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              Help Poppy Learn!
            </h3>
            <p className="text-sm opacity-90">
              After each response, use the feedback buttons to help Poppy understand what works best for you. Your input directly improves future conversations!
            </p>
          </div>
          <button
            onClick={dismissTooltip}
            className="text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}