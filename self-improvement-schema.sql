-- Self-Improvement System Schema for Poppy
-- This extends the existing database with feedback collection and learning capabilities

-- User Feedback on Messages (thumbs up/down, quality ratings)
CREATE TABLE public.message_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.conversation_messages(id) ON DELETE CASCADE NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'rating', 'explicit')),
  feedback_value INTEGER, -- 1-5 for ratings, 1/-1 for thumbs, null for explicit
  feedback_text TEXT, -- User's written feedback
  context_tags TEXT[], -- What aspect: 'helpful', 'accurate', 'creative', 'relevant', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Actions Tracking (saves, shares, returns to ideas, etc.)
CREATE TABLE public.user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'idea_saved', 'idea_shared', 'conversation_resumed', 'idea_edited', etc.
  action_metadata JSONB, -- Additional context about the action
  success_indicators JSONB, -- Metrics that indicate if this was successful
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversation Outcomes (did user achieve their goal?)
CREATE TABLE public.conversation_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outcome_type TEXT NOT NULL, -- 'goal_achieved', 'partially_achieved', 'abandoned', 'continued'
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  ideas_generated INTEGER DEFAULT 0,
  ideas_saved INTEGER DEFAULT 0,
  session_duration_minutes INTEGER,
  return_likelihood INTEGER CHECK (return_likelihood >= 1 AND return_likelihood <= 5), -- Would you return to this conversation?
  improvement_suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Learning Patterns (extracted insights from successful interactions)
CREATE TABLE public.learning_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL, -- 'prompt_technique', 'conversation_flow', 'categorization', 'summary_style'
  pattern_name TEXT NOT NULL,
  pattern_description TEXT NOT NULL,
  success_metrics JSONB NOT NULL, -- What makes this pattern successful
  example_conversations UUID[], -- Reference to conversations that demonstrate this pattern
  confidence_score FLOAT NOT NULL DEFAULT 0.5, -- How confident we are in this pattern
  usage_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0.0,
  embedding VECTOR(1536), -- For semantic similarity with new situations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Dynamic Prompts (system prompts that evolve based on learning)
CREATE TABLE public.dynamic_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_type TEXT NOT NULL, -- 'system_message', 'idea_extraction', 'categorization', 'summary_generation'
  prompt_version INTEGER NOT NULL DEFAULT 1,
  prompt_content TEXT NOT NULL,
  performance_metrics JSONB, -- Success rates, user satisfaction, etc.
  a_b_test_group TEXT, -- For testing different prompt variations
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- A/B Testing Framework
CREATE TABLE public.ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  test_description TEXT,
  test_type TEXT NOT NULL, -- 'prompt_variation', 'ui_flow', 'categorization_method'
  variants JSONB NOT NULL, -- Different versions being tested
  success_metric TEXT NOT NULL, -- What we're measuring
  target_sample_size INTEGER DEFAULT 100,
  current_sample_size INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  results JSONB, -- Statistical results when test completes
  winner_variant TEXT, -- Which variant performed best
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User Assignments to A/B Tests
CREATE TABLE public.user_test_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.ab_tests(id) ON DELETE CASCADE NOT NULL,
  variant_assigned TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, test_id)
);

-- Enable Row Level Security
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for feedback tables
CREATE POLICY "Users can manage own feedback" ON public.message_feedback
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own actions" ON public.user_actions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own outcomes" ON public.conversation_outcomes
  FOR ALL USING (auth.uid() = user_id);

-- Learning patterns are globally readable but only system can write
CREATE POLICY "Anyone can read learning patterns" ON public.learning_patterns
  FOR SELECT USING (true);

-- Dynamic prompts are globally readable
CREATE POLICY "Anyone can read active prompts" ON public.dynamic_prompts
  FOR SELECT USING (is_active = true);

-- A/B tests are globally readable
CREATE POLICY "Anyone can read active tests" ON public.ab_tests
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own test assignments" ON public.user_test_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for self-improvement

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

-- Indexes for performance
CREATE INDEX idx_message_feedback_user_id ON public.message_feedback(user_id);
CREATE INDEX idx_message_feedback_message_id ON public.message_feedback(message_id);
CREATE INDEX idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX idx_user_actions_type ON public.user_actions(action_type);
CREATE INDEX idx_conversation_outcomes_satisfaction ON public.conversation_outcomes(satisfaction_score);
CREATE INDEX idx_learning_patterns_type ON public.learning_patterns(pattern_type);
CREATE INDEX idx_dynamic_prompts_active ON public.dynamic_prompts(is_active, prompt_type);

-- Vector index for learning patterns
CREATE INDEX ON public.learning_patterns USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
