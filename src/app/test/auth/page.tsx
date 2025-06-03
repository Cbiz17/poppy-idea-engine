'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export default function TestAuthPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      {user ? (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800">✅ Authenticated</p>
            <p className="text-sm text-gray-600 mt-2">Email: {user.email}</p>
            <p className="text-sm text-gray-600">ID: {user.id}</p>
          </div>
          
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
          
          <div className="space-y-2">
            <p className="font-semibold">Test navigation:</p>
            <div className="space-x-2">
              <a href="/chat" className="text-blue-600 hover:underline">Go to Chat</a>
              <a href="/dashboard" className="text-blue-600 hover:underline">Go to Dashboard</a>
              <a href="/ideas" className="text-blue-600 hover:underline">Go to Ideas</a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800">⚠️ Not authenticated</p>
          </div>
          
          <a href="/" className="text-blue-600 hover:underline">Go to Login Page</a>
        </div>
      )}
    </div>
  )
}
