'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function EmailSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const supabase = createClient()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Check your email for the confirmation link!' 
          })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          // Redirect will happen automatically via auth state change
          window.location.href = '/dashboard'
        }
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleEmailSignIn} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
          <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'error'
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-green-50 text-green-600 border border-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </form>
  )
}
