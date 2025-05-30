// Browser DevTools Integration for Poppy Idea Engine
// This script connects the browser to the MCP DevTools server

export function initBrowserDevTools() {
  if (typeof window === 'undefined') return;
  
  // Only initialize in development
  if (process.env.NODE_ENV !== 'development') return;
  
  try {
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => {
      console.log('🔧 Connected to DevTools MCP Server');
    };
    
    ws.onerror = (error) => {
      console.warn('DevTools MCP connection error:', error);
    };
    
    // Enhanced console logging
    const originalConsole = { ...console };
    ['log', 'warn', 'error', 'debug', 'info'].forEach((method) => {
      (console as any)[method] = (...args: any[]) => {
        (originalConsole as any)[method](...args);
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'console',
            payload: {
              level: method,
              message: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' '),
              timestamp: new Date().toISOString(),
              url: window.location.href,
            },
          }));
        }
      };
    });
    
    // Error tracking
    window.addEventListener('error', (event) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: {
            message: event.message,
            filename: event.filename,
            line: event.lineno,
            column: event.colno,
            stack: event.error?.stack,
            url: window.location.href,
          },
        }));
      }
    });
    
    // Promise rejection tracking
    window.addEventListener('unhandledrejection', (event) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: {
            message: `Unhandled Promise Rejection: ${event.reason}`,
            stack: event.reason?.stack,
            url: window.location.href,
          },
        }));
      }
    });
    
    // Network request tracking
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'network',
            payload: {
              name: entry.name,
              duration: entry.duration,
              size: (entry as any).transferSize,
              type: (entry as any).initiatorType,
              status: (entry as any).responseStatus,
            },
          }));
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    // Add global helper functions
    (window as any).poppyDevTools = {
      clearAll: () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✨ Cleared all browser storage');
      },
      
      checkAuth: async () => {
        const response = await fetch('/api/health');
        const health = await response.json();
        console.table(health);
        return health;
      },
      
      getLogs: () => {
        return (window as any).poppyLogger?.getLogs() || [];
      },
      
      getPerformance: () => {
        return {
          memory: (performance as any).memory,
          timing: performance.timing,
          navigation: performance.navigation,
        };
      },
    };
    
    console.log('🚀 Poppy DevTools initialized. Available commands:');
    console.log('- poppyDevTools.clearAll() - Clear browser storage');
    console.log('- poppyDevTools.checkAuth() - Check auth status');
    console.log('- poppyDevTools.getLogs() - Get dev logs');
    console.log('- poppyDevTools.getPerformance() - Get performance metrics');
    
  } catch (error) {
    console.warn('Failed to initialize DevTools integration:', error);
  }
}
