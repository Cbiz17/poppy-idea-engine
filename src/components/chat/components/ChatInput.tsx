import React from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSendMessage: () => void
  isLoading: boolean
  showWelcomePulse: boolean
  messagesLength: number
}

export function ChatInput({
  value,
  onChange,
  onSendMessage,
  isLoading,
  showWelcomePulse,
  messagesLength
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  return (
    <div className="flex-shrink-0 p-6 bg-white border-t border-gray-200">
      <div className="flex gap-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Share your thoughts, ideas, or questions..."
          className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={onSendMessage}
          disabled={!value.trim() || isLoading}
          data-send-button
          className={`px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${
            showWelcomePulse && messagesLength === 1 ? 'animate-pulse-purple' : ''
          }`}
        >
          <Send className="w-5 h-5" />
          Send
        </button>
      </div>
    </div>
  )
}
