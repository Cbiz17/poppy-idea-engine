'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { 
  Sparkles, 
  Globe, 
  Heart, 
  MessageSquare, 
  GitBranch,
  Eye,
  TrendingUp,
  Clock,
  Search,
  Filter,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'

interface PublicIdea {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  user_id: string
  profiles: {
    email: string
    full_name?: string
    avatar_url?: string
  }
  idea_discovery_stats?: Array<{
    view_count: number
    like_count: number
    comment_count: number
    remix_count: number
  }>
  isLikedByCurrentUser: boolean
}

interface DiscoverClientProps {
  user: User
  ideas: PublicIdea[]
}

export default function DiscoverClient({ user, ideas: initialIdeas }: DiscoverClientProps) {
  const [ideas, setIdeas] = useState(initialIdeas)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const supabase = createClient()

  const categories = ['All', ...Array.from(new Set(ideas.map(idea => idea.category)))]

  const handleLike = async (ideaId: string, isLiked: boolean) => {
    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('idea_likes')
        .delete()
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)

      if (!error) {
        setIdeas(ideas.map(idea => {
          if (idea.id === ideaId) {
            const stats = idea.idea_discovery_stats?.[0]
            return {
              ...idea,
              isLikedByCurrentUser: false,
              idea_discovery_stats: stats ? [{
                ...stats,
                like_count: Math.max(0, stats.like_count - 1)
              }] : undefined
            }
          }
          return idea
        }))
      }
    } else {
      // Like
      const { error } = await supabase
        .from('idea_likes')
        .insert({ idea_id: ideaId, user_id: user.id })

      if (!error) {
        // Ensure discovery stats exist
        await supabase
          .from('idea_discovery_stats')
          .upsert({ idea_id: ideaId })

        setIdeas(ideas.map(idea => {
          if (idea.id === ideaId) {
            const stats = idea.idea_discovery_stats?.[0]
            return {
              ...idea,
              isLikedByCurrentUser: true,
              idea_discovery_stats: stats ? [{
                ...stats,
                like_count: stats.like_count + 1
              }] : [{ view_count: 0, like_count: 1, comment_count: 0, remix_count: 0 }]
            }
          }
          return idea
        }))
      }
    }
  }

  const copyShareLink = (ideaId: string) => {
    const url = `${window.location.origin}/ideas/shared/${ideaId}`
    navigator.clipboard.writeText(url)
    setCopiedId(ideaId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const incrementViewCount = async (ideaId: string) => {
    await supabase.rpc('increment_view_count', { p_idea_id: ideaId })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Filter and sort ideas
  const filteredIdeas = useMemo(() => {
    let filtered = ideas

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(idea => idea.category === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(idea => 
        idea.title.toLowerCase().includes(query) ||
        idea.content.toLowerCase().includes(query) ||
        idea.profiles.full_name?.toLowerCase().includes(query) ||
        idea.profiles.email.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      const aStats = a.idea_discovery_stats?.[0]
      const bStats = b.idea_discovery_stats?.[0]
      
      switch (sortBy) {
        case 'popular':
          return (bStats?.like_count || 0) - (aStats?.like_count || 0)
        case 'trending':
          // Simple trending: likes + comments in last 7 days weighted by recency
          const aTrending = (aStats?.like_count || 0) + (aStats?.comment_count || 0)
          const bTrending = (bStats?.like_count || 0) + (bStats?.comment_count || 0)
          return bTrending - aTrending
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [ideas, selectedCategory, searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ideas" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Discover Ideas</h1>
                <p className="text-sm text-gray-600">Explore public ideas from the community</p>
              </div>
            </div>
          </div>
          
          <Link
            href="/chat"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Create Your Own
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search public ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <div className="flex gap-2">
                  {[
                    { value: 'recent', label: 'Recent', icon: Clock },
                    { value: 'popular', label: 'Popular', icon: Heart },
                    { value: 'trending', label: 'Trending', icon: TrendingUp }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        sortBy === option.value
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ideas Grid */}
        {filteredIdeas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No public ideas found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map(idea => {
              const stats = idea.idea_discovery_stats?.[0]
              return (
                <div key={idea.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  {/* Author Info */}
                  <div className="flex items-center gap-3 mb-4">
                    {idea.profiles.avatar_url ? (
                      <img 
                        src={idea.profiles.avatar_url} 
                        alt={idea.profiles.full_name || idea.profiles.email}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {(idea.profiles.full_name || idea.profiles.email)[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {idea.profiles.full_name || idea.profiles.email}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(idea.created_at)}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{idea.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{idea.content}</p>

                  {/* Category */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {idea.category}
                    </span>
                  </div>

                  {/* Stats and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <button
                        onClick={() => handleLike(idea.id, idea.isLikedByCurrentUser)}
                        className={`flex items-center gap-1 transition-colors ${
                          idea.isLikedByCurrentUser 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'hover:text-red-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${idea.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                        {stats?.like_count || 0}
                      </button>
                      
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {stats?.comment_count || 0}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {stats?.view_count || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyShareLink(idea.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy share link"
                      >
                        {copiedId === idea.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      
                      <Link
                        href={`/ideas/shared/${idea.id}`}
                        onClick={() => incrementViewCount(idea.id)}
                        className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                        title="View idea"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}