'use client'

import GoogleSignIn from '@/components/auth/GoogleSignIn'
import EmailSignIn from '@/components/auth/EmailSignIn'
import { Lightbulb, MessageCircle, Brain, Sparkles, Beaker, Users } from 'lucide-react'
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
          <div className="text-sm text-gray-600">
            Internal R&D Platform
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Beaker className="w-4 h-4" />
            Research & Development Lab
          </div>
          
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Where We Build the Future of
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Family AI</span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            The Poppy Idea Engine is our internal R&D platform where we develop, test, and refine ideas 
            for the future Poppy household operating system. This is where we learn how AI can truly 
            understand and assist with the complexity of modern family life.
          </p>

          {/* Vision Callout */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-12 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Building Toward Poppy OS</h3>
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-700">
              Every conversation here teaches us how to build AI that can orchestrate calendars, 
              coordinate between family members, respect values and beliefs, and reduce the chaos 
              of daily logistics. The Idea Engine is our bootloader for the household OS of the future.
            </p>
          </div>

          {/* Auth Section */}
          <div className="mb-16">
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
            
            <p className="text-sm text-gray-500 mt-6 text-center">
              Internal platform. All research data is confidential and secure.
            </p>
          </div>
        </div>

        {/* What We're Learning Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">What We're Researching</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">AI Learning Patterns</h4>
              <p className="text-gray-600 leading-relaxed">
                How can AI truly adapt to individual users? We're testing feedback loops, preference 
                learning, and transparent improvement systems that will power Poppy's personalization.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Conversation Continuity</h4>
              <p className="text-gray-600 leading-relaxed">
                Building AI that remembers context across sessions, understands idea evolution, and 
                maintains relationships over time - crucial for family coordination.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Trust Through Transparency</h4>
              <p className="text-gray-600 leading-relaxed">
                Making AI improvement visible and controllable. Users can see exactly how their 
                feedback shapes the AI - a model for trustworthy family AI systems.
              </p>
            </div>
          </div>
        </div>

        {/* Current Features as Research Tools */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-12 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Our Research Tools</h3>
          <p className="text-gray-600 text-center mb-8">
            Each feature teaches us something critical for building Poppy
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Dynamic AI Conversations</h4>
                <p className="text-gray-600 text-sm">
                  Testing how AI can adapt its personality and responses based on user feedback - 
                  essential for role-aware family assistance.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Idea Evolution Tracking</h4>
                <p className="text-gray-600 text-sm">
                  Understanding how concepts develop over time through conversation - mirrors how 
                  family plans and decisions evolve.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Transparent Learning Dashboard</h4>
                <p className="text-gray-600 text-sm">
                  Showing users exactly how AI improves from their feedback - building the trust 
                  needed for AI to help with family decisions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-yellow-600 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Personal Context System</h4>
                <p className="text-gray-600 text-sm">
                  Learning communication preferences, interests, and patterns - the foundation for 
                  understanding different family member needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-16 border-t border-gray-200">
        <div className="text-center text-gray-500">
          <p className="font-medium text-gray-700 mb-2">Poppy Idea Engine - Internal R&D Platform</p>
          <p className="text-sm">Learning how to build AI that truly understands and orchestrates family life.</p>
          <p className="text-xs mt-4">&copy; 2024 Poppy. Building the household OS of the future.</p>
        </div>
      </footer>
    </div>
  )
}
