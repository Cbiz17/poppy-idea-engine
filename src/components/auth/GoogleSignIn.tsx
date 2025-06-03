'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'

export default function GoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  
  const handleGoogleSignIn = async () => {
    const debug: string[] = []
    
    try {
      setIsLoading(true)
      setDebugInfo([])
      
      // Check environment variables
      debug.push(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}`)
      debug.push(`SUPABASE_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`)
      debug.push(`Window Origin: ${window.location.origin}`)
      
      // Try to create client
      const supabase = createClient()
      debug.push('Supabase client created')
      
      // Check if client has auth property
      if (!supabase.auth) {
        debug.push('ERROR: Supabase client missing auth property')
        setDebugInfo(debug)
        return
      }
      
      debug.push('Calling signInWithOAuth...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        debug.push(`OAuth Error: ${error.message}`)
        console.error('Error signing in with Google:', error)
      } else {
        debug.push('OAuth call successful')
        debug.push(`URL: ${data?.url ? 'Generated' : 'NOT Generated'}`)
        debug.push(`Provider: ${data?.provider || 'Unknown'}`)
        
        // If we get here but no redirect, something is wrong
        if (data?.url) {
          debug.push(`Redirect URL: ${data.url}`)
          // Force redirect if it didn't happen automatically
          window.location.href = data.url
        } else {
          debug.push('ERROR: No redirect URL generated')
        }
      }
      
      setDebugInfo(debug)
    } catch (error) {
      debug.push(`Exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Unexpected error:', error)
      setDebugInfo(debug)
    } finally {
      setIsLoading(false)
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
      
      {debugInfo.length > 0 && (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-1">Debug Info:</p>
          {debugInfo.map((info, index) => (
            <p key={index} className="text-xs text-gray-600 font-mono">{info}</p>
          ))}
        </div>
      )}
    </div>
  )
}
