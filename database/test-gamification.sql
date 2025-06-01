-- Test the gamification system
-- Run this after applying the main schema to verify everything works

-- 1. Check if tables were created
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_achievements'
) as achievements_table_exists,
EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'feedback_rewards'
) as rewards_table_exists,
EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'daily_feedback_streaks'
) as streaks_table_exists;

-- 2. Check if feedback_stats column was added to profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'feedback_stats';

-- 3. Test the functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'update_user_feedback_stats',
  'check_and_award_achievements',
  'handle_new_feedback',
  'get_user_feedback_gamification_data'
);

-- 4. Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_feedback_created';

-- 5. Test the gamification data function (replace with your user ID)
-- SELECT get_user_feedback_gamification_data('YOUR_USER_ID_HERE');

-- If all checks pass, the gamification system is ready!