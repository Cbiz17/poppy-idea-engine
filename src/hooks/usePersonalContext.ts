import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { devLogger } from '@/lib/dev-logger'

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'balanced'
  responseLength: 'concise' | 'detailed' | 'adaptive'
  creativityLevel: 'practical' | 'creative' | 'innovative'
  focusAreas: string[]
  timezone?: string
  workingHours?: { start: number; end: number }
}

export interface UserContext {
  preferences: UserPreferences
  interests: string[]
  goals: string[]
  recentTopics: string[]
  ideaPatterns: {
    categories: Record<string, number>
    developmentStyle: string
    averageIdeaLength: number
  }
  conversationStats: {
    totalConversations: number
    averageSatisfaction: number
    preferredTimes: string[]
    successfulPatterns: string[]
  }
}

interface UsePersonalContextProps {
  user: User
}

export function usePersonalContext({ user }: UsePersonalContextProps) {
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const loadUserContext = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Load user preferences from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single()

      // Analyze user's ideas to understand interests
      const { data: ideas } = await supabase
        .from('ideas')
        .select('category, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Analyze feedback patterns
      const { data: feedback } = await supabase
        .from('message_feedback')
        .select('feedback_type, feedback_value, context_tags, created_at')
        .eq('user_id', user.id)
        .eq('feedback_type', 'rating')
        .gte('feedback_value', 4)
        .limit(100)

      // Analyze conversation outcomes
      const { data: outcomes } = await supabase
        .from('conversation_outcomes')
        .select('satisfaction_score, outcome_type, created_at')
        .eq('user_id', user.id)

      // Build user context
      const context = buildUserContext(profile, ideas, feedback, outcomes)
      setUserContext(context)
      
      devLogger.info('usePersonalContext', 'Loaded user context', {
        userId: user.id,
        interests: context.interests.length,
        goals: context.goals.length
      })
      
    } catch (error) {
      console.error('Error loading user context:', error)
      // Set default context on error
      setUserContext(getDefaultContext())
    } finally {
      setIsLoading(false)
    }
  }, [user.id, supabase])

  const updatePreferences = useCallback(async (
    preferences: Partial<UserPreferences>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          preferences: {
            ...userContext?.preferences,
            ...preferences
          }
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setUserContext(prev => prev ? {
        ...prev,
        preferences: {
          ...prev.preferences,
          ...preferences
        }
      } : null)

      return true
    } catch (error) {
      console.error('Error updating preferences:', error)
      return false
    }
  }, [user.id, userContext, supabase])

  const trackUserInterest = useCallback(async (
    topic: string,
    weight: number = 1
  ) => {
    // This would track what topics the user is interested in
    devLogger.info('usePersonalContext', 'Tracking user interest', { topic, weight })
    
    // Update local state immediately
    setUserContext(prev => {
      if (!prev) return prev
      const interests = [...prev.interests]
      if (!interests.includes(topic)) {
        interests.push(topic)
      }
      return { ...prev, interests }
    })
  }, [])

  const getPersonalizedSuggestions = useCallback((): string[] => {
    if (!userContext) return []

    const suggestions: string[] = []
    
    // Based on recent topics
    if (userContext.recentTopics.length > 0) {
      suggestions.push(`Continue exploring ${userContext.recentTopics[0]}`)
    }

    // Based on interests
    userContext.interests.slice(0, 2).forEach(interest => {
      suggestions.push(`Develop new ideas about ${interest}`)
    })

    // Based on time patterns
    const currentHour = new Date().getHours()
    if (userContext.preferences.workingHours) {
      const { start, end } = userContext.preferences.workingHours
      if (currentHour >= start && currentHour <= end) {
        suggestions.push('Focus on your most important project')
      }
    }

    return suggestions.slice(0, 3)
  }, [userContext])

  // Load context on mount
  useEffect(() => {
    loadUserContext()
  }, [loadUserContext])

  return {
    userContext,
    isLoading,
    updatePreferences,
    trackUserInterest,
    getPersonalizedSuggestions,
    refreshContext: loadUserContext
  }
}

function buildUserContext(
  profile: any,
  ideas: any[],
  feedback: any[],
  outcomes: any[]
): UserContext {
  // Analyze idea categories
  const categoryCount: Record<string, number> = {}
  ideas?.forEach(idea => {
    categoryCount[idea.category] = (categoryCount[idea.category] || 0) + 1
  })

  // Extract interests from idea content
  const interests = extractInterestsFromContent(ideas || [])
  
  // Analyze feedback for preferences
  const preferences = analyzePreferences(feedback || [])
  
  // Calculate average satisfaction
  const avgSatisfaction = outcomes?.length > 0
    ? outcomes.reduce((sum, o) => sum + (o.satisfaction_score || 0), 0) / outcomes.length
    : 0

  return {
    preferences: profile?.preferences || getDefaultPreferences(),
    interests,
    goals: [], // TODO: Extract from conversations
    recentTopics: extractRecentTopics(ideas || []),
    ideaPatterns: {
      categories: categoryCount,
      developmentStyle: determineDevelopmentStyle(ideas || []),
      averageIdeaLength: calculateAverageLength(ideas || [])
    },
    conversationStats: {
      totalConversations: outcomes?.length || 0,
      averageSatisfaction: avgSatisfaction,
      preferredTimes: analyzePreferredTimes(outcomes || []),
      successfulPatterns: extractSuccessfulPatterns(feedback || [])
    }
  }
}

function getDefaultContext(): UserContext {
  return {
    preferences: getDefaultPreferences(),
    interests: [],
    goals: [],
    recentTopics: [],
    ideaPatterns: {
      categories: {},
      developmentStyle: 'exploratory',
      averageIdeaLength: 0
    },
    conversationStats: {
      totalConversations: 0,
      averageSatisfaction: 0,
      preferredTimes: [],
      successfulPatterns: []
    }
  }
}

function getDefaultPreferences(): UserPreferences {
  return {
    communicationStyle: 'balanced',
    responseLength: 'adaptive',
    creativityLevel: 'creative',
    focusAreas: []
  }
}

function extractInterestsFromContent(ideas: any[]): string[] {
  // Simple keyword extraction - could be enhanced with NLP
  const keywords: Record<string, number> = {}
  
  ideas.forEach(idea => {
    const words = idea.content.toLowerCase().split(/\s+/)
    words.forEach(word => {
      if (word.length > 5) { // Focus on meaningful words
        keywords[word] = (keywords[word] || 0) + 1
      }
    })
  })
  
  return Object.entries(keywords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

function extractRecentTopics(ideas: any[]): string[] {
  return ideas
    .slice(0, 5)
    .map(idea => idea.category)
    .filter((v, i, a) => a.indexOf(v) === i)
}

function analyzePreferences(feedback: any[]): Partial<UserPreferences> {
  // Analyze feedback patterns to determine preferences
  const hasDetailedTags = feedback.some(f => 
    f.context_tags?.includes('detailed') || f.context_tags?.includes('thorough')
  )
  
  const hasCreativeTags = feedback.some(f => 
    f.context_tags?.includes('creative') || f.context_tags?.includes('innovative')
  )
  
  return {
    responseLength: hasDetailedTags ? 'detailed' : 'adaptive',
    creativityLevel: hasCreativeTags ? 'innovative' : 'creative'
  }
}

function determineDevelopmentStyle(ideas: any[]): string {
  if (ideas.length === 0) return 'exploratory'
  
  const avgLength = calculateAverageLength(ideas)
  if (avgLength > 500) return 'comprehensive'
  if (avgLength > 200) return 'structured'
  return 'exploratory'
}

function calculateAverageLength(ideas: any[]): number {
  if (ideas.length === 0) return 0
  return ideas.reduce((sum, idea) => sum + idea.content.length, 0) / ideas.length
}

function analyzePreferredTimes(outcomes: any[]): string[] {
  const hourCounts: Record<number, number> = {}
  
  outcomes.forEach(outcome => {
    const hour = new Date(outcome.created_at).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  
  return Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => {
      const h = parseInt(hour)
      if (h < 12) return 'morning'
      if (h < 17) return 'afternoon'
      return 'evening'
    })
    .filter((v, i, a) => a.indexOf(v) === i)
}

function extractSuccessfulPatterns(feedback: any[]): string[] {
  const patterns: string[] = []
  
  const tagCounts: Record<string, number> = {}
  feedback.forEach(f => {
    f.context_tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  
  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag)
}
