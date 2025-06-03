'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SupabaseTestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const runTests = async () => {
    setIsLoading(true)
    setTestResults([])
    const results: string[] = []

    try {
      // Test 1: Check if Supabase client is created
      results.push('✅ Supabase client created successfully')
      results.push(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
      
      // Test 2: Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        results.push(`❌ Session check error: ${sessionError.message}`)
      } else {
        results.push(`✅ Session check: ${session ? 'Logged in' : 'Not logged in'}`)
      }

      // Test 3: Check if we can reach Supabase
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        results.push(`❌ Get user error: ${error.message}`)
      } else {
        results.push(`✅ Get user: ${data.user ? data.user.email : 'No user'}`)
      }

      // Test 4: Check OAuth providers
      results.push('\nChecking OAuth configuration...')
      results.push(`Origin: ${window.location.origin}`)
      results.push(`Callback URL: ${window.location.origin}/auth/callback`)

    } catch (err) {
      results.push(`❌ Unexpected error: ${err}`)
    }

    setTestResults(results)
    setIsLoading(false)
  }

  const testGoogleOAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true // This prevents redirect for testing
        }
      })

      if (error) {
        setTestResults(prev => [...prev, `\n❌ OAuth test error: ${error.message}`])
      } else {
        setTestResults(prev => [...prev, `\n✅ OAuth URL generated: ${data.url}`])
        // Show the URL that would be used
        if (data.url) {
          setTestResults(prev => [...prev, `\nYou can manually visit: ${data.url}`])
        }
      }
    } catch (err) {
      setTestResults(prev => [...prev, `\n❌ OAuth test failed: ${err}`])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={runTests}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Run Supabase Tests
          </button>

          <button
            onClick={testGoogleOAuth}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-2"
          >
            Test Google OAuth URL
          </button>

          <a
            href="/"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ml-2"
          >
            Back to Login
          </a>
        </div>

        {testResults.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow">
            <h2 className="font-semibold mb-2">Test Results:</h2>
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {testResults.join('\n')}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
