import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { devLogger } from '@/lib/dev-logger'

export interface FeedbackInsights {
  overallSatisfaction: number
  preferredResponseStyle: {
    length: 'short' | 'medium' | 'long'
    tone: 'formal' | 'casual' | 'enthusiastic'
    detail: 'high-level' | 'detailed' | 'step-by-step'
  }
  successfulTopics: string[]
  improvementAreas: string[]
  bestTimeToChat: string[]
  feedbackTrends: {
    improving: boolean
    recentAverage: number
    historicalAverage: number
  }
}

export interface ConversationQuality {
  score: number
  factors: {
    clarity: number
    helpfulness: number
    creativity: number
    relevance: number
  }
  suggestions: string[]
}

interface UseFeedbackAnalysisProps {
  user: User
  conversationId?: string | null
}

export function useFeedbackAnalysis({ user, conversationId }: UseFeedbackAnalysisProps) {
  const [insights, setInsights] = useState<FeedbackInsights | null>(null)
  const [conversationQuality, setConversationQuality] = useState<ConversationQuality | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const supabase = createClient()

  const analyzeFeedbackPatterns = useCallback(async (): Promise<FeedbackInsights | null> => {
    try {
      // Get all user feedback
      const { data: feedback } = await supabase
        .from('message_feedback')
        .select(`
          *,
          conversation_messages!inner(
            content,
            role
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!feedback || feedback.length === 0) {
        return null
      }

      // Analyze patterns
      const insights = extractInsights(feedback)
      
      devLogger.info('useFeedbackAnalysis', 'Analyzed feedback patterns', {
        totalFeedback: feedback.length,
        satisfaction: insights.overallSatisfaction
      })
      
      return insights
    } catch (error) {
      console.error('Error analyzing feedback:', error)
      return null
    }
  }, [user.id, supabase])

  const analyzeCurrentConversation = useCallback(async (): Promise<ConversationQuality | null> => {
    if (!conversationId) return null
    
    try {
      // Get feedback for current conversation
      const { data: feedback } = await supabase
        .from('message_feedback')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      // Get conversation messages for context
      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('content, role')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!messages) return null

      const quality = calculateConversationQuality(messages, feedback || [])
      
      devLogger.info('useFeedbackAnalysis', 'Analyzed conversation quality', {
        conversationId,
        score: quality.score
      })
      
      return quality
    } catch (error) {
      console.error('Error analyzing conversation:', error)
      return null
    }
  }, [conversationId, user.id, supabase])

  const submitFeedback = useCallback(async (
    messageId: string,
    feedbackType: 'thumbs_up' | 'thumbs_down' | 'rating',
    value?: number,
    tags?: string[],
    text?: string
  ): Promise<boolean> => {
    if (!conversationId) return false
    
    try {
      const { error } = await supabase
        .from('message_feedback')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          message_id: messageId,
          feedback_type: feedbackType,
          feedback_value: value || (feedbackType === 'thumbs_up' ? 1 : -1),
          context_tags: tags || [],
          feedback_text: text
        })

      if (error) throw error

      // Re-analyze after new feedback
      // loadInsights will be called by useEffect when needed
      
      // Track learning pattern
      await createLearningPattern(messageId, feedbackType, value, tags)
      
      return true
    } catch (error) {
      console.error('Error submitting feedback:', error)
      return false
    }
  }, [conversationId, user.id, supabase])

  const createLearningPattern = async (
    messageId: string,
    feedbackType: string,
    value?: number,
    tags?: string[]
  ) => {
    if (!value || value < 4) return // Only learn from positive feedback
    
    try {
      // Get the message content
      const { data: message } = await supabase
        .from('conversation_messages')
        .select('content, role')
        .eq('id', messageId)
        .single()

      if (!message || message.role !== 'assistant') return

      // Extract pattern from successful response
      const pattern = {
        pattern_type: 'response_style',
        pattern_name: `successful_${tags?.join('_') || 'response'}`,
        pattern_description: `Response that was ${tags?.join(', ') || 'well-received'}`,
        success_metrics: {
          feedback_value: value,
          tags: tags || [],
          response_length: message.content.length,
          timestamp: new Date().toISOString()
        },
        confidence_score: value / 5,
        example_conversations: [conversationId]
      }

      await supabase
        .from('learning_patterns')
        .insert(pattern)
        
    } catch (error) {
      console.error('Error creating learning pattern:', error)
    }
  }

  const getImprovementSuggestions = useCallback((): string[] => {
    if (!insights) return []
    
    const suggestions: string[] = []
    
    if (insights.overallSatisfaction < 3) {
      suggestions.push('Try being more specific about what you need help with')
    }
    
    if (insights.improvementAreas.includes('clarity')) {
      suggestions.push('I can provide clearer explanations - just ask me to elaborate')
    }
    
    if (insights?.preferredResponseStyle?.length === 'short' && conversationQuality?.factors.clarity > 0.7) {
      suggestions.push('I notice you prefer concise responses - I\'ll keep that in mind')
    }
    
    return suggestions
  }, [insights, conversationQuality])

  const loadInsights = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      const [feedbackInsights, convQuality] = await Promise.all([
        analyzeFeedbackPatterns(),
        analyzeCurrentConversation()
      ])
      
      if (feedbackInsights) setInsights(feedbackInsights)
      if (convQuality) setConversationQuality(convQuality)
    } finally {
      setIsAnalyzing(false)
    }
  }, [analyzeFeedbackPatterns, analyzeCurrentConversation])

  // Load insights on mount and when conversation changes
  useEffect(() => {
    loadInsights()
  }, [conversationId, loadInsights])

  return {
    insights,
    conversationQuality,
    isAnalyzing,
    submitFeedback,
    getImprovementSuggestions,
    refreshInsights: loadInsights
  }
}

function extractInsights(feedback: any[]): FeedbackInsights {
  // Calculate overall satisfaction
  const ratings = feedback.filter(f => f.feedback_type === 'rating')
  const overallSatisfaction = ratings.length > 0
    ? ratings.reduce((sum, f) => sum + (f.feedback_value || 0), 0) / ratings.length
    : 3 // neutral default

  // Analyze response preferences
  const successfulResponses = feedback.filter(f => 
    (f.feedback_value || 0) >= 4 || f.feedback_type === 'thumbs_up'
  )
  
  const preferredResponseStyle = analyzeResponseStyle(successfulResponses)
  
  // Extract successful topics from high-rated conversations
  const successfulTopics = extractSuccessfulTopics(successfulResponses)
  
  // Identify improvement areas from low-rated responses
  const improvementAreas = extractImprovementAreas(
    feedback.filter(f => (f.feedback_value || 0) < 3 || f.feedback_type === 'thumbs_down')
  )
  
  // Analyze best times to chat
  const bestTimeToChat = analyzeBestTimes(successfulResponses)
  
  // Calculate trends
  const recentFeedback = feedback.slice(0, 20)
  const olderFeedback = feedback.slice(20)
  
  const recentAvg = calculateAverage(recentFeedback)
  const historicalAvg = calculateAverage(olderFeedback)
  
  return {
    overallSatisfaction,
    preferredResponseStyle,
    successfulTopics,
    improvementAreas,
    bestTimeToChat,
    feedbackTrends: {
      improving: recentAvg > historicalAvg,
      recentAverage: recentAvg,
      historicalAverage: historicalAvg
    }
  }
}

function analyzeResponseStyle(feedback: any[]) {
  const lengths = feedback.map(f => f.conversation_messages?.content?.length || 0)
  const avgLength = lengths.reduce((a, b) => a + b, 0) / Math.max(lengths.length, 1)
  
  const tags = feedback.flatMap(f => f.context_tags || [])
  const tagCounts: Record<string, number> = {}
  tags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1
  })
  
  return {
    length: avgLength > 500 ? 'long' : avgLength > 200 ? 'medium' : 'short' as const,
    tone: tagCounts['formal'] > tagCounts['casual'] ? 'formal' : 
          tagCounts['enthusiastic'] > 5 ? 'enthusiastic' : 'casual' as const,
    detail: tagCounts['detailed'] > tagCounts['concise'] ? 'detailed' :
            tagCounts['step-by-step'] > 3 ? 'step-by-step' : 'high-level' as const
  }
}

function extractSuccessfulTopics(feedback: any[]): string[] {
  const topics: Record<string, number> = {}
  
  feedback.forEach(f => {
    const content = f.conversation_messages?.content || ''
    // Simple topic extraction - could be enhanced
    const words = content.toLowerCase().split(/\s+/)
    words.forEach(word => {
      if (word.length > 6) {
        topics[word] = (topics[word] || 0) + 1
      }
    })
  })
  
  return Object.entries(topics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic]) => topic)
}

function extractImprovementAreas(feedback: any[]): string[] {
  const areas = new Set<string>()
  
  feedback.forEach(f => {
    if (f.feedback_text?.includes('clear')) areas.add('clarity')
    if (f.feedback_text?.includes('relevant')) areas.add('relevance')
    if (f.feedback_text?.includes('help')) areas.add('helpfulness')
    if (f.context_tags?.includes('confusing')) areas.add('clarity')
    if (f.context_tags?.includes('off-topic')) areas.add('relevance')
  })
  
  return Array.from(areas)
}

function analyzeBestTimes(feedback: any[]): string[] {
  const hourCounts: Record<string, number> = {}
  
  feedback.forEach(f => {
    const hour = new Date(f.created_at).getHours()
    const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    hourCounts[period] = (hourCounts[period] || 0) + 1
  })
  
  return Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([period]) => period)
}

function calculateAverage(feedback: any[]): number {
  const values = feedback
    .filter(f => f.feedback_type === 'rating')
    .map(f => f.feedback_value || 0)
  
  return values.length > 0 
    ? values.reduce((a, b) => a + b, 0) / values.length 
    : 3
}

function calculateConversationQuality(
  messages: any[],
  feedback: any[]
): ConversationQuality {
  const factors = {
    clarity: 0.7, // Default scores
    helpfulness: 0.7,
    creativity: 0.5,
    relevance: 0.8
  }
  
  // Adjust based on feedback
  feedback.forEach(f => {
    if (f.context_tags?.includes('clear')) factors.clarity += 0.1
    if (f.context_tags?.includes('helpful')) factors.helpfulness += 0.1
    if (f.context_tags?.includes('creative')) factors.creativity += 0.1
    if (f.context_tags?.includes('relevant')) factors.relevance += 0.1
    
    if (f.feedback_type === 'thumbs_down') {
      Object.keys(factors).forEach(key => {
        factors[key as keyof typeof factors] *= 0.9
      })
    }
  })
  
  // Normalize scores
  Object.keys(factors).forEach(key => {
    factors[key as keyof typeof factors] = Math.min(1, Math.max(0, factors[key as keyof typeof factors]))
  })
  
  const score = Object.values(factors).reduce((a, b) => a + b, 0) / 4
  
  const suggestions: string[] = []
  if (factors.clarity < 0.6) suggestions.push('Focus on clearer explanations')
  if (factors.creativity < 0.5) suggestions.push('Try more creative approaches')
  if (factors.relevance < 0.7) suggestions.push('Stay focused on the main topic')
  
  return { score, factors, suggestions }
}
