# Poppy Idea Engine - Project Instructions

## Project Overview

**Poppy Idea Engine** is a sophisticated AI-powered idea development tool with revolutionary self-improvement capabilities and comprehensive development infrastructure. It serves as both a valuable standalone application and strategic research for the larger Poppy ecosystem - a personal AI orchestrator for digital life management.

### Core Purpose
Transform thoughts into tangible, organizable concepts through conversation with Poppy AI, while the system continuously learns and improves from user feedback to become more helpful over time. Advanced MCP server integration and monitoring capabilities ensure efficient development and production-grade reliability.

## Key Architectural Components

### Technology Stack
- **Framework**: Next.js 14 with App Router 
- **Database**: Supabase (PostgreSQL + Vector extensions)
- **AI**: Anthropic Claude API with dynamic prompts
- **Auth**: Supabase Auth with Google OAuth
- **Styling**: Tailwind CSS
- **Language**: TypeScript (full type safety)
- **Error Monitoring**: Sentry for production-grade error tracking
- **Development Tools**: Custom MCP servers for enhanced debugging

### Database Architecture (Already Deployed)
- **Core Tables**: profiles, ideas, conversations, conversation_messages
- **Self-Improvement System**: message_feedback, user_actions, conversation_outcomes, learning_patterns, dynamic_prompts, ab_tests
- **Development & Monitoring**: dev_logs, conversation_continuity, idea_development_history, smart_save_suggestions
- **Vector Search**: Ideas and messages have embeddings for semantic search
- **RLS**: Row-level security ensuring complete user data isolation

### Current Status
- ✅ **56 conversations** logged and working
- ✅ **2 ideas** successfully saved with smart detection
- ✅ **Complete database schema** deployed and functional
- ✅ **Self-improvement system** fully implemented but needs feedback data
- ✅ **Browser DevTools MCP Server** operational with Puppeteer integration
- ✅ **Sentry integration** configured for error monitoring
- ✅ **Enhanced logging system** created and ready for integration
- ⚠️ **Admin dashboard** exists but no feedback collected yet
- 🔄 **Spatial organization** and advanced search planned for future

## Project Structure

```
src/
├── app/
│   ├── admin/              # AI management dashboard  
│   ├── api/                # Backend endpoints
│   │   ├── chat/           # Main AI conversation
│   │   ├── chat-enhanced/  # Enhanced chat with learning
│   │   ├── feedback/       # User feedback collection
│   │   ├── prompts/        # Dynamic prompt management
│   │   └── embed/          # Vector embedding generation
│   ├── auth/               # Authentication flows
│   ├── chat/               # Chat interface
│   ├── ideas/              # Idea gallery and management
│   └── dashboard/          # User dashboard
├── components/
│   ├── admin/              # Admin dashboard components
│   ├── chat/               # Chat interface (ChatInterface.tsx)
│   ├── ideas/              # Idea management (IdeasGallery.tsx)
│   ├── feedback/           # Feedback collection UI
│   └── dev/                # Development tools (DevPanel.tsx)
└── lib/
    ├── supabase*.ts        # Database configurations
    └── dev-logger.ts       # Enhanced logging system

mcp-servers/
├── browser-devtools/       # Browser debugging MCP server
│   ├── index.js           # Main server implementation
│   ├── package.json       # Dependencies
│   └── install-deps.sh    # Setup script
└── [future-servers]/      # Additional MCP servers

archived-chats/            # Saved conversation history
├── conversations/         # Full conversation transcripts
└── artifacts/            # Extracted code and documents
```

## Revolutionary Self-Improvement System

### How It Works
1. **Users interact** with Poppy AI and provide feedback (thumbs up/down, ratings, tags)
2. **System analyzes** patterns in highly-rated vs low-rated interactions
3. **AI generates** improved prompts based on successful conversation patterns  
4. **Dynamic prompts** are tested via A/B testing and activated when better-performing
5. **Continuous cycle** of improvement based on real user feedback
6. **Monitoring systems** track performance and catch issues early

### Database Functions Available
- `get_dynamic_system_prompt()` - Retrieves best-performing system prompts
- `analyze_conversation_patterns()` - Identifies successful interaction patterns
- `match_ideas()` - Semantic search across user's ideas
- `match_conversation_messages()` - Search conversation history
- `log_dev_event()` - Enhanced development logging function

## MCP Server Integration

### Browser DevTools MCP Server
- **Real-time Console Monitoring**: Live capture of console logs, warnings, and errors
- **Network Request Tracking**: Monitor API calls and resource loading performance
- **JavaScript Execution**: Execute code in browser context for testing and debugging
- **Screenshot Automation**: Automated visual testing and documentation
- **Performance Metrics**: Detailed browser performance analysis
- **WebSocket Integration**: Real-time communication with development tools

### Enhanced Logging System
- **Database Persistence**: Store logs in Supabase for long-term analysis
- **Structured Logging**: Categorized logs with metadata and search capabilities
- **Development Panel**: Visual interface accessible via floating 🐛 button
- **Export Capabilities**: Download logs for external analysis
- **Integration**: Correlate logs with user actions and AI performance

### Error Monitoring (Sentry)
- **Automatic Error Capture**: Unhandled exceptions with full context
- **Performance Monitoring**: Real user monitoring and performance tracking
- **User Session Replay**: Debug issues with complete user interaction history
- **Release Tracking**: Monitor error rates across deployments
- **Environment Configuration**: Different settings for development and production

## Development Guidelines

### When Working on This Project

1. **Respect the Self-Improvement Architecture**
   - Always collect user feedback on AI responses
   - Store conversation outcomes and user actions
   - Use dynamic prompts from the database when available
   - Monitor performance with Sentry integration

2. **Maintain Privacy & Security**
   - All database queries must respect RLS policies
   - User data is completely isolated between users
   - Learning happens on aggregated, anonymized patterns
   - Error monitoring excludes sensitive data

3. **Code Quality Standards**
   - Use TypeScript with strict typing
   - Implement proper error handling with try/catch
   - Use the enhanced dev-logger for debugging (NOT console.log)
   - Follow Next.js App Router patterns
   - Include Sentry error boundaries for React components

4. **Database Interactions**
   - Always use Supabase client from appropriate context (client/server)
   - Leverage vector search for semantic similarity
   - Store embeddings for all text content (ideas, messages)
   - Use enhanced logging for debugging database operations

5. **Development Tools Usage**
   - Use Browser DevTools MCP Server for real-time debugging
   - Access development panel via floating 🐛 button
   - Monitor console output through MCP server instead of browser console
   - Use Sentry for production error tracking

### Development Workflow

1. **For Backend Changes**: 
   - Test API routes thoroughly with edge cases
   - Use enhanced logging for debugging
   - Monitor with Sentry error tracking
   - Test with Browser DevTools MCP server

2. **For Frontend**: 
   - Ensure components work with and without authentication
   - Include Sentry error boundaries
   - Use development panel for debugging
   - Test with real browser automation

3. **For AI Integration**: 
   - Always test with dynamic prompts system
   - Collect feedback for learning
   - Monitor performance and errors
   - Log AI interactions for analysis

4. **For Database**: 
   - Use proper migrations and respect existing RLS policies
   - Test with enhanced logging
   - Monitor query performance
   - Validate with vector search capabilities

### Key Components to Understand

- **ChatInterface.tsx**: Main conversation component with feedback collection
- **IdeasGallery.tsx**: Displays saved ideas with search and organization
- **DevPanel.tsx**: Development debugging tools (floating 🐛 button)
- **EnhancedSaveModal.tsx**: Smart idea saving with continuation detection
- **PromptsAdmin.tsx**: Manage dynamic AI prompts and view analytics
- **FeedbackComponent.tsx**: User feedback collection for AI improvement
- **dev-logger.ts**: Enhanced logging system replacing console.log
- **sentry.*.config.ts**: Error monitoring configuration files

## Current Priorities

### Immediate Tasks
1. **Integrate Enhanced Logging**: Add DevButton to main layout for easy access
2. **Collect More Feedback**: Encourage users to rate AI responses for learning
3. **Test Smart Continuation**: Verify idea → conversation → save flow works correctly
4. **Monitor Performance**: Use Sentry dashboard to track application health
5. **MCP Server Integration**: Ensure Browser DevTools server is properly configured

### Future Features
- Drag-and-drop spatial organization of ideas
- Advanced semantic search interface
- Real-time analytics dashboard with performance monitoring
- Additional MCP servers for specialized development tasks
- Mobile app with synchronized conversations
- Enhanced error recovery and user experience

## Working with the AI System

### Dynamic Prompts
The system uses `get_dynamic_system_prompt()` to select the best-performing AI prompts based on user feedback. Always prefer dynamic prompts over hardcoded ones. Monitor prompt performance through the admin dashboard.

### Feedback Collection
Every AI response should have feedback collection UI (thumbs up/down, ratings). This data drives the self-improvement system and is monitored for effectiveness.

### Vector Search
Use semantic search for finding related ideas and conversations. The `match_ideas()` and `match_conversation_messages()` functions provide this capability with performance monitoring.

## Development Tools & Debugging

### Browser DevTools MCP Server Usage
```bash
# Start the MCP server
cd mcp-servers/browser-devtools
node index.js

# The server provides tools for:
# - get_console_logs: Retrieve console output
# - get_network_requests: Monitor API calls
# - execute_script: Run debugging code
# - take_screenshot: Capture visual state
# - get_performance_metrics: Analyze performance
```

### Enhanced Logging
```typescript
import { devLogger } from '@/lib/dev-logger';

// Replace console.log with structured logging
devLogger.info('ChatComponent', 'Message sent', { 
  messageId, conversationId, tokens: response.usage?.total_tokens 
});

devLogger.error('APIRoute', 'Database error', { error: error.message, userId });
```

### Sentry Error Monitoring
```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exceptions with context
try {
  // risky operation
} catch (error) {
  Sentry.captureException(error, {
    contexts: {
      conversation: { id: conversationId },
      user: { id: userId }
    }
  });
}
```

## Environment & Deployment

### Required Environment Variables
```env
# Core functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key  
ANTHROPIC_API_KEY=your_anthropic_key

# Error monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Authentication (already configured)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Development
NODE_ENV=development
```

### Database Setup
All schemas are deployed. The SQL files define:
1. `database-setup.sql` - Core tables and RLS policies
2. `self-improvement-schema.sql` - Learning system tables
3. `dev-logging-schema.sql` - Enhanced development logging (optional)

### MCP Server Setup
```bash
# Install Browser DevTools MCP Server
cd mcp-servers/browser-devtools
npm install
chmod +x index.js

# Test the server
node index.js
```

## Advanced Features & Implementation Details

### Smart Continuation Detection
The system automatically detects when new conversations might be related to existing ideas:
- Analyzes conversation patterns every 4 messages
- Uses semantic similarity and timing analysis
- Shows contextual banners when matches found (confidence > 30%)
- Enables smart merging and updating of existing ideas

### Enhanced Save Modal System
Two distinct save flows for different scenarios:
- **IdeaReviewModal**: For new, standalone ideas
- **EnhancedSaveModal**: For updates/merges with existing ideas
- Supports 'update', 'new variation', and 'merge' operations
- Tracks development history and conversation continuity

### Feedback Collection Integration
Every AI response includes FeedbackComponent for:
- Thumbs up/down ratings
- 5-star quality scores
- Contextual tags ('helpful', 'creative', 'accurate')
- Written feedback for improvement suggestions

### Vector Search & Embeddings
All content is automatically embedded for semantic search:
- Ideas table: `embedding VECTOR(1536)` column
- Messages table: `embedding VECTOR(1536)` column
- Uses OpenAI embeddings via `/api/embed` endpoint
- Enables `match_ideas()` and `match_conversation_messages()` functions

## Critical Implementation Notes

### Database Schema Extensions
Beyond core tables, the system includes:
```sql
-- Conversation continuity tracking
conversation_continuity, idea_development_history, smart_save_suggestions

-- User test assignments for A/B testing
user_test_assignments, ab_tests

-- Enhanced logging for development
dev_logs (when dev-logging-schema.sql is deployed)
```

### API Endpoints Structure
- `/api/chat` - Basic AI conversation
- `/api/chat-enhanced` - Learning-enabled chat with dynamic prompts
- `/api/detect-continuation` - Smart idea continuation detection  
- `/api/smart-merge` - Intelligent idea merging capabilities
- `/api/feedback` - User feedback collection
- `/api/prompts` - Dynamic prompt management
- `/api/embed` - Vector embedding generation

### TypeScript Types & Interfaces
Key interfaces used throughout:
```typescript
interface Message { id: string, content: string, role: 'user' | 'assistant', timestamp: Date }
interface ContinuationDetectionResult { continuationDetected: boolean, confidence: number, relatedIdeaId?: string, ... }
```

### MCP Server Integration
```typescript
// Browser DevTools MCP Server provides:
// - Real-time console monitoring
// - Network request tracking
// - JavaScript execution capabilities
// - Performance analysis
// - Screenshot automation
```

## Debugging & Development Tools

### Enhanced Logging System
- **DevPanel.tsx**: Floating 🐛 button for development logs
- **dev-logger.ts**: Structured logging with search/export
- Database logging via `dev_logs` table when schema deployed
- Replaces console.log with categorized, searchable logs

### Browser DevTools MCP Server
- **Real-time Monitoring**: Live console logs and network requests
- **JavaScript Execution**: Execute debugging code in browser context
- **Performance Analysis**: Detailed browser metrics
- **Screenshot Automation**: Visual testing capabilities

### Sentry Error Monitoring
- **Automatic Error Capture**: Unhandled exceptions with context
- **Performance Monitoring**: Real user performance tracking
- **Session Replay**: Debug with complete user interaction history
- **Release Tracking**: Monitor deployments and rollbacks

### Admin Dashboard
- **PromptsAdmin.tsx**: Monitor AI performance and manage dynamic prompts
- Real-time feedback analytics and success metrics
- A/B testing interface for prompt optimization
- System health monitoring integration

## Vision & Impact

This project is pioneering **transparent, user-controlled AI improvement** with production-grade development infrastructure. Unlike black-box AI systems, users can see exactly how their feedback makes the AI better, creating unprecedented alignment between human needs and AI capabilities.

The comprehensive MCP server integration and monitoring capabilities ensure that development is efficient, debugging is streamlined, and the production system is reliable and maintainable.

The patterns learned here about effective human-AI interaction directly inform the development of more advanced AI assistance tools, making this both a valuable application and important research platform.

## Key Success Metrics

- **User Satisfaction**: Conversation outcome scores trending upward
- **AI Improvement**: Dynamic prompts performing better than baseline
- **Engagement**: Users returning to continue conversations and save ideas
- **Learning**: Successful patterns identified and applied to new interactions

## 🆕 Recent Enhancements (May 2025)

### Enhanced Idea Development System
The idea gallery and workflow have been significantly upgraded:

#### 1. **Advanced History Tracking**
- Version numbers for all idea changes
- Branch support for experimental development
- Comprehensive metadata tracking
- Tags and categories for changes
- Development type classification

#### 2. **Enhanced Gallery Features**
- **Multiple View Modes**: Grid and List views
- **Advanced Filtering**: Category, search, archived status
- **Statistics Dashboard**: Real-time metrics
- **Pin & Archive**: Organize important ideas
- **Bulk Export**: Export ideas as Markdown

#### 3. **Database Enhancements**
```sql
-- New columns added to ideas table
development_count INTEGER      -- Quick access to change count
last_activity TIMESTAMPTZ     -- Track recent updates
archived BOOLEAN              -- Archive old ideas
pinned BOOLEAN                -- Pin important ideas

-- Enhanced idea_development_history columns
version_number INTEGER        -- Sequential versioning
branch_name TEXT             -- Named branches
parent_history_id UUID       -- Version tree structure
tags TEXT[]                  -- Categorize changes
development_metadata JSONB   -- Additional context
```

#### 4. **New API Endpoints**
- `POST /api/ideas/workflow` - Create idea branches
- `PATCH /api/ideas/workflow` - Merge branches
- `GET /api/ideas/workflow?ideaId=xxx` - Get history visualization

#### 5. **New Database Functions**
- `get_idea_stats()` - User statistics dashboard
- `get_idea_history_tree()` - Complete version history
- `update_idea_development_count()` - Auto-maintain counts

### Implementation Guide

1. **Deploy Database Updates**
   ```bash
   # Run in Supabase SQL editor
   04-enhanced-idea-tracking.sql
   ```

2. **Updated Components**
   - `IdeasGallery.tsx` - Enhanced with stats, filtering, views
   - `IdeaCard.tsx` - Supports development count display
   - API routes updated for version tracking

3. **New Workflow Capabilities**
   - Create experimental branches of ideas
   - Merge branches with AI assistance
   - Track complete development history
   - Visualize idea evolution over time
- **Smart Features**: Continuation detection accuracy and merge success rates
- **System Reliability**: Error rates and performance metrics from monitoring
- **Development Efficiency**: Debugging speed and issue resolution time
