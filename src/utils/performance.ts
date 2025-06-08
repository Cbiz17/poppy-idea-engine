/**
 * Performance Monitoring Utilities
 * Tools for measuring and tracking application performance
 */

import { config } from '@/config/environment'

/**
 * Performance metric types
 */
export type MetricType = 'navigation' | 'resource' | 'custom'

export interface PerformanceMetric {
  name: string
  value: number
  type: MetricType
  timestamp: number
  metadata?: Record<string, any>
}

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: Map<string, PerformanceObserver> = new Map()

  constructor() {
    if (typeof window !== 'undefined' && config.dev.showPerformanceMetrics) {
      this.initializeObservers()
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers() {
    // Navigation timing
    if ('PerformanceNavigationTiming' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming
          this.recordMetric({
            name: 'page-load',
            value: navEntry.loadEventEnd - navEntry.fetchStart,
            type: 'navigation',
            metadata: {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              domInteractive: navEntry.domInteractive - navEntry.fetchStart,
            },
          })
        }
      })
      
      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', navigationObserver)
    }

    // Largest Contentful Paint
    if ('LargestContentfulPaint' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.recordMetric({
          name: 'lcp',
          value: lastEntry.renderTime || lastEntry.loadTime,
          type: 'custom',
          metadata: {
            size: lastEntry.size,
            element: lastEntry.element?.tagName,
          },
        })
      })
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)
    }

    // First Input Delay
    if ('PerformanceEventTiming' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input') {
            this.recordMetric({
              name: 'fid',
              value: entry.processingStart - entry.startTime,
              type: 'custom',
            })
          }
        }
      })
      
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    }
    
    this.metrics.push(fullMetric)
    
    if (config.dev.showPerformanceMetrics) {
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms`, metric.metadata)
    }
  }

  /**
   * Measure the execution time of a function
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      this.recordMetric({
        name,
        value: duration,
        type: 'custom',
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      this.recordMetric({
        name: `${name}-error`,
        value: duration,
        type: 'custom',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
      
      throw error
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: MetricType): PerformanceMetric[] {
    return this.metrics.filter(m => m.type === type)
  }

  /**
   * Get average metric value by name
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.metrics.filter(m => m.name === name)
    if (metrics.length === 0) return null
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook for measuring component render performance
 */
export function useRenderMetrics(componentName: string) {
  if (typeof window === 'undefined' || !config.dev.showPerformanceMetrics) {
    return
  }

  const renderStart = performance.now()
  
  // Use useEffect to measure after render
  if ('useEffect' in require('react')) {
    const { useEffect } = require('react')
    useEffect(() => {
      const renderEnd = performance.now()
      performanceMonitor.recordMetric({
        name: `${componentName}-render`,
        value: renderEnd - renderStart,
        type: 'custom',
      })
    })
  }
}

/**
 * Debounce function with performance tracking
 */
export function debounceWithMetrics<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  metricName?: string
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let callCount = 0
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      callCount++
    }
    
    timeoutId = setTimeout(() => {
      if (metricName && callCount > 0) {
        performanceMonitor.recordMetric({
          name: `${metricName}-debounced`,
          value: callCount,
          type: 'custom',
          metadata: { delay },
        })
      }
      
      fn(...args)
      callCount = 0
    }, delay)
  }
}