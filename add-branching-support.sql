-- Add branching support to ideas table
-- Run this in Supabase SQL editor

-- Add columns for branching relationships
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS branched_from_id UUID REFERENCES ideas(id),
ADD COLUMN IF NOT EXISTS branch_note TEXT,
ADD COLUMN IF NOT EXISTS is_branch BOOLEAN DEFAULT false;

-- Add index for efficient branch queries
CREATE INDEX IF NOT EXISTS idx_ideas_branched_from ON ideas(branched_from_id);

-- Function to get idea family tree
CREATE OR REPLACE FUNCTION get_idea_family(p_idea_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  development_count INTEGER,
  branched_from_id UUID,
  branch_note TEXT,
  created_at TIMESTAMPTZ,
  relationship TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE idea_tree AS (
    -- Base case: the idea itself
    SELECT 
      i.id,
      i.title,
      i.development_count,
      i.branched_from_id,
      i.branch_note,
      i.created_at,
      'self'::TEXT as relationship
    FROM ideas i
    WHERE i.id = p_idea_id
    
    UNION ALL
    
    -- Recursive case: find all branches
    SELECT 
      i.id,
      i.title,
      i.development_count,
      i.branched_from_id,
      i.branch_note,
      i.created_at,
      'branch'::TEXT as relationship
    FROM ideas i
    INNER JOIN idea_tree it ON i.branched_from_id = it.id
  )
  SELECT * FROM idea_tree
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create a branched idea
CREATE OR REPLACE FUNCTION create_branched_idea(
  p_original_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_category TEXT,
  p_branch_note TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
BEGIN
  INSERT INTO ideas (
    user_id,
    title,
    content,
    category,
    branched_from_id,
    branch_note,
    is_branch,
    development_count
  ) VALUES (
    p_user_id,
    p_title,
    p_content,
    p_category,
    p_original_id,
    p_branch_note,
    true,
    1
  ) RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update idea_development_history to track branch events
ALTER TABLE idea_development_history
ADD COLUMN IF NOT EXISTS is_branch_point BOOLEAN DEFAULT false;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_idea_family(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_branched_idea(UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;