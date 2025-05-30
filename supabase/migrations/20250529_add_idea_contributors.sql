-- Add contributors tracking to ideas
-- This migration adds the ability to track multiple contributors to ideas,
-- especially important when ideas are merged or collaboratively developed

-- Create the idea_contributors table
CREATE TABLE IF NOT EXISTS public.idea_contributors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('original', 'merge', 'edit', 'suggestion')),
  contributed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contribution_details JSONB, -- Optional metadata about the contribution
  UNIQUE(idea_id, user_id, contribution_type) -- Prevent duplicate contribution types per user per idea
);

-- Enable RLS
ALTER TABLE public.idea_contributors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view contributors of their ideas" ON public.idea_contributors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = idea_contributors.idea_id 
      AND ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add contributors to their ideas" ON public.idea_contributors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = idea_contributors.idea_id 
      AND ideas.user_id = auth.uid()
    )
  );

-- Function to add initial contributor when idea is created
CREATE OR REPLACE FUNCTION public.add_initial_contributor()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.idea_contributors (idea_id, user_id, contribution_type)
  VALUES (NEW.id, NEW.user_id, 'original')
  ON CONFLICT (idea_id, user_id, contribution_type) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add creator as original contributor
CREATE TRIGGER on_idea_created_add_contributor
  AFTER INSERT ON public.ideas
  FOR EACH ROW EXECUTE PROCEDURE public.add_initial_contributor();

-- Function to get contributors with profile info
CREATE OR REPLACE FUNCTION public.get_idea_contributors(p_idea_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  contribution_type TEXT,
  contributed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ic.user_id,
    p.email,
    p.full_name,
    p.avatar_url,
    ic.contribution_type,
    ic.contributed_at
  FROM public.idea_contributors ic
  JOIN public.profiles p ON p.id = ic.user_id
  WHERE ic.idea_id = p_idea_id
  ORDER BY ic.contributed_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get contributors for multiple ideas (batch)
CREATE OR REPLACE FUNCTION public.get_idea_contributors_batch(idea_ids UUID[])
RETURNS TABLE (
  idea_id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  contribution_type TEXT,
  contributed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ic.idea_id,
    ic.user_id,
    p.email,
    p.full_name,
    p.avatar_url,
    ic.contribution_type,
    ic.contributed_at
  FROM public.idea_contributors ic
  JOIN public.profiles p ON p.id = ic.user_id
  WHERE ic.idea_id = ANY(idea_ids)
  ORDER BY ic.idea_id, ic.contributed_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add contributors to existing ideas (migration step)
INSERT INTO public.idea_contributors (idea_id, user_id, contribution_type)
SELECT id, user_id, 'original' FROM public.ideas
ON CONFLICT (idea_id, user_id, contribution_type) DO NOTHING;

-- Index for performance
CREATE INDEX idx_idea_contributors_idea_id ON public.idea_contributors(idea_id);
CREATE INDEX idx_idea_contributors_user_id ON public.idea_contributors(user_id);
