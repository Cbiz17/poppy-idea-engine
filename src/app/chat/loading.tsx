'use client'

import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ChatLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <LoadingSpinner size="lg" message="Initializing Poppy..." />
    </div>
  )
}