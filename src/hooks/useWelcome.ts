import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { getTimeAgo, generateSuggestions } from '@/utils/ideaProcessing'
import { getDefaultWelcomeMessage } from '@/utils/messageHelpers'
import { Message } from './useChat'

export interface WelcomeData {
  message: string
  lastConversation?: {
    id: string
    title: string
    preview: string
    timeAgo: string
  }
  lastConversationIdeaId?: string | null
  recentIdeas: Array<{
    id: string
    title: string
    category: string
  }>
  suggestions: string[]
  stats: {
    totalIdeas: number
    totalConversations: number
  }
}

export function useWelcome(user: User) {
  const [showWelcomePulse, setShowWelcomePulse] = useState(false)
  const supabase = createClient()

  const generatePersonalizedWelcome = useCallback(async (): Promise<WelcomeData> => {
    try {
      // Fetch user's last conversation with idea information
      const { data: lastConv } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          updated_at,
          idea_id,
          ideas!left(id, title, category),
          conversation_messages!inner(
            content,
            role,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      // Fetch user's recent ideas
      const { data: recentIdeas } = await supabase
        .from('ideas')
        .select('id, title, category, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3)

      // Fetch user patterns
      const { data: categoryStats } = await supabase
        .from('ideas')
        .select('category')
        .eq('user_id', user.id)

      const { data: conversationStats } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)

      // Build welcome data
      const welcomeData: WelcomeData = {
        message: '',
        recentIdeas: recentIdeas || [],
        suggestions: [],
        stats: {
          totalIdeas: categoryStats?.length || 0,
          totalConversations: conversationStats?.length || 0
        },
        lastConversationIdeaId: lastConv?.idea_id || null
      }

      // Process last conversation
      if (lastConv && lastConv.conversation_messages && Array.isArray(lastConv.conversation_messages) && lastConv.conversation_messages.length > 0) {
        const messages = Array.isArray(lastConv.conversation_messages) ? lastConv.conversation_messages : []
        const lastUserMessage = messages
          .filter((m: any) => m.role === 'user')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
        if (lastUserMessage) {
          welcomeData.lastConversation = {
            id: lastConv.id,
            title: lastConv.title || 'Previous conversation',
            preview: lastUserMessage.content.length > 100 
              ? lastUserMessage.content.substring(0, 100) + "..."
              : lastUserMessage.content,
            timeAgo: getTimeAgo(new Date(lastConv.updated_at))
          }
        }
      }

      // Generate suggestions based on categories
      if (categoryStats && categoryStats.length > 0) {
        const categoryCount: Record<string, number> = {}
        categoryStats.forEach((idea: any) => {
          categoryCount[idea.category] = (categoryCount[idea.category] || 0) + 1
        })
        const favoriteCategories = Object.entries(categoryCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([cat]) => cat)

        welcomeData.suggestions = generateSuggestions(favoriteCategories, recentIdeas || [])
      }

      // Build the welcome message
      let message = "Welcome back! 🌟\n\n"

      if (welcomeData.lastConversation) {
        message += `📍 **Where you left off** (${welcomeData.lastConversation.timeAgo}):\n`
        message += `You were exploring: *"${welcomeData.lastConversation.preview}"*\n\n`
      }

      if (welcomeData.recentIdeas.length > 0) {
        message += "💡 **Your recent ideas**:\n"
        welcomeData.recentIdeas.forEach((idea: any) => {
          message += `• ${idea.title} (${idea.category})\n`
        })
        message += "\n"
      }

      if (welcomeData.suggestions.length > 0) {
        message += "🚀 **Based on your interests, you might want to**:\n"
        welcomeData.suggestions.forEach(suggestion => {
          message += `• ${suggestion}\n`
        })
        message += "\n"
      }

      if (welcomeData.stats.totalIdeas > 0) {
        message += `📊 **Your journey so far**: ${welcomeData.stats.totalIdeas} ideas across ${welcomeData.stats.totalConversations} conversations\n\n`
      }

      message += "What would you like to explore today?"
      welcomeData.message = message

      return welcomeData

    } catch (error) {
      console.error('Error generating personalized welcome:', error)
      return {
        message: getDefaultWelcomeMessage(),
        recentIdeas: [],
        suggestions: [],
        stats: { totalIdeas: 0, totalConversations: 0 }
      }
    }
  }, [user.id, supabase])

  const renderWelcomeWithActions = useCallback((welcomeData: WelcomeData): string => {
    let message = welcomeData.message
    
    message += "\n\n"
    message += "🎯 **Quick Actions:**\n"
    
    if (welcomeData.lastConversation) {
      message += `• 🔄 Continue where you left off\n`
    }
    
    if (welcomeData.recentIdeas.length > 0) {
      message += `• 📊 Develop "${welcomeData.recentIdeas[0].title}"\n`
    }
    
    if (welcomeData.suggestions.length > 0) {
      message += `• 🎯 Start guided exploration\n`
    }
    
    if (welcomeData.stats.totalIdeas > 3) {
      message += `• 💡 Browse all your ideas\n`
    }
    
    message += `• ✨ Start something new\n`
    message += "\n_Click any action above or simply type below to begin!_"
    
    return message
  }, [])

  const generateWelcomeMessage = useCallback(async (): Promise<Message> => {
    // Check if this is a returning user
    const { data: existingConversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
    
    const isReturningUser = existingConversations && existingConversations.length > 0
    
    let welcomeMessage: string
    let welcomeData: WelcomeData | null = null
    
    if (isReturningUser) {
      welcomeData = await generatePersonalizedWelcome()
      welcomeMessage = renderWelcomeWithActions(welcomeData)
      
      // Store welcome data for action handling
      ;(window as any).__poppyWelcomeData = welcomeData
      
      // Enable pulse animation for send button
      setShowWelcomePulse(true)
      
      // Stop pulsing after user interacts or after 10 seconds
      setTimeout(() => setShowWelcomePulse(false), 10000)
    } else {
      welcomeMessage = getDefaultWelcomeMessage()
    }
    
    return {
      id: '1',
      content: welcomeMessage,
      role: 'assistant',
      timestamp: new Date()
    }
  }, [user.id, generatePersonalizedWelcome, renderWelcomeWithActions, supabase])

  return {
    showWelcomePulse,
    setShowWelcomePulse,
    generateWelcomeMessage
  }
}
