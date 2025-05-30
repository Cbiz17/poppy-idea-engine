'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { 
  Sparkles, 
  LogOut, 
  TrendingUp, 
  Settings, 
  Play, 
  BarChart3,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Prompt {
  id: string
  prompt_content: string
  prompt_version: number
  performance_metrics: any
  is_active: boolean
  created_at: string
  a_b_test_group?: string
}

interface Feedback {
  id: string
  feedback_type: string
  feedback_value: number
  context_tags: string[]
  created_at: string
  conversation_messages: {
    content: string
    role: string
  }
}

interface PromptsAdminProps {
  user: User
  prompts: Prompt[]
  recentFeedback: Feedback[]
}

export default function PromptsAdmin({ user, prompts, recentFeedback }: PromptsAdminProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  
  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const activatePrompt = async (promptId: string) => {
    try {
      await supabase
        .from('dynamic_prompts')
        .update({ is_active: false })
        .eq('prompt_type', 'system_message')

      const { error } = await supabase
        .from('dynamic_prompts')
        .update({ is_active: true })
        .eq('id', promptId)

      if (error) {
        alert('Error activating prompt: ' + error.message)
      } else {
        alert('Prompt activated successfully!')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error activating prompt:', error)
      alert('Failed to activate prompt')
    }
  }

  const analyzeAndImprove = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_and_improve' })
      })

      const result = await response.json()
      setAnalysisResults(result)
      
      if (result.success) {
        alert('New improved prompt generated!')
        window.location.reload()
      } else {
        alert(result.message || 'Analysis completed with notes')
      }
    } catch (error) {
      console.error('Error analyzing prompts:', error)
      alert('Failed to analyze prompts')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const feedbackStats = {
    total: recentFeedback.length,
    positive: recentFeedback.filter(f => f.feedback_value >= 4 || f.feedback_type === 'thumbs_up').length,
    negative: recentFeedback.filter(f => f.feedback_value <= 2 || f.feedback_type === 'thumbs_down').length,
    avgRating: recentFeedback.length > 0 
      ? recentFeedback
          .filter(f => f.feedback_value)
          .reduce((sum, f) => sum + f.feedback_value, 0) / 
        recentFeedback.filter(f => f.feedback_value).length
      : 0
  }

  const activePrompt = prompts.find(p => p.is_active)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Poppy Admin</h1>
              <p className="text-sm text-gray-600">Dynamic Prompts Management</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Link>
            
            <Link
              href="/ideas"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Ideas
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user.email}</span>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{feedbackStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <ThumbsUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Positive</p>
                <p className="text-2xl font-bold text-gray-900">{feedbackStats.positive}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <ThumbsDown className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Negative</p>
                <p className="text-2xl font-bold text-gray-900">{feedbackStats.negative}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedbackStats.avgRating.toFixed(1)}/5
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Prompt Analysis & Improvement</h2>
            <button
              onClick={analyzeAndImprove}
              disabled={isAnalyzing || feedbackStats.total < 10}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze & Improve'}
            </button>
          </div>
          
          {feedbackStats.total < 10 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                Need at least 10 feedback entries to run analysis. Current: {feedbackStats.total}
              </p>
            </div>
          )}
          
          {analysisResults && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Latest Analysis Results</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(analysisResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {activePrompt && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Currently Active Prompt</h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                v{activePrompt.prompt_version}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{activePrompt.prompt_content}</p>
            </div>
            {activePrompt.performance_metrics && (
              <div className="mt-4 text-sm text-gray-600">
                <strong>Performance:</strong> {JSON.stringify(activePrompt.performance_metrics, null, 2)}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">All Prompt Versions</h2>
          
          {prompts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No custom prompts yet. Use "Analyze & Improve" to generate your first optimized prompt.
            </p>
          ) : (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <div 
                  key={prompt.id}
                  className={`border rounded-lg p-4 transition-all ${
                    prompt.is_active 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        Version {prompt.prompt_version}
                      </span>
                      {prompt.is_active && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          ACTIVE
                        </span>
                      )}
                      {prompt.a_b_test_group && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {prompt.a_b_test_group}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </span>
                      {!prompt.is_active && (
                        <button
                          onClick={() => activatePrompt(prompt.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {prompt.prompt_content}
                    </p>
                  </div>
                  
                  {prompt.performance_metrics && (
                    <div className="text-xs text-gray-600">
                      <details>
                        <summary className="cursor-pointer font-medium">Performance Metrics</summary>
                        <pre className="mt-2 text-xs">
                          {JSON.stringify(prompt.performance_metrics, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}