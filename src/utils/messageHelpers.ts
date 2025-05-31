import { Message } from '@/hooks/useChat'

export function detectValueableContent(content: string): boolean {
  // Check for substantial content that might be worth saving
  const wordCount = content.split(/\s+/).length
  
  // Patterns that indicate valuable content
  const valuablePatterns = [
    /\b(template|framework|system|process|plan|strategy|checklist|guide|steps|method)\b/i,
    /\b(idea|concept|approach|solution|proposal)\b/i,
    /\b\d+\.\s+\w+/m, // Numbered lists
    /^[-•]\s+\w+/m, // Bullet points
    /\b(should|could|would|need to|have to|must)\b/i, // Action items
  ]
  
  // Content is valuable if it's substantial (>50 words) or matches patterns
  return wordCount > 50 || valuablePatterns.some(pattern => pattern.test(content))
}

export function shouldPromptToSave(response: string): boolean {
  const saveKeywords = [
    'save', 'idea tile', 'organize this', 'concrete idea', 'reference and build',
    'capture', 'finalize', 'entry', 'poppy idea engine', 'meal planner', 
    'let me know if you\'d like me to modify', 'does this look', 'how does this look'
  ]
  return saveKeywords.some(keyword => response.toLowerCase().includes(keyword))
}

export function getDefaultWelcomeMessage(): string {
  return "Hello! I'm Poppy, your AI thinking partner. 🌟\n\nI'm here to help you explore, develop, and organize your ideas. I learn from your feedback to become more helpful over time!\n\n💡 **Quick tip**: After each of my responses, you'll see feedback buttons. Your thumbs up/down helps me understand what works best for you.\n\nWhat's on your mind today? Share any thought, idea, or question you'd like to explore!"
}

export function determineCategoryFromContent(content: string): string {
  const lowerContent = content.toLowerCase()
  const categoryKeywords = {
    'Business': ['business', 'startup', 'revenue', 'market', 'customer', 'product'],
    'Technology': ['tech', 'software', 'app', 'code', 'api', 'system'],
    'Creative': ['creative', 'art', 'design', 'story', 'visual', 'aesthetic'],
    'Learning': ['learn', 'study', 'course', 'skill', 'knowledge', 'education'],
    'Health & Wellness': ['health', 'fitness', 'wellness', 'exercise', 'nutrition'],
    'Personal Growth': ['personal', 'growth', 'self', 'life', 'development'],
    'Finance': ['money', 'budget', 'investment', 'finance', 'savings'],
    'Productivity': ['productivity', 'workflow', 'efficiency', 'organize'],
    'Travel': ['travel', 'trip', 'vacation', 'destination', 'journey']
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      return category
    }
  }
  
  return 'General'
}

export function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'just now'
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
}

export function formatConversationContext(messages: Message[]): string {
  return messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
}

export function filterAndCleanMessages(messages: any[]): any[] {
  let filtered: any[] = []
  
  if (messages.length > 0) {
    filtered.push(messages[0])
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role !== messages[i - 1].role) {
        filtered.push(messages[i])
      } else {
        filtered[filtered.length - 1] = messages[i]
      }
    }
  }
  
  // Remove system messages that shouldn't be sent
  const firstMessageContent = filtered[0]?.content
  if (typeof firstMessageContent === 'string' && 
      (firstMessageContent.startsWith("Let's continue working on your idea:") || 
       firstMessageContent.startsWith("Hello! I'm Claude"))) {
    filtered.shift()
  }
  
  return filtered
}

export function analyzeConversationContext(messages: Message[]) {
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase()
  
  return {
    isIdeaDevelopment: conversationText.includes('idea') || 
                       conversationText.includes('concept') || 
                       conversationText.includes('plan'),
    isProblemSolving: conversationText.includes('problem') || 
                      conversationText.includes('challenge') || 
                      conversationText.includes('solution'),
    isBrainstorming: conversationText.includes('brainstorm') || 
                     conversationText.includes('creative') || 
                     conversationText.includes('explore'),
    messageCount: messages.length,
    avgMessageLength: messages.reduce((sum, m) => sum + m.content.length, 0) / Math.max(messages.length, 1)
  }
}
