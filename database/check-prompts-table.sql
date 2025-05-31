-- Quick check for dynamic_prompts table
-- Run this in Supabase SQL editor to verify the table exists

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'dynamic_prompts'
) as table_exists;

-- If the table doesn't exist, you need to run:
-- 1. self-improvement-schema.sql (creates the table)
-- 2. seed-dynamic-prompts.sql (adds initial data)

-- View existing prompts (if any)
SELECT * FROM dynamic_prompts 
WHERE prompt_type = 'system_message' 
ORDER BY created_at DESC;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dynamic_prompts'
ORDER BY ordinal_position;