# Poppy Idea Engine

> 📋 **For current deployment status and technical details, see [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)**

**A personal AI thinking partner that learns and improves from every conversation.**

Poppy transforms fleeting thoughts into organized, actionable ideas through natural conversation. Unlike traditional AI chatbots, Poppy adapts to your unique communication style, remembers what matters to you, and continuously improves based on your feedback.

## 🌟 What Makes Poppy Different

### 🧠 **Personal AI That Learns You**
- **Adaptive Responses**: Adjusts communication style to match your preferences
- **Interest Tracking**: Remembers topics you care about
- **Success Patterns**: Learns what type of help you find most valuable
- **Continuous Improvement**: Every feedback makes Poppy better for YOU

### 💡 **Intelligent Idea Development**
- **Smart Continuations**: Automatically detects when you're building on previous ideas
- **Version History**: Track how your ideas evolve over time
- **Semantic Search**: Find related concepts across all your conversations
- **Idea Branching**: Explore variations without losing the original

### 🎯 **Built for Real Thinking**
- **Conversation Memory**: Full context preserved across sessions
- **Visual Organization**: Arrange ideas spatially in your gallery
- **Quick Actions**: Save valuable insights with one click
- **Development Modes**: Switch between exploration and refinement

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Anthropic API key

### Quick Setup

1. **Clone and Install**
```bash
git clone <repo-url>
cd poppy-idea-engine
npm install
```

2. **Environment Setup**
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
ANTHROPIC_API_KEY=your_anthropic_key
```

3. **Database Setup**
Run the SQL files in Supabase:
- `database-setup.sql`
- `self-improvement-schema.sql`

4. **Start Development**
```bash
npm run dev
```

## 💭 How Poppy Works

### The Conversation Loop
1. **You share a thought** - Natural conversation, no special formatting
2. **Poppy responds** - Personalized to your style and interests
3. **You provide feedback** - Thumbs up/down, ratings, or tags
4. **Poppy learns** - Adjusts future responses based on what helps you

### Your Personal AI Profile
Poppy builds a unique profile for you:
- **Communication Style**: Formal, casual, or balanced
- **Response Preferences**: Concise or detailed explanations
- **Interest Areas**: Topics you explore frequently
- **Success Patterns**: What makes conversations valuable for you

## 🛠 Advanced Features

### For Power Users
- **Version Control**: Every idea change is tracked
- **Branching**: Explore variations of ideas
- **Bulk Export**: Download all ideas as Markdown
- **API Access**: Integrate with your workflow

### For Developers
- **Open Architecture**: Built with Next.js 14 and TypeScript
- **Vector Search**: Semantic similarity with PostgreSQL
- **Real-time Learning**: Observable AI improvement
- **Comprehensive Logging**: Debug with enhanced tools

## 📊 The Self-Improvement System

Poppy's learning happens transparently:

1. **Feedback Collection**: Every interaction provides learning data
2. **Pattern Analysis**: Successful conversations are analyzed
3. **Prompt Evolution**: AI instructions improve automatically
4. **Performance Tracking**: Measure satisfaction over time

You can see exactly how Poppy is learning in the Poppy Lab.

## 🔒 Privacy & Security

- **Your data is yours**: Complete isolation between users
- **Local learning**: Personalization happens without sharing data
- **Transparent AI**: See exactly how feedback improves responses
- **Export anytime**: Take your ideas and AI profile with you

## 🎯 Vision

Poppy is more than a chatbot - it's a thinking partner that grows with you. By learning your unique style and needs, Poppy becomes increasingly valuable over time. This is the future of personal AI: systems that truly understand and adapt to individual users.

## 🤝 Contributing

We're building the future of personalized AI assistance. The patterns learned here will inform next-generation AI tools that are genuinely helpful and aligned with human needs.

## 📈 Current Status

- ✅ Core conversation system
- ✅ Idea management with versioning
- ✅ Personal context awareness
- ✅ Feedback-driven learning
- ✅ Smart continuation detection
- 🔄 Collecting feedback for improvement
- 🔄 Building preference UI

## ⚠️ CRITICAL: Implementation Guidelines

### Keep It Simple
This project values **simplicity over complexity**. Features like "Continue where you left off" are intentionally simple - they pre-fill the chat input rather than loading complex state. This is by design.

### Before Making Changes
1. **Understand existing patterns** - Many "improvements" make things worse
2. **Discuss complex changes** - Talk before implementing
3. **Respect working code** - If it works well, don't "fix" it
4. **User experience first** - Simple solutions often provide better UX

**See [IMPORTANT_DOCUMENTATION_UPDATE.md](./IMPORTANT_DOCUMENTATION_UPDATE.md) for critical implementation details.**

---

**Start your journey with Poppy today. The more you use it, the better it understands you.**
