# Poppy Idea Engine - Architecture Decisions

*Last Updated: December 2024*

This document explains key architectural decisions in the Poppy Idea Engine and how they inform the future Poppy household OS architecture.

## 🎯 Guiding Principles

### For the Idea Engine (Current)
1. **Simplicity First** - Test core concepts with minimal complexity
2. **Observable Learning** - Make AI improvement transparent
3. **Privacy by Design** - Complete user data isolation
4. **Rapid Iteration** - Learn fast from real usage

### For Poppy OS (Future)
1. **Family-First Architecture** - Multi-user coordination at the core
2. **Integration-Ready** - Extensible plugin architecture
3. **Trust Through Transparency** - Explainable orchestration
4. **Resilient Orchestration** - Graceful handling of service failures

## 🏗 Current Architecture (Idea Engine)

### Tech Stack Decisions

#### Next.js 14 with App Router
**Why:** 
- Server components for secure API handling
- Streaming support for real-time AI responses
- Edge runtime compatibility
- Excellent DX for rapid iteration

**Learning for Poppy:** 
- Real-time streaming UI patterns work well
- Server-side rendering crucial for security
- Edge functions may be needed for global family coordination

#### Supabase (PostgreSQL + Vector)
**Why:**
- Built-in auth and RLS (Row Level Security)
- pgvector for semantic search without separate service
- Real-time subscriptions (not yet used)
- Managed infrastructure

**Learning for Poppy:**
- RLS works well for user isolation (need family-level RLS)
- Vector search powerful for semantic understanding
- Real-time will be crucial for multi-person coordination

#### Anthropic Claude API
**Why:**
- High-quality responses for idea development
- Good at maintaining conversation context
- Supports streaming responses
- Aligned with helpful, harmless, honest principles

**Learning for Poppy:**
- Need model-agnostic architecture
- Streaming essential for responsive feel
- Context window limitations require smart summarization

### Key Architectural Patterns

#### 1. Feedback-Driven Learning System
```
User Action → Feedback Collection → Pattern Analysis → Prompt Evolution
```

**Current Implementation:**
- Explicit feedback (thumbs up/down, ratings)
- Implicit feedback (save actions, continuations)
- A/B testing infrastructure
- Dynamic prompt selection

**Insights for Poppy:**
- Need more implicit feedback mechanisms
- Family-level pattern recognition required
- Cross-user learning without privacy violation

#### 2. Personal Context Architecture
```typescript
UserContext = Preferences + Interests + Patterns + History
```

**Current Implementation:**
- Stored in user profile (preferences)
- Derived from behavior (interests, patterns)
- Conversation-aware (history)

**Insights for Poppy:**
- Need hierarchical context (Individual → Role → Family)
- Context switching mechanisms crucial
- Shared vs. private context boundaries

#### 3. Semantic Memory System
```
Text → Embedding → Vector Storage → Similarity Search
```

**Current Implementation:**
- OpenAI embeddings for all content
- PostgreSQL pgvector for storage
- Threshold-based similarity matching

**Insights for Poppy:**
- Need multi-dimensional embeddings (task, person, context)
- Hybrid search (semantic + structured) required
- Explanation layer for why matches occur

#### 4. Version Control for Ideas
```
Idea → Development → New Version → History Preservation
```

**Current Implementation:**
- Full history tracking in separate table
- Change summaries and AI confidence scores
- Branching and merging support

**Insights for Poppy:**
- Version control patterns work for plans/decisions
- Need conflict resolution for multi-person edits
- Audit trail crucial for family decisions

## 🔮 Future Architecture (Poppy OS)

### Multi-Tenant Family Architecture

```
Family
├── Members (with roles)
├── Shared Context
│   ├── Calendars
│   ├── Preferences
│   └── Values
├── Private Contexts
└── Integration Credentials
```

**Key Challenges:**
- Permission models for shared data
- Context switching based on interaction
- Privacy within families

### Event-Driven Orchestration

```
External Event → Poppy Orchestrator → Decision Engine → Actions
                        ↓
                 Family Rules & Preferences
```

**Components Needed:**
- Event ingestion from multiple sources
- Rule engine for family preferences
- Action execution with rollback
- Notification system for approvals

### Plugin Architecture for Integrations

```
Core Poppy OS
├── Integration Framework
│   ├── OAuth Manager
│   ├── Webhook Registry
│   └── API Abstraction Layer
├── Built-in Integrations
│   ├── Google Workspace
│   ├── Microsoft 365
│   └── Common Tools
└── Plugin SDK
```

**Design Principles:**
- Standardized data models
- Graceful degradation
- User-controlled permissions
- Transparent data flow

### Conversation → Orchestration Bridge

```
Natural Language Input → Intent Recognition → Orchestration Plan → Execution
                              ↓
                     Family Context & Constraints
```

**Key Innovations Needed:**
- Multi-step planning with approval gates
- Constraint satisfaction across family members
- Explainable decision paths
- Rollback and correction mechanisms

## 💾 Data Architecture Evolution

### Current (Idea Engine)
```sql
users → profiles (1:1)
      → ideas (1:many)
      → conversations (1:many) → messages (1:many)
      → feedback (1:many)
```

### Future (Poppy OS)
```sql
families → members (1:many) → roles (many:many)
        → shared_context (1:1)
        → integrations (1:many)
        → orchestrations (1:many) → steps (1:many)
        → decisions (1:many) → impacts (1:many)
```

## 🔐 Security & Privacy Architecture

### Current Approach
- Row Level Security (RLS) for complete isolation
- No cross-user data access
- Encrypted credentials
- Audit logging

### Future Requirements
- Family-level access controls
- Role-based permissions
- Integration token management
- Compliance with family data regulations
- End-to-end encryption for sensitive orchestrations

## 📊 Performance Considerations

### Current Optimizations
- Edge functions for low latency
- Streaming responses for perceived speed
- Indexed vector searches
- Cached user preferences

### Future Scaling Needs
- Real-time coordination across time zones
- High-frequency event processing
- Complex constraint solving
- Global state synchronization

## 🧪 Testing & Quality Architecture

### Current Approach
- Manual testing with dogfooding
- A/B testing infrastructure
- Error tracking with Sentry
- Performance monitoring

### Future Requirements
- Automated family scenario testing
- Chaos engineering for integration failures
- Privacy compliance testing
- Multi-user interaction testing

## 🚀 Deployment Architecture

### Current
- Vercel for Next.js hosting
- Supabase managed PostgreSQL
- Environment-based configuration
- Automatic deployments from main

### Future
- Multi-region deployment for families
- Edge computing for local orchestration
- Offline-first capabilities
- Progressive web app for all platforms

## 📝 Key Architectural Decisions Log

### Decision: Use Server Components for AI Interactions
**Date:** November 2024  
**Why:** Security, streaming, cost management  
**Outcome:** Working well, good pattern for Poppy  

### Decision: Implement A/B Testing Infrastructure
**Date:** December 2024  
**Why:** Need data-driven prompt improvements  
**Outcome:** Successfully deployed, valuable for learning  

### Decision: Simple URL-Based Continuation
**Date:** November 2024  
**Why:** Complex state management was fragile  
**Outcome:** Simpler is better, users understand it  

### Decision: Separate Learning Tables
**Date:** November 2024  
**Why:** Evolution visibility and audit trail  
**Outcome:** Good pattern for family decision tracking  

## 🎯 Architecture North Stars

As we build toward Poppy, every architectural decision should:

1. **Enable Family Coordination** - Not just individual use
2. **Preserve Privacy** - Within and across families  
3. **Build Trust** - Through transparency and control
4. **Support Integration** - With real-world tools
5. **Scale Gracefully** - From 1 to millions of families

---

*This is a living document. As we learn more from the Idea Engine and early Poppy prototypes, we'll update our architectural approach.*
