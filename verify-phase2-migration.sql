-- Verification Query for Phase 2 Migration

-- 1. Check if new columns were added to ideas table
SELECT 'New columns in ideas table:' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ideas' 
AND column_name IN ('visibility', 'shared_with', 'share_token', 'allow_comments', 'allow_remixes');

-- 2. Check if new tables were created
SELECT '---' as separator;
SELECT 'New tables created:' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('idea_shares', 'idea_comments', 'idea_remixes', 'idea_discovery_stats', 'idea_likes')
ORDER BY table_name;

-- 3. Check if RLS policies were created
SELECT '---' as separator;
SELECT 'RLS policies for sharing:' as check_type;
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('ideas', 'idea_shares', 'idea_comments', 'idea_likes')
ORDER BY tablename, policyname;

-- 4. Check if functions were created
SELECT '---' as separator;
SELECT 'Functions created:' as check_type;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_idea_discovery_stats', 'calculate_trending_score', 'increment_view_count');

-- 5. Check if triggers were created
SELECT '---' as separator;
SELECT 'Triggers created:' as check_type;
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN ('update_comment_stats', 'update_like_stats', 'update_remix_stats');