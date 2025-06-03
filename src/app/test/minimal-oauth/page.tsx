'use client'

import { useState } from 'react'

export default function MinimalOAuthTest() {
  const [log, setLog] = useState<string[]>([])
  
  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testDirectSupabaseClient = async () => {
    setLog([])
    
    try {
      addLog('Testing direct Supabase client creation...')
      
      // Check if env vars exist
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      addLog(`URL exists: ${!!url}`)
      addLog(`Key exists: ${!!key}`)
      
      if (!url || !key) {
        addLog('ERROR: Missing environment variables')
        return
      }
      
      // Try creating client directly
      addLog('Importing @supabase/supabase-js...')
      const { createClient } = await import('@supabase/supabase-js')
      
      addLog('Creating client...')
      const supabase = createClient(url, key)
      
      addLog(`Client created: ${!!supabase}`)
      addLog(`Has auth: ${!!supabase.auth}`)
      
      // Try OAuth
      addLog('Attempting OAuth...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true // Don't redirect, just get URL
        }
      })
      
      if (error) {
        addLog(`OAuth error: ${error.message}`)
      } else {
        addLog(`OAuth success: ${!!data}`)
        addLog(`URL generated: ${!!data?.url}`)
        if (data?.url) {
          addLog(`OAuth URL: ${data.url.substring(0, 50)}...`)
        }
      }
      
    } catch (err) {
      addLog(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error(err)
    }
  }

  const testBrowserSupabaseClient = async () => {
    setLog([])
    
    try {
      addLog('Testing @supabase/ssr browser client...')
      
      const { createBrowserClient } = await import('@supabase/ssr')
      
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        addLog('ERROR: Missing environment variables')
        return
      }
      
      addLog('Creating browser client...')
      const supabase = createBrowserClient(url, key)
      
      addLog(`Client created: ${!!supabase}`)
      addLog(`Has auth: ${!!supabase.auth}`)
      
      // Test OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true
        }
      })
      
      if (error) {
        addLog(`OAuth error: ${error.message}`)
      } else {
        addLog(`OAuth success: ${!!data}`)
        if (data?.url) {
          addLog(`Can redirect to: ${data.url.substring(0, 50)}...`)
        }
      }
      
    } catch (err) {
      addLog(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const testWindowLocation = () => {
    setLog([])
    addLog('Testing window.location...')
    addLog(`origin: ${window.location.origin}`)
    addLog(`href: ${window.location.href}`)
    addLog(`protocol: ${window.location.protocol}`)
    addLog(`host: ${window.location.host}`)
    addLog(`hostname: ${window.location.hostname}`)
    addLog(`port: ${window.location.port}`)
    addLog(`pathname: ${window.location.pathname}`)
  }

  const checkEnvironment = () => {
    setLog([])
    addLog('Checking all NEXT_PUBLIC environment variables...')
    
    const envVars = Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .map(key => {
        const value = process.env[key]
        return `${key}: ${value ? 'SET' : 'NOT SET'}`
      })
    
    if (envVars.length === 0) {
      addLog('WARNING: No NEXT_PUBLIC_ variables found!')
    } else {
      envVars.forEach(v => addLog(v))
    }
    
    // Check Node environment
    addLog(`NODE_ENV: ${process.env.NODE_ENV}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Minimal OAuth Test</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={checkEnvironment}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Check Environment
          </button>
          
          <button
            onClick={testWindowLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Window Location
          </button>
          
          <button
            onClick={testDirectSupabaseClient}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Test Direct Supabase Client
          </button>
          
          <button
            onClick={testBrowserSupabaseClient}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test SSR Browser Client
          </button>
          
          <a
            href="/"
            className="inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Login
          </a>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-2">Log Output:</h2>
          <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {log.length === 0 ? (
              <p className="text-gray-500">Click a button to run tests...</p>
            ) : (
              log.map((entry, i) => (
                <p key={i} className={entry.includes('ERROR') ? 'text-red-600' : 'text-gray-700'}>
                  {entry}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
