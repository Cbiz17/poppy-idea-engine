import React from 'react'
import { Message } from '@/hooks/useChat'
import { Idea } from '@/hooks/useIdeas'
import FeedbackComponent from '@/components/feedback/FeedbackComponent'
import { Plus, RefreshCw, GitBranch } from 'lucide-react'
import { detectValueableContent } from '@/utils/messageHelpers'
import { WelcomeActions } from './WelcomeActions'

interface ChatMessageProps {
  message: Message
  currentIdeaContext: Idea | null
  onSaveIdea: (messageId: string) => void
  onBranchIdea: (messageId: string) => void
  onQuickSave: (messageId: string) => void
  showSavePrompt: boolean
  onHandleSaveIdea: (messageId: string) => void
  onDismissSavePrompt: () => void
  isLoading: boolean
  suggestedIdeaForReview: any
}

export function ChatMessage({
  message,
  currentIdeaContext,
  onSaveIdea,
  onBranchIdea,
  onQuickSave,
  showSavePrompt,
  onHandleSaveIdea,
  onDismissSavePrompt,
  isLoading,
  suggestedIdeaForReview
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isWelcomeMessage = message.id === '1'
  const hasValueableContent = detectValueableContent(message.content)
  const hasRealUUID = message.id.includes('-')

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-3xl rounded-2xl px-6 py-4 ${
          isUser
            ? 'bg-purple-600 text-white'
            : 'bg-white border border-gray-200 text-black'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {/* Welcome message actions */}
        {isWelcomeMessage && message.content.includes('🎯 **Quick Actions:**') && (
          <WelcomeActions />
        )}
        
        {/* Feedback component for assistant messages */}
        {!isUser && !isWelcomeMessage && hasRealUUID && (
          <>
            <FeedbackComponent messageId={message.id} />
            
            {/* Enhanced save options for idea development */}
            {hasValueableContent && currentIdeaContext && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-gray-800 mb-3">
                  This builds on your "{currentIdeaContext.title}" idea!
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onSaveIdea(message.id)}
                    className="flex flex-col items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 group"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span className="font-medium">Update & Version</span>
                    </div>
                    <span className="text-xs opacity-90">
                      Save as Version {(currentIdeaContext.development_count || 1) + 1}
                    </span>
                  </button>
                  <button
                    onClick={() => onBranchIdea(message.id)}
                    className="flex flex-col items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all hover:scale-105 group"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      <span className="font-medium">Branch as New</span>
                    </div>
                    <span className="text-xs opacity-90">
                      Create separate idea
                    </span>
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  💡 <strong>Update</strong> preserves full history • <strong>Branch</strong> creates a new related idea
                </p>
              </div>
            )}
            
            {/* Simple save for non-development mode */}
            {hasValueableContent && !currentIdeaContext && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-end">
                  <button
                    onClick={() => onQuickSave(message.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Save as idea
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Save prompt */}
        {showSavePrompt && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 mb-3">
              Would you like me to prepare this idea for saving?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onHandleSaveIdea(message.id)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading && suggestedIdeaForReview?.originalMessageId === message.id ? 'Processing...' : 'Prepare to Save'}
              </button>
              <button
                onClick={onDismissSavePrompt}
                className="px-3 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
