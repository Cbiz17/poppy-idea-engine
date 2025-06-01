'use client'

import { useState, useEffect } from 'react'
import { Trophy, Zap, Target, TrendingUp, Award, Gift, Star, Lock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Achievement {
  id: string
  name: string
  description: string
  icon: any
  requiredPoints: number
  unlocked: boolean
  unlockedAt?: Date
}

interface UserFeedbackStatsProps {
  user: User
}

export function UserFeedbackStats({ user }: UserFeedbackStatsProps) {
  const [stats, setStats] = useState({
    totalFeedback: 0,
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    pointsToNextLevel: 100,
    levelProgress: 0
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Load from API
      const response = await fetch('/api/feedback')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const { data } = await response.json()
      
      if (data?.stats) {
        const feedbackStats = data.stats
        const totalPoints = feedbackStats.totalPoints || 0
        const level = feedbackStats.currentLevel || 1
        const pointsInCurrentLevel = totalPoints % 100
        const pointsToNextLevel = 100 - pointsInCurrentLevel
        const levelProgress = (pointsInCurrentLevel / 100) * 100

        setStats({
          totalFeedback: feedbackStats.totalFeedbackCount || 0,
          totalPoints,
          currentStreak: feedbackStats.currentStreak || 0,
          longestStreak: feedbackStats.longestStreak || 0,
          level,
          pointsToNextLevel,
          levelProgress
        })

        // Update achievements
        if (data.achievements) {
          updateAchievements(data.achievements, totalPoints, feedbackStats.totalFeedbackCount || 0, feedbackStats.currentStreak || 0)
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const updateAchievements = (unlockedAchievements: any[], points: number, feedbackCount: number, streak: number) => {
    const unlockedIds = unlockedAchievements.map(a => a.id)
    
    const allAchievements: Achievement[] = [
      {
        id: 'first-feedback',
        name: 'First Steps',
        description: 'Give your first feedback',
        icon: Star,
        requiredPoints: 10,
        unlocked: unlockedIds.includes('first-feedback'),
        unlockedAt: unlockedAchievements.find(a => a.id === 'first-feedback')?.unlockedAt
      },
      {
        id: 'feedback-10',
        name: 'Helpful Human',
        description: 'Give 10 pieces of feedback',
        icon: Trophy,
        requiredPoints: 100,
        unlocked: unlockedIds.includes('feedback-10'),
        unlockedAt: unlockedAchievements.find(a => a.id === 'feedback-10')?.unlockedAt
      },
      {
        id: 'streak-3',
        name: 'Consistent Contributor',
        description: 'Maintain a 3-day streak',
        icon: Zap,
        requiredPoints: 50,
        unlocked: unlockedIds.includes('streak-3'),
        unlockedAt: unlockedAchievements.find(a => a.id === 'streak-3')?.unlockedAt
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: Award,
        requiredPoints: 200,
        unlocked: unlockedIds.includes('streak-7'),
        unlockedAt: unlockedAchievements.find(a => a.id === 'streak-7')?.unlockedAt
      },
      {
        id: 'points-100',
        name: 'Point Collector',
        description: 'Earn 100 total points',
        icon: Target,
        requiredPoints: 100,
        unlocked: unlockedIds.includes('points-100'),
        unlockedAt: unlockedAchievements.find(a => a.id === 'points-100')?.unlockedAt
      },
      {
        id: 'points-500',
        name: 'XP Hunter',
        description: 'Earn 500 total points',
        icon: Gift,
        requiredPoints: 500,
        unlocked: unlockedIds.includes('points-500'),
        unlockedAt: unlockedAchievements.find(a => a.id === 'points-500')?.unlockedAt
      }
    ]

    setAchievements(allAchievements)
  }

  const getLevelTitle = (level: number) => {
    if (level < 3) return 'Feedback Novice'
    if (level < 5) return 'AI Helper'
    if (level < 10) return 'Training Expert'
    if (level < 20) return 'Master Trainer'
    return 'AI Whisperer'
  }

  const getLevelColor = (level: number) => {
    if (level < 3) return 'from-gray-400 to-gray-600'
    if (level < 5) return 'from-green-400 to-green-600'
    if (level < 10) return 'from-blue-400 to-blue-600'
    if (level < 20) return 'from-purple-400 to-purple-600'
    return 'from-yellow-400 to-orange-600'
  }

  return (
    <>
      {/* Compact stats bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-3 hover:bg-gray-50 px-3 py-1 rounded-lg transition-colors"
            >
              <div className={`bg-gradient-to-r ${getLevelColor(stats.level)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                Lvl {stats.level}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{getLevelTitle(stats.level)}</div>
                <div className="text-xs text-gray-500">{stats.totalPoints} total XP</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">
                {stats.currentStreak} day streak
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                {achievements.filter(a => a.unlocked).length}/{achievements.length} achievements
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Next level in</span>
              <span className="font-medium text-purple-600 ml-1">{stats.pointsToNextLevel} XP</span>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${getLevelColor(stats.level)} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${stats.levelProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed stats panel */}
      {showDetails && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-b border-gray-200 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stats */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Your Impact
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Feedback Given</span>
                    <span className="font-semibold text-gray-900">{stats.totalFeedback}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total XP Earned</span>
                    <span className="font-semibold text-gray-900">{stats.totalPoints}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Streak</span>
                    <span className="font-semibold text-orange-600">{stats.currentStreak} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Longest Streak</span>
                    <span className="font-semibold text-gray-900">{stats.longestStreak} days</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Did you know?</strong> Your feedback has helped Poppy improve response quality by 23% this month!
                  </p>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Achievements
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.slice(0, 6).map(achievement => (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1 rounded ${achievement.unlocked ? 'text-purple-600' : 'text-gray-400'}`}>
                          <achievement.icon className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                          {achievement.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                      {achievement.unlocked ? (
                        <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>Unlocked!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Lock className="w-3 h-3" />
                          <span>{achievement.requiredPoints} XP needed</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}