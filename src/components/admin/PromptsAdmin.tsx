'use client'

import { useState, useEffect } from 'react'
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
  RefreshCw,
  FlaskConical,
  Info,
  Edit,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import PromptAnalyticsDashboard from './PromptAnalyticsDashboard'

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
  feedback_value: number | null
  created_at: string
  conversation_messages: {
    content: string
    role: string
  }
}

interface ABTest {
  id: string
  test_name: string
  test_description: string
  test_type: string
  variants: any
  success_metric: string
  target_sample_size: number
  current_sample_size: number
  is_active: boolean
  test_status: string
  created_at: string
  test_config?: {
    traffic_split: { control: number; variant: number }
    test_duration_days: number
  }
}

interface PromptsAdminProps {
  user: User
  prompts: Prompt[]
  recentFeedback: Feedback[]
}

export default function PromptsAdmin({ user, prompts, recentFeedback }: PromptsAdminProps) {
  const [activeTab, setActiveTab] = useState<'prompts' | 'analytics'>('prompts')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [currentFeedback, setCurrentFeedback] = useState(recentFeedback)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showABTestModal, setShowABTestModal] = useState(false)
  const [selectedPromptForTest, setSelectedPromptForTest] = useState<Prompt | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [testConfig, setTestConfig] = useState({
    testName: '',
    testDescription: '',
    trafficSplit: { control: 50, variant: 50 },
    duration: 14,
    successMetric: 'satisfaction_score',
    minimumSampleSize: 100
  })
  const [selectedActivationMethod, setSelectedActivationMethod] = useState<'immediate' | 'test'>('test')
  const [activeTests, setActiveTests] = useState<ABTest[]>([])
  
  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch fresh feedback data
  const refreshFeedbackData = async () => {
    setIsRefreshing(true)
    try {
      const { data: feedbackData, error } = await supabase
        .from('message_feedback')
        .select(`
          *,
          conversation_messages(content, role)
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && feedbackData) {
        setCurrentFeedback(feedbackData)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error refreshing feedback:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch active A/B tests
  const fetchActiveTests = async () => {
    try {
      const { data: tests } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('test_type', 'prompt_variation')
        .eq('is_active', true)
        .eq('test_status', 'running')
        .order('created_at', { ascending: false })

      if (tests) {
        setActiveTests(tests)
      }
    } catch (error) {
      console.error('Error fetching active tests:', error)
    }
  }

  // Initial load
  useEffect(() => {
    fetchActiveTests()
  }, [])

  // Set up auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFeedbackData()
      fetchActiveTests()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleActivateClick = (prompt: Prompt) => {
    setSelectedPromptForTest(prompt)
    setShowABTestModal(true)
  }

  const handleEditClick = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setEditedContent(prompt.prompt_content)
    setShowEditModal(true)
  }

  const saveEditedPrompt = async () => {
    if (!editingPrompt) return

    try {
      const { error } = await supabase
        .from('dynamic_prompts')
        .update({ prompt_content: editedContent })
        .eq('id', editingPrompt.id)

      if (error) {
        alert('Error saving prompt: ' + error.message)
      } else {
        alert('Prompt updated successfully!')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error saving prompt:', error)
      alert('Failed to save prompt')
    }
  }

  const createABTest = async () => {
    if (!selectedPromptForTest) return

    try {
      const activePrompt = prompts.find(p => p.is_active)
      
      if (!activePrompt) {
        alert('No active prompt found to test against')
        return
      }

      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-test',
          controlPromptId: activePrompt.id,
          variantPromptId: selectedPromptForTest.id,
          testName: testConfig.testName || `Test: v${activePrompt.prompt_version} vs v${selectedPromptForTest.prompt_version}`,
          testDescription: testConfig.testDescription || 'Testing prompt performance improvement',
          trafficSplit: testConfig.trafficSplit,
          duration: testConfig.duration,
          successMetric: testConfig.successMetric,
          minimumSampleSize: testConfig.minimumSampleSize
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert('A/B test created successfully! Users will now be randomly assigned to different prompt versions.')
        setShowABTestModal(false)
        window.location.reload()
      } else {
        alert('Error creating A/B test: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating A/B test:', error)
      alert('Failed to create A/B test')
    }
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
      } else if (result.error) {
        console.error('Analysis error:', result)
        alert(`Error: ${result.error}\n${result.details || ''}\n${result.hint || ''}`)
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

  console.log('Recent feedback data:', currentFeedback.slice(0, 3)); // Debug first 3 entries
  console.log('Feedback with null messages:', currentFeedback.filter(f => !f.conversation_messages).length);
  console.log('Feedback types breakdown:', {
    thumbs_up: currentFeedback.filter(f => f.feedback_type === 'thumbs_up').length,
    thumbs_down: currentFeedback.filter(f => f.feedback_type === 'thumbs_down').length,
    rating: currentFeedback.filter(f => f.feedback_type === 'rating').length,
    other: currentFeedback.filter(f => !['thumbs_up', 'thumbs_down', 'rating'].includes(f.feedback_type)).length
  });
  console.log('Feedback values for thumbs:', {
    thumbs_up_values: currentFeedback.filter(f => f.feedback_type === 'thumbs_up').map(f => f.feedback_value),
    thumbs_down_values: currentFeedback.filter(f => f.feedback_type === 'thumbs_down').map(f => f.feedback_value)
  });
  
  const feedbackStats = {
    total: currentFeedback.length,
    positive: currentFeedback.filter(f => {
      // Thumbs up OR rating >= 4 (but not negative thumbs which have value = -1)
      if (f.feedback_type === 'thumbs_up') return true;
      if (f.feedback_type === 'rating' && f.feedback_value !== null && f.feedback_value >= 4) return true;
      return false;
    }).length,
    negative: currentFeedback.filter(f => {
      // Thumbs down OR rating <= 2 (but only for actual ratings, not thumbs)
      if (f.feedback_type === 'thumbs_down') return true;
      if (f.feedback_type === 'rating' && f.feedback_value !== null && f.feedback_value <= 2) return true;
      return false;
    }).length,
    avgRating: currentFeedback.length > 0 
      ? currentFeedback
          .filter(f => f.feedback_type === 'rating' && f.feedback_value !== null && f.feedback_value > 0)
          .reduce((sum, f) => sum + (f.feedback_value || 0), 0) / 
        Math.max(currentFeedback.filter(f => f.feedback_type === 'rating' && f.feedback_value !== null && f.feedback_value > 0).length, 1)
      : 0
  }
  
  console.log('Calculated feedback stats:', feedbackStats); // Debug stats

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
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('prompts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prompts'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Prompt Management
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics & Insights
            </button>
          </nav>
        </div>

        {/* Conditional Content Based on Tab */}
        {activeTab === 'prompts' ? (
          <>
            {/* Active A/B Tests Section */}
        {activeTests.length > 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-1 mb-8">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FlaskConical className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Active A/B Tests</h2>
                <span className="ml-auto text-sm text-gray-600">
                  {activeTests.length} test{activeTests.length > 1 ? 's' : ''} running
                </span>
              </div>
              <div className="space-y-3">
                {activeTests.map(test => {
                  const progressPercent = Math.min(100, (test.current_sample_size / test.target_sample_size) * 100)
                  return (
                    <div key={test.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{test.test_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{test.test_description}</p>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          {test.test_config?.test_duration_days || 14} days
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Participants:</span>
                          <span className="ml-2 font-medium">{test.current_sample_size}/{test.target_sample_size}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Success Metric:</span>
                          <span className="ml-2 font-medium">{test.success_metric.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Traffic Split:</span>
                          <span className="ml-2 font-medium">
                            {test.test_config?.traffic_split.control || 50}% / {test.test_config?.traffic_split.variant || 50}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{progressPercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Refresh indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            {isRefreshing && (
              <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
            )}
          </div>
          <button
            onClick={refreshFeedbackData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>
        
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
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-1 mb-8">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Currently Active Prompt</h2>
                  <p className="text-sm text-gray-600">This is the prompt all users see right now</p>
                </div>
                <span className="ml-auto bg-green-500 text-white text-lg px-4 py-2 rounded-full font-bold">
                  Version {activePrompt.prompt_version}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-green-200">
                <p className="text-gray-700 whitespace-pre-wrap">{activePrompt.prompt_content}</p>
              </div>
              {activePrompt.performance_metrics && (
                <div className="mt-4 text-sm text-gray-600">
                  <strong>Performance:</strong> {JSON.stringify(activePrompt.performance_metrics, null, 2)}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">All Prompt Versions</h2>
            <button
              onClick={() => {
                setEditingPrompt(null)
                setEditedContent('')
                setShowEditModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Prompt
            </button>
          </div>
          
          {prompts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No custom prompts yet. Use "Analyze & Improve" to generate your first optimized prompt.
            </p>
          ) : (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <div 
                  key={prompt.id}
                  className={`border rounded-lg p-4 transition-all relative ${
                    prompt.is_active 
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-50' 
                      : 'border-gray-200 hover:border-gray-300 opacity-60'
                  }`}
                >
                  {prompt.is_active && (
                    <div className="absolute -top-3 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ACTIVE - USERS SEE THIS
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        Version {prompt.prompt_version}
                      </span>

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
                      <button
                        onClick={() => handleEditClick(prompt)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      {!prompt.is_active && (
                        <button
                          onClick={() => handleActivateClick(prompt)}
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
          </>
        ) : (
          <PromptAnalyticsDashboard />
        )}
      </main>

      {/* A/B Test Creation Modal */}
      {showABTestModal && selectedPromptForTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Activate Prompt Version {selectedPromptForTest.prompt_version}
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">What is A/B Testing?</p>
                  <p>A/B testing allows you to compare two prompts by randomly showing different versions to users. This helps determine which prompt performs better based on real user feedback.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-700 font-medium">How would you like to activate this prompt?</p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="activation-method" 
                    value="immediate"
                    checked={selectedActivationMethod === 'immediate'}
                    onChange={() => setSelectedActivationMethod('immediate')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Replace immediately</p>
                    <p className="text-sm text-gray-600">All users will start using this prompt right away</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="activation-method" 
                    value="test"
                    checked={selectedActivationMethod === 'test'}
                    onChange={() => setSelectedActivationMethod('test')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Run A/B test first</p>
                    <p className="text-sm text-gray-600">Compare performance before fully switching</p>
                  </div>
                </label>
              </div>

              {selectedActivationMethod === 'test' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">A/B Test Configuration</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Name
                      </label>
                      <input
                        type="text"
                        value={testConfig.testName}
                        onChange={(e) => setTestConfig({...testConfig, testName: e.target.value})}
                        placeholder="e.g., Improved Clarity Test"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Success Metric
                      </label>
                      <select
                        value={testConfig.successMetric}
                        onChange={(e) => setTestConfig({...testConfig, successMetric: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="satisfaction_score">User Satisfaction</option>
                        <option value="positive_feedback_rate">Positive Feedback %</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Duration (days)
                      </label>
                      <input
                        type="number"
                        value={testConfig.duration}
                        onChange={(e) => setTestConfig({...testConfig, duration: parseInt(e.target.value)})}
                        min="7"
                        max="30"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sample Size
                      </label>
                      <input
                        type="number"
                        value={testConfig.minimumSampleSize}
                        onChange={(e) => setTestConfig({...testConfig, minimumSampleSize: parseInt(e.target.value)})}
                        min="50"
                        step="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Traffic Split
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Current: {testConfig.trafficSplit.control}%</span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={testConfig.trafficSplit.control}
                        onChange={(e) => {
                          const control = parseInt(e.target.value)
                          setTestConfig({
                            ...testConfig, 
                            trafficSplit: { control, variant: 100 - control }
                          })
                        }}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600">New: {testConfig.trafficSplit.variant}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Description
                    </label>
                    <textarea
                      value={testConfig.testDescription}
                      onChange={(e) => setTestConfig({...testConfig, testDescription: e.target.value})}
                      placeholder="What are you hoping to improve with this prompt?"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowABTestModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={async () => {
                  if (selectedActivationMethod === 'immediate') {
                    await activatePrompt(selectedPromptForTest.id)
                    setShowABTestModal(false)
                  } else {
                    await createABTest()
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {selectedActivationMethod === 'immediate' ? 'Activate Immediately' : 'Start A/B Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Prompt Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingPrompt ? `Edit Prompt Version ${editingPrompt.prompt_version}` : 'Create New Prompt'}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Content
              </label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter your prompt content here..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: Be specific about tone, approach, and what makes responses valuable.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Prompt Best Practices:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Define the AI's role clearly (e.g., "You are Poppy, an AI assistant...")</li>
                    <li>Specify the desired tone and communication style</li>
                    <li>Include specific instructions for handling different scenarios</li>
                    <li>Mention key objectives (e.g., helping users develop ideas)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPrompt(null)
                  setEditedContent('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={async () => {
                  if (editingPrompt) {
                    await saveEditedPrompt()
                  } else {
                    // Create new prompt
                    const response = await fetch('/api/prompts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'create_variant',
                        promptContent: editedContent,
                        description: 'Manually created prompt'
                      })
                    })
                    if (response.ok) {
                      alert('New prompt created successfully!')
                      window.location.reload()
                    } else {
                      alert('Failed to create prompt')
                    }
                  }
                  setShowEditModal(false)
                }}
                disabled={!editedContent.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingPrompt ? 'Save Changes' : 'Create Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}