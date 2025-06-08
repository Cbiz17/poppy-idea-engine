import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface IdeaVersion {
  id: string
  created_at: string
  previous_title: string
  new_title: string
  previous_content: string
  new_content: string
  development_type: string
  change_summary: string
  ai_confidence_score: number
  conversation_length: number
}

interface IdeaHistoryModalProps {
  isOpen: boolean
  ideaId: string
  ideaTitle: string
  onClose: () => void
}

// Simple function to format relative time
function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

export default function IdeaHistoryModal({ isOpen, ideaId, ideaTitle, onClose }: IdeaHistoryModalProps) {
  const [history, setHistory] = useState<IdeaVersion[]>([])
  const [currentIdea, setCurrentIdea] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<IdeaVersion | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && ideaId) {
      fetchHistory()
    }
  }, [isOpen, ideaId])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      // Fetch current idea
      const { data: idea } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single()
      
      setCurrentIdea(idea)

      // Fetch history
      const { data: historyData } = await supabase
        .from('idea_development_history')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false })

      setHistory(historyData || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getVersionTypeIcon = (type: string) => {
    switch (type) {
      case 'refinement':
        return '✏️'
      case 'major_revision':
        return '🔄'
      case 'branch':
        return '🌿'
      case 'merge':
        return '🔀'
      default:
        return '📝'
    }
  }

  const getVersionTypeColor = (type: string) => {
    switch (type) {
      case 'refinement':
        return 'bg-blue-100 text-blue-800'
      case 'major_revision':
        return 'bg-purple-100 text-purple-800'
      case 'branch':
        return 'bg-green-100 text-green-800'
      case 'merge':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Idea History Timeline</h2>
              <p className="text-gray-600 mt-1">{ideaTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Version */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🌟</span>
                      <div>
                        <h3 className="font-bold text-gray-900">Current Version</h3>
                        <p className="text-sm text-gray-600">
                          Last updated {formatDistanceToNow(new Date(currentIdea?.updated_at || Date.now()))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="font-medium text-gray-900">{currentIdea?.title}</p>
                      <p className="text-gray-600 mt-2 line-clamp-3">{currentIdea?.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVersion(null)}
                    className="ml-4 px-4 py-2 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium text-purple-600"
                  >
                    View Full
                  </button>
                </div>
              </div>

              {/* Timeline Connector */}
              {history.length > 0 && (
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                </div>
              )}

              {/* History Versions */}
              {history.map((version, index) => (
                <div key={version.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-7 -top-1 w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>
                  
                  <div className="ml-16 bg-white rounded-xl p-5 border border-gray-200 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getVersionTypeIcon(version.development_type)}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVersionTypeColor(version.development_type)}`}>
                                {version.development_type.replace(/_/g, ' ')}
                              </span>
                              {version.ai_confidence_score && (
                                <span className="text-xs text-gray-500">
                                  {Math.round(version.ai_confidence_score * 100)}% confidence
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDistanceToNow(new Date(version.created_at))}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          {version.previous_title !== version.new_title && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Title changed:</span> {version.previous_title} → {version.new_title}
                            </p>
                          )}
                          <p className="text-gray-700 mt-1">{version.change_summary}</p>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span>📅 {new Date(version.created_at).toLocaleDateString()}</span>
                          <span>💬 {version.conversation_length} messages</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedVersion(version)}
                        className="ml-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                      >
                        View Version
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Original Version */}
              <div className="relative">
                <div className="absolute left-7 -top-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full"></div>
                
                <div className="ml-16 bg-green-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌱</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Original Idea</h4>
                      <p className="text-sm text-gray-600">
                        Created {formatDistanceToNow(new Date(currentIdea?.created_at || Date.now()))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Version Details Modal */}
        {selectedVersion && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Version Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedVersion.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Title</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedVersion.new_title}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                  <div className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedVersion.new_content}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Change Summary</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedVersion.change_summary}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
