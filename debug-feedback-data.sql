-- Debug feedback data in Supabase
-- Run this to see what's actually in your database

-- 1. Check total feedback count and types
SELECT 
  COUNT(*) as total_count,
  feedback_type,
  feedback_value,
  COUNT(*) as type_count
FROM message_feedback
GROUP BY feedback_type, feedback_value
ORDER BY feedback_type, feedback_value;

-- 2. See recent feedback entries with details
SELECT 
  id,
  feedback_type,
  feedback_value,
  context_tags,
  created_at,
  conversation_id,
  message_id
FROM message_feedback
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check if we're joining correctly with messages
SELECT 
  mf.id,
  mf.feedback_type,
  mf.feedback_value,
  mf.created_at,
  cm.role,
  LEFT(cm.content, 100) as content_preview
FROM message_feedback mf
LEFT JOIN conversation_messages cm ON cm.id = mf.message_id
ORDER BY mf.created_at DESC
LIMIT 10;

-- 4. Summary stats that should match the UI
SELECT 
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN feedback_value >= 4 OR feedback_type = 'thumbs_up' THEN 1 END) as positive_feedback,
  COUNT(CASE WHEN feedback_value <= 2 OR feedback_type = 'thumbs_down' THEN 1 END) as negative_feedback,
  COUNT(CASE WHEN feedback_value IS NOT NULL THEN feedback_value END) as rated_feedback,
  AVG(CASE WHEN feedback_value IS NOT NULL THEN feedback_value END) as avg_rating
FROM message_feedback;
