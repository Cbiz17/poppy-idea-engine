import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface UseChatProps {
  user: User
  conversationId: string | null
}

export function useChat({ user, conversationId }: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const updateMessage = useCallback((messageId: string, content: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content } 
          : msg
      )
    )
  }, [])

  const generateEmbedding = async (text: string): Promise<number[] | null> => {
    try {
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      
      if (!response.ok) {
        console.error('Failed to generate embedding:', response.status)
        return null
      }
      
      const { embedding } = await response.json()
      return embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      return null
    }
  }

  const saveMessageToDatabase = useCallback(async (
    message: Message, 
    conversationId: string
  ): Promise<string | null> => {
    if (!conversationId) {
      console.warn('No conversationId provided for message save')
      return null
    }
    
    try {
      // Generate embedding for the message
      const embedding = await generateEmbedding(message.content)
      
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: message.role,
          content: message.content,
          embedding: embedding,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()
        
      if (error) {
        console.error('Error saving message to DB:', error)
        return null
      }
      
      console.log(`Message saved with embedding (${embedding ? 'success' : 'no embedding'})`)
      return data.id
    } catch (error) {
      console.error('Error in saveMessageToDatabase:', error)
      return null
    }
  }, [user.id, supabase])

  const sendMessage = useCallback(async (
    content: string,
    onStreamUpdate?: (content: string) => void
  ) => {
    if (!content.trim() || isLoading || !conversationId) return

    setIsLoading(true)
    
    // Create user message with proper UUID
    const userMessage: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      role: 'user',
      timestamp: new Date()
    }
    
    addMessage(userMessage)

    // Create assistant placeholder with proper UUID
    const assistantMessageId = crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date()
    }
    
    addMessage(assistantPlaceholder)

    try {
      // Save user message with embedding
      const userMessageDbId = await saveMessageToDatabase(userMessage, conversationId)
      if (userMessageDbId) {
        // Update the message ID to match database
        setMessages(prev => 
          prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, id: userMessageDbId }
              : msg
          )
        )
      }

      // Make API call
      const response = await fetch('/api/chat-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({
            role: m.role, 
            content: m.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // Stream the response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let streamedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        streamedContent += decoder.decode(value, { stream: true })
        updateMessage(assistantMessageId, streamedContent)
        
        if (onStreamUpdate) {
          onStreamUpdate(streamedContent)
        }
      }

      streamedContent += decoder.decode()
      
      // Save assistant message with embedding
      const assistantMessageDbId = await saveMessageToDatabase(
        { 
          ...assistantPlaceholder, 
          content: streamedContent, 
          timestamp: new Date() 
        }, 
        conversationId
      )
      
      if (assistantMessageDbId) {
        // Update the message ID to match database
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, id: assistantMessageDbId }
              : msg
          )
        )
      }

      return streamedContent
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "I'm sorry, I'm having trouble responding right now. Please try again."
      
      updateMessage(assistantMessageId, errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, conversationId, addMessage, updateMessage, saveMessageToDatabase])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    addMessage,
    updateMessage,
    clearMessages,
    setMessages
  }
}
