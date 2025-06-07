'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function SimpleAuthTest() {
  const [status, setStatus] = useState<string>('Loading...')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setError(error.message)
        setStatus('Not authenticated')
      } else if (user) {
        setUser(user)
        setStatus('Authenticated')
      } else {
        setStatus('Not authenticated')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('Error')
    }
  }

  const handleSignIn = async () => {
    try {
      setError(null)
      setStatus('Signing in...')
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
        setStatus('Sign in failed')
      } else if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('Error')
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      await supabase.auth.signOut()
      setUser(null)
      setStatus('Signed out')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Simple Auth Test</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <p className="font-semibold">Status: {status}</p>
            {user && (
              <div className="mt-2">
                <p>User ID: {user.id}</p>
                <p>Email: {user.email}</p>
              </div>
            )}
            {error && (
              <p className="mt-2 text-red-600">Error: {error}</p>
            )}
          </div>
          
          <div className="flex gap-4">
            {!user ? (
              <button
                onClick={handleSignIn}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign in with Google
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sign out
              </button>
            )}
            
            <button
              onClick={checkAuth}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Check Auth Status
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h2 className="font-semibold mb-2">Environment Check:</h2>
            <p className="text-sm">
              <a 
                href="/api/check-env" 
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Click here to check environment variables
              </a>
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded">
            <h2 className="font-semibold mb-2">Debug Info:</h2>
            <p className="text-sm">Origin: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            <p className="text-sm">Redirect URL: {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}