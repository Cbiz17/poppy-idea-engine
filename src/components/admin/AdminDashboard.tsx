'use client'

// ADMIN DASHBOARD - COMPLETE AND READY!
// Last updated: May 29, 2025
// Status: Fully functional, waiting for data
// Features:
// - Real-time stats display
// - Feedback analytics
// - Learning pattern visualization
// - Recent feedback monitor
// Current state: Shows "No feedback collected yet" because users haven't provided feedback
// TO ACTIVATE: Use the chat and click feedback buttons!

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Brain, TrendingUp, Users, MessageSquare, ThumbsUp, ThumbsDown, Activity, Clock, Zap, BarChart } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface AdminDashboardProps {
  user: User
}

interface SystemStats {
  totalFeedback: number
  positiveFeedback: number
  negativeFeedback: number
  totalConversations: number
  totalIdeas: number
  activeUsers: number
  avgResponseRating: number
  feedbackTrend: 'up' | 'down' | 'stable'
  recentPatterns: Array<{
    pattern: string
    confidence: number
    occurrences: number
  }>
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch feedback stats
      const { data: feedbackData } = await supabase
        .from('message_feedback')
        .select('feedback_type, feedback_value, created_at')
      
      const totalFeedback = feedbackData?.length || 0
      const positiveFeedback = feedbackData?.filter(f => f.feedback_type === 'thumbs_up' || f.feedback_value > 3).length || 0
      const negativeFeedback = feedbackData?.filter(f => f.feedback_type === 'thumbs_down' || f.feedback_value < 3).length || 0
      
      // Fetch conversation stats
      const { count: totalConversations } = await supabase
        .from('conversations')
        .select('id', { count: 'exact' })
      
      // Fetch idea stats
      const { count: totalIdeas } = await supabase
        .from('ideas')
        .select('id', { count: 'exact' })
      
      // Fetch active users (last 7 days)
      const { data: activeUsersData } = await supabase
        .from('user_actions')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      
      const uniqueUsers = new Set(activeUsersData?.map(a => a.user_id) || [])
      
      // Calculate average rating
      const ratings = feedbackData?.filter(f => f.feedback_value).map(f => f.feedback_value) || []
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      
      // Determine trend (compare last week to previous week)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      
      const lastWeekFeedback = feedbackData?.filter(f => 
        new Date(f.created_at) > oneWeekAgo
      ).length || 0
      
      const previousWeekFeedback = feedbackData?.filter(f => 
        new Date(f.created_at) > twoWeeksAgo && 
        new Date(f.created_at) <= oneWeekAgo
      ).length || 0
      
      const trend = lastWeekFeedback > previousWeekFeedback ? 'up' : 
                   lastWeekFeedback < previousWeekFeedback ? 'down' : 'stable'
      
      // Fetch recent patterns
      const { data: patterns } = await supabase
        .from('learning_patterns')
        .select('pattern_type, pattern_value, confidence_score, occurrence_count')
        .order('confidence_score', { ascending: false })
        .limit(5)
      
      const recentPatterns = patterns?.map(p => ({
        pattern: p.pattern_value?.pattern || p.pattern_type,
        confidence: p.confidence_score,
        occurrences: p.occurrence_count
      })) || []
      
      setStats({
        totalFeedback,
        positiveFeedback,
        negativeFeedback,
        totalConversations: totalConversations || 0,
        totalIdeas: totalIdeas || 0,
        activeUsers: uniqueUsers.size,
        avgResponseRating: avgRating,
        feedbackTrend: trend,
        recentPatterns
      })
      
      // Fetch recent feedback with details
      const { data: recent } = await supabase
        .from('message_feedback')
        .select(`
          *,
          conversation_messages!inner(content, role)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      
      setRecentFeedback(recent || [])
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Poppy Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor AI Learning & Performance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/prompts"
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Manage Prompts
              </Link>
              <Link 
                href="/chat"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Chat
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Feedback */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <span className={`text-sm font-medium ${
                stats?.feedbackTrend === 'up' ? 'text-green-600' : 
                stats?.feedbackTrend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {stats?.feedbackTrend === 'up' ? '↑' : 
                 stats?.feedbackTrend === 'down' ? '↓' : '→'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalFeedback || 0}</h3>
            <p className="text-sm text-gray-600">Total Feedback</p>
          </div>

          {/* Satisfaction Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                {stats?.avgResponseRating ? `${stats.avgResponseRating.toFixed(1)}/5` : 'N/A'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats && stats.totalFeedback > 0 
                ? `${Math.round((stats.positiveFeedback / stats.totalFeedback) * 100)}%`
                : '0%'
              }
            </h3>
            <p className="text-sm text-gray-600">Satisfaction Rate</p>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">7 days</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</h3>
            <p className="text-sm text-gray-600">Active Users</p>
          </div>

          {/* Ideas Created */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">All time</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalIdeas || 0}</h3>
            <p className="text-sm text-gray-600">Ideas Created</p>
          </div>
        </div>

        {/* Learning Patterns */}
        {stats?.recentPatterns && stats.recentPatterns.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Detected Learning Patterns
            </h2>
            <div className="space-y-3">
              {stats.recentPatterns.map((pattern, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{pattern.pattern}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-600">{pattern.occurrences} occurrences</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">Confidence:</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${pattern.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-700">{Math.round(pattern.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Recent Feedback
          </h2>
          <div className="space-y-3">
            {recentFeedback.length > 0 ? (
              recentFeedback.map((feedback) => (
                <div key={feedback.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {feedback.feedback_type === 'thumbs_up' ? (
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                        ) : feedback.feedback_type === 'thumbs_down' ? (
                          <ThumbsDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <BarChart className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {feedback.feedback_type === 'rating' 
                            ? `Rated ${feedback.feedback_value}/5`
                            : feedback.feedback_type.replace('_', ' ').charAt(0).toUpperCase() + feedback.feedback_type.slice(1).replace('_', ' ')
                          }
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.created_at).toLocaleString()}
                        </span>
                      </div>
                      {feedback.feedback_text && (
                        <p className="text-sm text-gray-600 italic">"{feedback.feedback_text}"</p>
                      )}
                      {feedback.context_tags && feedback.context_tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {feedback.context_tags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No feedback collected yet. Encourage users to rate responses!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}