import Link from 'next/link'
import { AlertCircle, Home } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Error
        </h1>
        
        <p className="text-gray-600 mb-8">
          Sorry, there was an issue with the authentication process. This could be due to:
        </p>
        
        <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
          <li>• The authentication code has expired</li>
          <li>• There was a network issue during sign-in</li>
          <li>• The authentication provider is temporarily unavailable</li>
        </ul>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
          
          <p className="text-xs text-gray-500">
            You can try signing in again from the home page
          </p>
        </div>
      </div>
    </div>
  )
} 