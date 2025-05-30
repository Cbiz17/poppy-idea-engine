import { Sparkles } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center animate-pulse`}>
          <Sparkles className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7'} text-white`} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg animate-ping opacity-20" />
      </div>
      {message && (
        <p className="text-gray-600 text-sm">{message}</p>
      )}
    </div>
  )
}