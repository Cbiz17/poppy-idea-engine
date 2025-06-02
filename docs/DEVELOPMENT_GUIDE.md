# Development Guide

This guide covers everything you need to develop on the Poppy Idea Engine effectively.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- A Supabase account (free tier works)
- An Anthropic API key

### Initial Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd poppy-idea-engine

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

### Environment Configuration

Edit `.env.local` with your credentials:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-key

# Optional but recommended
OPENAI_API_KEY=your-openai-key  # For vector embeddings
SENTRY_DSN=your-sentry-dsn      # For error tracking

# Development only
NEXT_PUBLIC_DEV_MODE=true       # Enables dev tools
```

### Database Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Save your project URL and anon key

2. **Run Database Migrations**
   ```sql
   -- In Supabase SQL Editor, run these in order:
   -- 1. database-setup.sql (core tables)
   -- 2. self-improvement-schema.sql (learning system)
   -- 3. Any other migration files in /database
   ```

3. **Enable Google OAuth**
   - In Supabase Dashboard → Authentication → Providers
   - Enable Google
   - Add your OAuth credentials
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### Running Locally

```bash
# Start development server
npm run dev

# Visit http://localhost:3000
```

## 🏗 Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Anthropic Claude API
- **Auth**: Supabase Auth with Google OAuth
- **Styling**: Tailwind CSS
- **Types**: TypeScript with strict mode

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── chat/              # Chat interface page
│   ├── ideas/             # Ideas gallery page
│   └── admin/             # Admin dashboard
├── components/            # React components
│   ├── chat/             # Chat-related components
│   ├── ideas/            # Idea management components
│   ├── feedback/         # Feedback system components
│   └── admin/            # Admin dashboard components
├── hooks/                # Custom React hooks
│   ├── useChat.ts        # Chat functionality
│   ├── useIdeas.ts       # Idea management
│   └── usePersonalContext.ts # User preferences
├── lib/                  # Utilities and configs
│   ├── supabase.ts      # Client configuration
│   └── dev-logger.ts    # Enhanced logging
└── types/               # TypeScript definitions
```

### Key Components

#### Chat System (`/components/chat/ChatInterface.tsx`)
- Manages conversation flow
- Handles message streaming
- Integrates feedback collection
- Supports special commands

#### Ideas Management (`/components/ideas/IdeasGallery.tsx`)
- Visual card-based gallery
- Version history tracking
- Search and filtering
- Export functionality

#### Self-Improvement System
- **Feedback Collection**: After every AI response
- **Pattern Analysis**: Identifies successful interactions
- **Dynamic Prompts**: AI adapts based on feedback
- **Admin Dashboard**: Monitor learning progress

## 💻 Development Workflow

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Code Standards**
   - Use TypeScript with proper types
   - Follow existing component patterns
   - Use Tailwind classes (no custom CSS)
   - Keep components focused and simple

3. **Test Your Changes**
   ```bash
   # Type checking
   npm run build
   
   # Manual testing
   - Test with multiple users
   - Check mobile responsiveness
   - Verify RLS policies work
   - Test error cases
   ```

### Common Development Tasks

#### Adding a New API Route
```typescript
// src/app/api/your-route/route.ts
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Your logic here
  
  return Response.json({ success: true })
}
```

#### Creating a New Component
```typescript
// src/components/your-component.tsx
'use client'

interface YourComponentProps {
  // Define props
}

export function YourComponent({ ...props }: YourComponentProps) {
  // Component logic
  
  return (
    <div className="...">
      {/* Component UI */}
    </div>
  )
}
```

#### Adding Database Queries
```typescript
// Always include user_id in queries for RLS
const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .eq('user_id', user.id)
```

## 🛠 Development Tools

### Browser DevTools MCP Server
For advanced debugging:
```bash
# In a separate terminal
cd mcp-servers/browser-devtools
npm start

# This provides:
# - Real-time console logs
# - Network monitoring
# - Performance metrics
# - Screenshot capture
```

### Enhanced Logging
Use the dev logger instead of console.log:
```typescript
import { devLogger } from '@/lib/dev-logger'

devLogger.info('Component', 'Action happened', { data })
devLogger.error('Component', 'Error occurred', error)
```

### Development Panel
The floating 🐛 button provides:
- Searchable logs
- Database query logs
- Performance metrics
- Export functionality

## 🧪 Testing Approach

### Manual Testing Checklist
- [ ] Feature works for new users
- [ ] Feature works for existing users
- [ ] Data isolation is maintained
- [ ] Error states handled gracefully
- [ ] Mobile responsive
- [ ] Loading states present
- [ ] Keyboard navigation works

### Testing Different Scenarios
```bash
# Test with multiple users
# 1. Sign in with User A
# 2. Create data
# 3. Sign out
# 4. Sign in with User B
# 5. Verify User A's data not visible
```

## 🐛 Debugging Tips

### Common Issues

**"Failed to fetch" errors**
- Check Supabase connection
- Verify environment variables
- Check RLS policies

**TypeScript errors**
- Run `npm run build` to see all errors
- Check generated types match database

**Authentication issues**
- Verify Google OAuth configured
- Check redirect URLs
- Test in incognito window

### Useful Database Queries
```sql
-- Check user data
SELECT * FROM profiles WHERE id = 'user-uuid';

-- View feedback patterns
SELECT feedback_type, COUNT(*) 
FROM message_feedback 
GROUP BY feedback_type;

-- Check conversation count
SELECT user_id, COUNT(*) as conv_count
FROM conversations
GROUP BY user_id;
```

## 📚 Key Concepts

### Row Level Security (RLS)
Every table uses RLS to isolate user data:
```sql
-- Users only see their own data
CREATE POLICY "Users view own data" ON ideas
FOR SELECT USING (user_id = auth.uid());
```

### Vector Embeddings
Used for semantic search:
- Ideas and messages get embeddings
- Enables "find similar" functionality
- Powers smart continuation detection

### Dynamic Prompts
AI system prompts that evolve:
- Based on user feedback
- A/B tested for effectiveness
- Automatically activated when better

## 🚀 Advanced Features

### Adding Special Commands
```typescript
// In useSpecialCommands hook
if (input.startsWith('/mycommand')) {
  // Handle command
  return true // Prevents normal message send
}
```

### Implementing New Feedback Types
1. Update database schema
2. Add to feedback component
3. Update analytics queries
4. Add to admin dashboard

### Creating New Visualizations
- Use existing chart components
- Follow the dashboard patterns
- Keep performance in mind

## 📖 Further Reading

- [Architecture Decisions](./ARCHITECTURE.md)
- [Vision & Goals](./VISION.md)
- [Learning Insights](./LEARNING_INSIGHTS.md)
- [Deployment Guide](./guides/DEPLOYMENT.md)

---

**Remember**: Keep it simple. The best features are often the simplest ones that solve real problems for our users.