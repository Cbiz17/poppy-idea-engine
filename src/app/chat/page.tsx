'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import ChatInterface from '@/components/chat/ChatInterface'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          console.error('Auth error:', error)
          router.push('/')
          return
        }
        
        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('Error checking auth:', err)
        router.push('/')
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push('/')
      } else {
        setUser(session.user)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

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

  if (!user) {
    return null
  }

  return (
    <ErrorBoundary>
      <ChatInterface user={user} />
    </ErrorBoundary>
  )
}
