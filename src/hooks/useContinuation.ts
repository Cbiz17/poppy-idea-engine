import { useState, useCallback } from 'react'
import { Message } from './useChat'

export interface ContinuationDetectionResult {
  continuationDetected: boolean
  confidence: number
  relatedIdeaId?: string
  relatedIdeaTitle?: string
  relatedIdeaContent?: string
  relatedIdeaCategory?: string
  suggestedAction?: 'update' | 'merge' | 'new_variation'
  detectionMethod?: string
  timeSinceLastUpdate?: number
  previousDevelopments?: Array<{
    date: string
    summary: string
    type: string
  }>
}

export function useContinuation() {
  const [continuationContext, setContinuationContext] = useState<ContinuationDetectionResult | null>(null)
  const [showContinuationBanner, setShowContinuationBanner] = useState(false)
  const [messageCountSinceDetection, setMessageCountSinceDetection] = useState(0)
  const [isDetecting, setIsDetecting] = useState(false)

  const detectContinuation = useCallback(async (
    messages: Message[],
    timeThresholdHours: number = 48
  ): Promise<ContinuationDetectionResult | null> => {
    if (messages.length < 4) return null
    
    setIsDetecting(true)
    
    try {
      const response = await fetch('/api/detect-continuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.slice(-6).map(m => ({
            role: m.role, 
            content: m.content
          })),
          timeThresholdHours
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        throw new Error('Detection API failed')
      }

      const detection: ContinuationDetectionResult = await response.json()
      
      if (detection.continuationDetected && detection.confidence > 0.3) {
        setContinuationContext(detection)
        setShowContinuationBanner(true)
        
        // Auto-hide banner after 10 seconds
        setTimeout(() => {
          setShowContinuationBanner(false)
        }, 10000)
        
        return detection
      }
      
      return null
    } catch (error) {
      console.error('Smart detection error:', error)
      // Fail silently - don't disrupt the chat experience
      return null
    } finally {
      setIsDetecting(false)
    }
  }, [])

  const incrementMessageCount = useCallback(() => {
    setMessageCountSinceDetection(prev => prev + 1)
  }, [])

  const resetMessageCount = useCallback(() => {
    setMessageCountSinceDetection(0)
  }, [])

  const dismissBanner = useCallback(() => {
    setShowContinuationBanner(false)
  }, [])

  const clearContinuation = useCallback(() => {
    setContinuationContext(null)
    setShowContinuationBanner(false)
    setMessageCountSinceDetection(0)
  }, [])

  return {
    continuationContext,
    showContinuationBanner,
    messageCountSinceDetection,
    isDetecting,
    detectContinuation,
    incrementMessageCount,
    resetMessageCount,
    dismissBanner,
    clearContinuation,
    setContinuationContext
  }
}
