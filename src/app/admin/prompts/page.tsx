'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import PromptsAdmin from '@/components/admin/PromptsAdmin'

export default function PromptsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [prompts, setPrompts] = useState<any[]>([])
  const [recentFeedback, setRecentFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Create Supabase client
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Auth error:', authError)
          window.location.href = '/'
          return
        }
        
        if (!user) {
          window.location.href = '/'
          return
        }
        
        setUser(user)

        // Fetch prompts data
        const { data: promptsData, error: promptsError } = await supabase
          .from('dynamic_prompts')
          .select('*')
          .eq('prompt_type', 'system_message')
          .order('created_at', { ascending: false })

        if (promptsError) {
          console.error('Error fetching prompts:', promptsError)
          setError('Failed to load prompts. Please check if the dynamic_prompts table exists.')
        } else {
          setPrompts(promptsData || [])
        }

        // Fetch recent feedback data for analysis
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('message_feedback')
          .select(`
            *,
            conversation_messages!inner(content, role)
          `)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(50)

        if (feedbackError) {
          console.error('Error fetching feedback:', feedbackError)
          // Don't set error for feedback, as it's not critical
        } else {
          setRecentFeedback(feedbackData || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-5 h-5 bg-white rounded" />
          </div>
          <p className="text-gray-600">Loading prompts admin...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Prompts</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Make sure you've run <code className="bg-gray-100 px-1 py-0.5 rounded">seed-dynamic-prompts.sql</code> in Supabase.
            </p>
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <PromptsAdmin 
      user={user} 
      prompts={prompts} 
      recentFeedback={recentFeedback}
    />
  )
}