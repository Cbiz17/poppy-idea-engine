'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function AuthCodeError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const description = searchParams.get('description')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Error
        </h1>
        
        <p className="text-gray-600 mb-4">
          There was an error signing you in. This could happen if the sign-in link expired or was already used.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm font-semibold text-red-800">Error: {error}</p>
            {description && (
              <p className="text-sm text-red-600 mt-1">{description}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
          >
            Try Again
          </Link>

          <Link
            href="/test/env-check"
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Run Diagnostics
          </Link>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>If this problem persists, check:</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Your Supabase project settings</li>
            <li>• OAuth redirect URLs configuration</li>
            <li>• Environment variables in Vercel</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
