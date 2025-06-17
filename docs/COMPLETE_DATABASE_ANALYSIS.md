# Complete Database Table Analysis
Generated on: June 17, 2025

## Overview
This document provides a comprehensive analysis of all 28 tables in the Poppy Idea Engine database, including their intended purpose, current state, dependencies, and policies.

---

## 🌟 Core Tables (4 tables)

### 1. **profiles**
**Purpose**: User profile management extending Supabase auth
**Created**: Initial setup - Core requirement
**Vision**: Store user preferences, display names, avatars, and eventually gamification stats
**Current State**: ✅ POPULATED - Every authenticated user has a profile
**Data**: 
- Auto-created on signup via trigger `on_auth_user_created`
- Contains: email, display_name, avatar_url, bio, preferences, onboarding_completed
- Added later: feedback_stats JSONB for gamification
**RLS Policies**: 
- Users can view/update/insert only their own profile
**Dependencies**: Referenced by almost every user-related table via user_id
**Why Active**: Core authentication system requirement

### 2. **ideas**
**Purpose**: Central storage for all user ideas
**Created**: Initial setup - Core feature
**Vision**: Store ideas with semantic search capabilities, spatial organization, and branching
**Current State**: ✅ POPULATED - 10+ ideas saved
**Data**:
- Core fields: title, content, category, user_id
- Vector embedding for semantic search (1536 dimensions for OpenAI)
- Position fields (x,y) for future spatial UI (unused)
- Branching support: branched_from_id, branch_note, is_branch
- Development tracking: development_stage, development_count
- Sharing fields: visibility, shared_with (for Phase 2)
**RLS Policies**: 
- Complex viewing rules for owned/public/shared ideas
- Users can only create/update/delete their own ideas
**Dependencies**: Referenced by many tables (development history, likes, stats, etc.)
**Why Active**: Core functionality

### 3. **conversations**
**Purpose**: Chat session metadata
**Created**: Initial setup after renaming conflict
**Vision**: Track entire conversation sessions with optional idea association
**Current State**: ✅ POPULATED - 56+ conversations logged
**Data**:
- Links user to a chat session
- Optional idea_id for idea-specific conversations
- Title and summary fields (mostly unused)
- Timestamps for session tracking
**RLS Policies**: Users can manage only their own conversations
**Dependencies**: Referenced by conversation_messages, outcomes, continuity
**Why Active**: Every chat creates a conversation record

### 4. **conversation_messages**
**Purpose**: Individual chat messages storage
**Created**: Initial setup
**Vision**: Store full conversation history with embeddings for RAG
**Current State**: ✅ POPULATED - All chat messages stored
**Data**:
- role: 'user' or 'assistant'
- content: Message text
- embedding: Vector for semantic search (partially populated)
- Links to conversation and user
**RLS Policies**: Users can manage only their own messages
**Dependencies**: Referenced by message_feedback
**Why Active**: Core chat functionality

---

## 🧠 AI Learning & Self-Improvement Tables (7 tables)

### 5. **dynamic_prompts**
**Purpose**: Evolving system prompts based on learning
**Created**: Phase 1 self-improvement
**Vision**: AI prompts that improve based on user feedback
**Current State**: ✅ POPULATED - Multiple prompt versions
**Data**:
- System messages, categorization prompts, etc.
- Performance metrics tracking
- A/B test group assignments
- Version control for prompts
**RLS Policies**: Anyone can read active prompts
**Dependencies**: Used by ab_tests
**Why Active**: Powers the self-improvement system

### 6. **learning_patterns**
**Purpose**: Extracted insights from successful interactions
**Created**: Phase 1 self-improvement
**Vision**: Store patterns that lead to user satisfaction
**Current State**: ⚠️ PARTIALLY POPULATED
**Data**:
- Pattern types: prompt_technique, conversation_flow, etc.
- Success metrics and confidence scores
- Embeddings for similarity matching
- Usage tracking
**RLS Policies**: Globally readable, system-writable
**Dependencies**: None
**Why Partial**: Requires significant feedback data to generate patterns

### 7. **message_feedback**
**Purpose**: User feedback on AI responses
**Created**: Phase 1 self-improvement
**Vision**: Collect thumbs up/down, ratings, and detailed feedback
**Current State**: ⚠️ PARTIALLY POPULATED
**Data**:
- Feedback types: thumbs_up, thumbs_down, rating
- Context tags for categorization
- Written feedback text
- Links to specific messages
**RLS Policies**: Users manage their own feedback
**Dependencies**: References conversations and messages
**Why Partial**: Users don't always provide feedback

### 8. **user_actions**
**Purpose**: Track all user behaviors for learning
**Created**: Phase 1 self-improvement
**Vision**: Understand what actions indicate success
**Current State**: ✅ POPULATED - Tracking A/B test impressions
**Data**:
- Action types: idea_saved, ab_test_impression, etc.
- Metadata about each action
- Success indicators
**RLS Policies**: Users can view their own actions
**Dependencies**: Can reference conversations, ideas
**Why Active**: A/B testing system uses it

### 9. **conversation_outcomes**
**Purpose**: Track if conversations achieved goals
**Created**: Phase 1 self-improvement
**Vision**: Measure conversation success and satisfaction
**Current State**: ❌ UNUSED
**Data Structure**:
- Outcome types: goal_achieved, abandoned, etc.
- Satisfaction scores
- Session duration and return likelihood
**RLS Policies**: Users manage their own outcomes
**Dependencies**: References conversations
**Why Unused**: No UI/flow implemented for outcome tracking

### 10. **ab_tests**
**Purpose**: A/B testing framework
**Created**: Phase 1 self-improvement
**Vision**: Test different AI behaviors scientifically
**Current State**: ✅ POPULATED - Active tests running
**Data**:
- Test configurations and variants
- Success metrics and sample sizes
- Statistical results
**RLS Policies**: Globally readable when active
**Dependencies**: Referenced by user_test_assignments, ab_test_results
**Why Active**: Testing different prompts

### 11. **user_test_assignments**
**Purpose**: Track which users are in which A/B tests
**Created**: Phase 1 self-improvement
**Vision**: Ensure consistent test experiences
**Current State**: ✅ POPULATED
**Data**:
- User-to-test mappings
- Variant assignments (control/variant)
- Unique constraint prevents multiple assignments
**RLS Policies**: Users can view their own assignments
**Dependencies**: References users and ab_tests
**Why Active**: Part of A/B testing system

---

## 📈 Advanced Tracking Tables (4 tables)

### 12. **idea_development_history**
**Purpose**: Track how ideas evolve over conversations
**Created**: Phase 2 enhanced tracking
**Vision**: Version control for ideas
**Current State**: ⚠️ PARTIALLY POPULATED
**Data**:
- Before/after snapshots of ideas
- Development types: expansion, refinement, etc.
- Change summaries and key insights
- Branching support: parent_history_id, branch_name
- Version numbering
**RLS Policies**: Users manage their own history
**Dependencies**: References ideas and conversations
**Why Partial**: Only populated during continuation detection

### 13. **conversation_continuity**
**Purpose**: Link related conversations
**Created**: Phase 2 enhanced tracking
**Vision**: Track when users return to develop ideas
**Current State**: ⚠️ MINIMAL USE
**Data**:
- Links original and continuation conversations
- Time gaps and context preservation
- Detection methods and confidence
**RLS Policies**: Users manage their own continuity
**Dependencies**: References conversations and ideas
**Why Minimal**: Only used in specific continuation flows

### 14. **smart_save_suggestions**
**Purpose**: AI-detected save opportunities
**Created**: Phase 2 enhanced tracking
**Vision**: Proactively suggest when to save ideas
**Current State**: ❌ UNUSED
**Data Structure**:
- Suggested titles, content, categories
- Trigger patterns and confidence scores
- User responses to suggestions
**RLS Policies**: Users manage their own suggestions
**Dependencies**: References conversations and messages
**Why Unused**: Feature not implemented in UI

### 15. **dev_logs**
**Purpose**: Enhanced development logging
**Created**: Separate dev logging schema
**Vision**: Debug and monitor application behavior
**Current State**: ⚠️ UNKNOWN - Likely populated by logger
**Data**:
- Log levels: info, warn, error, debug
- Component-based logging
- Session tracking
**RLS Policies**: Unknown (need to check)
**Dependencies**: None
**Why Unknown**: Used by backend logger, not visible in API code

---

## 🎮 Gamification Tables (4 tables)

### 16. **daily_feedback_streaks**
**Purpose**: Track consecutive days of feedback
**Created**: Phase 5 gamification
**Vision**: Encourage daily engagement through streaks
**Current State**: ❌ UNUSED
**Data Structure**:
- Daily feedback counts
- Points earned per day
- Unique constraint on user/date
**RLS Policies**: Users view/manage their own streaks
**Dependencies**: References users
**Why Unused**: Gamification UI not implemented

### 17. **feedback_rewards**
**Purpose**: Log points earned from feedback
**Created**: Phase 5 gamification
**Vision**: Detailed reward tracking
**Current State**: ❌ UNUSED
**Data Structure**:
- Points earned and reward types
- Links to specific feedback
- Metadata about rewards
**RLS Policies**: Users view their own rewards
**Dependencies**: References users and message_feedback
**Why Unused**: Gamification system not activated

### 18. **user_achievements**
**Purpose**: Track unlocked achievements
**Created**: Phase 5 gamification
**Vision**: Badge/achievement system
**Current State**: ❌ UNUSED
**Data Structure**:
- Achievement IDs and unlock times
- Progress tracking
- Metadata for each achievement
**RLS Policies**: Users view/manage their own achievements
**Dependencies**: References users
**Why Unused**: No achievement system implemented

### 19. **user_ab_preferences**
**Purpose**: Store user preferences for A/B tests
**Created**: Unknown migration
**Vision**: Let users opt in/out of specific tests
**Current State**: ❌ UNUSED
**Data Structure**:
- Preference types and values
- JSON storage for flexibility
**RLS Policies**: Unknown
**Dependencies**: References users
**Why Unused**: Using user_test_assignments instead

---

## 🌍 Social/Sharing Tables (7 tables)

### 20. **idea_discovery_stats**
**Purpose**: Track public idea engagement
**Created**: Phase 2 sharing
**Vision**: Analytics for public idea discovery
**Current State**: ⚠️ STRUCTURE EXISTS
**Data**:
- View, like, comment, remix counts
- Trending score calculation
- Triggers update counts automatically
**RLS Policies**: Viewable for public ideas only
**Dependencies**: References ideas
**Why Unused**: Public sharing not fully implemented

### 21. **idea_likes**
**Purpose**: Like system for public ideas
**Created**: Phase 2 sharing
**Vision**: Social engagement feature
**Current State**: ⚠️ STRUCTURE EXISTS
**Data Structure**:
- User-to-idea like mappings
- Unique constraint prevents double likes
- Triggers update discovery stats
**RLS Policies**: Anyone can view, users can like public ideas
**Dependencies**: References ideas and users
**Why Unused**: No like UI implemented

### 22. **idea_comments**
**Purpose**: Comment threads on ideas
**Created**: Phase 2 sharing
**Vision**: Discussion and collaboration
**Current State**: ❌ UNUSED
**Data Structure**:
- Nested comments with parent_comment_id
- Edit tracking
- Only on ideas with allow_comments=true
**RLS Policies**: Complex rules based on idea visibility
**Dependencies**: References ideas and users
**Why Unused**: No commenting UI

### 23. **idea_contributors**
**Purpose**: Track idea collaborators
**Created**: Add contributors migration
**Vision**: Multi-user idea development
**Current State**: ❌ UNUSED
**Data Structure**:
- Contribution types: creator, collaborator, commenter
- Timestamps for when added
**RLS Policies**: Unknown
**Dependencies**: References ideas and users
**Why Unused**: No collaboration features

### 24. **idea_remixes**
**Purpose**: Track idea forks/variations
**Created**: Phase 2 sharing
**Vision**: Build on others' public ideas
**Current State**: ❌ UNUSED
**Data Structure**:
- Original and remixed idea links
- Remix types: fork, variation, expansion
- Attribution notes
**RLS Policies**: Anyone can view, controlled creation
**Dependencies**: References ideas (self-referential)
**Why Unused**: No remix UI

### 25. **idea_shares**
**Purpose**: Granular sharing permissions
**Created**: Phase 2 sharing
**Vision**: Share specific ideas with specific users
**Current State**: ❌ UNUSED
**Data Structure**:
- Permission levels: view, comment, edit
- Expiration dates
- Email-based sharing for non-users
**RLS Policies**: Complex sharing rules
**Dependencies**: References ideas and users
**Why Unused**: Using simpler visibility field instead

### 26. **idea_version_timeline** (VIEW)
**Purpose**: Visualize idea version history
**Created**: Phase 4 enhanced tracking
**Vision**: Git-like version visualization
**Current State**: ❌ UNUSED VIEW
**Data**: Aggregates from idea_development_history
**Why Unused**: No version timeline UI

---

## 🗄️ Utility/Legacy Tables (2 tables)

### 27. **old_conversations_backup**
**Purpose**: Backup of old conversation structure
**Created**: During initial schema migration
**Vision**: Temporary backup during restructure
**Current State**: ❌ LEGACY
**Data**: Old message-based conversation data
**RLS Policies**: Unknown
**Dependencies**: None
**Why Exists**: Created by `ALTER TABLE conversations RENAME TO`

### 28. **ab_test_results**
**Purpose**: Store A/B test metrics
**Created**: Unknown (in types but not in migrations)
**Vision**: Detailed test result tracking
**Current State**: ⚠️ UNCLEAR
**Data Structure**:
- Test results per user/variant
- Metric types and values
**Dependencies**: References ab_tests and users
**Why Unclear**: Defined in types but no migration found

---

## 🔐 Row Level Security Summary

### Strict User Isolation
- profiles, ideas, conversations, messages - Users only see their own
- feedback, actions, outcomes - Users only manage their own

### Shared/Public Access
- ideas - Complex rules for public/shared visibility
- learning_patterns - Globally readable
- dynamic_prompts - Active prompts globally readable
- ab_tests - Active tests globally readable

### Social Features (When Implemented)
- Comments - Based on idea visibility
- Likes - Only on public ideas
- Remixes - Only allowed on public ideas with permission

---

## 📊 Population Analysis

### Fully Populated
1. profiles - Every user has one
2. ideas - Core feature, actively used
3. conversations - Every chat session
4. conversation_messages - All messages stored
5. dynamic_prompts - Multiple versions
6. ab_tests - Active tests
7. user_test_assignments - Test participants
8. user_actions - A/B tracking

### Partially Populated
1. learning_patterns - Needs more data
2. message_feedback - Optional user action
3. idea_development_history - Only on continuations
4. conversation_continuity - Rare use case
5. dev_logs - Backend only

### Completely Unused
1. All gamification tables (4)
2. All social features except basic stats (5)
3. conversation_outcomes
4. smart_save_suggestions
5. user_ab_preferences
6. old_conversations_backup

---

## 🎯 Key Insights

### Why Tables Are Unused
1. **Ambitious Roadmap**: Many tables created for future features
2. **Pivot in Priorities**: Gamification deprioritized for core features
3. **Complexity**: Social features require significant UI work
4. **User Behavior**: Some features (like outcomes) need user training

### Design Patterns
1. **Soft Deletes**: Using archived flags instead of deletions
2. **JSON Flexibility**: Heavy use of JSONB for extensibility
3. **Vector Search**: Embeddings on ideas and messages
4. **Audit Trails**: Comprehensive history tracking
5. **A/B Testing**: Built-in experimentation framework

### Technical Debt
1. **Unused Columns**: position_x/y in ideas never used
2. **Duplicate Systems**: user_ab_preferences vs user_test_assignments
3. **Over-Engineering**: Complex social features before user need
4. **Migration Artifacts**: old_conversations_backup still exists