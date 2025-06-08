-- Test script to check dynamic_prompts table permissions
-- Run this in Supabase SQL editor

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'dynamic_prompts'
);

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'dynamic_prompts';

-- Check if RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'dynamic_prompts';

-- Try to insert a test prompt (will fail if no insert policy)
-- This helps identify the exact permission issue
/*
INSERT INTO public.dynamic_prompts (
  prompt_type,
  prompt_content,
  prompt_version,
  performance_metrics,
  a_b_test_group,
  is_active
) VALUES (
  'system_message',
  'Test prompt content',
  999,
  '{"test": true}'::jsonb,
  'test',
  false
);
*/
