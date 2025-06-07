'use client'

import { useState } from 'react'
import GoogleSignIn from '@/components/auth/GoogleSignIn'
import EmailSignIn from '@/components/auth/EmailSignIn'

export default function AuthSection() {
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email')

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
      <p className="text-sm text-gray-600 mb-4">Team member? Sign in to continue your research:</p>
      
      {/* Auth Method Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setAuthMethod('email')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            authMethod === 'email'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setAuthMethod('google')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            authMethod === 'google'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Google
        </button>
      </div>
      
      {/* Auth Components */}
      {authMethod === 'email' ? <EmailSignIn /> : <GoogleSignIn />}
    </div>
  )
}
