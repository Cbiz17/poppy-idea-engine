'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat Interface</h1>
            <p className="text-gray-600 mb-4">Welcome, {user.email}!</p>
            
            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-sm text-gray-600">Chat interface is loading...</p>
              <p className="text-xs text-gray-500 mt-2">If the chat doesn't load, there may be an issue with the ChatInterface component.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sign Out
              </button>
              <a
                href="/test/auth"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
              >
                Test Auth Page
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
