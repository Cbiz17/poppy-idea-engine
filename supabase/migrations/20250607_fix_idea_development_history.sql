-- Fix idea_development_history table schema issues
-- This migration addresses multiple issues:
-- 1. Adds missing JSONB columns (previous_version, new_version)
-- 2. Creates proper enum type with all needed values
-- 3. Converts development_type from text to enum
-- 4. Migrates existing data to new format

-- Step 1: Drop dependent views if they exist
DROP VIEW IF EXISTS idea_version_timeline CASCADE;

-- Step 2: Add new JSONB columns if they don't exist
ALTER TABLE public.idea_development_history 
ADD COLUMN IF NOT EXISTS previous_version JSONB,
ADD COLUMN IF NOT EXISTS new_version JSONB;

-- Step 3: Migrate existing data to JSONB format
UPDATE public.idea_development_history
SET 
  previous_version = jsonb_build_object(
    'title', COALESCE(previous_title, ''),
    'content', COALESCE(previous_content, ''),
    'category', 'uncategorized',
    'timestamp', created_at::text
  ),
  new_version = jsonb_build_object(
    'title', COALESCE(new_title, ''),
    'content', COALESCE(new_content, ''),
    'category', 'uncategorized',
    'timestamp', created_at::text
  )
WHERE previous_version IS NULL OR new_version IS NULL;

-- Step 4: Create the enum type with all needed values (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'development_type') THEN
        CREATE TYPE development_type AS ENUM (
            'refinement',
            'expansion',
            'pivot',
            'merge',
            'major_revision',
            'branch',
            'branch_creation',
            'initial_creation'
        );
    ELSE
        -- Add missing values to existing enum
        BEGIN
            ALTER TYPE development_type ADD VALUE IF NOT EXISTS 'branch_creation';
        EXCEPTION
            WHEN others THEN NULL;
        END;
        BEGIN
            ALTER TYPE development_type ADD VALUE IF NOT EXISTS 'initial_creation';
        EXCEPTION
            WHEN others THEN NULL;
        END;
    END IF;
END$$;

-- Step 5: Update any invalid development_type values before conversion
UPDATE public.idea_development_history
SET development_type = 'refinement'
WHERE development_type NOT IN ('refinement', 'expansion', 'pivot', 'merge', 'major_revision', 'branch', 'branch_creation', 'initial_creation');

-- Step 6: Convert development_type column from text to enum
-- First, create a temporary column
ALTER TABLE public.idea_development_history 
ADD COLUMN IF NOT EXISTS development_type_enum development_type;

-- Copy and convert the data
UPDATE public.idea_development_history
SET development_type_enum = development_type::development_type;

-- Drop the old column and rename the new one
ALTER TABLE public.idea_development_history 
DROP COLUMN IF EXISTS development_type;

ALTER TABLE public.idea_development_history 
RENAME COLUMN development_type_enum TO development_type;

-- Step 7: Recreate the view with updated schema
CREATE OR REPLACE VIEW idea_version_timeline AS
SELECT 
  idh.idea_id,
  idh.id as history_id,
  idh.version_number,
  COALESCE(idh.new_version->>'title', idh.new_title, '') as title,
  idh.development_type,
  idh.change_summary,
  idh.created_at,
  idh.user_id,
  idh.tags,
  idh.ai_confidence_score,
  CASE 
    WHEN idh.parent_history_id IS NULL THEN 'main'
    ELSE COALESCE(idh.branch_name, 'branch')
  END as branch,
  COUNT(child.id) as child_versions
FROM public.idea_development_history idh
LEFT JOIN public.idea_development_history child ON child.parent_history_id = idh.id
GROUP BY idh.id, idh.idea_id, idh.version_number, idh.new_version, idh.new_title,
         idh.development_type, idh.change_summary, idh.created_at, 
         idh.user_id, idh.tags, idh.ai_confidence_score, 
         idh.parent_history_id, idh.branch_name;

-- Step 8: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_idea_history_jsonb ON public.idea_development_history USING GIN (previous_version, new_version);

-- Step 9: Grant permissions
GRANT SELECT ON idea_version_timeline TO authenticated;

-- Step 10: Drop old columns (optional - only after confirming migration worked)
-- Uncomment these lines after verifying the migration succeeded
-- ALTER TABLE public.idea_development_history 
-- DROP COLUMN IF EXISTS previous_title,
-- DROP COLUMN IF EXISTS new_title,
-- DROP COLUMN IF EXISTS previous_content,
-- DROP COLUMN IF EXISTS new_content;
