'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Sparkles, LogOut, MessageCircle, Plus, Grid3X3, List, 
  Search, Filter, Clock, TrendingUp, GitBranch, Star, 
  Hash, Download, ChevronDown, BarChart3, Archive, Pin, History, Globe, Share2, Lock, Users
} from 'lucide-react'
import Link from 'next/link'
import ConversationAuditTrail from './ConversationAuditTrail'
import EditIdeaModal from './EditIdeaModal'
import IdeaCard from './IdeaCard'
import ShareDialog from './ShareDialog'

interface Contributor {
  user_id: string
  email?: string
  full_name?: string
  avatar_url?: string
  contribution_type: 'original' | 'merge' | 'edit'
  contributed_at: string
}

interface Idea {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
  development_count?: number
  last_activity?: string
  archived?: boolean
  pinned?: boolean
  branched_from_id?: string
  branch_note?: string
  is_branch?: boolean
  branches?: Idea[]
  user_id: string
  contributors?: Contributor[]
}

interface IdeasGalleryProps {
  user: User
  ideas: Idea[]
}

const CATEGORIES = ['General', 'Business', 'Creative', 'Technology', 'Personal Growth', 'Learning', 'Health & Wellness', 'Productivity', 'Finance', 'Travel']

export default function IdeasGallery({ user, ideas: initialIdeas }: IdeasGalleryProps) {
  const [ideas, setIdeas] = useState(initialIdeas)
  const [auditTrailOpen, setAuditTrailOpen] = useState(false)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'activity'>('updated')
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedIdeaForShare, setSelectedIdeaForShare] = useState<Idea | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_idea_stats', { p_user_id: user.id })
      
      if (!error && data && data.length > 0) {
        setStats(data[0])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleEditIdea = (idea: Idea) => {
    setSelectedIdea(idea)
    setEditModalOpen(true)
  }

  const handleDevelopInChat = (idea: Idea) => {
    // Navigate to chat with the idea context
    window.location.href = `/chat?idea=${idea.id}`
  }

  const handleSaveIdea = async (updatedData: { title: string; content: string; category: string }, saveType: 'update' | 'new' | 'merge', mergeMetadata?: { mergedIdeaId: string; mergeAction: 'keep' | 'archive' | 'delete' }) => {
    if (!selectedIdea) return

    try {
      if (saveType === 'new') {
        // Create a new idea based on the existing one
        const response = await fetch(`/api/ideas/${selectedIdea.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updatedData,
            saveType: 'new',
            originalId: selectedIdea.id
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create new idea')
        }

        const { idea: newIdea } = await response.json()
        
        // Add the new idea to the list
        setIdeas([newIdea, ...ideas])
        
      } else {
        // Update existing idea (for both 'update' and 'merge' types)
        const response = await fetch(`/api/ideas/${selectedIdea.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        })

        if (!response.ok) {
          throw new Error('Failed to update idea')
        }

        const { idea: updatedIdea } = await response.json()
        
        // Update the local state
        setIdeas(ideas.map(idea => 
          idea.id === updatedIdea.id ? updatedIdea : idea
        ))
        
        // Handle merge action if this was a merge
        if (saveType === 'merge' && mergeMetadata) {
          const { mergedIdeaId, mergeAction } = mergeMetadata
          
          // Track merge contributors
          try {
            // Get the merged idea to find its contributors
            const mergedIdea = ideas.find(i => i.id === mergedIdeaId)
            
            if (mergedIdea) {
              // Add the original owner of the merged idea as a merge contributor
              await supabase
                .from('idea_contributors')
                .upsert({
                  idea_id: selectedIdea.id,
                  user_id: mergedIdea.user_id,
                  contribution_type: 'merge',
                  contributed_at: new Date().toISOString(),
                  contribution_details: {
                    mergedFrom: mergedIdeaId,
                    mergedTitle: mergedIdea.title,
                    mergeAction: mergeAction
                  }
                }, {
                  onConflict: 'idea_id,user_id,contribution_type'
                })
              
              // Also copy over any existing contributors from the merged idea
              const { data: mergedContributors } = await supabase
                .from('idea_contributors')
                .select('*')
                .eq('idea_id', mergedIdeaId)
              
              if (mergedContributors && mergedContributors.length > 0) {
                // Add all contributors from the merged idea
                const contributorsToAdd = mergedContributors.map(c => ({
                  idea_id: selectedIdea.id,
                  user_id: c.user_id,
                  contribution_type: c.contribution_type === 'original' ? 'merge' : c.contribution_type,
                  contributed_at: new Date().toISOString(),
                  contribution_details: {
                    ...c.contribution_details,
                    mergedFrom: mergedIdeaId
                  }
                }))
                
                await supabase
                  .from('idea_contributors')
                  .upsert(contributorsToAdd, {
                    onConflict: 'idea_id,user_id,contribution_type'
                  })
              }
            }
          } catch (contributorError) {
            console.error('Error tracking merge contributors:', contributorError)
            // Non-critical, continue
          }
          
          if (mergeAction === 'delete') {
            // Delete the merged idea
            const deleteResponse = await supabase
              .from('ideas')
              .delete()
              .eq('id', mergedIdeaId)
              .eq('user_id', user.id)
            
            if (deleteResponse.error) {
              console.error('Error deleting merged idea:', deleteResponse.error)
            } else {
              // Remove from local state
              setIdeas(ideas.filter(idea => idea.id !== mergedIdeaId))
            }
          } else if (mergeAction === 'archive') {
            // Archive the merged idea
            const archiveResponse = await supabase
              .from('ideas')
              .update({ archived: true })
              .eq('id', mergedIdeaId)
              .eq('user_id', user.id)
            
            if (archiveResponse.error) {
              console.error('Error archiving merged idea:', archiveResponse.error)
            } else {
              // Update local state to mark as archived
              setIdeas(ideas.map(idea => 
                idea.id === mergedIdeaId ? { ...idea, archived: true } : idea
              ))
            }
          }
          // If mergeAction is 'keep', we don't need to do anything
          
          // Add a success message
          const actionText = mergeAction === 'delete' ? 'deleted' : mergeAction === 'archive' ? 'archived' : 'kept'
          alert(`Ideas successfully merged! The merged idea "${ideas.find(i => i.id === mergedIdeaId)?.title}" has been ${actionText}.`)
        }
      }
      
      // Close the modal
      setEditModalOpen(false)
      setSelectedIdea(null)
      
      // Refresh stats
      fetchStats()
      
    } catch (error) {
      console.error('Error saving idea:', error)
      throw error // Re-throw to be handled by the modal
    }
  }

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return

    try {
      const { data, error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('Supabase error deleting idea:', error)
        alert(`Failed to delete idea: ${error.message}`)
      } else if (data && data.length > 0) {
        setIdeas(ideas.filter(idea => idea.id !== ideaId))
        alert('Idea deleted successfully!')
        fetchStats()
      }
    } catch (error) {
      console.error('Unexpected error deleting idea:', error)
      alert(`Unexpected error: ${error}`)
    }
  }

  const handleArchiveIdea = async (ideaId: string) => {
    try {
      const idea = ideas.find(i => i.id === ideaId)
      if (!idea) return

      const { error } = await supabase
        .from('ideas')
        .update({ archived: !idea.archived })
        .eq('id', ideaId)
        .eq('user_id', user.id)

      if (!error) {
        setIdeas(ideas.map(i => 
          i.id === ideaId ? { ...i, archived: !i.archived } : i
        ))
      }
    } catch (error) {
      console.error('Error archiving idea:', error)
    }
  }

  const handlePinIdea = async (ideaId: string) => {
    try {
      const idea = ideas.find(i => i.id === ideaId)
      if (!idea) return

      const { error } = await supabase
        .from('ideas')
        .update({ pinned: !idea.pinned })
        .eq('id', ideaId)
        .eq('user_id', user.id)

      if (!error) {
        setIdeas(ideas.map(i => 
          i.id === ideaId ? { ...i, pinned: !i.pinned } : i
        ))
      }
    } catch (error) {
      console.error('Error pinning idea:', error)
    }
  }

  const handleViewHistory = (ideaId: string) => {
    setSelectedIdeaId(ideaId)
    setAuditTrailOpen(true)
  }

  const handleShareIdea = (idea: Idea) => {
    setSelectedIdeaForShare(idea)
    setShareDialogOpen(true)
  }

  const handleVisibilityChange = (ideaId: string, newVisibility: 'private' | 'public' | 'shared') => {
    setIdeas(ideas.map(idea => 
      idea.id === ideaId ? { ...idea, visibility: newVisibility } : idea
    ))
  }

  const handleBulkExport = () => {
    const toExport = filteredIdeas

    const markdown = toExport.map(idea => 
      `# ${idea.title}\n\n**Category:** ${idea.category}\n**Created:** ${new Date(idea.created_at).toLocaleDateString()}\n**Updated:** ${new Date(idea.updated_at).toLocaleDateString()}\n**Developments:** ${idea.development_count || 0}\n\n${idea.content}\n\n---\n`
    ).join('\n')

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ideas-export-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Filter and sort ideas
  const filteredIdeas = useMemo(() => {
    let filtered = ideas

    // Pinned ideas always come first
    const pinned = filtered.filter(idea => idea.pinned && !idea.archived)
    let unpinned = filtered.filter(idea => !idea.pinned)
    
    // Category filter
    if (selectedCategory !== 'All') {
      unpinned = unpinned.filter(idea => idea.category === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      unpinned = unpinned.filter(idea => 
        idea.title.toLowerCase().includes(query) ||
        idea.content.toLowerCase().includes(query) ||
        idea.category.toLowerCase().includes(query)
      )
    }

    // Archive filter
    if (!showArchived) {
      unpinned = unpinned.filter(idea => !idea.archived)
    }

    // Sort
    unpinned.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'activity':
          return (b.development_count || 0) - (a.development_count || 0)
        default:
          return 0
      }
    })

    return [...pinned, ...unpinned]
  }, [ideas, selectedCategory, searchQuery, sortBy, showArchived])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Poppy Idea Engine</h1>
              <p className="text-sm text-gray-600">Idea Gallery</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <BarChart3 className="w-4 h-4" />
              Admin
            </Link>
            
            <Link
              href="/discover"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Globe className="w-4 h-4" />
              Discover
            </Link>
            
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              New Conversation
            </Link>
            
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Ideas</h2>
          <p className="text-gray-600">
            {ideas.length === 0 
              ? "No ideas saved yet. Start a conversation to create your first idea!"
              : `${filteredIdeas.length} idea${filteredIdeas.length === 1 ? '' : 's'} in your collection`
            }
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Grid view"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <BarChart3 className="w-4 h-4" />
                Stats
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="updated">Last Updated</option>
                  <option value="created">Date Created</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="activity">Most Active</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Show Archived</label>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-3 py-2 border rounded-lg w-full ${
                    showArchived ? 'bg-gray-100 border-gray-400' : 'border-gray-300'
                  }`}
                >
                  {showArchived ? 'Showing All' : 'Active Only'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Dashboard */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-sm">Total Ideas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_ideas || 0}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">This Week</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.ideas_this_week || 0}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <GitBranch className="w-4 h-4" />
                <span className="text-sm">Total Changes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_developments || 0}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Avg. per Idea</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.avg_developments_per_idea || 0}</p>
            </div>
          </div>
        )}

        {/* Ideas Display */}
        {ideas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No ideas yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start a conversation with Poppy to explore your thoughts and save them as idea tiles.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Start Your First Conversation
            </Link>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No ideas found matching your criteria</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredIdeas.map((idea) => (
                  <div key={idea.id} className="relative">
                    {idea.pinned && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Pin className="w-5 h-5 text-purple-600 rotate-45" />
                      </div>
                    )}
                    <IdeaCard
                      idea={idea}
                      onEdit={() => handleEditIdea(idea)}
                      onDelete={() => handleDeleteIdea(idea.id)}
                      onViewHistory={() => handleViewHistory(idea.id)}
                      onDevelopInChat={() => handleDevelopInChat(idea)}
                      onShare={() => handleShareIdea(idea)}
                      formatDate={formatDate}
                      currentUserId={user.id}
                    />
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visibility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contributors
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredIdeas.map(idea => (
                      <tr key={idea.id} className={`hover:bg-gray-50 ${idea.archived ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {idea.pinned && <Pin className="w-4 h-4 text-purple-600 rotate-45" />}
                            <button
                              onClick={() => handleEditIdea(idea)}
                              className="text-sm font-medium text-gray-900 hover:text-purple-600"
                            >
                              {idea.title}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {idea.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {(idea as any).visibility && (idea as any).visibility !== 'private' ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              (idea as any).visibility === 'public' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {(idea as any).visibility === 'public' ? (
                                <><Globe className="w-3 h-3" /> Public</>
                              ) : (
                                <><Users className="w-3 h-3" /> Shared</>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400">
                              <Lock className="w-3 h-3" /> Private
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {idea.contributors && idea.contributors.length > 0 ? (
                            <div className="flex items-center">
                              <div className="flex -space-x-2">
                                {idea.contributors.slice(0, 2).map((contributor) => (
                                  <div
                                    key={contributor.user_id}
                                    className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center"
                                    title={`${contributor.full_name || contributor.email} (${contributor.contribution_type})`}
                                  >
                                    {contributor.avatar_url ? (
                                      <img
                                        src={contributor.avatar_url}
                                        alt={contributor.full_name || contributor.email || ''}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs text-gray-600">
                                        {(contributor.full_name || contributor.email || '?')[0].toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {idea.contributors.length > 2 && (
                                <span className="ml-2 text-xs text-gray-500">
                                  +{idea.contributors.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(idea.updated_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {idea.development_count || 0} changes
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePinIdea(idea.id)}
                              className="text-gray-400 hover:text-purple-600"
                              title={idea.pinned ? 'Unpin' : 'Pin'}
                            >
                              <Pin className={`w-4 h-4 ${idea.pinned ? 'rotate-45' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleArchiveIdea(idea.id)}
                              className="text-gray-400 hover:text-blue-600"
                              title={idea.archived ? 'Unarchive' : 'Archive'}
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleShareIdea(idea)}
                              className="text-gray-400 hover:text-green-600"
                              title="Share idea"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewHistory(idea.id)}
                              className="text-gray-400 hover:text-blue-600"
                              title="View history"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <span className="text-gray-300 mx-1">|</span>
                            <button
                              onClick={() => handleEditIdea(idea)}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                              title="Edit & Merge"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDevelopInChat(idea)}
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                              title="Develop in Chat"
                            >
                              Develop
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Edit Modal */}
      {selectedIdea && (
        <EditIdeaModal
          idea={selectedIdea}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedIdea(null)
          }}
          onSave={handleSaveIdea}
          categories={CATEGORIES}
        />
      )}
      
      {/* Conversation Audit Trail Modal */}
      {selectedIdeaId && (
        <ConversationAuditTrail
          ideaId={selectedIdeaId}
          isOpen={auditTrailOpen}
          onClose={() => {
            setAuditTrailOpen(false)
            setSelectedIdeaId(null)
          }}
        />
      )}
      
      {/* Share Dialog */}
      {selectedIdeaForShare && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false)
            setSelectedIdeaForShare(null)
          }}
          ideaId={selectedIdeaForShare.id}
          ideaTitle={selectedIdeaForShare.title}
          currentVisibility={(selectedIdeaForShare as any).visibility || 'private'}
          onVisibilityChange={(newVisibility) => handleVisibilityChange(selectedIdeaForShare.id, newVisibility)}
        />
      )}
    </div>
  )
}
