-- Run this THIRD to add missing RPC functions for the RAG system
-- Copy and paste this entire file into your Supabase SQL Editor

-- Function to get active system prompt based on user's context
CREATE OR REPLACE FUNCTION get_dynamic_system_prompt(
  user_context TEXT DEFAULT 'general',
  conversation_type TEXT DEFAULT 'idea_development'
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  prompt_text TEXT;
BEGIN
  SELECT prompt_content INTO prompt_text
  FROM public.dynamic_prompts
  WHERE prompt_type = 'system_message'
    AND is_active = true
    AND (performance_metrics->>'success_rate')::float > 0.7
  ORDER BY (performance_metrics->>'success_rate')::float DESC
  LIMIT 1;
  
  -- Fallback to default if no good dynamic prompt exists
  IF prompt_text IS NULL THEN
    prompt_text := 'You are Claude, an AI assistant for the Poppy Idea Engine. Your goal is to help users explore, develop, and organize their ideas. Be insightful, encouraging, and help them break down complex thoughts into actionable concepts.';
  END IF;
  
  RETURN prompt_text;
END;
$$;

-- Function to search learning patterns (needed by chat-enhanced API)
CREATE OR REPLACE FUNCTION match_learning_patterns(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  pattern_name TEXT,
  pattern_description TEXT,
  confidence_score FLOAT,
  usage_count INTEGER,
  success_rate FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id,
    lp.pattern_name,
    lp.pattern_description,
    lp.confidence_score,
    lp.usage_count,
    lp.success_rate,
    1 - (lp.embedding <=> query_embedding) AS similarity
  FROM public.learning_patterns AS lp
  WHERE lp.embedding IS NOT NULL
    AND 1 - (lp.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

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
BEGIN
  -- Combine recent messages for context analysis
  message_text := array_to_string(current_messages, ' ');
  
  -- Search for semantically similar ideas using text matching
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
      position(lower(message_text) in lower(i.content)) > 0
    )
  ORDER BY confidence_score DESC
  LIMIT 3;
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

-- Function to analyze conversation success patterns
CREATE OR REPLACE FUNCTION analyze_conversation_patterns()
RETURNS TABLE (
  pattern_type TEXT,
  success_indicators JSONB,
  frequency INTEGER,
  avg_satisfaction FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'high_satisfaction' as pattern_type,
    jsonb_build_object(
      'common_keywords', array_agg(DISTINCT substring(cm.content from 1 for 50)),
      'avg_message_length', avg(length(cm.content)),
      'conversation_length', avg(message_count)
    ) as success_indicators,
    count(*)::integer as frequency,
    avg(co.satisfaction_score) as avg_satisfaction
  FROM public.conversation_outcomes co
  JOIN public.conversations c ON c.id = co.conversation_id
  JOIN (
    SELECT 
      conversation_id, 
      count(*) as message_count,
      string_agg(content, ' ') as full_content
    FROM public.conversation_messages 
    GROUP BY conversation_id
  ) conv_stats ON conv_stats.conversation_id = c.id
  JOIN public.conversation_messages cm ON cm.conversation_id = c.id AND cm.role = 'assistant'
  WHERE co.satisfaction_score >= 4
  GROUP BY co.satisfaction_score
  HAVING count(*) >= 5;
END;
$$;

-- Create vector indexes for learning patterns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'learning_patterns' 
    AND indexname LIKE '%embedding%'
  ) THEN
    CREATE INDEX ON public.learning_patterns USING hnsw (embedding vector_cosine_ops) 
    WITH (m = 16, ef_construction = 64);
  END IF;
END $$;
