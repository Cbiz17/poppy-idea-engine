'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  ArrowRight, 
  User as UserIcon,
  Lightbulb,
  MessageSquare,
  Layout,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface OnboardingClientProps {
  user: User
  initialProfile: any
}

export default function OnboardingClient({ user, initialProfile }: OnboardingClientProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState(initialProfile?.full_name || user.user_metadata?.full_name || '')
  const [interests, setInterests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const availableInterests = [
    'Business & Startups',
    'Technology & Innovation',
    'Creative Projects',
    'Personal Growth',
    'Learning & Education',
    'Health & Wellness',
    'Productivity & Organization',
    'Finance & Investing',
    'Travel & Adventure'
  ]

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const completeOnboarding = async () => {
    setIsLoading(true)

    try {
      // Update profile with name and mark onboarding as completed
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          onboarding_completed: true,
          interests: interests,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Navigate to chat
      router.push('/chat')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to complete setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = step === 1 ? fullName.trim().length > 0 : interests.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-1 rounded-full transition-colors ${
            step >= 1 ? 'bg-purple-600' : 'bg-gray-300'
          }`} />
          <div className={`w-8 h-1 rounded-full transition-colors ${
            step >= 2 ? 'bg-purple-600' : 'bg-gray-300'
          }`} />
          <div className={`w-8 h-1 rounded-full transition-colors ${
            step >= 3 ? 'bg-purple-600' : 'bg-gray-300'
          }`} />
        </div>

        {/* Step 1: Welcome & Name */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Poppy Idea Engine! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Let's get you set up in just a few moments. First, what should we call you?
            </p>

            <div className="max-w-sm mx-auto mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Your Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                placeholder="Enter your name"
                autoFocus
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceed}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mx-auto"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              What are you interested in exploring?
            </h2>
            
            <p className="text-gray-600 mb-8 text-center">
              Select a few areas to help Poppy understand your interests better
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {availableInterests.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    interests.includes(interest)
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              
              <button
                onClick={() => setStep(3)}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: How it Works */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Here's how Poppy works, {fullName}!
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Have Conversations</h3>
                  <p className="text-gray-600">
                    Chat naturally with Poppy AI about any ideas, thoughts, or questions you have. 
                    It's like talking to a thoughtful friend who helps develop your thinking.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Save Your Ideas</h3>
                  <p className="text-gray-600">
                    When something valuable emerges from your conversation, save it as an idea tile. 
                    Poppy will help organize and summarize it for you.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Layout className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Build Your Gallery</h3>
                  <p className="text-gray-600">
                    Your ideas live in a visual gallery where you can organize, develop, and 
                    revisit them anytime. Watch your thinking evolve over time!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-purple-700">
                <strong>🤖 AI that learns:</strong> Poppy improves based on your feedback. 
                Use the thumbs up/down buttons to help it understand what's helpful!
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              
              <button
                onClick={completeOnboarding}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Getting started...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Start Exploring
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}