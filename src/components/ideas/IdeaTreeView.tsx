'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  GitBranch, ChevronRight, ChevronDown, Calendar, 
  ArrowUpRight, Layers, History, Sparkles, 
  User, Clock, TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface IdeaNode {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
  development_count: number
  branched_from_id: string | null
  branch_note: string | null
  is_branch: boolean
  children?: IdeaNode[]
  parent?: IdeaNode
}

interface IdeaTreeViewProps {
  ideaId: string
  isOpen: boolean
  onClose: () => void
}

export default function IdeaTreeView({ ideaId, isOpen, onClose }: IdeaTreeViewProps) {
  const [treeData, setTreeData] = useState<IdeaNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([ideaId]))
  const [loading, setLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string>(ideaId)
  const [developmentHistory, setDevelopmentHistory] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadIdeaTree()
    }
  }, [isOpen, ideaId])

  const loadIdeaTree = async () => {
    setLoading(true)
    try {
      // First, get the current idea
      const { data: currentIdea } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single()

      if (!currentIdea) return

      // Build the tree structure
      const tree = await buildTree(currentIdea)
      setTreeData(tree)

      // Load development history for the selected idea
      await loadDevelopmentHistory(ideaId)
    } catch (error) {
      console.error('Error loading idea tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildTree = async (idea: any): Promise<IdeaNode> => {
    const node: IdeaNode = {
      ...idea,
      children: [],
      parent: undefined
    }

    // Load parent if this is a branch
    if (idea.branched_from_id) {
      const { data: parent } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', idea.branched_from_id)
        .single()

      if (parent) {
        node.parent = parent
      }
    }

    // Load all children (branches from this idea)
    const { data: children } = await supabase
      .from('ideas')
      .select('*')
      .eq('branched_from_id', idea.id)
      .order('created_at', { ascending: false })

    if (children && children.length > 0) {
      // Recursively build tree for each child
      node.children = await Promise.all(
        children.map(child => buildTree(child))
      )
    }

    return node
  }

  const loadDevelopmentHistory = async (nodeId: string) => {
    try {
      const { data: history } = await supabase
        .from('idea_development_history')
        .select('*')
        .eq('idea_id', nodeId)
        .order('created_at', { ascending: false })

      setDevelopmentHistory(history || [])
    } catch (error) {
      console.error('Error loading development history:', error)
    }
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const selectNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId)
    await loadDevelopmentHistory(nodeId)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderNode = (node: IdeaNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNodeId === node.id
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id} className="relative">
        {/* Connection line */}
        {level > 0 && (
          <div className="absolute left-0 top-0 w-6 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg" 
               style={{ left: `${(level - 1) * 32 + 16}px`, top: '-12px' }} />
        )}

        <div
          className={`flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-all ${
            isSelected 
              ? 'bg-purple-100 border-2 border-purple-500' 
              : 'hover:bg-gray-50 border-2 border-transparent'
          }`}
          style={{ marginLeft: `${level * 32}px` }}
          onClick={() => selectNode(node.id)}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          {/* Node content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">{node.title}</h4>
              {node.development_count > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  v{node.development_count + 1}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {node.content}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(node.created_at)}
              </span>
              {node.is_branch && node.branch_note && (
                <span className="italic">{node.branch_note}</span>
              )}
            </div>
          </div>

          {/* View button */}
          <Link
            href={`/ideas/${node.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="View idea"
          >
            <ArrowUpRight className="w-4 h-4 text-gray-600" />
          </Link>
        </div>

        {/* Render children */}
        {isExpanded && node.children && (
          <div className="mt-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const getSelectedNode = (node: IdeaNode | null): IdeaNode | null => {
    if (!node) return null
    if (node.id === selectedNodeId) return node
    
    if (node.children) {
      for (const child of node.children) {
        const found = getSelectedNode(child)
        if (found) return found
      }
    }
    
    return null
  }

  const selectedNode = getSelectedNode(treeData)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Left side - Tree view */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-purple-600" />
                Idea Tree View
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Explore the evolution and branches of your ideas
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-purple-600 animate-pulse mx-auto mb-2" />
                  <p className="text-gray-600">Loading idea tree...</p>
                </div>
              </div>
            ) : treeData ? (
              <div>
                {/* Show parent if exists */}
                {treeData.parent && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Parent Idea
                    </p>
                    <Link
                      href={`/ideas/${treeData.parent.id}`}
                      className="font-medium text-purple-600 hover:text-purple-700 flex items-center gap-2"
                    >
                      {treeData.parent.title}
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {/* Render tree */}
                {renderNode(treeData)}
              </div>
            ) : (
              <p className="text-center text-gray-500">No tree data available</p>
            )}
          </div>
        </div>

        {/* Right side - Details */}
        <div className="w-1/2 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Development History
            </h3>
            {selectedNode && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedNode.title}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {developmentHistory.length > 0 ? (
              <div className="space-y-4">
                {developmentHistory.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    {/* Timeline line */}
                    {index < developmentHistory.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-300" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        v{entry.version_number}
                      </div>
                      
                      <div className="flex-1 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {entry.development_type.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                               entry.development_type.replace(/_/g, ' ').slice(1)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {entry.change_summary}
                            </p>
                          </div>
                          {entry.ai_confidence_score && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              {Math.round(entry.ai_confidence_score * 100)}% confidence
                            </span>
                          )}
                        </div>
                        
                        {entry.previous_title !== entry.new_title && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Title changed:</span> 
                            <span className="line-through ml-2">{entry.previous_title}</span>
                            <span className="ml-2">→</span>
                            <span className="ml-2 text-purple-600">{entry.new_title}</span>
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(entry.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {entry.conversation_length} messages
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No development history yet</p>
                <p className="text-sm mt-1">Updates will appear here as you develop this idea</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <Link
                href={`/chat?idea=${selectedNodeId}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4" />
                Continue in Chat
              </Link>
              <Link
                href={`/ideas/${selectedNodeId}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <ArrowUpRight className="w-4 h-4" />
                View Full Idea
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
