# Poppy Idea Engine - Complete Project Foundation

## Project Vision and Purpose

The Poppy Idea Engine represents a strategic proof-of-concept for the larger Poppy ecosystem - a personal AI orchestrator that will eventually manage digital life through persistent memory and automated actions. This simplified version serves dual purposes: it provides immediate value to users as an AI-powered idea development tool, while generating invaluable user research data about what people actually want from AI automation.

Think of this as building a "digital idea greenhouse" where thoughts can grow and flourish through conversation with Claude AI, then be organized spatially by users in an intuitive, drag-and-drop interface. Unlike traditional note-taking apps or simple chatbots, this system captures both the ideas themselves and the conversational journey that created them.

### The Strategic Value

This proof-of-concept answers critical questions for the full Poppy development: How do users naturally want to interact with persistent AI? What categories of automation ideas emerge most frequently? How do people prioritize and organize their digital life goals? The data collected here directly informs the roadmap for Poppy's full automation capabilities.

## Core User Experience Philosophy

The application should feel like having a conversation with an insightful friend who has perfect memory and infinite patience. Users arrive with vague notions ("I wish my life was more organized") and leave with concrete, actionable ideas they can see, touch, and prioritize through spatial interaction.

The magic happens in three interconnected spaces:

**The Conversation Space** - Where ideas are born through natural dialogue with Claude AI. This isn't just Q&A; it's collaborative thinking where Claude helps users explore, refine, and develop their thoughts into concrete concepts.

**The Idea Gallery** - Where thoughts become tangible objects that users can arrange, prioritize, and revisit. Each idea exists as a draggable tile that users can move around to reflect their changing priorities and interests.

**The Development Workshop** - Where users can return to any idea and continue the conversation with Claude, building on previous context to refine and expand their thinking.

## Technical Architecture and Reasoning

### Technology Stack Decisions

**Next.js 14 with App Router** serves as our foundation because it provides both excellent developer experience and production-ready performance. The App Router's file-based routing system makes it intuitive to create the distinct spaces users navigate between, while server components optimize initial page loads.

**Supabase** handles authentication and data persistence with minimal configuration overhead. Its Row Level Security ensures user data privacy without complex backend logic, while its real-time subscriptions enable smooth collaborative features if we add them later. The PostgreSQL foundation scales naturally as data complexity grows.

**Claude AI via Anthropic API** provides the conversational intelligence that transforms simple chat into genuine idea development. Claude's ability to maintain context and engage in sophisticated reasoning makes it ideal for helping users think through complex problems.

**DND Kit** enables the sophisticated drag-and-drop interactions that make ideas feel like physical objects users can manipulate. This psychological transformation from abstract text to tangible tiles significantly enhances user engagement and spatial thinking.

### Data Architecture Philosophy

The database design captures three layers of information that traditional note-taking apps miss:

**Identity Layer** - User profiles and authentication state managed through Supabase Auth with Google OAuth integration.

**Content Layer** - Ideas as discrete entities with both semantic content and spatial properties (position, priority). Each idea links back to the conversations that created it.

**Context Layer** - Complete conversation history that preserves the thinking process behind each idea. This enables Claude to reference previous discussions when users return to develop ideas further.

### Security and Privacy Considerations

User data protection operates on multiple levels. Supabase's Row Level Security ensures database-level isolation between users. Environment variables protect API keys and sensitive configuration. The frontend never stores authentication tokens in localStorage, relying instead on Supabase's secure session management.

For the admin analytics dashboard, we aggregate and anonymize data patterns while maintaining the ability to understand popular idea categories and user engagement patterns. This provides business intelligence without compromising individual privacy.

## Database Schema Design

```sql
-- Profiles extend Supabase auth.users with application-specific data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Ideas capture both content and spatial organization
CREATE TABLE public.ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  priority_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversations preserve the thinking process behind ideas
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  message_role TEXT NOT NULL, -- 'user' or 'assistant'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);