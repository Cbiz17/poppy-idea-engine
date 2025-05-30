import { devLogger } from '@/lib/dev-logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
    devLogger.debug('Performance', `Mark: ${name}`);
  }

  measure(name: string, startMark: string, metadata?: Record<string, any>) {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      devLogger.warn('Performance', `Start mark not found: ${startMark}`);
      return;
    }

    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.metrics.push(metric);
    devLogger.info('Performance', `${name}: ${duration.toFixed(2)}ms`, metadata);

    // Log slow operations
    if (duration > 1000) {
      devLogger.warn('Performance', `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }

    // Clean up mark
    this.marks.delete(startMark);
    
    return duration;
  }

  getMetrics() {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
    this.marks.clear();
  }

  // Helper to measure async functions
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startMark = `${name}_start_${Date.now()}`;
    this.mark(startMark);
    
    try {
      const result = await fn();
      this.measure(name, startMark, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      this.measure(name, startMark, { ...metadata, status: 'error', error: String(error) });
      throw error;
    }
  }
}

export const perfMonitor = new PerformanceMonitor();

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).poppyPerf = perfMonitor;
}
