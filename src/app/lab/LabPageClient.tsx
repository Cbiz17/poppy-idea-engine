'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import AdminDashboard from '@/components/admin/AdminDashboard'
import PromptsAdmin from '@/components/admin/PromptsAdmin'
import Link from 'next/link'
import { Sparkles, LogOut, MessageCircle, Globe, BarChart3, Zap, FlaskConical, LineChart } from 'lucide-react'
import { User } from '@supabase/supabase-js'

interface LabPageProps {
  user: User
}

export default function LabPageClient({ user }: LabPageProps) {
  const [activeTab, setActiveTab] = useState<'prompts' | 'overview' | 'analytics' | 'experiments'>('prompts')
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header - matching IdeasGallery */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Poppy Idea Engine</h1>
              <p className="text-sm text-gray-600">AI Lab</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              href="/lab"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors relative"
            >
              <span className="animate-pulse">⚡</span>
              <span>Lab</span>
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
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="animate-pulse">⚡</span>
            Poppy Lab
          </h2>
          <p className="text-lg text-gray-600 mt-2">
            Where your feedback shapes the future of embodied intelligence
          </p>
          
          {/* Creator-focused explanation */}
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-900">
              <strong>For Creators:</strong> This is the nerve center of Poppy's self-improvement system. 
              Here you can monitor how user feedback is training the AI, analyze which prompts perform best, 
              and see real-time improvements. Every piece of feedback collected helps us understand what makes 
              conversations valuable, informing the development of the full Poppy personal AI orchestrator.
            </p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('prompts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'prompts'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Prompt Management
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4" />
                Analytics
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('experiments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'experiments'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Experiments
              </div>
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div>
          {activeTab === 'prompts' && <PromptsAdmin />}
          {activeTab === 'overview' && <AdminDashboard user={user} />}
          {activeTab === 'analytics' && (
            <div className="text-center py-12 text-gray-500">
              <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Analytics dashboard coming soon...</p>
            </div>
          )}
          {activeTab === 'experiments' && (
            <div className="text-center py-12 text-gray-500">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>A/B testing experiments coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
