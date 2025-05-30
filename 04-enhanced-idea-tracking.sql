-- Enhanced Idea Tracking Schema
-- Run this AFTER the existing schemas to add advanced idea development features

-- Add new columns to existing idea_development_history table
ALTER TABLE public.idea_development_history 
ADD COLUMN IF NOT EXISTS development_metadata JSONB,
ADD COLUMN IF NOT EXISTS parent_history_id UUID REFERENCES public.idea_development_history(id),
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS merge_source_id UUID,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS collaborator_ids UUID[],
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- Add development_count to ideas table for quick access
ALTER TABLE public.ideas
ADD COLUMN IF NOT EXISTS development_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_idea_history_version ON public.idea_development_history(idea_id, version_number);
CREATE INDEX IF NOT EXISTS idx_idea_history_branch ON public.idea_development_history(idea_id, branch_name);
CREATE INDEX IF NOT EXISTS idx_idea_history_parent ON public.idea_development_history(parent_history_id);
CREATE INDEX IF NOT EXISTS idx_ideas_archived ON public.ideas(archived, user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_activity ON public.ideas(last_activity DESC);

-- Function to update idea development count
CREATE OR REPLACE FUNCTION update_idea_development_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ideas 
  SET 
    development_count = (
      SELECT COUNT(*) 
      FROM public.idea_development_history 
      WHERE idea_id = NEW.idea_id
    ),
    last_activity = NOW()
  WHERE id = NEW.idea_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain development count
DROP TRIGGER IF EXISTS update_idea_count_trigger ON public.idea_development_history;
CREATE TRIGGER update_idea_count_trigger
AFTER INSERT ON public.idea_development_history
FOR EACH ROW
EXECUTE FUNCTION update_idea_development_count();

-- Function to get idea statistics
CREATE OR REPLACE FUNCTION get_idea_stats(p_user_id UUID)
RETURNS TABLE (
  total_ideas BIGINT,
  active_ideas BIGINT,
  archived_ideas BIGINT,
  total_developments BIGINT,
  ideas_this_week BIGINT,
  ideas_this_month BIGINT,
  most_active_category TEXT,
  avg_developments_per_idea NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(DISTINCT i.id) as total_ideas,
      COUNT(DISTINCT i.id) FILTER (WHERE NOT i.archived) as active_ideas,
      COUNT(DISTINCT i.id) FILTER (WHERE i.archived) as archived_ideas,
      COUNT(DISTINCT idh.id) as total_developments,
      COUNT(DISTINCT i.id) FILTER (WHERE i.created_at > NOW() - INTERVAL '7 days') as ideas_this_week,
      COUNT(DISTINCT i.id) FILTER (WHERE i.created_at > NOW() - INTERVAL '30 days') as ideas_this_month
    FROM public.ideas i
    LEFT JOIN public.idea_development_history idh ON i.id = idh.idea_id
    WHERE i.user_id = p_user_id
  ),
  category_stats AS (
    SELECT category, COUNT(*) as count
    FROM public.ideas
    WHERE user_id = p_user_id
    GROUP BY category
    ORDER BY count DESC
    LIMIT 1
  )
  SELECT 
    stats.total_ideas,
    stats.active_ideas,
    stats.archived_ideas,
    stats.total_developments,
    stats.ideas_this_week,
    stats.ideas_this_month,
    category_stats.category as most_active_category,
    CASE 
      WHEN stats.total_ideas > 0 
      THEN ROUND(stats.total_developments::NUMERIC / stats.total_ideas::NUMERIC, 2)
      ELSE 0
    END as avg_developments_per_idea
  FROM stats, category_stats;
END;
$$ LANGUAGE plpgsql;

-- View for idea version timeline
CREATE OR REPLACE VIEW idea_version_timeline AS
SELECT 
  idh.idea_id,
  idh.id as history_id,
  idh.version_number,
  idh.new_title as title,
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
GROUP BY idh.id, idh.idea_id, idh.version_number, idh.new_title, 
         idh.development_type, idh.change_summary, idh.created_at, 
         idh.user_id, idh.tags, idh.ai_confidence_score, 
         idh.parent_history_id, idh.branch_name;

-- Function to get complete idea history tree
CREATE OR REPLACE FUNCTION get_idea_history_tree(p_idea_id UUID)
RETURNS TABLE (
  history_id UUID,
  parent_id UUID,
  version_number INTEGER,
  branch_name TEXT,
  development_type TEXT,
  change_summary TEXT,
  created_at TIMESTAMPTZ,
  depth INTEGER,
  path TEXT[]
) AS $$
WITH RECURSIVE history_tree AS (
  -- Base case: root versions
  SELECT 
    id as history_id,
    parent_history_id as parent_id,
    version_number,
    COALESCE(branch_name, 'main') as branch_name,
    development_type,
    change_summary,
    created_at,
    0 as depth,
    ARRAY[id::text] as path
  FROM public.idea_development_history
  WHERE idea_id = p_idea_id AND parent_history_id IS NULL
  
  UNION ALL
  
  -- Recursive case: child versions
  SELECT 
    h.id as history_id,
    h.parent_history_id as parent_id,
    h.version_number,
    COALESCE(h.branch_name, ht.branch_name) as branch_name,
    h.development_type,
    h.change_summary,
    h.created_at,
    ht.depth + 1 as depth,
    ht.path || h.id::text as path
  FROM public.idea_development_history h
  INNER JOIN history_tree ht ON h.parent_history_id = ht.history_id
  WHERE h.idea_id = p_idea_id
)
SELECT * FROM history_tree
ORDER BY created_at DESC;
$$ LANGUAGE sql;

-- Update existing ideas to have development count
UPDATE public.ideas i
SET development_count = (
  SELECT COUNT(*) 
  FROM public.idea_development_history idh 
  WHERE idh.idea_id = i.id
)
WHERE development_count IS NULL;

-- Grant necessary permissions
GRANT SELECT ON idea_version_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION get_idea_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_idea_history_tree TO authenticated;
