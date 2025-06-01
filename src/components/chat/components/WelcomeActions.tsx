import React from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, TrendingUp, Target, Layout, Sparkles, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { devLogger } from '@/lib/dev-logger'

export function WelcomeActions() {
  const router = useRouter()
  const supabase = createClient()
  
  const handleActionButton = async (action: string, data?: any) => {
    const welcomeData = (window as any).__poppyWelcomeData
    
    console.log('🔍 WelcomeActions: Action triggered:', action, 'with data:', data)
    console.log('🔍 WelcomeActions: Welcome data available:', welcomeData)
    
    switch (action) {
      case 'continue-last':
        console.log('🔍 WelcomeActions: Continue-last case, conversationId:', data?.conversationId)
        if (data?.conversationId) {
          devLogger.info('WelcomeActions', 'Continuing last conversation', { conversationId: data.conversationId })
          
          // Instead of navigating, dispatch an event like guided exploration does
          window.dispatchEvent(new CustomEvent('poppy-continue-conversation', {
            detail: { conversationId: data.conversationId }
          }))
          
          // Clear the welcome message by focusing the input
          setTimeout(() => {
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement
            if (textarea) {
              textarea.focus()
            }
          }, 100)
        }
        break
        
      case 'develop-idea':
        if (data?.ideaId) {
          window.location.href = `/chat?idea=${data.ideaId}`
        }
        break
        
      case 'guided-exploration':
        if (data?.prompt) {
          // Dispatch custom event that ChatInterface will listen to
          window.dispatchEvent(new CustomEvent('poppy-welcome-action', {
            detail: { prompt: data.prompt }
          }))
          
          // Focus the textarea
          setTimeout(() => {
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement
            if (textarea) {
              textarea.focus()
              // Place cursor at end
              textarea.setSelectionRange(textarea.value.length, textarea.value.length)
            }
          }, 100)
        }
        break
        
      case 'browse-ideas':
        router.push('/ideas')
        break
        
      case 'start-new':
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement
        if (textarea) textarea.focus()
        break
    }
  }

  const welcomeData = (window as any).__poppyWelcomeData
  if (!welcomeData) return null

  return (
    <div className="mt-6 space-y-3">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {welcomeData.lastConversation && (
          <button
            onClick={() => handleActionButton('continue-last', { conversationId: welcomeData.lastConversation.id })}
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left group overflow-hidden"
          >
            <RefreshCw className="w-5 h-5 text-purple-600 group-hover:rotate-180 transition-transform flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-purple-900">Continue where you left off</div>
              <div className="text-sm text-purple-700 line-clamp-2">
                {welcomeData.lastConversation.preview}
              </div>
            </div>
          </button>
        )}
        
        {welcomeData.recentIdeas.length > 0 && (
          <button
            onClick={() => handleActionButton('develop-idea', { ideaId: welcomeData.recentIdeas[0].id })}
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left group overflow-hidden relative"
            title={welcomeData.recentIdeas[0].title}
          >
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-blue-900">Develop recent idea</div>
              <div className="text-sm text-blue-700 line-clamp-2">
                {welcomeData.recentIdeas[0].title}
              </div>
              <div className="text-xs text-blue-600 mt-0.5">
                {welcomeData.recentIdeas[0].category}
              </div>
            </div>
          </button>
        )}
        
        {welcomeData.suggestions.length > 0 && (
          <button
            onClick={() => handleActionButton('guided-exploration', { prompt: welcomeData.suggestions[0] })}
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left group overflow-hidden"
          >
            <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-green-900">Guided exploration</div>
              <div className="text-sm text-green-700 line-clamp-2">
                {welcomeData.suggestions[0]}
              </div>
            </div>
          </button>
        )}
        
        <button
          onClick={() => handleActionButton('start-new')}
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left group overflow-hidden"
        >
          <Sparkles className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">Start something new</div>
            <div className="text-sm text-gray-600">Free exploration with Poppy</div>
          </div>
        </button>
      </div>
      
      {welcomeData.stats.totalIdeas > 3 && (
        <button
          onClick={() => handleActionButton('browse-ideas')}
          className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-300 hover:border-gray-400 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
        >
          <Layout className="w-4 h-4" />
          <span className="text-sm font-medium">
            Browse all {welcomeData.stats.totalIdeas} ideas in your gallery
          </span>
        </button>
      )}
      
      <div className="text-center text-sm text-gray-500 pt-2">
        <MessageSquare className="w-4 h-4 inline-block mr-1" />
        Or simply type your thoughts below
      </div>
    </div>
  )
}
