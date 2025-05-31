import { useCallback } from 'react'
import { Message } from './useChat'
import { Idea } from './useIdeas'

interface UseSpecialCommandsProps {
  currentIdeaContext: Idea | null
  fetchIdeaHistory: (ideaId: string) => void
  addMessage: (message: Message) => void
}

export function useSpecialCommands({
  currentIdeaContext,
  fetchIdeaHistory,
  addMessage
}: UseSpecialCommandsProps) {
  const handleSpecialCommands = useCallback((input: string): boolean => {
    const lowerInput = input.toLowerCase().trim()
    
    // Check for history command
    if (lowerInput === '/history' || lowerInput === 'show history' || lowerInput === 'show idea history') {
      if (currentIdeaContext) {
        fetchIdeaHistory(currentIdeaContext.id)
        return true
      } else {
        const helpMessage: Message = {
          id: `help-${Date.now()}`,
          content: "To view idea history, you need to be working on a specific idea. You can:\n\n• Click 'Develop recent idea' from your welcome screen\n• Navigate to an idea from your gallery\n• Or save this conversation as an idea first!\n\n💡 **Tip**: Type `/history` or 'show history' when working on an idea to see its complete evolution.",
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(helpMessage)
        return true
      }
    }
    
    return false
  }, [currentIdeaContext, fetchIdeaHistory, addMessage])

  return { handleSpecialCommands }
}
