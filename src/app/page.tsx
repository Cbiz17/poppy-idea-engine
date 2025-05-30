'use client'

import GoogleSignIn from '@/components/auth/GoogleSignIn'
import EmailSignIn from '@/components/auth/EmailSignIn'
import { Lightbulb, MessageCircle, Layout, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email')
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Poppy Idea Engine</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Ideas Into
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Reality</span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Your personal AI-powered idea greenhouse where thoughts grow through conversation with the Poppy Idea Engine, 
            then become tangible, organizable concepts you can prioritize and develop.
          </p>

          {/* Auth Section */}
          <div className="mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
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
            
            <p className="text-sm text-gray-500 mt-6 text-center">
              Your ideas are private and secure. We never share your data.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">The Conversation Space</h3>
            <p className="text-gray-600 leading-relaxed">
              Engage in natural dialogue with our AI engine to explore, refine, and develop your thoughts into concrete, actionable concepts.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Layout className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">The Idea Gallery</h3>
            <p className="text-gray-600 leading-relaxed">
              Transform thoughts into tangible, draggable tiles that you can arrange, prioritize, and revisit as your interests evolve.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <Lightbulb className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">The Development Workshop</h3>
            <p className="text-gray-600 leading-relaxed">
              Return to any idea and continue the conversation with Poppy, building on previous context to refine and expand your thinking.
            </p>
          </div>
        </div>

        {/* Vision Section */}
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-6">More Than Just Note-Taking</h3>
          <p className="text-lg opacity-90 leading-relaxed mb-8">
            Unlike traditional apps, Poppy captures both your ideas and the conversational journey that created them. 
            It's like having a conversation with an insightful friend who has perfect memory and infinite patience.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="bg-white/20 px-4 py-2 rounded-full">AI-Powered Conversations</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">Spatial Organization</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">Persistent Memory</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">Intuitive Interface</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-16 border-t border-gray-200">
        <div className="text-center text-gray-500">
          <p>&copy; 2024 Poppy Idea Engine. Building the future of AI-assisted thinking.</p>
        </div>
      </footer>
    </div>
  )
}
// Trigger deployment
// Deploy with all fixes
