// Enhanced Development Logger for Poppy Idea Engine
// File: src/lib/dev-logger.ts

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  data?: any;
  userId?: string;
  conversationId?: string;
}

class DevLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDev = process.env.NODE_ENV === 'development';
  private dbLogQueue: LogEntry[] = [];
  private isProcessingQueue = false;

  log(level: LogEntry['level'], component: string, message: string, data?: any) {
    if (!this.isDev) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output with better formatting
    const emoji = {
      info: '🔍',
      warn: '⚠️',
      error: '🚨',
      debug: '🐛'
    }[level];

    console.group(`${emoji} [${component}] ${message}`);
    if (data) {
      console.table(data);
    }
    console.groupEnd();

    // Store in localStorage for easy access
    if (typeof window !== 'undefined') {
      localStorage.setItem('poppy-dev-logs', JSON.stringify(this.logs.slice(0, 100)));
      
      // Add to database queue
      this.dbLogQueue.push(entry);
      this.processDbQueue();
    }
  }

  info(component: string, message: string, data?: any) {
    this.log('info', component, message, data);
  }

  warn(component: string, message: string, data?: any) {
    this.log('warn', component, message, data);
  }

  error(component: string, message: string, data?: any) {
    this.log('error', component, message, data);
  }

  debug(component: string, message: string, data?: any) {
    this.log('debug', component, message, data);
  }

  // Export logs as downloadable file
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poppy-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Clear logs
  clear() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('poppy-dev-logs');
    }
  }

  // Get logs for debugging
  getLogs() {
    return this.logs;
  }

  // Search logs
  search(query: string) {
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(query.toLowerCase()) ||
      log.component.toLowerCase().includes(query.toLowerCase()) ||
      JSON.stringify(log.data).toLowerCase().includes(query.toLowerCase())
    );
  }

  // Process database log queue
  private async processDbQueue() {
    if (this.isProcessingQueue || this.dbLogQueue.length === 0 || typeof window === 'undefined') {
      return;
    }

    this.isProcessingQueue = true;
    const logsToSend = [...this.dbLogQueue];
    this.dbLogQueue = [];

    try {
      const response = await fetch('/api/dev-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend }),
      });

      if (!response.ok) {
        // Put logs back in queue if failed
        this.dbLogQueue.unshift(...logsToSend);
      }
    } catch (error) {
      // Put logs back in queue if failed
      this.dbLogQueue.unshift(...logsToSend);
      console.error('Failed to send logs to database:', error);
    } finally {
      this.isProcessingQueue = false;
      
      // Process remaining logs if any
      if (this.dbLogQueue.length > 0) {
        setTimeout(() => this.processDbQueue(), 1000);
      }
    }
  }
}

export const devLogger = new DevLogger();

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).poppyLogger = devLogger;
}
