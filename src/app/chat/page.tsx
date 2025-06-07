'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Auth error:', authError)
          setError(`Auth error: ${authError.message}`)
          setLoading(false)
          return
        }
        
        if (!user) {
          console.log('No user found, redirecting to home')
          router.push('/')
          return
        }
        
        console.log('User found:', user.email)
        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError(`Unexpected error: ${err}`)
        setLoading(false)
      }
    }

    initializeChat()
  }, [supabase, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your conversation space...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Chat</h2>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="block w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() => router.push('/')}
                className="block w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show chat interface
  if (user) {
    return <ChatInterface user={user} />
  }

  // Fallback
  return null
}