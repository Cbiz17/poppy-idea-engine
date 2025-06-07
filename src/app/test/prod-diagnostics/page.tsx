'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function ProductionDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      supabase: {},
      oauth: {},
      urls: {},
      cookies: {},
      recommendations: []
    }

    // Check environment
    results.environment = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET',
    }

    // Check URLs
    if (typeof window !== 'undefined') {
      results.urls = {
        origin: window.location.origin,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port,
        href: window.location.href,
        isProduction: window.location.hostname !== 'localhost',
        expectedCallbackUrl: `${window.location.origin}/auth/callback`
      }
    }

    // Test Supabase connection
    try {
      const supabase = createClient()
      results.supabase.clientCreated = '✅ Success'
      results.supabase.hasAuth = supabase.auth ? '✅ Yes' : '❌ No'

      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        results.supabase.sessionError = sessionError.message
      } else {
        results.supabase.hasSession = session ? '✅ Yes' : '❌ No'
        if (session) {
          results.supabase.userId = session.user?.id
          results.supabase.userEmail = session.user?.email
        }
      }

      // Test OAuth URL generation
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: true
          }
        })

        if (error) {
          results.oauth.error = error.message
          results.oauth.status = '❌ Failed'
        } else if (data?.url) {
          results.oauth.status = '✅ Success'
          results.oauth.urlGenerated = '✅ Yes'
          results.oauth.provider = data.provider
          // Extract the redirect URL from OAuth URL
          const url = new URL(data.url)
          const redirectUri = url.searchParams.get('redirect_uri')
          results.oauth.actualRedirectUri = redirectUri
          results.oauth.expectedRedirectUri = `${window.location.origin}/auth/callback`
          results.oauth.redirectUriMatch = redirectUri === `${window.location.origin}/auth/callback` ? '✅ Match' : '❌ Mismatch'
        }
      } catch (oauthError: any) {
        results.oauth.exception = oauthError.message
        results.oauth.status = '❌ Exception'
      }

    } catch (error: any) {
      results.supabase.clientCreated = '❌ Failed'
      results.supabase.error = error.message
    }

    // Check cookies
    if (typeof document !== 'undefined') {
      results.cookies.enabled = navigator.cookieEnabled ? '✅ Yes' : '❌ No'
      results.cookies.count = document.cookie.split(';').filter(c => c.trim()).length
      results.cookies.hasSbCookies = document.cookie.includes('sb-') ? '✅ Yes' : '❌ No'
    }

    // Generate recommendations
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      results.recommendations.push({
        severity: 'critical',
        message: 'Missing Supabase environment variables in Vercel',
        action: 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel environment variables'
      })
    }

    if (results.oauth.redirectUriMatch === '❌ Mismatch') {
      results.recommendations.push({
        severity: 'critical',
        message: 'OAuth redirect URL mismatch',
        action: `Update Supabase OAuth settings to include: ${results.urls.expectedCallbackUrl}`
      })
    }

    if (results.urls.protocol !== 'https:' && results.urls.hostname !== 'localhost') {
      results.recommendations.push({
        severity: 'warning',
        message: 'Not using HTTPS',
        action: 'Ensure your production site uses HTTPS'
      })
    }

    if (!results.cookies.enabled) {
      results.recommendations.push({
        severity: 'critical',
        message: 'Cookies are disabled',
        action: 'Authentication requires cookies to be enabled'
      })
    }

    setDiagnostics(results)
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
    alert('Diagnostics copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Running diagnostics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Production Authentication Diagnostics</h1>
          <p className="text-gray-600 mb-4">Run time: {diagnostics.timestamp}</p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={runDiagnostics}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Re-run Diagnostics
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Copy Results
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 inline-block"
            >
              Back to Login
            </a>
          </div>

          {/* Recommendations */}
          {diagnostics.recommendations?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">🚨 Action Required</h2>
              {diagnostics.recommendations.map((rec: any, i: number) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg mb-2 ${
                    rec.severity === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <p className={`font-semibold ${rec.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                    {rec.message}
                  </p>
                  <p className={`text-sm mt-1 ${rec.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                    Action: {rec.action}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Environment Variables */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
            <div className="bg-gray-50 rounded p-4 space-y-1">
              {Object.entries(diagnostics.environment).map(([key, value]) => (
                <p key={key} className="font-mono text-sm">
                  <span className="text-gray-600">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          </div>

          {/* URLs */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">URLs & Domain</h2>
            <div className="bg-gray-50 rounded p-4 space-y-1">
              {Object.entries(diagnostics.urls || {}).map(([key, value]) => (
                <p key={key} className="font-mono text-sm">
                  <span className="text-gray-600">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          </div>

          {/* Supabase Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Supabase Connection</h2>
            <div className="bg-gray-50 rounded p-4 space-y-1">
              {Object.entries(diagnostics.supabase || {}).map(([key, value]) => (
                <p key={key} className="font-mono text-sm">
                  <span className="text-gray-600">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          </div>

          {/* OAuth Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">OAuth Configuration</h2>
            <div className="bg-gray-50 rounded p-4 space-y-1">
              {Object.entries(diagnostics.oauth || {}).map(([key, value]) => (
                <p key={key} className="font-mono text-sm">
                  <span className="text-gray-600">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          </div>

          {/* Cookies */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Cookies</h2>
            <div className="bg-gray-50 rounded p-4 space-y-1">
              {Object.entries(diagnostics.cookies || {}).map(([key, value]) => (
                <p key={key} className="font-mono text-sm">
                  <span className="text-gray-600">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Checklist</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>In Vercel Dashboard → Settings → Environment Variables</li>
              <li>Add NEXT_PUBLIC_SUPABASE_URL (from Supabase project settings)</li>
              <li>Add NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase project settings)</li>
              <li>In Supabase Dashboard → Authentication → URL Configuration</li>
              <li>Add to Redirect URLs: <code className="bg-blue-100 px-1">{diagnostics.urls?.expectedCallbackUrl || 'https://your-domain.vercel.app/auth/callback'}</code></li>
              <li>Redeploy your Vercel project after adding environment variables</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
