import React from 'react'
import Link from 'next/link'
import { Sparkles, Layout, Save, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { User } from '@supabase/supabase-js'

interface ChatHeaderProps {
  user: User
  messagesLength: number
  hasValueableContent: boolean
  onQuickSave: () => void
  onSignOut: () => Promise<void>
}

export function ChatHeader({
  user,
  messagesLength,
  hasValueableContent,
  onQuickSave,
  onSignOut
}: ChatHeaderProps) {
  const isAdmin = user.email === 'christianbutler@hey.com' || user.email?.includes('@admin')

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/chat" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Poppy Idea Engine</h1>
            <p className="text-sm text-gray-600">Conversation Space</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          {messagesLength > 1 && (
            <button
              onClick={onQuickSave}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                hasValueableContent 
                  ? 'text-purple-600 hover:text-purple-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={hasValueableContent ? 'Save valuable content' : 'Save conversation'}
            >
              <Save className="w-4 h-4" />
              Save Idea
              {hasValueableContent && (
                <span className="inline-flex items-center justify-center w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              )}
            </button>
          )}

          <Link 
            href="/ideas"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Layout className="w-4 h-4" /> 
            Idea Gallery
          </Link>

          {isAdmin && (
            <Link 
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              title="Admin Dashboard"
            >
              <Settings className="w-4 h-4" /> 
              Admin
            </Link>
          )}

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="View Profile"
            >
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <span className="text-sm text-gray-600">
                {user.user_metadata?.full_name || user.email}
              </span>
            </Link>
          </div>
          
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
