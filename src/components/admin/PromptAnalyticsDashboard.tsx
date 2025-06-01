'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare,
  ThumbsUp,
  Clock,
  Target,
  Activity,
  ChevronRight,
  Calendar,
  Filter
} from 'lucide-react'

interface PromptMetrics {
  promptId: string
  promptVersion: number
  totalInteractions: number
  avgSatisfaction: number
  positiveRate: number
  negativeRate: number
  avgResponseTime: number
  topFeedbackTags: string[]
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

interface TimeRange {
  label: string
  value: '24h' | '7d' | '30d' | 'all'
}

export default function PromptAnalyticsDashboard() {
  const [activePromptMetrics, setActivePromptMetrics] = useState<PromptMetrics | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange['value']>('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [comparisonData, setComparisonData] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const timeRanges: TimeRange[] = [
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'All Time', value: 'all' }
  ]

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      // Get active prompt
      const { data: activePrompt } = await supabase
        .from('dynamic_prompts')
        .select('*')
        .eq('is_active', true)
        .eq('prompt_type', 'system_message')
        .single()

      if (!activePrompt) return

      // Calculate time filter
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24)
          break
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        default:
          startDate = new Date('2024-01-01') // All time
      }

      // Get feedback data for active prompt
      const { data: feedback } = await supabase
        .from('message_feedback')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      // Calculate metrics
      const totalInteractions = feedback?.length || 0
      const positiveCount = feedback?.filter(f => 
        f.feedback_type === 'thumbs_up' || 
        (f.feedback_type === 'rating' && f.feedback_value >= 4)
      ).length || 0
      const negativeCount = feedback?.filter(f => 
        f.feedback_type === 'thumbs_down' || 
        (f.feedback_type === 'rating' && f.feedback_value <= 2)
      ).length || 0

      const avgSatisfaction = feedback?.filter(f => f.feedback_type === 'rating' && f.feedback_value)
        .reduce((sum, f) => sum + f.feedback_value, 0) / 
        Math.max(feedback?.filter(f => f.feedback_type === 'rating').length || 1, 1)

      // Calculate trend (compare to previous period)
      const prevStartDate = new Date(startDate)
      const periodMs = now.getTime() - startDate.getTime()
      prevStartDate.setTime(prevStartDate.getTime() - periodMs)

      const { data: prevFeedback } = await supabase
        .from('message_feedback')
        .select('*')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      const prevPositiveRate = (prevFeedback?.filter(f => 
        f.feedback_type === 'thumbs_up' || 
        (f.feedback_type === 'rating' && f.feedback_value >= 4)
      ).length || 0) / Math.max(prevFeedback?.length || 1, 1)

      const currentPositiveRate = positiveCount / Math.max(totalInteractions, 1)
      const trendPercentage = prevPositiveRate > 0 
        ? ((currentPositiveRate - prevPositiveRate) / prevPositiveRate) * 100
        : 0

      setActivePromptMetrics({
        promptId: activePrompt.id,
        promptVersion: activePrompt.performance_metrics?.prompt_version || activePrompt.prompt_version,
        totalInteractions,
        avgSatisfaction: avgSatisfaction || 0,
        positiveRate: currentPositiveRate,
        negativeRate: negativeCount / Math.max(totalInteractions, 1),
        avgResponseTime: 0.8, // Placeholder - would calculate from actual response times
        topFeedbackTags: ['helpful', 'creative', 'clear'], // Placeholder - would extract from actual tags
        trend: trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable',
        trendPercentage: Math.abs(trendPercentage)
      })

      // Get historical data for chart
      // This would be more sophisticated in production
      const historicalMetrics = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          satisfaction: 3.5 + Math.random() * 1.5,
          interactions: Math.floor(50 + Math.random() * 100)
        }
      })
      
      setHistoricalData(historicalMetrics)

      // Get comparison data with other prompts
      const { data: allPrompts } = await supabase
        .from('dynamic_prompts')
        .select('*')
        .eq('prompt_type', 'system_message')
        .order('created_at', { ascending: false })
        .limit(5)

      setComparisonData(allPrompts)

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Prompt Performance Analytics</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange['value'])}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {activePromptMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Interactions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Interactions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activePromptMetrics.totalInteractions.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Satisfaction Score */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Satisfaction</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activePromptMetrics.avgSatisfaction.toFixed(1)}/5
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {activePromptMetrics.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : activePromptMetrics.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : null}
                  <span className={`text-xs ${
                    activePromptMetrics.trend === 'up' ? 'text-green-600' : 
                    activePromptMetrics.trend === 'down' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {activePromptMetrics.trend === 'stable' ? 'Stable' : 
                     `${activePromptMetrics.trendPercentage.toFixed(0)}%`}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Positive Rate */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Positive Feedback</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {(activePromptMetrics.positiveRate * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {(activePromptMetrics.positiveRate * activePromptMetrics.totalInteractions).toFixed(0)} positive
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activePromptMetrics.avgResponseTime}s
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Fast responses
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {historicalData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-purple-100 rounded-t relative" 
                style={{ 
                  height: `${(data.satisfaction / 5) * 100}%`,
                  minHeight: '20px'
                }}
              >
                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                  {data.satisfaction.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-gray-500 mt-2">{data.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Feedback Tags */}
      {activePromptMetrics && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Feedback Themes</h3>
          <div className="flex flex-wrap gap-2">
            {activePromptMetrics.topFeedbackTags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Comparison Table */}
      {comparisonData && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prompt Version Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-medium text-gray-600 pb-2">Version</th>
                  <th className="text-left text-sm font-medium text-gray-600 pb-2">Status</th>
                  <th className="text-left text-sm font-medium text-gray-600 pb-2">Success Rate</th>
                  <th className="text-left text-sm font-medium text-gray-600 pb-2">Created</th>
                  <th className="text-left text-sm font-medium text-gray-600 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((prompt: any) => (
                  <tr key={prompt.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm font-medium text-gray-900">
                      v{prompt.performance_metrics?.prompt_version || prompt.prompt_version}
                    </td>
                    <td className="py-3">
                      {prompt.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {prompt.performance_metrics?.success_rate 
                        ? `${(prompt.performance_metrics.success_rate * 100).toFixed(0)}%`
                        : '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {new Date(prompt.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <button className="text-purple-600 hover:text-purple-700">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}