# Poppy Idea Engine

A personal AI-powered idea development tool that transforms thoughts into tangible, organizable concepts through conversation with Poppy AI. Features advanced self-improvement capabilities that learn from user feedback to continuously enhance the AI experience, plus comprehensive MCP server integration for enhanced development workflow.

## 🌟 Core Features

### 💬 **AI-Powered Conversations**
- Engage with Poppy AI to explore and refine your ideas
- Context-aware conversations that remember previous discussions
- Smart idea extraction and automated categorization
- Seamless conversation continuation from saved ideas

### 🎨 **Spatial Organization**
- Transform thoughts into draggable idea tiles
- Intuitive gallery interface for browsing and organizing ideas
- Category-based organization and filtering
- Visual prioritization through spatial arrangement

### 🧠 **Self-Improving AI System**
- **Dynamic Prompts**: AI learns from user feedback to improve responses
- **Feedback Collection**: Thumbs up/down, 5-star ratings, and contextual tags
- **Pattern Analysis**: System identifies what makes conversations successful
- **Continuous Learning**: AI prompts evolve based on user satisfaction data

### 🔧 **MCP Server Integration**
- **Browser DevTools**: Real-time browser debugging and automation with Puppeteer
- **Enhanced Logging**: Advanced development logging with database persistence
- **Error Monitoring**: Sentry integration for production-grade error tracking
- **Performance Analytics**: Comprehensive monitoring and metrics collection

### 📊 **Analytics & Admin Dashboard**
- Real-time feedback statistics and trends
- Performance metrics for different AI prompt versions
- A/B testing framework for prompt optimization
- User action tracking and behavior analysis

### 🔐 **Secure & Private**
- Google Authentication with Supabase Auth
- Row-level security ensuring data privacy
- Complete user data isolation
- Encrypted conversation storage

## 🧪 **Self-Improvement System**

### How It Works
1. **Users interact** with Poppy AI and provide feedback on responses
2. **System analyzes** patterns in highly-rated vs low-rated interactions
3. **AI generates** improved prompts based on successful conversation patterns
4. **Dynamic prompts** are tested and activated when they show better performance
5. **Continuous cycle** of improvement based on real user feedback

### Admin Features
- **Prompt Management**: View, test, and activate different AI prompt versions
- **Feedback Analysis**: Deep insights into what users find helpful
- **Performance Tracking**: Monitor AI improvement over time
- **Pattern Recognition**: Identify successful conversation techniques

## 🛠️ **MCP Server Architecture**

### Browser DevTools MCP Server
- **Real-time Console Monitoring**: Capture console logs, warnings, and errors
- **Network Request Tracking**: Monitor API calls and resource loading
- **JavaScript Execution**: Execute code in browser context for testing
- **Screenshot Capture**: Automated visual testing capabilities
- **Performance Metrics**: Detailed browser performance analysis

### Enhanced Development Logging
- **Database Persistence**: Store logs in Supabase for long-term analysis
- **Structured Logging**: Categorized logs with search and filtering
- **Development Panel**: Visual interface for log management
- **Export Capabilities**: Download logs for external analysis

### Error Monitoring & Analytics
- **Sentry Integration**: Production-grade error tracking
- **Performance Monitoring**: Real-time application performance metrics
- **User Session Replay**: Debug issues with complete user context
- **Environment-specific Configuration**: Different settings for dev/prod

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- A Supabase account
- A Google Cloud Console project (for OAuth)
- An Anthropic API key (for Claude AI)
- A Sentry account (for error monitoring)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd poppy-idea-engine
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Go to Authentication > Providers and enable Google OAuth
4. Add your Google OAuth credentials from Google Cloud Console

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### 4. Set Up Sentry (Optional but Recommended)

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for your application
3. Get your DSN from the project settings

### 5. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic API Configuration  
ANTHROPIC_API_KEY=your_anthropic_api_key

# Sentry Configuration (Optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Authentication Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_string

# Development Configuration
NODE_ENV=development
```

### 6. Database Setup

Run the SQL files in your Supabase SQL editor in this order:

1. **Core Schema** (`database-setup.sql`):
   - User profiles and authentication
   - Ideas with semantic search capabilities
   - Conversations with full message history
   - Vector embeddings for AI-powered search

2. **Self-Improvement Schema** (`self-improvement-schema.sql`):
   - User feedback collection system
   - Dynamic prompt management
   - Learning pattern storage
   - A/B testing framework

3. **Development Logging Schema** (`dev-logging-schema.sql`) *[Optional]*:
   - Enhanced development logging
   - Persistent log storage
   - Advanced debugging capabilities

### 7. MCP Server Setup (Optional)

For enhanced development capabilities:

```bash
# Navigate to MCP servers directory
cd mcp-servers/browser-devtools

# Install dependencies
npm install

# Make executable
chmod +x index.js

# Test the server
node index.js
```

### 8. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard for AI management
│   ├── api/               # API routes
│   │   ├── chat/          # AI conversation endpoints
│   │   ├── chat-enhanced/ # Enhanced chat with learning
│   │   ├── feedback/      # User feedback collection
│   │   ├── prompts/       # Dynamic prompt management
│   │   └── embed/         # Vector embedding generation
│   ├── auth/              # Authentication routes
│   ├── chat/              # Chat interface
│   ├── ideas/             # Idea gallery and management
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── admin/             # Admin dashboard components
│   ├── auth/              # Authentication components
│   ├── chat/              # Chat interface components
│   ├── feedback/          # Feedback collection UI
│   ├── ideas/             # Idea management components
│   └── dev/               # Development tools (DevPanel.tsx)
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Client-side Supabase config
│   ├── supabase-server.ts # Server-side Supabase config
│   ├── supabase-middleware.ts # Middleware configuration
│   └── dev-logger.ts      # Enhanced logging system
└── middleware.ts          # Next.js auth middleware

mcp-servers/              # MCP Server implementations
├── browser-devtools/     # Browser debugging MCP server
│   ├── index.js          # Main server implementation
│   ├── package.json      # Dependencies
│   └── install-deps.sh   # Setup script
└── [future-servers]/     # Additional MCP servers

archived-chats/           # Saved conversation history
├── conversations/        # Full conversation transcripts
└── artifacts/           # Extracted code and documents
```

## 🔧 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase (PostgreSQL) with vector extensions
- **AI Integration**: Anthropic Claude API with dynamic prompts
- **Search**: Vector embeddings with semantic similarity
- **Error Monitoring**: Sentry for production error tracking
- **Development Tools**: Custom MCP servers for enhanced debugging
- **Icons**: Lucide React
- **TypeScript**: Full type safety throughout

## 📊 Database Schema

### Core Tables
- **`profiles`**: User account information
- **`ideas`**: Saved ideas with vector embeddings
- **`conversations`**: Chat sessions and metadata
- **`conversation_messages`**: Individual messages with embeddings

### Self-Improvement Tables
- **`message_feedback`**: User ratings and feedback on AI responses
- **`user_actions`**: Tracking of user behaviors and interactions
- **`conversation_outcomes`**: End-of-conversation satisfaction metrics
- **`dynamic_prompts`**: AI system prompts that evolve over time
- **`learning_patterns`**: Extracted insights from successful interactions
- **`ab_tests`**: A/B testing framework for prompt optimization

### Development & Monitoring Tables
- **`dev_logs`**: Enhanced development logging (optional)
- **`conversation_continuity`**: Smart conversation continuation tracking
- **`idea_development_history`**: Idea evolution and development tracking

## 🎯 Key Features

### For Users
- **Smart Conversations**: AI that remembers context and improves over time
- **Idea Organization**: Visual gallery with search and categorization
- **Feedback System**: Rate AI responses to help improve the system
- **Persistent Memory**: All conversations saved for future reference

### For Developers
- **MCP Integration**: Advanced debugging with browser devtools
- **Enhanced Logging**: Comprehensive development logging system
- **Error Monitoring**: Production-grade error tracking with Sentry
- **Performance Analytics**: Detailed metrics and monitoring

### For Administrators
- **AI Performance Dashboard**: Monitor feedback trends and satisfaction
- **Dynamic Prompt Management**: Test and deploy improved AI prompts
- **User Analytics**: Understand how people interact with the system
- **Continuous Improvement**: Automated analysis of successful patterns

## 🚧 Current Status

### ✅ Completed Features
- Landing page with modern design and branding
- Google OAuth authentication with Supabase
- AI chat interface with Poppy AI personality
- Idea extraction and saving with vector embeddings
- User feedback collection (thumbs up/down, ratings, tags)
- Dynamic prompt system that learns from feedback
- Admin dashboard for AI management and analytics
- Self-improving AI that generates better prompts over time
- Complete conversation history and context preservation
- Idea gallery with deletion and organization
- **Browser DevTools MCP Server** with real-time debugging
- **Sentry integration** for error monitoring
- **Enhanced logging system** with database persistence

### 🚧 Future Enhancements
- Drag-and-drop spatial organization of ideas
- Advanced search and filtering capabilities
- Additional MCP servers for specialized development tasks
- Collaboration features for shared idea development
- Mobile app with synchronized conversations
- Integration with productivity tools and calendars

## 📖 Documentation

### Core Documentation
- [Foundation & Architecture](docs/FOUNDATION.md) - Detailed project vision and architecture
- [Project Instructions](PROJECT-INSTRUCTIONS.md) - Complete development guidelines
- [MCP Logging Setup](MCP-LOGGING-SETUP.md) - Enhanced logging configuration

### Development Guides
- [TODO List](TODO.md) - Current priorities and tasks
- Database schemas in root directory (`.sql` files)
- Archived conversations in `archived-chats/` directory

## 🔍 Self-Improvement System Details

### How Users Help Improve the AI
1. **Rate Responses**: Thumbs up/down or 5-star ratings
2. **Add Context Tags**: "helpful", "creative", "clear", etc.
3. **Provide Written Feedback**: Detailed suggestions for improvement
4. **Use the System**: Actions like saving ideas provide implicit feedback

### How the AI Learns
1. **Pattern Recognition**: Analyzes highly-rated vs poorly-rated responses
2. **Prompt Evolution**: Generates improved system prompts based on patterns
3. **A/B Testing**: Tests different approaches to find what works best
4. **Continuous Refinement**: Constantly improves based on new feedback

### Admin Tools
- **Real-time Analytics**: See feedback trends and user satisfaction
- **Prompt Versioning**: Manage different AI prompt versions
- **Performance Metrics**: Track improvement over time
- **Pattern Analysis**: Understand what makes conversations successful

## 🛡️ Error Monitoring & Debugging

### Sentry Integration
- **Automatic Error Capture**: Unhandled exceptions and promise rejections
- **Performance Monitoring**: Track application performance metrics
- **User Context**: Associate errors with user sessions and actions
- **Release Tracking**: Monitor error rates across deployments

### Browser DevTools MCP Server
- **Real-time Console Monitoring**: Live console logs and errors
- **Network Request Tracking**: Monitor API calls and performance
- **JavaScript Execution**: Execute debugging code in browser context
- **Performance Analysis**: Detailed browser performance metrics

### Enhanced Development Logging
- **Structured Logging**: Categorized logs with metadata
- **Database Persistence**: Long-term log storage and analysis
- **Search & Filtering**: Find specific log entries quickly
- **Export Capabilities**: Download logs for external analysis

## 🤝 Contributing

This project is part of the larger Poppy ecosystem development. The self-improvement system provides valuable insights for building more advanced AI systems.

### Development Workflow
1. **Setup Environment**: Follow the quick start guide
2. **Enable MCP Servers**: Set up browser devtools for enhanced debugging
3. **Test Self-Improvement**: Use the feedback system to train the AI
4. **Monitor Performance**: Use Sentry and logging for debugging

## 📄 License

Private project - All rights reserved.

## 🎯 Vision

This project serves as both a valuable standalone tool and strategic research for the larger Poppy ecosystem - a personal AI orchestrator that will eventually manage digital life through persistent memory and automated actions. The self-improvement capabilities developed here directly inform how AI can become more helpful and aligned with user needs over time.

The comprehensive MCP server integration and monitoring capabilities ensure that development is efficient, debugging is streamlined, and the production system is reliable and maintainable.
