'use client'

import { useState } from 'react'

export default function SimpleAuthTest() {
  const [status, setStatus] = useState<string>('Ready to test')
  const [isLoading, setIsLoading] = useState(false)

  const testGoogleAuth = async () => {
    setIsLoading(true)
    setStatus('Testing Google Auth...')
    
    try {
      // Test 1: Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        setStatus('❌ ERROR: Missing environment variables! Check Vercel settings.')
        setIsLoading(false)
        return
      }
      
      setStatus('✅ Environment variables found. Creating client...')
      
      // Test 2: Import and create client
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url, key)
      
      setStatus('✅ Client created. Testing OAuth...')
      
      // Test 3: Try OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setStatus(`❌ OAuth Error: ${error.message}`)
      } else if (data?.url) {
        setStatus('✅ Success! Redirecting to Google...')
        window.location.href = data.url
      } else {
        setStatus('❌ No redirect URL generated')
      }
      
    } catch (err) {
      setStatus(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const manualRedirect = () => {
    // Fallback - construct the OAuth URL manually
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!baseUrl) {
      alert('Missing Supabase URL!')
      return
    }
    
    const redirectTo = encodeURIComponent(`${window.location.origin}/auth/callback`)
    const oauthUrl = `${baseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`
    
    window.location.href = oauthUrl
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Simple Auth Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <p className="font-mono text-sm">Status: {status}</p>
          
          <button
            onClick={testGoogleAuth}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Google Authentication'}
          </button>
          
          <button
            onClick={manualRedirect}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Manual OAuth Redirect (Fallback)
          </button>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Quick checks:</p>
            <ul className="text-xs space-y-1">
              <li>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</li>
              <li>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</li>
              <li>Origin: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</li>
            </ul>
          </div>
          
          <div className="pt-4 space-y-2">
            <a
              href="/test/prod-diagnostics"
              className="block text-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Run Full Diagnostics
            </a>
            <a
              href="/"
              className="block text-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Back to Login
            </a>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm font-semibold text-yellow-800 mb-2">If the button doesn't work:</p>
          <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
            <li>Check browser console (F12) for errors</li>
            <li>Try the "Manual OAuth Redirect" button</li>
            <li>Verify environment variables in Vercel dashboard</li>
            <li>Ensure cookies are enabled</li>
            <li>Check if Supabase OAuth is configured correctly</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
