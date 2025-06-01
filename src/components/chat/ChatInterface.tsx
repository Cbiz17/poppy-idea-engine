'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { devLogger } from '@/lib/dev-logger'

// Hooks
import {
  useChat,
  useConversation,
  useIdeas,
  useContinuation,
  useWelcome,
  useSpecialCommands,
  type Message,
  type Idea
,
  usePersonalContext,
  useFeedbackAnalysis,
  type UserContext,
  type FeedbackInsights
} from '@/hooks'

// Components
import {
  ChatHeader,
  ContinuationBanner,
  IdeaDevelopmentBanner,
  ChatInput,
  ChatMessage,
  FloatingSaveButton
} from './components'

import IdeaReviewModal from '@/components/ideas/IdeaReviewModal'
import EnhancedSaveModal from '@/components/ideas/EnhancedSaveModal'
import FeedbackTooltip from '@/components/feedback/FeedbackTooltip'

// Utils
import {
  detectValueableContent,
  shouldPromptToSave,
  formatConversationContext
} from '@/utils/messageHelpers'
import { processIdeaWithAI, prepareSaveMetadata } from '@/utils/ideaProcessing'
import { CATEGORIES } from '@/constants'

interface ChatInterfaceProps {
  user: User
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [hasNewMessages, setHasNewMessages] = useState(false)

  // State
  const [input, setInput] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)
  const [showSavePrompt, setShowSavePrompt] = useState<string | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isEnhancedModalOpen, setIsEnhancedModalOpen] = useState(false)
  const [suggestedIdeaForReview, setSuggestedIdeaForReview] = useState<any>(null)
  const [hasLoadedIdea, setHasLoadedIdea] = useState(false)
  const [showFloatingSave, setShowFloatingSave] = useState(false)
  const [selectedMessageForSave, setSelectedMessageForSave] = useState<string | null>(null)
  const [hasValueableContent, setHasValueableContent] = useState(false)

  // Hooks
  const {
    currentConversationId,
    setCurrentConversationId,
    ensureConversationSession,
    createConversation,
    loadConversation
  } = useConversation({ user })

  const {
    messages,
    isLoading,
    sendMessage,
    addMessage,
    updateMessage,
    clearMessages,
    setMessages
  } = useChat({ user, conversationId: currentConversationId })

  const {
    currentIdeaContext,
    setCurrentIdeaContext,
    loadIdea,
    saveIdea,
    updateIdea,
    fetchIdeaHistory: fetchHistory
  } = useIdeas({ user })

  const {
    continuationContext,
    showContinuationBanner,
    messageCountSinceDetection,
    detectContinuation,
    incrementMessageCount,
    resetMessageCount,
    dismissBanner,
    clearContinuation,
    setContinuationContext
  } = useContinuation()

  const {
    showWelcomePulse,
    setShowWelcomePulse,
    generateWelcomeMessage
  } = useWelcome(user)

  const { handleSpecialCommands } = useSpecialCommands({
    currentIdeaContext,
    fetchIdeaHistory: fetchHistory,
    addMessage
  });

  const {
    userContext,
    trackUserInterest,
    getPersonalizedSuggestions
  } = usePersonalContext({ user })

  const {
    insights,
    conversationQuality,
    submitFeedback,
    getImprovementSuggestions
  } = useFeedbackAnalysis({ user, conversationId: currentConversationId })

  // Smart scroll behavior
  const checkIfNearBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom < 100 // Within 100px of bottom
  }, [])

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  // Monitor scroll position
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const nearBottom = checkIfNearBottom()
      setIsNearBottom(nearBottom)
      if (nearBottom && hasNewMessages) {
        setHasNewMessages(false)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [checkIfNearBottom, hasNewMessages])

  // Scroll to bottom when messages change - but only if user is near bottom
  useEffect(() => {
    // Don't scroll if modals are open
    if (isReviewModalOpen || isEnhancedModalOpen) return
    
    // Check if this is a new message (not initial load)
    const isNewMessage = messages.length > 0 && !isInitializing
    
    if (isNearBottom || isLoading) {
      // User is near bottom or AI is responding, auto-scroll
      // Longer delay for AI responses to ensure content is rendered
      const delay = isLoading ? 200 : 100
      setTimeout(() => scrollToBottom('smooth'), delay)
    } else if (isNewMessage) {
      // User is reading above, show indicator
      setHasNewMessages(true)
    }
  }, [messages, isLoading, isReviewModalOpen, isEnhancedModalOpen, isNearBottom, isInitializing, scrollToBottom])

  // Force scroll when AI is loading (typing)
  useEffect(() => {
    if (isLoading && !isReviewModalOpen && !isEnhancedModalOpen) {
      // Small delay to ensure loading indicator is rendered
      const timer = setTimeout(() => {
        scrollToBottom('smooth')
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isLoading, isReviewModalOpen, isEnhancedModalOpen, scrollToBottom])

  // Monitor for valuable content
  useEffect(() => {
    const hasValuable = messages.some(m => 
      m.role === 'assistant' && 
      m.id !== '1' && 
      detectValueableContent(m.content)
    )
    setHasValueableContent(hasValuable)
    
    if (messages.length > 3 && hasValuable) {
      setShowFloatingSave(true)
    }
  }, [messages])

  // Smart continuation detection
  useEffect(() => {
    const runSmartDetection = async () => {
      if (messages.length >= 4 && !showContinuationBanner && messageCountSinceDetection >= 4) {
        await detectContinuation(messages)
        resetMessageCount()
      }
    }

    if (!isInitializing && !isLoading) {
      runSmartDetection()
    }
  }, [messages.length, messageCountSinceDetection, showContinuationBanner, isInitializing, isLoading, detectContinuation, resetMessageCount, messages])

  // Add effect to handle welcome action prompts
  useEffect(() => {
    const handleWelcomeAction = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.prompt) {
        setInput(customEvent.detail.prompt)
      }
    }

    window.addEventListener('poppy-welcome-action', handleWelcomeAction)
    return () => window.removeEventListener('poppy-welcome-action', handleWelcomeAction)
  }, [])

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      setIsInitializing(true)
      try {
        const ideaId = searchParams.get('idea')
        
        if (ideaId && !hasLoadedIdea) {
          clearMessages()
          await loadIdeaIntoChat(ideaId)
        } else if (!ideaId && !hasLoadedIdea) {
          const welcomeMessage = await generateWelcomeMessage()
          setMessages([welcomeMessage])
          
          const conv = await ensureConversationSession(null)
          if (conv) {
            devLogger.info('ChatInterface', 'Created initial conversation', { conversationId: conv.id })
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
        setMessages([{
          id: '1',
          content: "Hello! I'm Poppy, your AI thinking partner. What's on your mind today?",
          role: 'assistant',
          timestamp: new Date()
        }])
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()
  }, [searchParams.get('idea')])

  const loadIdeaIntoChat = async (ideaId: string) => {
    try {
      const idea = await loadIdea(ideaId)
      if (!idea) return

      // Check for existing conversation
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_messages(
            id,
            content,
            role,
            created_at
          )
        `)
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (existingConversations && existingConversations.length > 0) {
        const conv = existingConversations[0]
        setCurrentConversationId(conv.id)
        
        const messages = conv.conversation_messages.map((m: any) => ({
          id: m.id,
          content: m.content,
          role: m.role as 'user' | 'assistant',
          timestamp: new Date(m.created_at)
        }))
        
        const lastMessage = messages[messages.length - 1]
        if (!lastMessage || lastMessage.role === 'user') {
          messages.push({
            id: `continue-${Date.now()}`,
            content: `🔄 **Continuing your idea**: "${idea.title}"\n\n📝 **Current version**: "${idea.content}"\n\n🚀 **Development mode**: All improvements will be tracked in this idea's history. Type "/history" to see the complete evolution.\n\nWhat would you like to develop or refine further?`,
            role: 'assistant',
            timestamp: new Date()
          })
        }
        
        setMessages(messages)
      } else {
        // Create new conversation for this idea
        const newConv = await createConversation(ideaId)
        if (newConv) setCurrentConversationId(newConv.id)

        const ideaSeedMessage: Message = {
          id: 'idea-seed-' + ideaId,
          content: `🔄 **Continuing your idea**: "${idea.title}"\n\n📝 **Current version**: "${idea.content}"\n\n🚀 **Development mode**: All improvements will be tracked in this idea's history. Type "/history" to see the complete evolution.\n\nWhat would you like to develop or refine further?`,
          role: 'assistant',
          timestamp: new Date()
        }
        
        setMessages([ideaSeedMessage])
      }
      
      setHasLoadedIdea(true)
    } catch (error) {
      console.error('Error loading idea:', error)
    }
  }

  const fetchIdeaHistory = async (ideaId: string) => {
    try {
      const history = await fetchHistory(ideaId)
      const { data: idea } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single()

      let historyMessage = `📚 **Complete History of "${idea?.title || 'This Idea'}"**\n\n`
      
      if (idea) {
        historyMessage += `🌱 **Original Idea** (Created ${new Date(idea.created_at).toLocaleDateString()}):\n`
        historyMessage += `*Title:* ${idea.title}\n`
        historyMessage += `*Content:* ${idea.content}\n`
        historyMessage += `*Category:* ${idea.category}\n\n`
      }

      if (history && history.length > 0) {
        historyMessage += `🔄 **Development History** (${history.length} updates):\n\n`
        
        history.forEach((entry: any, index: number) => {
          const date = new Date(entry.created_at).toLocaleDateString()
          const time = new Date(entry.created_at).toLocaleTimeString()
          
          historyMessage += `**Update ${index + 1}** - ${date} at ${time}\n`
          historyMessage += `🔸 *Type:* ${entry.development_type.replace('_', ' ')}\n`
          
          if (entry.previous_title !== entry.new_title) {
            historyMessage += `📝 *Title changed from:* "${entry.previous_title}" → "${entry.new_title}"\n`
          }
          
          historyMessage += `💬 *Changes:* ${entry.change_summary}\n`
          
          if (entry.ai_confidence_score) {
            historyMessage += `🤖 *AI Confidence:* ${Math.round(entry.ai_confidence_score * 100)}%\n`
          }
          
          historyMessage += `\n📦 **Content at this point:**\n${entry.new_content}\n\n`
          historyMessage += `---\n\n`
        })
        
        historyMessage += `📋 **Summary:**\n`
        historyMessage += `• Total updates: ${history.length}\n`
        historyMessage += `• Last updated: ${new Date(history[history.length - 1].created_at).toLocaleDateString()}\n`
        historyMessage += `• Development span: ${Math.ceil((new Date(history[history.length - 1].created_at).getTime() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60 * 24))} days\n`
      } else {
        historyMessage += `*No development history yet - this is the original version.*\n`
      }

      addMessage({
        id: `history-${Date.now()}`,
        content: historyMessage,
        role: 'assistant',
        timestamp: new Date()
      })
      
    } catch (error) {
      console.error('Error fetching idea history:', error)
      addMessage({
        id: `error-${Date.now()}`,
        content: "I couldn't fetch the idea history. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      })
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    // Check for special commands
    if (handleSpecialCommands(input.trim())) {
      setInput('')
      return
    }

    setShowWelcomePulse(false)
    incrementMessageCount()

    devLogger.info('ChatInterface', 'Sending message', { 
      messageLength: input.length,
      conversationId: currentConversationId 
    })

    // Ensure we have a conversation
    let convId = currentConversationId
    if (!convId) {
      const newConv = await ensureConversationSession(searchParams.get('idea'))
      if (newConv) {
        convId = newConv.id
      } else {
        alert('Error starting conversation. Please try again.')
        return
      }
    }

    const userInput = input.trim()
    setInput('')

    try {
      const response = await sendMessage(userInput, (streamedContent) => {
        // Optional: Handle streaming updates
        if (shouldPromptToSave(streamedContent)) {
          // We'll check after the message is complete
        }
      })

      // Check if we should prompt to save
      if (response && shouldPromptToSave(response)) {
        const lastAssistantMessage = messages.find(m => m.role === 'assistant' && m.content === response)
        if (lastAssistantMessage) {
          setShowSavePrompt(lastAssistantMessage.id)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleQuickSave = async (messageId?: string) => {
    if (messageId) {
      setSelectedMessageForSave(messageId)
      await handleSaveIdea(messageId)
    } else {
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant' && m.id !== '1').pop()
      if (lastAssistantMessage) {
        await handleSaveIdea(lastAssistantMessage.id)
      }
    }
  }

  const handleSaveIdea = async (messageId: string) => {
    setShowSavePrompt(null)
    
    const contextMessages = messages.filter(m => m.id !== '1')
    const processedIdea = await processIdeaWithAI(contextMessages)
    
    setSuggestedIdeaForReview({ ...processedIdea, originalMessageId: messageId })
    
    if (continuationContext || currentIdeaContext) {
      setIsEnhancedModalOpen(true)
    } else {
      setIsReviewModalOpen(true)
    }
  }

  const handleBranchIdea = async (messageId: string) => {
    setShowSavePrompt(null)
    
    const contextMessages = messages.filter(m => m.id !== '1')
    const processedIdea = await processIdeaWithAI(contextMessages)
    
    const branchContext = {
      ...processedIdea,
      originalMessageId: messageId,
      isBranch: true,
      parentIdeaId: currentIdeaContext?.id,
      parentIdeaTitle: currentIdeaContext?.title,
      branchNote: `Branched from "${currentIdeaContext?.title}" to explore a new direction`
    }
    
    setSuggestedIdeaForReview(branchContext)
    setIsReviewModalOpen(true)
  }

  const handleConfirmSaveIdea = async (
    editedIdea: {title: string, content: string, category: string}, 
    saveType: 'update' | 'new' | 'merge' = 'new',
    metadata?: any
  ) => {
    setIsReviewModalOpen(false)
    setIsEnhancedModalOpen(false)
    
    try {
      const fullMetadata = prepareSaveMetadata(currentIdeaContext, continuationContext, saveType)
      const isBranch = (suggestedIdeaForReview as any)?.isBranch
      
      let savedIdea = null
      
      if (isBranch) {
        // Handle branch saves through API
        const response = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editedIdea,
            conversationId: currentConversationId,
            branchedFromId: currentIdeaContext?.id || fullMetadata.parentIdeaId,
            branchNote: (suggestedIdeaForReview as any)?.branchNote || fullMetadata.branchNote,
            isBranch: true
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Branch save failed:', errorData)
          throw new Error('Failed to create branched idea')
        }
        const { idea } = await response.json()
        savedIdea = idea
        
      } else if (saveType === 'new') {
        // Create new idea
        savedIdea = await saveIdea(editedIdea, currentConversationId)
        
      } else if (saveType === 'update' || saveType === 'merge') {
        // Update existing idea
        const targetIdeaId = currentIdeaContext?.id || continuationContext?.relatedIdeaId
        if (targetIdeaId) {
          savedIdea = await updateIdea(
            targetIdeaId,
            editedIdea,
            saveType === 'merge' ? 'major_revision' : 'refinement'
          )
        }
      }

      if (savedIdea) {
        // Track user action
        await supabase
          .from('user_actions')
          .insert({
            user_id: user.id,
            conversation_id: currentConversationId,
            idea_id: savedIdea.id,
            action_type: 'idea_saved',
            action_metadata: {
              idea_title: editedIdea.title,
              idea_category: editedIdea.category,
              content_length: editedIdea.content.length,
              save_type: saveType,
              ...(metadata || {})
            }
          })

        const actionMessage = saveType === 'new' 
          ? 'New idea created successfully!' 
          : `Idea updated successfully! (Version ${savedIdea.development_count || 1})`
        
        alert(actionMessage)
        
        clearContinuation()
        
        if (saveType !== 'new' && savedIdea) {
          setCurrentIdeaContext(savedIdea)
        }
      }
      
    } catch (error) {
      console.error('Error saving idea:', error)
      alert(`Failed to save idea: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSuggestedIdeaForReview(null)
    }
  }

  const handleSignOut = async () => {
    try {
      // Call the signout API route
      const response = await fetch('/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // The server will handle the redirect
        window.location.href = response.url
      } else {
        // Fallback to client-side signout
        await supabase.auth.signOut()
        router.push('/')
      }
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback to client-side signout
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-5 h-5 text-white animate-pulse">✨</div>
          </div>
          <p className="text-gray-600">Initializing Poppy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col overflow-hidden">
      <ChatHeader
        user={user}
        messagesLength={messages.length}
        hasValueableContent={hasValueableContent}
        onQuickSave={() => handleQuickSave()}
        onSignOut={handleSignOut}
      />

      {showContinuationBanner && continuationContext && (
        <ContinuationBanner
          continuationContext={continuationContext}
          onDismiss={dismissBanner}
        />
      )}

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col overflow-hidden">
        {currentIdeaContext && (
          <IdeaDevelopmentBanner
            currentIdeaContext={currentIdeaContext}
            onViewHistory={() => fetchIdeaHistory(currentIdeaContext.id)}
          />
        )}
        
        {/* Main chat area with proper scroll container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 pb-4 scroll-smooth">
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  currentIdeaContext={currentIdeaContext}
                  onSaveIdea={handleSaveIdea}
                  onBranchIdea={handleBranchIdea}
                  onQuickSave={handleQuickSave}
                  showSavePrompt={showSavePrompt === message.id}
                  onHandleSaveIdea={handleSaveIdea}
                  onDismissSavePrompt={() => setShowSavePrompt(null)}
                  isLoading={isLoading}
                  suggestedIdeaForReview={suggestedIdeaForReview}
                />
              ))}
              
              {isLoading && !isReviewModalOpen && !isEnhancedModalOpen && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Spacer div to ensure scroll to bottom works properly */}
              <div ref={messagesEndRef} className="h-20" />
            </div>
          </div>

          {/* Input area - fixed at bottom of chat container */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            showWelcomePulse={showWelcomePulse}
            messagesLength={messages.length}
          />
        </div>
      </div>
      
      {/* New messages indicator - positioned relative to viewport */}
      {hasNewMessages && !isNearBottom && (
        <button
          onClick={() => {
            scrollToBottom('smooth')
            setHasNewMessages(false)
          }}
          className="fixed bottom-32 right-8 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2 animate-bounce z-20"
        >
          <span>New message</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
      
      {/* Floating save button - positioned above input */}
      {showFloatingSave && hasValueableContent && (
        <FloatingSaveButton
          hasValueableContent={hasValueableContent}
          currentIdeaContext={currentIdeaContext}
          continuationContext={continuationContext}
          onQuickSave={() => handleQuickSave()}
          onSaveAsNew={() => handleQuickSave()}
          onUpdate={() => {
            const lastAssistant = messages.filter(m => m.role === 'assistant' && m.id !== '1').pop()
            if (lastAssistant) handleSaveIdea(lastAssistant.id)
          }}
          onContinue={() => {
            const lastAssistant = messages.filter(m => m.role === 'assistant' && m.id !== '1').pop()
            if (lastAssistant) handleSaveIdea(lastAssistant.id)
          }}
        />
      )}
      
      {/* Modals */}
      {suggestedIdeaForReview && !continuationContext && !currentIdeaContext && (
        <IdeaReviewModal
          isOpen={isReviewModalOpen}
          suggestedIdea={suggestedIdeaForReview}
          onClose={() => {
            setIsReviewModalOpen(false)
            setSuggestedIdeaForReview(null)
          }}
          onSave={(idea) => handleConfirmSaveIdea(idea, 'new')}
          categories={[...CATEGORIES]}
        />
      )}
      
      {suggestedIdeaForReview && (continuationContext || currentIdeaContext) && (
        <EnhancedSaveModal
          isOpen={isEnhancedModalOpen}
          suggestedIdea={suggestedIdeaForReview}
          originalIdea={currentIdeaContext || (continuationContext ? {
            id: continuationContext.relatedIdeaId!,
            title: continuationContext.relatedIdeaTitle!,
            content: continuationContext.relatedIdeaContent!,
            category: continuationContext.relatedIdeaCategory!
          } : null)}
          continuationContext={continuationContext ? {
            relatedIdeaId: continuationContext.relatedIdeaId!,
            confidence: continuationContext.confidence,
            contextSummary: '',
            suggestedAction: continuationContext.suggestedAction!,
            detectionMethod: continuationContext.detectionMethod as any,
            timeSinceLastUpdate: continuationContext.timeSinceLastUpdate,
            previousDevelopments: continuationContext.previousDevelopments
          } : null}
          conversationHistory={messages.map(m => ({role: m.role, content: m.content}))}
          onClose={() => {
            setIsEnhancedModalOpen(false)
            setSuggestedIdeaForReview(null)
          }}
          onSave={handleConfirmSaveIdea}
          categories={[...CATEGORIES]}
        />
      )}
      
      <FeedbackTooltip />
    </div>
  )
}
