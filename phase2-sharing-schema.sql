-- Phase 2: Idea Sharing System Schema
-- This adds sharing capabilities to the Poppy Idea Engine

-- Add visibility and sharing fields to ideas table
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),
ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_remixes BOOLEAN DEFAULT true;

-- Create index for faster public idea queries
CREATE INDEX IF NOT EXISTS idx_ideas_visibility ON public.ideas(visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_ideas_shared_with ON public.ideas USING GIN(shared_with) WHERE visibility = 'shared';

-- Idea shares table for granular sharing permissions
CREATE TABLE IF NOT EXISTS public.idea_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT, -- For sharing with users who haven't signed up yet
  permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit')),
  share_message TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(idea_id, shared_with_user_id),
  UNIQUE(idea_id, shared_with_email)
);

-- Comments on shared ideas
CREATE TABLE IF NOT EXISTS public.idea_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES public.idea_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Idea remixes/forks (when someone builds on a shared idea)
CREATE TABLE IF NOT EXISTS public.idea_remixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL NOT NULL,
  remixed_idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  remix_type TEXT DEFAULT 'fork' CHECK (remix_type IN ('fork', 'variation', 'expansion')),
  attribution_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(original_idea_id, remixed_idea_id)
);

-- Public idea discovery metadata
CREATE TABLE IF NOT EXISTS public.idea_discovery_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL UNIQUE,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  remix_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  trending_score FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Likes for public ideas
CREATE TABLE IF NOT EXISTS public.idea_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(idea_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.idea_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_discovery_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_likes ENABLE ROW LEVEL SECURITY;

-- Update existing ideas RLS policies to handle sharing
DROP POLICY IF EXISTS "Users can view own ideas" ON public.ideas;
CREATE POLICY "Users can view ideas they have access to" ON public.ideas
  FOR SELECT USING (
    auth.uid() = user_id -- Own ideas
    OR visibility = 'public' -- Public ideas
    OR auth.uid() = ANY(shared_with) -- Directly shared
    OR EXISTS ( -- Shared via idea_shares table
      SELECT 1 FROM public.idea_shares
      WHERE idea_shares.idea_id = ideas.id
      AND idea_shares.shared_with_user_id = auth.uid()
      AND (idea_shares.expires_at IS NULL OR idea_shares.expires_at > now())
    )
  );

-- Keep other existing policies
-- Users can still only create their own ideas
-- Users can only update/delete their own ideas

-- Policies for idea_shares
CREATE POLICY "Users can view shares for their ideas or shared with them" ON public.idea_shares
  FOR SELECT USING (
    auth.uid() = shared_by_user_id
    OR auth.uid() = shared_with_user_id
  );

CREATE POLICY "Users can create shares for their own ideas" ON public.idea_shares
  FOR INSERT WITH CHECK (
    auth.uid() = shared_by_user_id
    AND EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = idea_shares.idea_id
      AND ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own shares" ON public.idea_shares
  FOR UPDATE USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own shares" ON public.idea_shares
  FOR DELETE USING (auth.uid() = shared_by_user_id);

-- Policies for comments
CREATE POLICY "Users can view comments on accessible ideas" ON public.idea_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = idea_comments.idea_id
      AND (
        ideas.user_id = auth.uid()
        OR ideas.visibility = 'public'
        OR auth.uid() = ANY(ideas.shared_with)
        OR EXISTS (
          SELECT 1 FROM public.idea_shares
          WHERE idea_shares.idea_id = ideas.id
          AND idea_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible ideas" ON public.idea_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = idea_comments.idea_id
      AND ideas.allow_comments = true
      AND (
        ideas.user_id = auth.uid()
        OR ideas.visibility = 'public'
        OR auth.uid() = ANY(ideas.shared_with)
        OR EXISTS (
          SELECT 1 FROM public.idea_shares
          WHERE idea_shares.idea_id = ideas.id
          AND idea_shares.shared_with_user_id = auth.uid()
          AND idea_shares.permission_level IN ('comment', 'edit')
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON public.idea_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.idea_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for remixes
CREATE POLICY "Anyone can view remixes" ON public.idea_remixes
  FOR SELECT USING (true);

CREATE POLICY "Users can create remixes of accessible ideas" ON public.idea_remixes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ideas original
      WHERE original.id = idea_remixes.original_idea_id
      AND original.allow_remixes = true
      AND (
        original.visibility = 'public'
        OR original.user_id = auth.uid()
        OR auth.uid() = ANY(original.shared_with)
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.ideas remixed
      WHERE remixed.id = idea_remixes.remixed_idea_id
      AND remixed.user_id = auth.uid()
    )
  );

-- Policies for discovery stats
CREATE POLICY "Anyone can view discovery stats for public ideas" ON public.idea_discovery_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = idea_discovery_stats.idea_id
      AND ideas.visibility = 'public'
    )
  );

-- Policies for likes
CREATE POLICY "Users can view all likes" ON public.idea_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like public ideas" ON public.idea_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = idea_likes.idea_id
      AND ideas.visibility = 'public'
    )
  );

CREATE POLICY "Users can remove their own likes" ON public.idea_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update discovery stats
CREATE OR REPLACE FUNCTION update_idea_discovery_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'idea_comments' THEN
    UPDATE public.idea_discovery_stats
    SET comment_count = comment_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END,
        updated_at = now()
    WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id);
  ELSIF TG_TABLE_NAME = 'idea_likes' THEN
    UPDATE public.idea_discovery_stats
    SET like_count = like_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END,
        updated_at = now()
    WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id);
  ELSIF TG_TABLE_NAME = 'idea_remixes' THEN
    UPDATE public.idea_discovery_stats
    SET remix_count = remix_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END,
        updated_at = now()
    WHERE idea_id = COALESCE(NEW.original_idea_id, OLD.original_idea_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating stats
CREATE TRIGGER update_comment_stats
AFTER INSERT OR DELETE ON public.idea_comments
FOR EACH ROW EXECUTE FUNCTION update_idea_discovery_stats();

CREATE TRIGGER update_like_stats
AFTER INSERT OR DELETE ON public.idea_likes
FOR EACH ROW EXECUTE FUNCTION update_idea_discovery_stats();

CREATE TRIGGER update_remix_stats
AFTER INSERT OR DELETE ON public.idea_remixes
FOR EACH ROW EXECUTE FUNCTION update_idea_discovery_stats();

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_view_count INTEGER,
  p_like_count INTEGER,
  p_comment_count INTEGER,
  p_remix_count INTEGER,
  p_created_at TIMESTAMP WITH TIME ZONE
) RETURNS FLOAT AS $$
DECLARE
  age_hours FLOAT;
  interaction_score FLOAT;
  time_decay FLOAT;
BEGIN
  -- Calculate age in hours
  age_hours := EXTRACT(EPOCH FROM (now() - p_created_at)) / 3600.0;
  
  -- Calculate interaction score (weighted sum)
  interaction_score := 
    (p_view_count * 1.0) + 
    (p_like_count * 3.0) + 
    (p_comment_count * 5.0) + 
    (p_remix_count * 10.0);
  
  -- Apply time decay (ideas trend less as they age)
  time_decay := POWER(0.95, age_hours / 24.0); -- 5% decay per day
  
  RETURN interaction_score * time_decay;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_idea_shares_shared_with ON public.idea_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_idea ON public.idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_likes_idea ON public.idea_likes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_discovery_trending ON public.idea_discovery_stats(trending_score DESC);