// Utility functions for idea management

export const IDEA_CATEGORIES = [
  'General',
  'Business', 
  'Creative',
  'Technology',
  'Personal Growth',
  'Learning',
  'Health & Wellness',
  'Productivity',
  'Finance',
  'Travel'
] as const

export type IdeaCategory = typeof IDEA_CATEGORIES[number]

export interface Idea {
  id: string
  title: string
  content: string
  category: IdeaCategory | string
  created_at: string
  updated_at: string
  user_id: string
  embedding?: number[]
}

export const validateIdeaInput = (data: Partial<Idea>): string[] => {
  const errors: string[] = []
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required')
  } else if (data.title.length > 200) {
    errors.push('Title must be less than 200 characters')
  }
  
  if (!data.content || data.content.trim().length === 0) {
    errors.push('Content is required')
  } else if (data.content.length > 10000) {
    errors.push('Content must be less than 10,000 characters')
  }
  
  if (!data.category || !IDEA_CATEGORIES.includes(data.category as IdeaCategory)) {
    errors.push('Valid category is required')
  }
  
  return errors
}

export const formatIdeaDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
}

export const searchIdeas = (ideas: Idea[], query: string): Idea[] => {
  const lowerQuery = query.toLowerCase()
  return ideas.filter(idea => 
    idea.title.toLowerCase().includes(lowerQuery) ||
    idea.content.toLowerCase().includes(lowerQuery) ||
    idea.category.toLowerCase().includes(lowerQuery)
  )
}

export const sortIdeas = (ideas: Idea[], sortBy: 'created' | 'updated' | 'title' | 'category'): Idea[] => {
  return [...ideas].sort((a, b) => {
    switch (sortBy) {
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'title':
        return a.title.localeCompare(b.title)
      case 'category':
        return a.category.localeCompare(b.category)
      default:
        return 0
    }
  })
}

export const filterByCategory = (ideas: Idea[], category: IdeaCategory | 'All'): Idea[] => {
  if (category === 'All') return ideas
  return ideas.filter(idea => idea.category === category)
}

export const exportIdeasAsMarkdown = (ideas: Idea[]): string => {
  let markdown = '# My Ideas\n\n'
  
  const categorizedIdeas = ideas.reduce((acc, idea) => {
    if (!acc[idea.category]) acc[idea.category] = []
    acc[idea.category].push(idea)
    return acc
  }, {} as Record<string, Idea[]>)
  
  Object.entries(categorizedIdeas).forEach(([category, categoryIdeas]) => {
    markdown += `## ${category}\n\n`
    categoryIdeas.forEach(idea => {
      markdown += `### ${idea.title}\n`
      markdown += `*Created: ${formatIdeaDate(idea.created_at)}*\n\n`
      markdown += `${idea.content}\n\n---\n\n`
    })
  })
  
  return markdown
}

export const getIdeaStats = (ideas: Idea[]) => {
  const stats = {
    total: ideas.length,
    byCategory: {} as Record<string, number>,
    recentlyUpdated: 0,
    thisWeek: 0,
    thisMonth: 0
  }
  
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  ideas.forEach(idea => {
    // Category count
    stats.byCategory[idea.category] = (stats.byCategory[idea.category] || 0) + 1
    
    // Time-based counts
    const createdDate = new Date(idea.created_at)
    const updatedDate = new Date(idea.updated_at)
    
    if (updatedDate > createdDate) {
      stats.recentlyUpdated++
    }
    
    if (createdDate > weekAgo) {
      stats.thisWeek++
    }
    
    if (createdDate > monthAgo) {
      stats.thisMonth++
    }
  })
  
  return stats
}
