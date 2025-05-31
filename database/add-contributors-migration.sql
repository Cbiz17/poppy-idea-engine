-- Database Migration: Add Contributors Tracking to Ideas
-- Run this in your Supabase SQL editor

-- Add contributors tracking to ideas table
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS contributors jsonb DEFAULT '[]';

-- Create idea_contributors table for better relational tracking
CREATE TABLE IF NOT EXISTS idea_contributors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL DEFAULT 'original', -- 'original', 'merge', 'edit'
  contributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_idea_contributors_idea_id ON idea_contributors(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_contributors_user_id ON idea_contributors(user_id);

-- Create a view to easily get idea with contributors
CREATE OR REPLACE VIEW ideas_with_contributors AS
SELECT 
  i.*,
  COALESCE(
    json_agg(
      json_build_object(
        'user_id', ic.user_id,
        'email', u.email,
        'full_name', u.raw_user_meta_data->>'full_name',
        'avatar_url', u.raw_user_meta_data->>'avatar_url',
        'contribution_type', ic.contribution_type,
        'contributed_at', ic.contributed_at
      ) ORDER BY ic.contributed_at
    ) FILTER (WHERE ic.user_id IS NOT NULL),
    '[]'::json
  ) AS contributors
FROM ideas i
LEFT JOIN idea_contributors ic ON i.id = ic.idea_id
LEFT JOIN auth.users u ON ic.user_id = u.id
GROUP BY i.id;

-- Migrate existing data: Add current owners as original contributors
INSERT INTO idea_contributors (idea_id, user_id, contribution_type)
SELECT id, user_id, 'original' 
FROM ideas
ON CONFLICT DO NOTHING;
