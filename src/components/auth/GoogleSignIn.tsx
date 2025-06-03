'use client'

import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function GoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    // Log the current URL for debugging
    setDebugInfo(`Current origin: ${window.location.origin}`)
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Starting Google Sign In...')
      setDebugInfo(prev => prev + '\nStarting Google Sign In...')
      
      // First, sign out any existing session to ensure clean OAuth flow
      await supabase.auth.signOut()
      console.log('Signed out existing session')
      setDebugInfo(prev => prev + '\nSigned out existing session')
      
      // Small delay to ensure sign out completes
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log('Redirect URL:', redirectTo)
      setDebugInfo(prev => prev + `\nRedirect URL: ${redirectTo}`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        console.error('Error signing in with Google:', error)
        setError(error.message)
        setDebugInfo(prev => prev + `\nError: ${error.message}`)
      } else {
        console.log('OAuth initiated successfully', data)
        setDebugInfo(prev => prev + '\nOAuth initiated successfully')
        // If we get here but no redirect happens, something is wrong
        setTimeout(() => {
          if (!window.location.href.includes('accounts.google.com')) {
            setError('OAuth initiated but no redirect occurred. Check browser console.')
            setDebugInfo(prev => prev + '\nWarning: No redirect occurred after 2 seconds')
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Unexpected error: ${errorMessage}`)
      setDebugInfo(prev => prev + `\nUnexpected error: ${errorMessage}`)
    } finally {
      // Don't set loading to false immediately as we should be redirecting
      setTimeout(() => setIsLoading(false), 3000)
    }
  }

  return (
    <div className="w-full space-y-2">
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-gray-700 font-medium">
          {isLoading ? 'Processing...' : 'Continue with Google'}
        </span>
      </button>
      
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Debug information - remove in production */}
      {(isLoading || debugInfo) && (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap">{debugInfo}</p>
        </div>
      )}
    </div>
  )
}
