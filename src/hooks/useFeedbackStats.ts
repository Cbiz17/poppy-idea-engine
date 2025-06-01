import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { devLogger } from '@/lib/dev-logger'

export interface UserFeedbackStats {
  totalFeedback: number
  totalPoints: number
  currentStreak: number
  longestStreak: number
  level: number
  pointsToNextLevel: number
  levelProgress: number
  recentFeedback: RecentFeedback[]
  achievements: Achievement[]
  nextMilestone: Milestone | null
}

export interface RecentFeedback {
  id: string
  timestamp: Date
  type: 'thumbs_up' | 'thumbs_down' | 'rating'
  points: number
  ideaTitle?: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requiredPoints: number
  unlocked: boolean
  unlockedAt?: Date
  progress: number
}

export interface Milestone {
  name: string
  target: number
  current: number
  reward: number
  type: 'feedback_count' | 'streak' | 'points'
}

interface UseFeedbackStatsProps {
  user: User
}

export function useFeedbackStats({ user }: UseFeedbackStatsProps) {
  const [stats, setStats] = useState<UserFeedbackStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    try {
      // Get stats from API
      const response = await fetch('/api/feedback')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const { data } = await response.json()
      
      if (!data) {
        setStats(null)
        return
      }

      // Parse the stats
      const feedbackStats = data.stats || {}
      const totalPoints = feedbackStats.totalPoints || 0
      const totalFeedback = feedbackStats.totalFeedbackCount || 0
      const currentStreak = feedbackStats.currentStreak || 0
      const longestStreak = feedbackStats.longestStreak || 0
      const level = feedbackStats.currentLevel || 1
      const pointsInCurrentLevel = totalPoints % 100
      const pointsToNextLevel = 100 - pointsInCurrentLevel
      const levelProgress = (pointsInCurrentLevel / 100) * 100

      // Parse achievements
      const achievements = getAchievements(
        data.achievements || [], 
        totalPoints, 
        totalFeedback, 
        currentStreak
      )

      // Get recent rewards as recent feedback
      const recentFeedback: RecentFeedback[] = (data.recentRewards || []).map((r: any) => ({
        id: r.id || String(Date.now()),
        timestamp: new Date(r.createdAt),
        type: r.type || 'thumbs_up',
        points: r.points || 0
      }))

      const statsData: UserFeedbackStats = {
        totalFeedback,
        totalPoints,
        currentStreak,
        longestStreak,
        level,
        pointsToNextLevel,
        levelProgress,
        recentFeedback,
        achievements,
        nextMilestone: null
      }

      // Add next milestone
      statsData.nextMilestone = getNextMilestone(statsData)

      setStats(statsData)

      devLogger.info('useFeedbackStats', 'Loaded user stats', {
        totalFeedback,
        totalPoints,
        level,
        currentStreak
      })

    } catch (error) {
      console.error('Error loading feedback stats:', error)
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [user.id])

  const getAchievements = (unlockedAchievements: any[], totalPoints: number, totalFeedback: number, streak: number): Achievement[] => {
    const unlockedIds = unlockedAchievements.map(a => a.id)
    
    const achievements: Achievement[] = [
      {
        id: 'first-feedback',
        name: 'First Steps',
        description: 'Give your first feedback',
        icon: 'star',
        requiredPoints: 0,
        unlocked: unlockedIds.includes('first-feedback'),
        progress: Math.min(totalFeedback, 1)
      },
      {
        id: 'feedback-10',
        name: 'Helpful Human',
        description: 'Give 10 pieces of feedback',
        icon: 'trophy',
        requiredPoints: 0,
        unlocked: unlockedIds.includes('feedback-10'),
        progress: Math.min(totalFeedback / 10 * 100, 100)
      },
      {
        id: 'feedback-50',
        name: 'Feedback Champion',
        description: 'Give 50 pieces of feedback',
        icon: 'medal',
        requiredPoints: 0,
        unlocked: unlockedIds.includes('feedback-50'),
        progress: Math.min(totalFeedback / 50 * 100, 100)
      },
      {
        id: 'streak-3',
        name: 'Consistent Contributor',
        description: 'Maintain a 3-day streak',
        icon: 'zap',
        requiredPoints: 0,
        unlocked: unlockedIds.includes('streak-3'),
        progress: Math.min(streak / 3 * 100, 100)
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: 'fire',
        requiredPoints: 0,
        unlocked: unlockedIds.includes('streak-7'),
        progress: Math.min(streak / 7 * 100, 100)
      },
      {
        id: 'points-100',
        name: 'Point Collector',
        description: 'Earn 100 total points',
        icon: 'coins',
        requiredPoints: 100,
        unlocked: unlockedIds.includes('points-100'),
        progress: Math.min(totalPoints / 100 * 100, 100)
      },
      {
        id: 'points-500',
        name: 'XP Hunter',
        description: 'Earn 500 total points',
        icon: 'gem',
        requiredPoints: 500,
        unlocked: unlockedIds.includes('points-500'),
        progress: Math.min(totalPoints / 500 * 100, 100)
      },
      {
        id: 'points-1000',
        name: 'Master Trainer',
        description: 'Earn 1000 total points',
        icon: 'diamond',
        requiredPoints: 1000,
        unlocked: unlockedIds.includes('points-1000'),
        progress: Math.min(totalPoints / 1000 * 100, 100)
      }
    ]

    return achievements
  }

  const getNextMilestone = (stats: UserFeedbackStats): Milestone | null => {
    const milestones: Milestone[] = [
      {
        name: 'Next Feedback Milestone',
        target: stats.totalFeedback < 10 ? 10 : stats.totalFeedback < 50 ? 50 : 100,
        current: stats.totalFeedback,
        reward: 50,
        type: 'feedback_count'
      },
      {
        name: 'Streak Goal',
        target: stats.currentStreak < 3 ? 3 : stats.currentStreak < 7 ? 7 : 30,
        current: stats.currentStreak,
        reward: 100,
        type: 'streak'
      },
      {
        name: 'Points Target',
        target: Math.ceil(stats.totalPoints / 100) * 100,
        current: stats.totalPoints,
        reward: 25,
        type: 'points'
      }
    ]

    // Find the closest milestone
    return milestones
      .filter(m => m.current < m.target)
      .sort((a, b) => (a.target - a.current) - (b.target - b.current))[0] || null
  }

  const incrementStats = useCallback(async (pointsEarned: number) => {
    if (!stats) return

    // Optimistically update local state
    const newTotalPoints = stats.totalPoints + pointsEarned
    const newLevel = Math.floor(newTotalPoints / 100) + 1
    const pointsInCurrentLevel = newTotalPoints % 100
    
    setStats({
      ...stats,
      totalFeedback: stats.totalFeedback + 1,
      totalPoints: newTotalPoints,
      level: newLevel,
      pointsToNextLevel: 100 - pointsInCurrentLevel,
      levelProgress: (pointsInCurrentLevel / 100) * 100
    })

    // Check for level up
    if (newLevel > stats.level) {
      devLogger.info('useFeedbackStats', 'User leveled up!', {
        oldLevel: stats.level,
        newLevel,
        totalPoints: newTotalPoints
      })
      
      // Could trigger a celebration notification here
    }
  }, [stats])

  // Load stats on mount
  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    isLoading,
    refreshStats: loadStats,
    incrementStats
  }
}