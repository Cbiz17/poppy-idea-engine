-- Insert initial learning patterns to bootstrap the self-improvement system

-- Pattern 1: Detailed Idea Development
INSERT INTO public.learning_patterns (
  pattern_type,
  pattern_name,
  pattern_description,
  success_metrics,
  confidence_score,
  usage_count,
  success_rate
) VALUES (
  'conversation_flow',
  'Detailed Idea Development',
  'When users discuss ideas, provide structured responses that break down concepts into components, identify implementation steps, and suggest enhancements. Use numbered lists and clear organization.',
  '{
    "success_factors": ["structured_response", "actionable_steps", "clear_organization"],
    "recommended_usage": "when users are developing business or creative ideas",
    "avg_satisfaction": 4.5,
    "response_structure": "numbered_lists_with_detailed_explanations"
  }',
  0.8,
  0,
  0.85
);

-- Pattern 2: Encouraging Tone
INSERT INTO public.learning_patterns (
  pattern_type,
  pattern_name,
  pattern_description,
  success_metrics,
  confidence_score,
  usage_count,
  success_rate
) VALUES (
  'prompt_technique',
  'Encouraging and Supportive Tone',
  'Use encouraging language that validates user ideas while providing constructive suggestions. Phrases like "That''s a great starting point" and "Building on that idea" work well.',
  '{
    "success_factors": ["positive_validation", "constructive_feedback", "collaborative_language"],
    "recommended_usage": "when users are sharing early-stage or uncertain ideas",
    "key_phrases": ["great starting point", "building on that", "I love how you", "that could work really well"],
    "avg_satisfaction": 4.3
  }',
  0.75,
  0,
  0.82
);

-- Pattern 3: Question-Driven Exploration
INSERT INTO public.learning_patterns (
  pattern_type,
  pattern_name,
  pattern_description,
  success_metrics,
  confidence_score,
  usage_count,
  success_rate
) VALUES (
  'conversation_flow',
  'Question-Driven Exploration',
  'When helping users explore ideas, ask targeted questions that help them think deeper. End responses with 1-2 thoughtful questions that guide further development.',
  '{
    "success_factors": ["targeted_questions", "thought_provoking", "guided_exploration"],
    "recommended_usage": "when users need help expanding or refining their ideas",
    "question_types": ["implementation_focused", "user_needs", "potential_challenges"],
    "avg_satisfaction": 4.4
  }',
  0.7,
  0,
  0.78
);

-- Insert an initial dynamic prompt
INSERT INTO public.dynamic_prompts (
  prompt_type,
  prompt_version,
  prompt_content,
  performance_metrics,
  is_active
) VALUES (
  'system_message',
  1,
  'You are Claude, an AI assistant for the Poppy Idea Engine specialized in helping users develop and organize their ideas. Focus on:

1. Breaking down complex ideas into actionable components
2. Asking thoughtful questions that guide deeper exploration
3. Providing structured, organized responses with clear next steps
4. Using encouraging language that validates user creativity
5. Suggesting practical implementation approaches

Be insightful, encouraging, and help users transform abstract thoughts into concrete, actionable ideas. Structure your responses clearly and end with questions that promote further development.',
  '{
    "success_rate": 0.75,
    "user_satisfaction": 4.2,
    "ideas_saved_rate": 0.65,
    "average_response_rating": 4.1
  }',
  true
);

-- Create a sample A/B test for system prompts
INSERT INTO public.ab_tests (
  test_name,
  test_description,
  test_type,
  variants,
  success_metric,
  target_sample_size,
  is_active
) VALUES (
  'System Prompt Tone Test',
  'Testing whether encouraging vs analytical tone works better for idea development',
  'prompt_variation',
  '{
    "encouraging": "Focus on validation and positive reinforcement while providing guidance",
    "analytical": "Focus on logical breakdown and systematic analysis of ideas"
  }',
  'user_satisfaction_score',
  50,
  true
);
