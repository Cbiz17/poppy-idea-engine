'use client'

import { useState, useEffect } from 'react'
import { History, Clock, TrendingUp, GitBranch, User, Bot, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface DevelopmentHistoryItem {
  id: string;
  development_type: string;
  change_summary: string;
  conversation_id: string;
  previous_title?: string;
  new_title?: string;
  previous_content?: string;
  new_content?: string;
  previous_category?: string;
  new_category?: string;
  created_at: string;
  conversation_length?: number;
  user_satisfaction?: number;
}

interface ConversationAuditTrailProps {
  ideaId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationAuditTrail({ ideaId, isOpen, onClose }: ConversationAuditTrailProps) {
  const [history, setHistory] = useState<DevelopmentHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && ideaId) {
      fetchDevelopmentHistory()
    }
  }, [isOpen, ideaId])

  const fetchDevelopmentHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('idea_development_history')
        .select(`
          id,
          development_type,
          change_summary,
          conversation_id,
          previous_title,
          new_title,
          previous_content,
          new_content,
          previous_category,
          new_category,
          created_at,
          conversation_length,
          user_satisfaction
        `)
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching development history:', error)
      } else {
        setHistory(data || [])
      }
    } catch (error) {
      console.error('Error fetching development history:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'initial_creation':
        return <User className="w-4 h-4 text-green-600" />
      case 'content_expansion':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'refinement':
        return <Bot className="w-4 h-4 text-purple-600" />
      case 'major_revision':
        return <GitBranch className="w-4 h-4 text-orange-600" />
      case 'continuation':
        return <ExternalLink className="w-4 h-4 text-indigo-600" />
      default:
        return <History className="w-4 h-4 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'initial_creation':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'content_expansion':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'refinement':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'major_revision':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'continuation':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredHistory = history.filter(item => {
    if (selectedFilter === 'all') return true
    return item.development_type === selectedFilter
  })

  const developmentTypes = [...new Set(history.map(item => item.development_type))]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Development History</h2>
                <p className="text-sm text-gray-600">Track how this idea evolved through conversations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Changes ({history.length})</option>
              {developmentTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')} ({history.filter(h => h.development_type === type).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Development History</h3>
              <p className="text-gray-600">This idea hasn't been developed through conversations yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {filteredHistory.map((item, index) => (
                  <div key={item.id} className="relative">
                    
                    {/* Timeline line */}
                    {index < filteredHistory.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                    )}
                    
                    {/* Timeline item */}
                    <div className="flex items-start gap-4">
                      
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                        {getTypeIcon(item.development_type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 bg-gray-50 rounded-lg p-4">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(item.development_type)}`}>
                              {item.development_type.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.created_at)}
                            </span>
                            {item.conversation_length && (
                              <span className="text-xs text-gray-500">
                                {item.conversation_length} messages
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => toggleExpanded(item.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedItems.has(item.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        
                        {/* Summary */}
                        <p className="text-gray-700 mb-2">
                          {item.change_summary || `${item.development_type} development occurred`}
                        </p>
                        
                        {/* Satisfaction Score */}
                        {item.user_satisfaction && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-600">Satisfaction:</span>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map(star => (
                                <div
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= item.user_satisfaction!
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Expanded Details */}
                        {expandedItems.has(item.id) && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            
                            {/* Title Changes */}
                            {item.previous_title && item.new_title && item.previous_title !== item.new_title && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Title Changes:</h4>
                                <div className="text-sm space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-600">−</span>
                                    <span className="text-gray-600 line-through">{item.previous_title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-600">+</span>
                                    <span className="text-gray-900">{item.new_title}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Category Changes */}
                            {item.previous_category && item.new_category && item.previous_category !== item.new_category && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Category Changes:</h4>
                                <div className="text-sm space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-600">−</span>
                                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">{item.previous_category}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-600">+</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">{item.new_category}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Content Changes Preview */}
                            {item.previous_content && item.new_content && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Content Evolution:</h4>
                                <div className="text-sm bg-white rounded border p-3 max-h-32 overflow-y-auto">
                                  <div className="mb-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Previous:</span>
                                    <p className="text-gray-600 mt-1">{item.previous_content.substring(0, 200)}...</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Updated:</span>
                                    <p className="text-gray-900 mt-1">{item.new_content.substring(0, 200)}...</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Conversation Link */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => window.open(`/chat?conversation=${item.conversation_id}`, '_blank')}
                                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Original Conversation
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Development Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Total Changes</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600 mt-1">{history.length}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Development Span</span>
                    </div>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      {history.length > 1 ? (
                        `${Math.ceil(
                          (new Date(history[0].created_at).getTime() - 
                           new Date(history[history.length - 1].created_at).getTime()) / 
                          (1000 * 60 * 60 * 24)
                        )} days`
                      ) : (
                        'New'
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">Avg Satisfaction</span>
                    </div>
                    <p className="text-lg font-bold text-purple-600 mt-1">
                      {history.filter(h => h.user_satisfaction).length > 0 ? (
                        `${(
                          history
                            .filter(h => h.user_satisfaction)
                            .reduce((sum, h) => sum + (h.user_satisfaction || 0), 0) /
                          history.filter(h => h.user_satisfaction).length
                        ).toFixed(1)}/5`
                      ) : (
                        'N/A'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
