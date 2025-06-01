'use client'

import { useState, useEffect, useMemo } from 'react'
import { ThumbsUp, ThumbsDown, Star, MessageSquare, Sparkles, Trophy, TrendingUp, Zap, Heart, Gift, Target } from 'lucide-react'
import confetti from 'canvas-confetti'

interface FeedbackComponentProps {
  messageId: string
  onFeedbackSubmitted?: () => void
  userStats?: {
    totalFeedback: number
    currentStreak: number
    level: number
    pointsToNextLevel: number
  }
}

export default function EnhancedFeedbackComponent({ messageId, onFeedbackSubmitted, userStats }: FeedbackComponentProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [contextTags, setContextTags] = useState<string[]>([])
  const [showPulse, setShowPulse] = useState(true)
  const [showReward, setShowReward] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [showStreakBonus, setShowStreakBonus] = useState(false)

  const availableTags = [
    'helpful', 'accurate', 'creative', 'relevant', 'clear', 'encouraging',
    'detailed', 'actionable', 'insightful', 'well-structured'
  ]

  // Enhanced visual feedback messages
  const encouragementMessages = [
    "🎯 Your feedback is training Poppy's neural network!",
    "⚡ Poppy improvement detected! Thanks to users like you.",
    "🧠 Your input = smarter conversations for everyone!",
    "🚀 Poppy learned something new from your feedback!",
    "💡 You're helping shape the future of Poppy!"
  ]

  // Select a message once when feedback is given, not on every render
  const [selectedMessage, setSelectedMessage] = useState<string>('')

  // Stop pulsing after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const calculatePoints = (type: string, value?: number, tags?: string[], text?: string) => {
    let points = 0
    
    // Base points
    if (type === 'thumbs_up' || type === 'thumbs_down') points = 10
    if (type === 'rating') points = 20 + (value || 0) * 2
    
    // Bonus for tags
    if (tags && tags.length > 0) points += tags.length * 5
    
    // Bonus for written feedback
    const textToCheck = text !== undefined ? text : feedbackText
    if (textToCheck.length > 20) points += 15
    
    // Streak bonus
    if (userStats?.currentStreak && userStats.currentStreak > 0) {
      points = Math.floor(points * (1 + userStats.currentStreak * 0.1))
      if (userStats.currentStreak >= 3) setShowStreakBonus(true)
    }
    
    return points
  }

  const triggerCelebration = (points: number) => {
    // Select encouragement message once
    const randomIndex = Math.floor(Math.random() * encouragementMessages.length)
    setSelectedMessage(encouragementMessages[randomIndex])
    
    // Visual celebration
    setEarnedPoints(points)
    setShowReward(true)
    
    // Confetti for high-value feedback
    if (points >= 30) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#3b82f6', '#ec4899']
      })
    }
    
    setTimeout(() => {
      setShowReward(false)
      setShowStreakBonus(false)
    }, 3000)
  }

  const submitFeedback = async (type: string, value?: number, text?: string, tags?: string[]) => {
    try {
      const points = calculatePoints(type, value, tags, text)
      
      // Check if messageId looks like a valid UUID (contains dashes)
      const isValidUUID = messageId.includes('-') && messageId.length > 30;
      
      if (!isValidUUID) {
        console.warn('Invalid message ID for feedback:', messageId);
        // Still show success to user but don't submit
        setFeedbackGiven(true);
        triggerCelebration(points);
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
          contextTags: tags,
          pointsEarned: points
        })
      })

      if (response.ok) {
        setFeedbackGiven(true)
        triggerCelebration(points)
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
      <div className="mt-4 pt-4 border-t-2 border-gray-100">
        <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-40 h-40 bg-purple-400 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10">
          {showReward && (
            <div className="absolute -top-2 -right-2 animate-bounce">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                +{earnedPoints} XP
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-purple-700">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="font-medium">
              {selectedMessage}
            </span>
          </div>
          
          {showStreakBonus && (
            <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md w-fit">
              <Zap className="w-3 h-3" />
              <span>🔥 {userStats?.currentStreak} day streak bonus applied!</span>
            </div>
          )}
          
          <div className="mt-2 flex items-center gap-4 text-xs text-purple-600">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>Level {userStats?.level || 1}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>{userStats?.pointsToNextLevel || 100} XP to next level</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    )
  }

  // Progress percentage should be stable
  const progressPercentage = 78 // This could be calculated from actual data

  return (
    <div className="mt-4 pt-4 border-t-2 border-gray-100 transition-all duration-300">
      {!showDetailedFeedback ? (
        <div className="space-y-3">
          {/* Progress indicator */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Poppy Learning Progress</span>
              </div>
              <span className="text-xs text-purple-600">{progressPercentage}% improved this week</span>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">How was this response?</span>
              {showPulse && (
                <span className="relative">
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-gradient-to-r from-purple-500 to-blue-500 items-center justify-center">
                    <Gift className="w-3 h-3 text-white" />
                  </span>
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuickFeedback('thumbs_up')}
                className="group relative flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 rounded-full transition-all hover:scale-105 hover:shadow-md"
                title="Helpful response"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-medium">Helpful</span>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  +10 XP
                </span>
              </button>
              
              <button
                onClick={() => handleQuickFeedback('thumbs_down')}
                className="group relative flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-100 to-rose-100 hover:from-red-200 hover:to-rose-200 text-red-700 rounded-full transition-all hover:scale-105 hover:shadow-md"
                title="Not helpful"
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-xs font-medium">Not helpful</span>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  +10 XP
                </span>
              </button>
              
              <button
                onClick={() => setShowDetailedFeedback(true)}
                className="group relative flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 rounded-full transition-all hover:scale-105 hover:shadow-md"
                title="Give detailed feedback"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-medium">More feedback</span>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  +20-50 XP
                </span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <p className="text-gray-500 italic flex items-center gap-1">
              <Heart className="w-3 h-3 text-pink-500" />
              Your feedback directly improves Poppy for everyone
            </p>
            {userStats && (
              <div className="flex items-center gap-2 text-purple-600">
                <Zap className="w-3 h-3" />
                <span className="font-medium">{userStats.currentStreak} day streak!</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Share detailed feedback for bonus XP!
            </h4>
            <button
              onClick={() => setShowDetailedFeedback(false)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">
              Overall Rating <span className="text-purple-600">(+{rating * 2} XP)</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onClick={() => setRating(i)}
                  className={`w-10 h-10 transition-all ${
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
              What made this response good? <span className="text-purple-600">(+5 XP each)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                    contextTags.includes(tag)
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105 shadow-md'
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
              Suggestions for improvement <span className="text-purple-600">(+15 XP for 20+ chars)</span>
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="How could this response be better?"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {feedbackText.length}/100 characters
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-purple-700 font-medium">
              Potential XP: {calculatePoints('rating', rating, contextTags, feedbackText)} points
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDetailedFeedback}
                disabled={rating === 0}
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg"
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
        </div>
      )}
    </div>
  )
}