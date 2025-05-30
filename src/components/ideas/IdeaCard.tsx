'use client'

import { Trash2, History, Edit2, GitBranch, Users, Star, Share2, Globe, Lock } from 'lucide-react'
import Link from 'next/link'

interface Contributor {
  user_id: string
  email?: string
  full_name?: string
  avatar_url?: string
  contribution_type: 'original' | 'merge' | 'edit'
  contributed_at: string
}

interface IdeaCardProps {
  idea: {
    id: string
    title: string
    content: string
    category: string
    created_at: string
    updated_at: string
    development_count?: number
    archived?: boolean
    pinned?: boolean
    is_branch?: boolean
    branches?: Array<{ id: string; title: string }>
    contributors?: Contributor[]
    user_id: string
    visibility?: 'private' | 'public' | 'shared'
    shared_with?: string[]
  }
  onEdit: () => void
  onDelete: () => void
  onViewHistory: () => void
  onDevelopInChat: () => void
  onShare?: () => void
  formatDate: (date: string) => string
  currentUserId: string
}

export default function IdeaCard({ idea, onEdit, onDelete, onViewHistory, onDevelopInChat, onShare, formatDate, currentUserId }: IdeaCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 cursor-pointer" onClick={onEdit}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {idea.title}
          </h3>
          <p className="text-sm text-gray-500">
            {formatDate(idea.created_at)}
            {idea.updated_at !== idea.created_at && (
              <span className="text-xs text-gray-400 ml-2">(edited)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShare()
              }}
              className="p-1 text-gray-400 hover:text-green-500 transition-colors"
              title="Share idea"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
            title="Edit & Merge"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewHistory()
            }}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="View development history"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete idea"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-4">
          {idea.content}
        </p>
      </div>
      
      {/* Contributors Section */}
      {idea.contributors && idea.contributors.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <div className="flex items-center -space-x-2">
            {idea.contributors
              .sort((a, b) => {
                // Show original contributor first
                if (a.contribution_type === 'original') return -1
                if (b.contribution_type === 'original') return 1
                return 0
              })
              .slice(0, 3)
              .map((contributor, index) => {
                const isOwner = contributor.user_id === idea.user_id
                const contributionLabel = 
                  contributor.contribution_type === 'original' ? 'Owner' :
                  contributor.contribution_type === 'merge' ? 'Merged' :
                  contributor.contribution_type === 'edit' ? 'Edited' : 
                  contributor.contribution_type
                
                return (
                  <div key={contributor.user_id} className="relative" style={{ zIndex: 3 - index }}>
                    {contributor.avatar_url ? (
                      <img
                        src={contributor.avatar_url}
                        alt={contributor.full_name || contributor.email || 'Contributor'}
                        className={`w-6 h-6 rounded-full border-2 ${
                          isOwner ? 'border-purple-400' : 'border-white'
                        }`}
                        title={`${contributor.full_name || contributor.email} (${contributionLabel})`}
                      />
                    ) : (
                      <div 
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isOwner 
                            ? 'border-purple-400 bg-purple-100' 
                            : contributor.contribution_type === 'merge' 
                            ? 'border-blue-400 bg-blue-100'
                            : 'border-white bg-gray-300'
                        }`}
                        title={`${contributor.full_name || contributor.email} (${contributionLabel})`}
                      >
                        <span className={`text-xs ${
                          isOwner ? 'text-purple-700' : 
                          contributor.contribution_type === 'merge' ? 'text-blue-700' :
                          'text-gray-600'
                        }`}>
                          {(contributor.full_name || contributor.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    {isOwner && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-white" 
                           title="Idea Owner">
                        <Star className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
                      </div>
                    )}
                  </div>
                )
              })}
            {idea.contributors.length > 3 && (
              <div className="relative z-0">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{idea.contributors.length - 3}</span>
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {idea.contributors.length === 1 ? 'contributor' : 'contributors'}
          </span>
        </div>
      )}
      
      {/* Tags and Metadata Row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {idea.category}
        </span>
        {idea.visibility && idea.visibility !== 'private' && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            idea.visibility === 'public' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {idea.visibility === 'public' ? (
              <><Globe className="w-3 h-3" /> Public</>
            ) : (
              <><Users className="w-3 h-3" /> Shared</>
            )}
          </span>
        )}
        {idea.is_branch && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <GitBranch className="w-3 h-3" />
            Branch
          </span>
        )}
        {idea.development_count && idea.development_count > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            v{idea.development_count}
          </span>
        )}
        {idea.branches && idea.branches.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
            <GitBranch className="w-3 h-3" />
            {idea.branches.length} branch{idea.branches.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>
      
      {/* Action Buttons Row */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          ✓ Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDevelopInChat()
          }}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center gap-1"
        >
          Develop <span className="text-lg leading-none">→</span>
        </button>
      </div>
    </div>
  )
}
