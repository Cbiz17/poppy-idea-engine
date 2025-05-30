-- Function to increment view count for public ideas
CREATE OR REPLACE FUNCTION increment_view_count(p_idea_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Only increment if the idea is public
  IF EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE id = p_idea_id AND visibility = 'public'
  ) THEN
    -- Upsert the discovery stats
    INSERT INTO public.idea_discovery_stats (idea_id, view_count, last_viewed_at)
    VALUES (p_idea_id, 1, NOW())
    ON CONFLICT (idea_id) 
    DO UPDATE SET 
      view_count = idea_discovery_stats.view_count + 1,
      last_viewed_at = NOW(),
      updated_at = NOW();
      
    -- Update trending score
    UPDATE public.idea_discovery_stats
    SET trending_score = calculate_trending_score(
      view_count,
      like_count,
      comment_count,
      remix_count,
      created_at
    )
    WHERE idea_id = p_idea_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_view_count TO authenticated;