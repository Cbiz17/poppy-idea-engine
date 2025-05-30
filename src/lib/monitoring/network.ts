import { devLogger } from '@/lib/dev-logger';

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  error?: string;
  requestBody?: any;
  responseData?: any;
}

class NetworkMonitor {
  private requests: Map<string, NetworkRequest> = new Map();
  private isEnabled = process.env.NODE_ENV === 'development';

  constructor() {
    if (this.isEnabled && typeof window !== 'undefined') {
      this.interceptFetch();
    }
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [resource, init] = args;
      const url = resource.toString();
      const method = init?.method || 'GET';
      const requestId = `${method}_${url}_${Date.now()}`;
      
      const request: NetworkRequest = {
        id: requestId,
        url,
        method,
        startTime: performance.now(),
        requestBody: init?.body,
      };
      
      this.requests.set(requestId, request);
      devLogger.debug('Network', `Request started: ${method} ${url}`);
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - request.startTime;
        
        request.endTime = performance.now();
        request.duration = duration;
        request.status = response.status;
        
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        
        // Log based on response type
        if (response.ok) {
          devLogger.info('Network', `Request completed: ${method} ${url}`, {
            status: response.status,
            duration: `${duration.toFixed(2)}ms`,
          });
        } else {
          devLogger.error('Network', `Request failed: ${method} ${url}`, {
            status: response.status,
            duration: `${duration.toFixed(2)}ms`,
          });
          
          // Try to get error details
          try {
            const errorData = await clonedResponse.text();
            request.error = errorData;
          } catch {}
        }
        
        // Warn on slow requests
        if (duration > 3000) {
          devLogger.warn('Network', `Slow request detected: ${method} ${url} took ${duration.toFixed(2)}ms`);
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - request.startTime;
        request.endTime = performance.now();
        request.duration = duration;
        request.error = String(error);
        
        devLogger.error('Network', `Request error: ${method} ${url}`, {
          error: String(error),
          duration: `${duration.toFixed(2)}ms`,
        });
        
        throw error;
      }
    };
  }

  getRequests() {
    return Array.from(this.requests.values());
  }

  clearRequests() {
    this.requests.clear();
  }

  getSlowRequests(threshold = 3000) {
    return this.getRequests().filter(req => (req.duration || 0) > threshold);
  }

  getFailedRequests() {
    return this.getRequests().filter(req => req.error || (req.status && req.status >= 400));
  }
}

export const networkMonitor = new NetworkMonitor();

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).poppyNetwork = networkMonitor;
}
