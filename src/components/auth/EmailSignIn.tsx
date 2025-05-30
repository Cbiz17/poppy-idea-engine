'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

type AuthMode = 'signin' | 'signup'

export default function EmailSignIn() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    // Validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setIsLoading(true)
    
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password')
          } else {
            setError(error.message)
          }
        } else if (data?.user) {
          // Check if user needs onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .single()
          
          const redirectPath = profile?.onboarding_completed ? '/dashboard' : '/onboarding'
          window.location.href = redirectPath
        }
      } else {
        // Sign up mode
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        
        if (error) {
          setError(error.message)
        } else if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists')
        } else {
          setSuccess('Check your email for the confirmation link!')
          // Clear form
          setEmail('')
          setPassword('')
          setConfirmPassword('')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError(null)
    setSuccess(null)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}
        
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
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="you@example.com"
              disabled={isLoading}
              autoComplete="email"
            />
            <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              disabled={isLoading}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {mode === 'signup' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Confirm your password"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Lock className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : (
            mode === 'signin' ? 'Sign In' : 'Create Account'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleMode}
            className="text-purple-600 hover:text-purple-700 font-medium"
            disabled={isLoading}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}