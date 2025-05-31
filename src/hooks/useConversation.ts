import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { devLogger } from '@/lib/dev-logger'

interface Conversation {
  id: string
  user_id: string
  idea_id?: string | null
  title: string
  created_at: string
  updated_at: string
}

interface UseConversationProps {
  user: User
  initialIdeaId?: string | null
}

export function useConversation({ user, initialIdeaId }: UseConversationProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()

  const createConversation = useCallback(async (ideaId?: string | null): Promise<Conversation | null> => {
    setIsCreating(true)
    
    try {
      devLogger.info('useConversation', 'Creating new conversation', { 
        userId: user.id, 
        ideaId 
      })

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({ 
          user_id: user.id, 
          idea_id: ideaId || null, 
          title: ideaId ? 'Chat about existing idea' : 'New Chat',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        devLogger.error('useConversation', 'Failed to create conversation', {
          error: error.message,
          code: error.code,
          details: error.details
        })
        return null
      }
      
      devLogger.info('useConversation', 'Conversation created successfully', { 
        conversationId: newConversation.id 
      })
      
      setCurrentConversationId(newConversation.id)
      return newConversation
    } catch (error) {
      console.error('Unexpected error in createConversation:', error)
      devLogger.error('useConversation', 'Unexpected error creating conversation', { error })
      return null
    } finally {
      setIsCreating(false)
    }
  }, [user.id, supabase])

  const ensureConversationSession = useCallback(async (ideaId?: string | null): Promise<Conversation | null> => {
    try {
      // If we already have a conversation, verify it exists
      if (currentConversationId) {
        const { data: existingConv, error } = await supabase
          .from('conversations')
          .select()
          .eq('id', currentConversationId)
          .single()
        
        if (existingConv && !error) {
          // Update idea_id if needed
          if (ideaId && !existingConv.idea_id) {
            await supabase
              .from('conversations')
              .update({ idea_id: ideaId })
              .eq('id', currentConversationId)
              
            devLogger.info('useConversation', 'Updated conversation with idea', { 
              conversationId: currentConversationId, 
              ideaId 
            })
          }
          return existingConv
        }
      }

      // Create a new conversation
      return await createConversation(ideaId || initialIdeaId)
    } catch (error) {
      console.error('Error in ensureConversationSession:', error)
      return null
    }
  }, [currentConversationId, initialIdeaId, createConversation, supabase])

  const loadConversation = useCallback(async (conversationId: string): Promise<Conversation | null> => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select()
        .eq('id', conversationId)
        .single()

      if (error) {
        console.error('Error loading conversation:', error)
        return null
      }

      setCurrentConversationId(data.id)
      return data
    } catch (error) {
      console.error('Error in loadConversation:', error)
      return null
    }
  }, [supabase])

  const updateConversationTitle = useCallback(async (title: string): Promise<boolean> => {
    if (!currentConversationId) return false

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentConversationId)

      if (error) {
        console.error('Error updating conversation title:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateConversationTitle:', error)
      return false
    }
  }, [currentConversationId, supabase])

  return {
    currentConversationId,
    setCurrentConversationId,
    isCreating,
    createConversation,
    ensureConversationSession,
    loadConversation,
    updateConversationTitle
  }
}
