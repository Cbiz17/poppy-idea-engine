import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { devLogger } from '@/lib/dev-logger'

export interface Idea {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
  development_count?: number
  visibility?: 'private' | 'public' | 'shared'
  user_id: string
}

interface UseIdeasProps {
  user: User
}

export function useIdeas({ user }: UseIdeasProps) {
  const [currentIdeaContext, setCurrentIdeaContext] = useState<Idea | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const loadIdea = useCallback(async (ideaId: string): Promise<Idea | null> => {
    setIsLoading(true)
    
    try {
      const { data: ideaData, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        console.error('Error fetching idea:', error)
        return null
      }
      
      if (ideaData) {
        setCurrentIdeaContext(ideaData)
        devLogger.info('useIdeas', 'Loaded idea successfully', {
          ideaId: ideaData.id,
          title: ideaData.title
        })
      }
      
      return ideaData
    } catch (error) {
      console.error('Error in loadIdea:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user.id, supabase])

  const saveIdea = useCallback(async (
    ideaData: {
      title: string
      content: string
      category: string
    },
    conversationId?: string | null
  ): Promise<Idea | null> => {
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          ...ideaData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          development_count: 1
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving idea:', error)
        throw error
      }

      // Link to conversation if provided
      if (data && conversationId) {
        await supabase
          .from('conversations')
          .update({ idea_id: data.id })
          .eq('id', conversationId)
      }

      devLogger.info('useIdeas', 'Saved new idea', {
        ideaId: data.id,
        title: data.title,
        linkedToConversation: !!conversationId
      })

      return data
    } catch (error) {
      console.error('Error in saveIdea:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user.id, supabase])

  const updateIdea = useCallback(async (
    ideaId: string,
    updates: {
      title?: string
      content?: string
      category?: string
    },
    developmentType: string = 'refinement'
  ): Promise<Idea | null> => {
    setIsLoading(true)
    
    try {
      // Get current idea for history
      const { data: currentIdea } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single()

      if (!currentIdea) {
        throw new Error('Idea not found')
      }

      // Update the idea
      const { data: updatedIdea, error } = await supabase
        .from('ideas')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          development_count: (currentIdea.development_count || 1) + 1
        })
        .eq('id', ideaId)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Record in development history
      await supabase
        .from('idea_development_history')
        .insert({
          idea_id: ideaId,
          user_id: user.id,
          development_type: developmentType,
          previous_title: currentIdea.title,
          new_title: updates.title || currentIdea.title,
          previous_content: currentIdea.content,
          new_content: updates.content || currentIdea.content,
          change_summary: `Updated: ${Object.keys(updates).join(', ')}`,
          created_at: new Date().toISOString()
        })

      if (updatedIdea) {
        setCurrentIdeaContext(updatedIdea)
      }

      devLogger.info('useIdeas', 'Updated idea', {
        ideaId,
        version: updatedIdea.development_count,
        developmentType
      })

      return updatedIdea
    } catch (error) {
      console.error('Error in updateIdea:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user.id, supabase])

  const fetchIdeaHistory = useCallback(async (ideaId: string) => {
    try {
      const { data: history, error } = await supabase
        .from('idea_development_history')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return history || []
    } catch (error) {
      console.error('Error fetching idea history:', error)
      return []
    }
  }, [supabase])

  const detectRelatedIdeas = useCallback(async (
    conversationContent: string,
    threshold: number = 0.7
  ): Promise<Idea[]> => {
    try {
      // This would call your API endpoint for semantic search
      const response = await fetch('/api/ideas/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: conversationContent,
          threshold,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to search for related ideas')
      }

      const { ideas } = await response.json()
      return ideas || []
    } catch (error) {
      console.error('Error detecting related ideas:', error)
      return []
    }
  }, [user.id])

  return {
    currentIdeaContext,
    setCurrentIdeaContext,
    isLoading,
    loadIdea,
    saveIdea,
    updateIdea,
    fetchIdeaHistory,
    detectRelatedIdeas
  }
}
