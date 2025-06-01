'use client'

import { useState, useEffect } from 'react'
import { Trophy, X, Sparkles, Star, Zap, Target, Gift, Medal } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

interface AchievementNotificationProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      setIsExiting(false)
      
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.3 },
        colors: ['#9333ea', '#3b82f6', '#ec4899', '#fbbf24']
      })

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [achievement])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }

  if (!achievement || !isVisible) return null

  const getIcon = () => {
    switch (achievement.icon) {
      case 'star': return Star
      case 'trophy': return Trophy
      case 'zap': return Zap
      case 'target': return Target
      case 'gift': return Gift
      case 'medal': return Medal
      default: return Sparkles
    }
  }

  const Icon = getIcon()

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}>
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm border-2 border-purple-200 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 opacity-50"></div>
        <div className="absolute top-0 left-0 w-40 h-40 bg-purple-400 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-400 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Content */}
        <div className="relative z-10">
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Icon className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Achievement Unlocked!
              </h3>
              <p className="text-purple-700 font-semibold mb-1">
                {achievement.name}
              </p>
              <p className="text-sm text-gray-600">
                {achievement.description}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-xs text-purple-600">
            <Sparkles className="w-3 h-3" />
            <span>You're making Poppy smarter!</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Achievement notification manager
export function useAchievementNotifications() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [queue, setQueue] = useState<Achievement[]>([])

  const showAchievement = (achievement: Achievement) => {
    setQueue(prev => [...prev, achievement])
  }

  useEffect(() => {
    if (!currentAchievement && queue.length > 0) {
      setCurrentAchievement(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [currentAchievement, queue])

  const handleClose = () => {
    setCurrentAchievement(null)
  }

  return {
    currentAchievement,
    showAchievement,
    handleClose,
    AchievementComponent: () => (
      <AchievementNotification 
        achievement={currentAchievement} 
        onClose={handleClose} 
      />
    )
  }
}