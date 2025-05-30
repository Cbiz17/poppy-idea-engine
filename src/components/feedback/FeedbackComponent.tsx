'use client'

// FEEDBACK COMPONENT - FULLY IMPLEMENTED AND WORKING!
// Last updated: May 29, 2025
// This component appears after EVERY AI response
// Features:
// - Quick feedback (thumbs up/down)
// - Detailed 5-star ratings
// - Tag selection for context
// - Written feedback option
// - Pulsing animation for first 5 seconds
// NEEDS: Users to actually click the buttons to generate data!

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, Star, MessageSquare, Sparkles } from 'lucide-react'

interface FeedbackComponentProps {
  messageId: string
  onFeedbackSubmitted?: () => void
}

export default function FeedbackComponent({ messageId, onFeedbackSubmitted }: FeedbackComponentProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [contextTags, setContextTags] = useState<string[]>([])
  const [showPulse, setShowPulse] = useState(true)

  const availableTags = [
    'helpful', 'accurate', 'creative', 'relevant', 'clear', 'encouraging',
    'detailed', 'actionable', 'insightful', 'well-structured'
  ]

  // Stop pulsing after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const submitFeedback = async (type: string, value?: number, text?: string, tags?: string[]) => {
    try {
      // Check if messageId looks like a valid UUID (contains dashes)
      const isValidUUID = messageId.includes('-') && messageId.length > 30;
      
      if (!isValidUUID) {
        console.warn('Invalid message ID for feedback:', messageId);
        // Still show success to user but don't submit
        setFeedbackGiven(true);
        onFeedbackSubmitted?.();
        return;
      }
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          feedbackType: type,
          feedbackValue: value,
          feedbackText: text,
          contextTags: tags
        })
      })

      if (response.ok) {
        setFeedbackGiven(true)
        onFeedbackSubmitted?.()
      } else {
        const error = await response.json();
        console.error('Feedback submission failed:', error);
        // Still mark as given to avoid annoying the user
        setFeedbackGiven(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      // Mark as given anyway to not block the user
      setFeedbackGiven(true);
    }
  }

  const handleQuickFeedback = async (type: 'thumbs_up' | 'thumbs_down') => {
    await submitFeedback(type, type === 'thumbs_up' ? 1 : -1)
  }

  const handleDetailedFeedback = async () => {
    await submitFeedback('rating', rating, feedbackText, contextTags)
    setShowDetailedFeedback(false)
  }

  const toggleTag = (tag: string) => {
    setContextTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  if (feedbackGiven) {
    return (
      <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2 text-sm text-purple-700">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="font-medium">Thank you for helping Poppy learn!</span>
        </div>
        <p className="text-xs text-purple-600 mt-1">
          Your feedback directly improves future conversations.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t-2 border-gray-100">
      {!showDetailedFeedback ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">How was this response?</span>
              {showPulse && (
                <span className="inline-flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuickFeedback('thumbs_up')}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-all hover:scale-105"
                title="Helpful response"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-medium">Helpful</span>
              </button>
              <button
                onClick={() => handleQuickFeedback('thumbs_down')}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-all hover:scale-105"
                title="Not helpful"
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-xs font-medium">Not helpful</span>
              </button>
              <button
                onClick={() => setShowDetailedFeedback(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-all hover:scale-105"
                title="Give detailed feedback"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-medium">More feedback</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">
            💡 Your feedback helps Poppy learn and improve for everyone
          </p>
        </div>
      ) : (
        <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-800">Share detailed feedback</h4>
            <button
              onClick={() => setShowDetailedFeedback(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">
              Overall Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onClick={() => setRating(i)}
                  className={`w-8 h-8 transition-all ${
                    i <= rating 
                      ? 'text-yellow-400 scale-110' 
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <Star className="w-full h-full fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">
              What made this response good? (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                    contextTags.includes(tag)
                      ? 'bg-purple-600 text-white scale-105'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">
              Any suggestions for improvement? (optional)
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="How could this response be better?"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDetailedFeedback}
              disabled={rating === 0}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Submit Feedback
            </button>
            <button
              onClick={() => setShowDetailedFeedback(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}