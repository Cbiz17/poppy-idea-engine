import { Message } from '@/hooks/useChat'

export interface ProcessedIdea {
  title: string
  content: string
  category: string
  originalMessageId?: string
}

export async function processIdeaWithAI(
  messages: Message[]
): Promise<ProcessedIdea> {
  try {
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n')
    
    const prompt = `Based on this conversation, please extract and format the main idea for saving:

${conversationText}

Please respond with ONLY a JSON object in this exact format:
{
  "title": "A clear, concise title (5-8 words)",
  "content": "A comprehensive summary of the key points and details discussed (2-3 sentences)",
  "category": "One of: General, Business, Creative, Technology, Personal Growth, Learning, Health & Wellness, Productivity, Finance, Travel"
}`

    const response = await fetch('/api/chat-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: [{ role: 'user', content: prompt }] 
      })
    })

    if (!response.ok) {
      throw new Error('Failed to process idea with AI')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullResponse += decoder.decode(value, { stream: true })
      }
      fullResponse += decoder.decode()
    }

    try {
      const parsed = JSON.parse(fullResponse.trim())
      return {
        title: parsed.title || "New Idea",
        content: parsed.content || "No summary available",
        category: parsed.category || "General"
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON:', fullResponse)
      throw new Error('Invalid AI response format')
    }
  } catch (error) {
    console.error('Error processing idea with AI:', error)
    return fallbackIdeaProcessing(messages)
  }
}

export function fallbackIdeaProcessing(messages: Message[]): ProcessedIdea {
  let relevantContent = ""
  let potentialTitle = "New Idea"

  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length > 0) {
    relevantContent = userMessages.map(m => m.content).join("\n\n---\n\n")
    potentialTitle = userMessages[userMessages.length - 1].content.split(' ').slice(0, 7).join(' ') + 
      (userMessages[userMessages.length - 1].content.split(' ').length > 7 ? '...' : '')
  } else {
    relevantContent = messages[messages.length - 1]?.content || "No content found."
    potentialTitle = relevantContent.split(' ').slice(0, 7).join(' ') + 
      (relevantContent.split(' ').length > 7 ? '...' : '')
  }

  const category = determineCategoryFromContent(relevantContent)
  const summary = relevantContent.length > 300 ? relevantContent.substring(0, 297) + "..." : relevantContent

  return {
    title: potentialTitle,
    content: summary,
    category: category
  }
}

function determineCategoryFromContent(content: string): string {
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

export function generateSuggestions(favoriteCategories: string[], recentIdeas: any[]): string[] {
  const suggestions: string[] = []
  
  const categoryPrompts: Record<string, string[]> = {
    'Business': [
      'Refine your business model with market analysis',
      'Explore new revenue streams for your ideas',
      'Develop a go-to-market strategy'
    ],
    'Technology': [
      'Design the technical architecture for your project',
      'Explore AI integration possibilities',
      'Plan your development roadmap'
    ],
    'Creative': [
      'Brainstorm new creative directions',
      'Develop your artistic vision further',
      'Explore collaboration opportunities'
    ],
    'Personal Growth': [
      'Set actionable goals for the next quarter',
      'Reflect on recent learnings and insights',
      'Create a personal development plan'
    ],
    'Learning': [
      'Identify key skills to develop next',
      'Create a structured learning path',
      'Find resources for deeper exploration'
    ],
    'Health & Wellness': [
      'Design a sustainable wellness routine',
      'Explore mindfulness practices',
      'Set health goals for the month'
    ],
    'Productivity': [
      'Optimize your workflow systems',
      'Identify and eliminate time wasters',
      'Create templates for recurring tasks'
    ],
    'Finance': [
      'Review and optimize your budget',
      'Explore investment opportunities',
      'Plan for financial milestones'
    ],
    'Travel': [
      'Plan your next adventure',
      'Create a travel bucket list',
      'Research destinations that inspire you'
    ]
  }

  // Add suggestions based on favorite categories
  favoriteCategories.forEach(category => {
    const prompts = categoryPrompts[category] || []
    if (prompts.length > 0) {
      suggestions.push(prompts[Math.floor(Math.random() * prompts.length)])
    }
  })

  // Add continuation suggestion if there are recent ideas
  if (recentIdeas && recentIdeas.length > 0) {
    suggestions.push(`Continue developing "${recentIdeas[0].title}"`)
  }

  // Add a general exploration suggestion
  if (suggestions.length < 3) {
    suggestions.push('Explore a new idea or challenge you\'ve been thinking about')
  }

  // Limit to 3 suggestions
  return suggestions.slice(0, 3)
}

export interface IdeaSaveMetadata {
  saveType: 'update' | 'new' | 'merge' | 'branch'
  originalIdeaId?: string
  parentIdeaId?: string
  branchNote?: string
  mergeAction?: 'keep' | 'archive' | 'delete'
  developmentType?: string
  continuationContext?: any
}

export function prepareSaveMetadata(
  currentIdeaContext: any,
  continuationContext: any,
  saveType: string
): IdeaSaveMetadata {
  const metadata: IdeaSaveMetadata = {
    saveType: saveType as any
  }

  if (saveType === 'branch' && currentIdeaContext) {
    metadata.parentIdeaId = currentIdeaContext.id
    metadata.branchNote = `Branched from "${currentIdeaContext.title}" to explore a new direction`
  }

  if (saveType === 'update' || saveType === 'merge') {
    metadata.originalIdeaId = currentIdeaContext?.id || continuationContext?.relatedIdeaId
    metadata.developmentType = saveType === 'merge' ? 'major_revision' : 'refinement'
  }

  if (continuationContext) {
    metadata.continuationContext = continuationContext
  }

  return metadata
}
