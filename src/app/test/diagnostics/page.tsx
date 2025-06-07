'use client'

import { useEffect, useState } from 'react'

interface DiagnosticsState {
  isBrowser?: boolean
  envVars?: {
    NEXT_PUBLIC_SUPABASE_URL?: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  }
  windowLocation?: string
  origin?: string
  supabaseStatus?: string
  supabaseError?: string | null
  timestamp?: string
  authCheck?: {
    user: string
    error: string
  }
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({})
  
  useEffect(() => {
    // Check if we're in the browser
    const isBrowser = typeof window !== 'undefined'
    
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    }
    
    // Check if Supabase client can be created
    let supabaseStatus = 'Not tested'
    let supabaseError: string | null = null
    
    try {
      if (isBrowser) {
        // Try to import and create client
        import('@supabase/ssr').then(({ createBrowserClient }) => {
          try {
            const client = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            supabaseStatus = 'Client created successfully'
            
            // Try to check auth
            client.auth.getUser().then(({ data, error }) => {
              setDiagnostics((prev: DiagnosticsState) => ({
                ...prev,
                authCheck: {
                  user: data?.user?.email || 'No user',
                  error: error?.message || 'No error'
                }
              }))
            })
          } catch (e: any) {
            supabaseStatus = 'Failed to create client'
            supabaseError = e.message
          }
          
          setDiagnostics((prev: DiagnosticsState) => ({
            ...prev,
            supabaseStatus,
            supabaseError
          }))
        }).catch(e => {
          setDiagnostics((prev: DiagnosticsState) => ({
            ...prev,
            supabaseStatus: 'Failed to import @supabase/ssr',
            supabaseError: e.message
          }))
        })
      }
    } catch (e: any) {
      supabaseError = e.message
    }
    
    setDiagnostics({
      isBrowser,
      envVars,
      windowLocation: isBrowser ? window.location.href : 'N/A',
      origin: isBrowser ? window.location.origin : 'N/A',
      supabaseStatus,
      supabaseError,
      timestamp: new Date().toISOString()
    })
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Deep Diagnostics</h1>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Manual Tests:</h2>
          <button
            onClick={() => {
              alert('Button click works!')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-4"
          >
            Test Alert
          </button>
          
          <button
            onClick={async () => {
              try {
                const { createBrowserClient } = await import('@supabase/ssr')
                const client = createBrowserClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                )
                const { data, error } = await client.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                  }
                })
                
                if (error) {
                  alert(`OAuth Error: ${error.message}`)
                } else if (data?.url) {
                  alert(`Would redirect to: ${data.url}`)
                  window.location.href = data.url
                } else {
                  alert('No URL generated')
                }
              } catch (e: any) {
                alert(`Error: ${e.message}`)
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test OAuth Flow
          </button>
        </div>
      </div>
    </div>
  )
}
