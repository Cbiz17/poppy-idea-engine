-- Fix idea_development_history columns to match enhanced tracking
-- This migration ensures all columns from 04-enhanced-idea-tracking.sql are present

-- Add missing columns to idea_development_history if they don't exist
ALTER TABLE public.idea_development_history 
ADD COLUMN IF NOT EXISTS development_metadata JSONB,
ADD COLUMN IF NOT EXISTS parent_history_id UUID REFERENCES public.idea_development_history(id),
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS merge_source_id UUID,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS collaborator_ids UUID[],
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- Add columns for storing the actual content versions (if missing)
ALTER TABLE public.idea_development_history
ADD COLUMN IF NOT EXISTS previous_title TEXT,
ADD COLUMN IF NOT EXISTS new_title TEXT,
ADD COLUMN IF NOT EXISTS previous_content TEXT,
ADD COLUMN IF NOT EXISTS new_content TEXT,
ADD COLUMN IF NOT EXISTS previous_category TEXT,
ADD COLUMN IF NOT EXISTS new_category TEXT;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_idea_history_version ON public.idea_development_history(idea_id, version_number);
CREATE INDEX IF NOT EXISTS idx_idea_history_branch ON public.idea_development_history(idea_id, branch_name);
CREATE INDEX IF NOT EXISTS idx_idea_history_parent ON public.idea_development_history(parent_history_id);

-- Add development_type 'branch' to the enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'branch' 
        AND enumtypid = (
            SELECT oid FROM pg_type 
            WHERE typname = 'development_type'
        )
    ) THEN
        ALTER TYPE development_type ADD VALUE 'branch';
    END IF;
END $$;

-- Add comments for clarity
COMMENT ON COLUMN public.idea_development_history.development_metadata IS 'Additional metadata about the development';
COMMENT ON COLUMN public.idea_development_history.parent_history_id IS 'Reference to parent version for branching';
COMMENT ON COLUMN public.idea_development_history.branch_name IS 'Name of the branch if this is a branched version';
COMMENT ON COLUMN public.idea_development_history.version_number IS 'Sequential version number for this idea';
