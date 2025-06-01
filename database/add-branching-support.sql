-- Add branching support to ideas table
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS branched_from_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_note TEXT,
ADD COLUMN IF NOT EXISTS is_branch BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS development_count INTEGER DEFAULT 0;

-- Add index for finding branches
CREATE INDEX IF NOT EXISTS idx_ideas_branched_from ON public.ideas(branched_from_id) WHERE branched_from_id IS NOT NULL;

-- Add visibility columns for sharing (while we're updating the schema)
ALTER TABLE public.ideas
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

-- Update RLS policies to handle branches properly
-- Users can view ideas they own OR ideas that are public
DROP POLICY IF EXISTS "Users can view own ideas" ON public.ideas;
CREATE POLICY "Users can view own or public ideas" ON public.ideas
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

-- Add comment for clarity
COMMENT ON COLUMN public.ideas.branched_from_id IS 'References the parent idea if this idea was branched';
COMMENT ON COLUMN public.ideas.branch_note IS 'Note explaining why this idea was branched';
COMMENT ON COLUMN public.ideas.is_branch IS 'True if this idea was created as a branch from another';
COMMENT ON COLUMN public.ideas.development_count IS 'Number of times this idea has been updated/developed';
COMMENT ON COLUMN public.ideas.is_public IS 'Whether this idea is publicly visible';
COMMENT ON COLUMN public.ideas.share_token IS 'Unique token for sharing private ideas';
