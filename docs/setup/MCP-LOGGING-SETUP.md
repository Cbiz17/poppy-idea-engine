# Enhanced MCP Logging & Debugging Setup

This document outlines the comprehensive logging and debugging infrastructure for the Poppy Idea Engine, including Browser DevTools MCP Server, Sentry error monitoring, and enhanced database logging.

## 🎯 Overview

The Poppy Idea Engine now includes a complete debugging and monitoring ecosystem that eliminates the frustrations of traditional browser console debugging while providing production-grade error tracking and performance monitoring.

## 🔧 Available Systems

### 1. Browser DevTools MCP Server

**Location**: `mcp-servers/browser-devtools/`

A custom MCP server that provides real-time browser debugging capabilities using Puppeteer integration.

#### Features:

- **Real-time Console Monitoring**: Live capture of console logs, warnings, and errors
- **Network Request Tracking**: Monitor API calls and resource loading
- **JavaScript Execution**: Execute code in browser context for testing
- **Screenshot Automation**: Automated visual testing capabilities
- **Performance Metrics**: Detailed browser performance analysis
- **WebSocket Integration**: Real-time communication with development tools

#### Setup:

```bash
cd mcp-servers/browser-devtools
npm install
chmod +x index.js
node index.js
```

#### Usage:

The MCP server provides these tools through Claude:

- `get_console_logs` - Retrieve console output with filtering
- `get_network_requests` - Monitor API calls and performance
- `get_page_errors` - JavaScript errors from the page
- `execute_script` - Run debugging code in browser
- `take_screenshot` - Capture visual state
- `navigate_to` - Navigate browser to specific URLs
- `get_performance_metrics` - Browser performance analysis
- `clear_browser_data` - Clear storage and cache

### 2. Enhanced Database Logging

**Files**: `dev-logging-schema.sql`, `src/lib/dev-logger.ts`

#### Database Schema:

```sql
CREATE TABLE public.dev_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  user_id UUID REFERENCES profiles(id),
  conversation_id UUID REFERENCES conversations(id),
  session_id TEXT,
  url TEXT,
  user_agent TEXT
);
```

#### Usage:

```typescript
import { devLogger } from '@/lib/dev-logger'

// Replace console.log with structured logging
devLogger.info('ChatComponent', 'Message sent', {
  messageId,
  conversationId,
  tokens: response.usage?.total_tokens,
})

devLogger.error('APIRoute', 'Database error', {
  error: error.message,
  userId,
  query: 'failed_query_here',
})

devLogger.debug('FeedbackComponent', 'User rating', {
  rating: 5,
  messageId,
  tags: ['helpful', 'creative'],
})
```

#### Benefits:

- **Persistent Storage**: Logs survive browser refreshes and sessions
- **Structured Data**: JSON metadata for advanced querying
- **User Context**: Correlate logs with specific users and conversations
- **Search & Filter**: Find specific log entries quickly
- **Export Capabilities**: Download logs for external analysis

### 3. Development Panel UI

**File**: `src/components/dev/DevPanel.tsx`

#### Features:

- Floating 🐛 button for easy access (development only)
- Search and filter logs by level, component, or content
- Real-time log streaming
- Export logs as JSON
- Clear logs functionality
- Integration with both local and database logs

#### Setup:

Add to your main layout:

```typescript
import { DevButton } from '@/components/dev/DevPanel';

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <DevButton />
    </div>
  );
}
```

### 4. Sentry Error Monitoring

**Files**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

#### Features:

- **Automatic Error Capture**: Unhandled exceptions and promise rejections
- **Performance Monitoring**: Real user monitoring with performance tracking
- **User Session Replay**: Complete user interaction recording
- **Release Tracking**: Monitor error rates across deployments
- **Context Capture**: User information and session data with errors

#### Configuration:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

#### Usage:

```typescript
// Capture exceptions with context
try {
  // risky operation
} catch (error) {
  Sentry.captureException(error, {
    contexts: {
      conversation: { id: conversationId },
      user: { id: userId },
    },
  })
}

// Add breadcrumbs for debugging
Sentry.addBreadcrumb({
  message: 'User started new conversation',
  category: 'user-action',
  data: { conversationId },
})
```

## 🚀 Implementation Guide

### Step 1: Deploy Database Schema (Optional)

Run `dev-logging-schema.sql` in your Supabase SQL editor to enable database logging.

### Step 2: Set Up Browser DevTools MCP Server

```bash
cd mcp-servers/browser-devtools
npm install
node index.js
```

### Step 3: Configure Environment Variables

```env
# Sentry (optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Development
NODE_ENV=development
```

### Step 4: Integrate Development Panel

Add `<DevButton />` to your main layout component.

### Step 5: Replace Console Logging

Update your components to use `devLogger` instead of `console.log`:

```typescript
// Before
console.log('User message:', message)

// After
devLogger.info('ChatInterface', 'User message received', {
  messageLength: message.length,
  userId,
  conversationId,
})
```

## 🛠️ Advanced Usage Patterns

### Debugging API Routes

```typescript
// In API routes
import { devLogger } from '@/lib/dev-logger'

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    devLogger.info('ChatAPI', 'Request started', {
      url: request.url,
      method: request.method,
    })

    const result = await processRequest(request)

    devLogger.info('ChatAPI', 'Request completed', {
      duration: Date.now() - startTime,
      success: true,
    })

    return Response.json(result)
  } catch (error) {
    devLogger.error('ChatAPI', 'Request failed', {
      error: error.message,
      duration: Date.now() - startTime,
      stack: error.stack,
    })

    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Debugging React Components

```typescript
// In React components
import { devLogger } from '@/lib/dev-logger'
import { useEffect } from 'react'

export function ChatInterface({ user }) {
  useEffect(() => {
    devLogger.info('ChatInterface', 'Component mounted', {
      userId: user.id,
      timestamp: new Date().toISOString(),
    })

    return () => {
      devLogger.info('ChatInterface', 'Component unmounted', {
        userId: user.id,
      })
    }
  }, [user.id])

  const handleSendMessage = async message => {
    devLogger.debug('ChatInterface', 'Sending message', {
      messageLength: message.length,
      userId: user.id,
    })

    try {
      const response = await sendMessage(message)

      devLogger.info('ChatInterface', 'Message sent successfully', {
        responseTime: response.timing,
        tokens: response.usage?.total_tokens,
      })
    } catch (error) {
      devLogger.error('ChatInterface', 'Failed to send message', {
        error: error.message,
        messageLength: message.length,
      })
    }
  }
}
```

### Browser DevTools Integration

```typescript
// Using MCP server tools for debugging
async function debugBrowserState() {
  // Get current console logs
  const logs = await mcpClient.call('get_console_logs', {
    level: 'error',
    limit: 20,
  })

  // Execute debugging script
  const result = await mcpClient.call('execute_script', {
    script: `
      return {
        url: window.location.href,
        storage: Object.keys(localStorage),
        userAgent: navigator.userAgent
      };
    `,
  })

  // Take screenshot for visual debugging
  await mcpClient.call('take_screenshot', {
    fullPage: true,
  })
}
```

## 🔍 Monitoring & Analytics

### Performance Tracking

```typescript
import { devLogger } from '@/lib/dev-logger'

class PerformanceTracker {
  static trackOperation(name: string, operation: () => Promise<any>) {
    const startTime = Date.now()

    return operation()
      .then(result => {
        devLogger.info('Performance', `${name} completed`, {
          duration: Date.now() - startTime,
          success: true,
        })
        return result
      })
      .catch(error => {
        devLogger.warn('Performance', `${name} failed`, {
          duration: Date.now() - startTime,
          error: error.message,
        })
        throw error
      })
  }
}

// Usage
const result = await PerformanceTracker.trackOperation('AI Response Generation', () =>
  generateAIResponse(prompt)
)
```

### User Interaction Tracking

```typescript
// Track user interactions for UX analysis
function trackUserAction(action: string, metadata: any) {
  devLogger.info('UserInteraction', action, {
    ...metadata,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  })
}

// Examples
trackUserAction('idea_saved', { ideaId, category, wordCount })
trackUserAction('feedback_provided', { messageId, rating, tags })
trackUserAction('conversation_continued', { ideaId, messageCount })
```

## 🎯 Best Practices

### 1. Logging Levels

- **debug**: Detailed information for debugging specific issues
- **info**: General information about application flow
- **warn**: Something unexpected but not breaking
- **error**: Errors that need immediate attention

### 2. Structured Data

Always include relevant context in your log data:

```typescript
// Good
devLogger.info('UserAuth', 'Login successful', {
  userId,
  method: 'google_oauth',
  sessionId,
  userAgent: request.headers['user-agent'],
})

// Bad
devLogger.info('UserAuth', 'User logged in')
```

### 3. Error Context

Provide maximum context for errors:

```typescript
try {
  await saveIdea(idea)
} catch (error) {
  devLogger.error('IdeaSave', 'Failed to save idea', {
    error: error.message,
    stack: error.stack,
    ideaId: idea.id,
    userId: user.id,
    ideaLength: idea.content.length,
    category: idea.category,
  })
}
```

### 4. Performance Monitoring

Track timing for critical operations:

```typescript
const startTime = performance.now()
const result = await expensiveOperation()
const duration = performance.now() - startTime

devLogger.info('Performance', 'Expensive operation completed', {
  operation: 'vector_search',
  duration,
  resultCount: result.length,
})
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Browser DevTools MCP Server Not Starting

```bash
# Check if port is in use
lsof -i :3000

# Kill existing processes
pkill -f "node.*browser-devtools"

# Restart server
cd mcp-servers/browser-devtools
node index.js
```

#### 2. Database Logging Not Working

- Ensure `dev-logging-schema.sql` is deployed
- Check Supabase connection in logs
- Verify RLS policies allow logging

#### 3. Sentry Not Capturing Errors

- Verify `NEXT_PUBLIC_SENTRY_DSN` environment variable
- Check Sentry project configuration
- Ensure error boundaries are properly configured

#### 4. Development Panel Not Showing

- Confirm `NODE_ENV=development`
- Check that `<DevButton />` is added to layout
- Verify no JavaScript errors preventing render

### Log Analysis Queries

```sql
-- Find errors in the last hour
SELECT * FROM dev_logs
WHERE level = 'error'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Performance analysis
SELECT
  component,
  AVG((data->>'duration')::float) as avg_duration,
  COUNT(*) as operation_count
FROM dev_logs
WHERE data ? 'duration'
GROUP BY component
ORDER BY avg_duration DESC;

-- User activity patterns
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as log_count
FROM dev_logs
WHERE user_id IS NOT NULL
GROUP BY hour
ORDER BY hour DESC;
```

## 🚀 Future Enhancements

### Planned Features

- **Log Aggregation**: Centralized logging across multiple environments
- **Alert System**: Automated alerts for critical errors
- **Performance Dashboards**: Real-time performance monitoring
- **Log Correlation**: Link logs across different systems
- **Advanced Analytics**: Machine learning for anomaly detection

### Additional MCP Servers

- **Database MCP Server**: Direct database monitoring and optimization
- **API Testing MCP Server**: Automated API endpoint testing
- **Deployment MCP Server**: Automated deployment and rollback tools
- **Security MCP Server**: Security scanning and vulnerability detection

This comprehensive logging and debugging infrastructure ensures that the Poppy Idea Engine development process is efficient, reliable, and maintainable while providing production-grade monitoring capabilities.
