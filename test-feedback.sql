-- Check conversation messages
SELECT 
  id, 
  user_id, 
  conversation_id, 
  role, 
  substring(content, 1, 50) as content_preview,
  created_at
FROM conversation_messages
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'christian.a.butler@gmail.com')
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any feedback records
SELECT 
  mf.id,
  mf.user_id,
  mf.conversation_id,
  mf.message_id,
  mf.feedback_type,
  mf.feedback_value,
  mf.created_at,
  cm.role,
  substring(cm.content, 1, 30) as message_preview
FROM message_feedback mf
LEFT JOIN conversation_messages cm ON mf.message_id = cm.id
WHERE mf.user_id = (SELECT id FROM auth.users WHERE email = 'christian.a.butler@gmail.com')
ORDER BY mf.created_at DESC
LIMIT 10;

-- Check if message IDs are being saved correctly
SELECT 
  id,
  LENGTH(id) as id_length,
  CASE 
    WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID'
    ELSE 'Not UUID'
  END as id_format
FROM conversation_messages
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'christian.a.butler@gmail.com')
ORDER BY created_at DESC
LIMIT 10;
