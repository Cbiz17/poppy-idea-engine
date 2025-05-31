-- Run this SECOND to add the enhanced conversation history system
-- Copy and paste this entire file into your Supabase SQL Editor

-- Idea Development History - tracks how ideas evolve over time
CREATE TABLE IF NOT EXISTS public.idea_development_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Changes made in this conversation
  previous_title TEXT,
  new_title TEXT,
  previous_content TEXT,
  new_content TEXT,
  previous_category TEXT,
  new_category TEXT,
  
  -- Type of development that occurred
  development_type TEXT NOT NULL CHECK (development_type IN (
    'initial_creation', 'content_expansion', 'refinement', 
    'categorization_change', 'major_revision', 'continuation'
  )),
  
  -- Context about the changes
  change_summary TEXT,
  key_insights TEXT[],
  related_concepts TEXT[],
  
  -- Metadata
  conversation_length INTEGER, -- Number of messages in the conversation
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  ai_confidence_score FLOAT DEFAULT 0.5,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversation Continuity Tracking - when users continue working on ideas
CREATE TABLE IF NOT EXISTS public.conversation_continuity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  continuation_conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  
  -- Time between conversations
  time_gap_hours INTEGER,
  
  -- Context preservation
  context_summary TEXT,
  preserved_insights TEXT[],
  new_directions TEXT[],
  
  -- Smart detection results
  continuation_detected_by TEXT CHECK (continuation_detected_by IN ('user_explicit', 'smart_detection', 'url_parameter')),
  detection_confidence FLOAT DEFAULT 0.5,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Smart Save Suggestions - AI-detected opportunities to save ideas
CREATE TABLE IF NOT EXISTS public.smart_save_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.conversation_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Suggestion details
  suggested_title TEXT NOT NULL,
  suggested_content TEXT NOT NULL,
  suggested_category TEXT NOT NULL,
  confidence_score FLOAT NOT NULL DEFAULT 0.5,
  
  -- Detection criteria that triggered this
  trigger_keywords TEXT[],
  trigger_patterns TEXT[],
  context_indicators JSONB,
  
  -- User response
  user_action TEXT CHECK (user_action IN ('accepted', 'modified', 'rejected', 'ignored')),
  final_saved_content TEXT, -- What was actually saved if accepted/modified
  user_modifications JSONB, -- What changes the user made
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.idea_development_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_continuity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_save_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own idea development history" ON public.idea_development_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own conversation continuity" ON public.conversation_continuity
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own save suggestions" ON public.smart_save_suggestions
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_idea_development_history_idea_id ON public.idea_development_history(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_development_history_conversation_id ON public.idea_development_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_continuity_user_id ON public.conversation_continuity(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_continuity_idea_id ON public.conversation_continuity(idea_id);
CREATE INDEX IF NOT EXISTS idx_smart_save_suggestions_conversation_id ON public.smart_save_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_smart_save_suggestions_user_action ON public.smart_save_suggestions(user_action);
