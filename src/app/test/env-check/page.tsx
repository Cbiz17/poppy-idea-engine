'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function EnvironmentCheckPage() {
  const [checks, setChecks] = useState<{[key: string]: any}>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    runChecks()
  }, [])

  const runChecks = async () => {
    setIsLoading(true)
    const results: {[key: string]: any} = {}

    // 1. Environment Variables Check
    results.envVars = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set (hidden for security)' : 'NOT SET',
        isValid: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') && 
                 process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co')
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'NOT SET',
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      }
    }

    // 2. Browser Information
    results.browser = {
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: typeof window !== 'undefined' && window.localStorage ? 'Available' : 'Not Available',
      sessionStorage: typeof window !== 'undefined' && window.sessionStorage ? 'Available' : 'Not Available',
      origin: window.location.origin,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    }

    // 3. Supabase Client Check
    try {
      const supabase = createClient()
      results.supabaseClient = {
        created: true,
        hasAuth: !!supabase.auth,
        hasStorage: !!supabase.storage,
        hasFrom: typeof supabase.from === 'function'
      }

      // 4. Auth Session Check
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        results.authSession = {
          checked: true,
          hasSession: !!session,
          error: error?.message || null,
          user: session?.user?.email || null
        }
      } catch (e) {
        results.authSession = {
          checked: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        }
      }

      // 5. OAuth Provider Check
      try {
        // Test OAuth URL generation without redirecting
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: true
          }
        })
        
        results.oauthTest = {
          tested: true,
          urlGenerated: !!data?.url,
          provider: data?.provider,
          error: error?.message || null,
          redirectUrl: `${window.location.origin}/auth/callback`
        }
      } catch (e) {
        results.oauthTest = {
          tested: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        }
      }

    } catch (e) {
      results.supabaseClient = {
        created: false,
        error: e instanceof Error ? e.message : 'Failed to create Supabase client'
      }
    }

    // 6. Network Check
    results.network = {
      online: navigator.onLine,
      type: (navigator as any).connection?.effectiveType || 'Unknown'
    }

    // 7. Console Errors Check
    const originalError = console.error
    const errors: string[] = []
    console.error = (...args) => {
      errors.push(args.join(' '))
      originalError(...args)
    }
    
    // Wait a bit to catch any async errors
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.error = originalError
    
    results.consoleErrors = errors

    setChecks(results)
    setIsLoading(false)
  }

  const getStatusIcon = (isGood: boolean) => {
    return isGood ? '✅' : '❌'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Poppy Environment & Configuration Check</h1>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Running diagnostics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Environment Variables */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
              <div className="space-y-3">
                <div>
                  <p className="font-mono text-sm">
                    {getStatusIcon(checks.envVars?.NEXT_PUBLIC_SUPABASE_URL?.exists)} 
                    NEXT_PUBLIC_SUPABASE_URL: {checks.envVars?.NEXT_PUBLIC_SUPABASE_URL?.value}
                  </p>
                  {checks.envVars?.NEXT_PUBLIC_SUPABASE_URL?.exists && (
                    <p className="text-xs text-gray-600 ml-6">
                      Valid format: {getStatusIcon(checks.envVars?.NEXT_PUBLIC_SUPABASE_URL?.isValid)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-mono text-sm">
                    {getStatusIcon(checks.envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY?.exists)} 
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: {checks.envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY?.value}
                  </p>
                  {checks.envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY?.exists && (
                    <p className="text-xs text-gray-600 ml-6">
                      Key length: {checks.envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length} characters
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Supabase Client */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Supabase Client</h2>
              {checks.supabaseClient?.created ? (
                <div className="space-y-2">
                  <p className="text-sm">{getStatusIcon(true)} Client created successfully</p>
                  <p className="text-sm">{getStatusIcon(checks.supabaseClient?.hasAuth)} Auth module: {checks.supabaseClient?.hasAuth ? 'Available' : 'Missing'}</p>
                  <p className="text-sm">{getStatusIcon(checks.supabaseClient?.hasStorage)} Storage module: {checks.supabaseClient?.hasStorage ? 'Available' : 'Missing'}</p>
                  <p className="text-sm">{getStatusIcon(checks.supabaseClient?.hasFrom)} Database module: {checks.supabaseClient?.hasFrom ? 'Available' : 'Missing'}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-600">{getStatusIcon(false)} Failed to create client</p>
                  <p className="text-xs text-gray-600 mt-1">Error: {checks.supabaseClient?.error}</p>
                </div>
              )}
            </div>

            {/* Auth Session */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Auth Session</h2>
              {checks.authSession?.checked ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    {getStatusIcon(!checks.authSession?.error)} 
                    Session check: {checks.authSession?.error || 'Success'}
                  </p>
                  <p className="text-sm">
                    Current user: {checks.authSession?.user || 'Not logged in'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-600">Failed to check session: {checks.authSession?.error}</p>
              )}
            </div>

            {/* OAuth Test */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">OAuth Configuration</h2>
              {checks.oauthTest?.tested ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    {getStatusIcon(checks.oauthTest?.urlGenerated)} 
                    OAuth URL generation: {checks.oauthTest?.urlGenerated ? 'Success' : 'Failed'}
                  </p>
                  <p className="text-sm">Provider: {checks.oauthTest?.provider || 'Not set'}</p>
                  <p className="text-sm">Redirect URL: <code className="text-xs bg-gray-100 px-1">{checks.oauthTest?.redirectUrl}</code></p>
                  {checks.oauthTest?.error && (
                    <p className="text-sm text-red-600">Error: {checks.oauthTest.error}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-600">OAuth test failed: {checks.oauthTest?.error}</p>
              )}
            </div>

            {/* Browser Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Browser Environment</h2>
              <div className="space-y-2 text-sm">
                <p>{getStatusIcon(checks.browser?.cookiesEnabled)} Cookies: {checks.browser?.cookiesEnabled ? 'Enabled' : 'Disabled'}</p>
                <p>Origin: <code className="text-xs bg-gray-100 px-1">{checks.browser?.origin}</code></p>
                <p>Protocol: {checks.browser?.protocol}</p>
                <p>Hostname: {checks.browser?.hostname}</p>
                <p>{getStatusIcon(checks.network?.online)} Network: {checks.network?.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            {/* Console Errors */}
            {checks.consoleErrors?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-red-600">Console Errors Detected</h2>
                <div className="space-y-1">
                  {checks.consoleErrors.map((error: string, index: number) => (
                    <p key={index} className="text-xs font-mono text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={runChecks}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Re-run Checks
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block"
              >
                Back to Login
              </a>
              <a
                href="/test/auth"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
              >
                Auth Test Page
              </a>
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Verify environment variables are set in Vercel project settings</li>
                <li>Ensure Supabase project URL and anon key are correct</li>
                <li>Check Supabase Dashboard → Authentication → URL Configuration</li>
                <li>Add <code className="text-xs bg-yellow-100 px-1">{window.location.origin}</code> to allowed redirect URLs</li>
                <li>Enable Google provider in Supabase Authentication settings</li>
                <li>Clear browser cache and cookies for this domain</li>
                <li>Try in an incognito/private window</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
