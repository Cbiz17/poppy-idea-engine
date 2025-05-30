-- Ensure necessary columns exist for idea update tracking
-- Run this to make sure your database has the required columns

-- Add development_count and last_activity to ideas table if they don't exist
ALTER TABLE public.ideas
ADD COLUMN IF NOT EXISTS development_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update existing ideas to have their development count
UPDATE public.ideas i
SET development_count = (
  SELECT COUNT(*) 
  FROM public.idea_development_history idh 
  WHERE idh.idea_id = i.id
)
WHERE development_count = 0 OR development_count IS NULL;

-- Add conversation_id to idea_development_history if it doesn't exist
ALTER TABLE public.idea_development_history
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ideas_development_count ON public.ideas(development_count);
CREATE INDEX IF NOT EXISTS idx_ideas_last_activity ON public.ideas(last_activity DESC);
