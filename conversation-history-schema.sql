-- Enhanced Conversation History Tracking Schema
-- This extends the existing database with advanced conversation continuity features

-- Idea Development History - tracks how ideas evolve over time
CREATE TABLE public.idea_development_history (
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
CREATE TABLE public.conversation_continuity (
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
CREATE TABLE public.smart_save_suggestions (
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

-- Enhanced functions for conversation history

-- Function to detect conversation continuation contexts
CREATE OR REPLACE FUNCTION detect_conversation_continuation(
  user_id_input UUID,
  current_messages TEXT[],
  time_threshold_hours INTEGER DEFAULT 24
) 
RETURNS TABLE (
  related_idea_id UUID,
  confidence_score FLOAT,
  context_summary TEXT,
  suggested_title TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  message_text TEXT;
  search_embedding VECTOR(1536);
BEGIN
  -- Combine recent messages for context analysis
  message_text := array_to_string(current_messages, ' ');
  
  -- This would normally call an embedding API, but for now we'll use text matching
  -- In practice, you'd want to:
  -- 1. Generate embedding for message_text
  -- 2. Search for semantically similar ideas using vector similarity
  
  RETURN QUERY
  SELECT 
    i.id as related_idea_id,
    CASE 
      WHEN position(lower(i.title) in lower(message_text)) > 0 THEN 0.9
      WHEN position(lower(message_text) in lower(i.content)) > 0 THEN 0.7
      ELSE 0.3
    END as confidence_score,
    i.content as context_summary,
    i.title as suggested_title
  FROM public.ideas i
  WHERE i.user_id = user_id_input
    AND i.updated_at > NOW() - (time_threshold_hours || ' hours')::INTERVAL
    AND (
      position(lower(i.title) in lower(message_text)) > 0 OR
      position(lower(message_text) in lower(i.content)) > 0 OR
      similarity(i.title, message_text) > 0.3
    )
  ORDER BY confidence_score DESC
  LIMIT 3;
END;
$$;

-- Function to analyze conversation for save opportunities
CREATE OR REPLACE FUNCTION analyze_save_opportunities(
  conversation_messages TEXT[],
  conversation_id_input UUID,
  user_id_input UUID
)
RETURNS TABLE (
  message_index INTEGER,
  suggested_title TEXT,
  suggested_content TEXT,
  suggested_category TEXT,
  confidence_score FLOAT,
  trigger_keywords TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  msg TEXT;
  msg_index INTEGER;
  keywords TEXT[] := ARRAY[
    'idea', 'concept', 'plan', 'strategy', 'solution', 'approach',
    'design', 'feature', 'product', 'service', 'method', 'system',
    'framework', 'model', 'prototype', 'project', 'business',
    'startup', 'app', 'website', 'tool', 'process'
  ];
  save_triggers TEXT[] := ARRAY[
    'save this', 'remember this', 'keep track', 'organize this',
    'let me save', 'i want to save', 'capture this', 'record this'
  ];
  completion_indicators TEXT[] := ARRAY[
    'final version', 'complete plan', 'ready to implement',
    'this is the approach', 'let me finalize', 'here''s the summary'
  ];
BEGIN
  -- Analyze each message for save opportunities
  FOR msg_index IN 1..array_length(conversation_messages, 1) LOOP
    msg := conversation_messages[msg_index];
    
    -- Check for explicit save requests
    IF EXISTS (
      SELECT 1 FROM unnest(save_triggers) AS trigger
      WHERE position(trigger in lower(msg)) > 0
    ) THEN
      RETURN QUERY SELECT 
        msg_index,
        split_part(msg, ' ', 1) || ' ' || split_part(msg, ' ', 2) || '...' as suggested_title,
        msg as suggested_content,
        'General' as suggested_category,
        0.9 as confidence_score,
        ARRAY['explicit_save_request'] as trigger_keywords;
    END IF;
    
    -- Check for completion indicators
    IF EXISTS (
      SELECT 1 FROM unnest(completion_indicators) AS indicator
      WHERE position(indicator in lower(msg)) > 0
    ) AND char_length(msg) > 100 THEN
      RETURN QUERY SELECT 
        msg_index,
        split_part(msg, ' ', 1) || ' ' || split_part(msg, ' ', 2) || '...' as suggested_title,
        msg as suggested_content,
        determine_category_from_text(msg) as suggested_category,
        0.8 as confidence_score,
        ARRAY['completion_indicator'] as trigger_keywords;
    END IF;
    
    -- Check for idea-rich content
    IF (
      SELECT count(*) FROM unnest(keywords) AS keyword
      WHERE position(keyword in lower(msg)) > 0
    ) >= 3 AND char_length(msg) > 150 THEN
      RETURN QUERY SELECT 
        msg_index,
        split_part(msg, ' ', 1) || ' ' || split_part(msg, ' ', 2) || '...' as suggested_title,
        msg as suggested_content,
        determine_category_from_text(msg) as suggested_category,
        0.6 as confidence_score,
        ARRAY['keyword_density'] as trigger_keywords;
    END IF;
  END LOOP;
END;
$$;

-- Helper function to determine category from text content
CREATE OR REPLACE FUNCTION determine_category_from_text(content_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  lower_content TEXT := lower(content_text);
BEGIN
  IF position('business' in lower_content) > 0 OR position('startup' in lower_content) > 0 
     OR position('revenue' in lower_content) > 0 OR position('market' in lower_content) > 0 THEN
    RETURN 'Business';
  ELSIF position('app' in lower_content) > 0 OR position('software' in lower_content) > 0 
        OR position('code' in lower_content) > 0 OR position('api' in lower_content) > 0 THEN
    RETURN 'Technology';
  ELSIF position('design' in lower_content) > 0 OR position('art' in lower_content) > 0 
        OR position('creative' in lower_content) > 0 OR position('story' in lower_content) > 0 THEN
    RETURN 'Creative';
  ELSIF position('learn' in lower_content) > 0 OR position('study' in lower_content) > 0 
        OR position('course' in lower_content) > 0 OR position('skill' in lower_content) > 0 THEN
    RETURN 'Learning';
  ELSIF position('health' in lower_content) > 0 OR position('fitness' in lower_content) > 0 
        OR position('wellness' in lower_content) > 0 OR position('exercise' in lower_content) > 0 THEN
    RETURN 'Health & Wellness';
  ELSIF position('travel' in lower_content) > 0 OR position('trip' in lower_content) > 0 
        OR position('vacation' in lower_content) > 0 THEN
    RETURN 'Travel';
  ELSIF position('money' in lower_content) > 0 OR position('budget' in lower_content) > 0 
        OR position('investment' in lower_content) > 0 OR position('finance' in lower_content) > 0 THEN
    RETURN 'Finance';
  ELSIF position('productivity' in lower_content) > 0 OR position('workflow' in lower_content) > 0 
        OR position('efficiency' in lower_content) > 0 OR position('organize' in lower_content) > 0 THEN
    RETURN 'Productivity';
  ELSIF position('personal' in lower_content) > 0 OR position('growth' in lower_content) > 0 
        OR position('self' in lower_content) > 0 OR position('life' in lower_content) > 0 THEN
    RETURN 'Personal Growth';
  ELSE
    RETURN 'General';
  END IF;
END;
$$;

-- Function to create development history entry
CREATE OR REPLACE FUNCTION create_development_history(
  idea_id_input UUID,
  conversation_id_input UUID,
  user_id_input UUID,
  old_title TEXT,
  new_title TEXT,
  old_content TEXT,
  new_content TEXT,
  old_category TEXT,
  new_category TEXT,
  dev_type TEXT,
  summary_text TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  history_id UUID;
BEGIN
  INSERT INTO public.idea_development_history (
    idea_id, conversation_id, user_id,
    previous_title, new_title,
    previous_content, new_content,
    previous_category, new_category,
    development_type, change_summary
  ) VALUES (
    idea_id_input, conversation_id_input, user_id_input,
    old_title, new_title,
    old_content, new_content,
    old_category, new_category,
    dev_type, summary_text
  ) RETURNING id INTO history_id;
  
  RETURN history_id;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_idea_development_history_idea_id ON public.idea_development_history(idea_id);
CREATE INDEX idx_idea_development_history_conversation_id ON public.idea_development_history(conversation_id);
CREATE INDEX idx_conversation_continuity_user_id ON public.conversation_continuity(user_id);
CREATE INDEX idx_conversation_continuity_idea_id ON public.conversation_continuity(idea_id);
CREATE INDEX idx_smart_save_suggestions_conversation_id ON public.smart_save_suggestions(conversation_id);
CREATE INDEX idx_smart_save_suggestions_user_action ON public.smart_save_suggestions(user_action);
