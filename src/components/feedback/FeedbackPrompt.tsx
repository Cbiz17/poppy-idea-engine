'use client';

import { useState, useEffect } from 'react';
import { X, ThumbsUp, ThumbsDown, Star, MessageSquare } from 'lucide-react';

interface FeedbackPromptProps {
  onClose: () => void;
  onFeedback: (type: 'positive' | 'negative', message?: string) => void;
}

export function FeedbackPrompt({ onClose, onFeedback }: FeedbackPromptProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (feedbackType) {
      onFeedback(feedbackType, message);
      onClose();
    }
  };

  return (
    <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50 animate-slide-up">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>

      {!showDetails ? (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            Help Poppy improve!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            How was your experience with the last response?
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFeedbackType('positive');
                setShowDetails(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              Helpful
            </button>
            <button
              onClick={() => {
                setFeedbackType('negative');
                setShowDetails(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <ThumbsDown className="w-4 h-4" />
              Not helpful
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            Your feedback trains Poppy to be more helpful
          </p>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            {feedbackType === 'positive' ? '🎉 Great!' : '😔 Sorry about that'}
          </h3>
          
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Rate this response:</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              feedbackType === 'positive'
                ? 'What made this response helpful? (optional)'
                : 'What could have been better? (optional)'
            }
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
          />
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setShowDetails(false);
                setFeedbackType(null);
                setRating(0);
                setMessage('');
              }}
              className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Periodic prompt manager
export function useFeedbackPrompts() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lastPromptTime, setLastPromptTime] = useState(0);

  const incrementMessageCount = () => {
    setMessageCount(c => c + 1);
  };

  useEffect(() => {
    // Show prompt every 10 messages or every 30 minutes
    const shouldShowPrompt = 
      messageCount >= 10 || 
      (Date.now() - lastPromptTime > 30 * 60 * 1000 && messageCount >= 3);

    if (shouldShowPrompt && !showPrompt) {
      setShowPrompt(true);
      setLastPromptTime(Date.now());
      setMessageCount(0);
    }
  }, [messageCount, lastPromptTime, showPrompt]);

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  return {
    showPrompt,
    dismissPrompt,
    incrementMessageCount
  };
}
