import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Error
        </h1>
        
        <p className="text-gray-600 mb-6">
          There was an error signing you in. This could happen if the sign-in link expired or was already used.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}
