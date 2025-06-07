'use client'

import { useState } from 'react'
import GoogleSignIn from './GoogleSignIn'
import EmailSignIn from './EmailSignIn'
import { Sparkles, Brain, Zap, Shield } from 'lucide-react'

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI-Powered Conversations",
      description: "Transform thoughts into structured ideas with Poppy AI"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Self-Improving System",
      description: "AI that learns from your feedback to serve you better"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Smart Organization",
      description: "Automatically organize and connect your ideas"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Private & Secure",
      description: "Your ideas are encrypted and completely private"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex">
      {/* Left side - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center p-12">
        <div className="max-w-md space-y-8">
          {/* Logo and Tagline */}
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl animate-pulse-purple flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Poppy Idea Engine
            </h1>
            <p className="text-xl text-gray-600">
              Transform thoughts into tangible concepts with AI-powered idea development
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial or Quote */}
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <p className="text-gray-700 italic">
              "The future of personal AI - systems that truly understand and adapt to individual users."
            </p>
            <p className="text-sm text-gray-500 mt-2">— Poppy Team</p>
          </div>
        </div>
      </div>

      {/* Right side - Authentication */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          {/* Mobile Logo (shown only on mobile) */}
          <div className="lg:hidden text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl animate-pulse-purple flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Poppy Idea Engine
            </h1>
            <p className="text-sm text-gray-600 px-4">
              Transform thoughts into tangible concepts
            </p>
          </div>

          {/* Auth Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              {authMode === 'signin' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="mt-2 text-gray-600">
              {authMode === 'signin' 
                ? 'Sign in to continue developing your ideas' 
                : 'Create an account to start transforming your thoughts'}
            </p>
          </div>

          {/* Auth Options */}
          <div className="space-y-6">
            {/* Google Sign In */}
            <div>
              <GoogleSignIn />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email Sign In */}
            <EmailSignIn />
          </div>

          {/* Features for mobile - shown below auth form */}
          <div className="lg:hidden mt-12 space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 text-center">Why choose Poppy?</h3>
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="text-center space-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mx-auto">
                    {feature.icon}
                  </div>
                  <p className="text-xs text-gray-600">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Terms and Privacy */}
          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700">Privacy Policy</a>
          </p>

          {/* Debug link */}
          <div className="text-center">
            <a href="/test/auth" className="text-xs text-gray-400 hover:text-gray-600">
              Having trouble? Test your auth status
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
