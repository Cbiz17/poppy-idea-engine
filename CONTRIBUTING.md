# Contributing to Poppy Idea Engine

Welcome! This guide will help you contribute effectively to the Poppy Idea Engine while maintaining our core development philosophy.

## 🎯 Core Philosophy: Simplicity Over Complexity

**The best code is often the simplest code that solves the problem.**

We've learned from experience that over-engineering leads to:

- 🕰️ Hours of debugging
- 😟 Poor user experience
- 🔧 Maintenance nightmares
- 💔 Frustrated developers

## 📋 Before You Start

1. **Read the Vision**: Understand what we're building - see [VISION.md](./docs/VISION.md)
2. **Check Current Status**: See what's already working - [PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
3. **Understand the Architecture**: Review technical decisions - [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 🛠 Development Principles

### 1. KISS (Keep It Simple, Stupid)

- Start with the simplest solution that could work
- Add complexity only when proven necessary
- If a feature takes more than a day, it might be over-engineered

### 2. User Control & Transparency

- Users should understand what's happening
- Give users control over AI actions
- Make learning and improvement visible

### 3. Consistency

- Similar features should work in similar ways
- Follow existing patterns before creating new ones
- Use the same UI components and flows

### 4. Discussion First

- Complex changes need discussion before implementation
- Open an issue or reach out before major refactoring
- Share your approach to get feedback early

## 💡 Case Study: "Continue Where You Left Off"

This feature demonstrates our philosophy perfectly:

**❌ Over-Engineered Approach** (6 hours of debugging):

- Complex URL navigation with `?continue=id`
- Full conversation history loading
- State management across components
- Edge case handling for auth flows

**✅ Simple Solution** (Working perfectly):

- Pre-fills chat input with continuation prompt
- User sees and controls the message
- Works like other quick actions
- No special state management

The lesson: Simple, consistent solutions often provide better UX than complex "smart" features.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd poppy-idea-engine

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your keys to .env.local:
# - Supabase URL and anon key
# - Anthropic API key
# - (Optional) OpenAI key for embeddings

# Run development server
npm run dev
```

### Database Setup

1. Create a Supabase project
2. Run SQL migrations in order (see `/database` folder)
3. Enable Google OAuth in Supabase Auth

## 📝 Making Changes

### 1. Check Existing Work

Before implementing something new:

- Check if it already exists (many features are built but not obvious)
- Look for similar patterns in the codebase
- Read recent commits to understand current work

### 2. Follow the Code Style

- TypeScript with strict typing
- Functional components with hooks
- Server components where possible
- Tailwind for styling (no custom CSS files)

### 3. Test Your Changes

```bash
# Type checking
npm run build

# Manual testing
- Test with multiple user accounts
- Test error cases
- Test on mobile devices
- Check browser console for errors
```

### 4. Commit Guidelines

```bash
# Format: type: description
git commit -m "feat: Add user preference tracking"
git commit -m "fix: Resolve chat scroll issue"
git commit -m "docs: Update deployment guide"
git commit -m "refactor: Simplify feedback component"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🐛 Common Pitfalls to Avoid

### 1. Adding Complexity Without Need

❌ Creating elaborate state management for simple features
✅ Using existing patterns and simple solutions

### 2. Breaking User Data Isolation

❌ Queries without proper user_id filters
✅ Always respect RLS policies and user boundaries

### 3. Ignoring Existing Infrastructure

❌ Building new logging/monitoring systems
✅ Using existing DevPanel, Sentry, and MCP tools

### 4. Over-Optimizing Early

❌ Complex caching before proving need
✅ Simple solutions first, optimize based on metrics

## 🔍 Where to Find Things

```
src/
├── app/           # Pages and API routes
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and configurations
└── types/         # TypeScript type definitions

Key files:
- ChatInterface.tsx - Main chat component
- IdeasGallery.tsx - Ideas management
- AdminDashboard.tsx - AI learning dashboard
- usePersonalContext.ts - User preference tracking
```

## 🤝 Submitting Changes

1. **Fork & Branch**: Create a feature branch from `main`
2. **Make Changes**: Follow the principles above
3. **Test Thoroughly**: Including edge cases
4. **Document**: Update relevant docs if needed
5. **Pull Request**: With clear description of what and why

### PR Template

```markdown
## What

Brief description of changes

## Why

The problem this solves or value it adds

## How

Technical approach taken

## Testing

How you tested the changes

## Screenshots

If UI changes
```

## 🚨 When to Ask for Help

- Before major architectural changes
- When touching authentication or security
- If a "simple" task is taking too long
- When unsure about the approach

## 📚 Additional Resources

- [Development Guide](./docs/DEVELOPMENT_GUIDE.md) - Detailed setup
- [Troubleshooting](./docs/guides/TROUBLESHOOTING.md) - Common issues
- [Learning Insights](./docs/LEARNING_INSIGHTS.md) - What we've learned

---

**Remember**: We're building research tools to understand how AI can help orchestrate family life. Every contribution should either help the founding team develop ideas more effectively OR teach us something valuable about human-AI interaction.

Thank you for contributing to the future of AI-assisted living! 🚀
