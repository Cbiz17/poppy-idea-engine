-- Feedback Gamification Schema
-- This adds gamification elements to encourage more user feedback

-- Add gamification columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feedback_stats JSONB DEFAULT '{
  "totalPoints": 0,
  "currentLevel": 1,
  "currentStreak": 0,
  "longestStreak": 0,
  "lastFeedbackDate": null,
  "totalFeedbackCount": 0
}'::jsonb;

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create feedback rewards log
CREATE TABLE IF NOT EXISTS feedback_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_feedback_id UUID REFERENCES message_feedback(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  reward_type TEXT NOT NULL, -- 'base', 'streak_bonus', 'quality_bonus', 'milestone'
  reward_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily feedback streaks table for efficient streak calculation
CREATE TABLE IF NOT EXISTS daily_feedback_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  feedback_count INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rewards_user_id ON feedback_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_feedback_streaks_user_date ON daily_feedback_streaks(user_id, date DESC);

-- RLS Policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_feedback_streaks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own rewards
CREATE POLICY "Users can view own rewards" ON feedback_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewards" ON feedback_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own streaks
CREATE POLICY "Users can view own streaks" ON daily_feedback_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage streaks" ON daily_feedback_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Function to calculate and update user feedback stats
CREATE OR REPLACE FUNCTION update_user_feedback_stats(p_user_id UUID, p_points_earned INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_current_stats JSONB;
  v_last_feedback_date DATE;
  v_today DATE;
  v_new_streak INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current stats
  SELECT feedback_stats INTO v_current_stats
  FROM profiles
  WHERE id = p_user_id;
  
  v_today := CURRENT_DATE;
  v_last_feedback_date := (v_current_stats->>'lastFeedbackDate')::DATE;
  
  -- Calculate new streak
  IF v_last_feedback_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_feedback_date = v_today THEN
    v_new_streak := (v_current_stats->>'currentStreak')::INTEGER;
  ELSIF v_last_feedback_date = v_today - INTERVAL '1 day' THEN
    v_new_streak := (v_current_stats->>'currentStreak')::INTEGER + 1;
  ELSE
    v_new_streak := 1;
  END IF;
  
  -- Update stats
  v_current_stats := jsonb_set(v_current_stats, '{totalPoints}', 
    to_jsonb((v_current_stats->>'totalPoints')::INTEGER + p_points_earned));
  v_current_stats := jsonb_set(v_current_stats, '{currentStreak}', to_jsonb(v_new_streak));
  v_current_stats := jsonb_set(v_current_stats, '{longestStreak}', 
    to_jsonb(GREATEST((v_current_stats->>'longestStreak')::INTEGER, v_new_streak)));
  v_current_stats := jsonb_set(v_current_stats, '{lastFeedbackDate}', to_jsonb(v_today));
  v_current_stats := jsonb_set(v_current_stats, '{totalFeedbackCount}', 
    to_jsonb((v_current_stats->>'totalFeedbackCount')::INTEGER + 1));
  
  -- Calculate new level (100 points per level)
  v_new_level := ((v_current_stats->>'totalPoints')::INTEGER / 100) + 1;
  v_current_stats := jsonb_set(v_current_stats, '{currentLevel}', to_jsonb(v_new_level));
  
  -- Update profile
  UPDATE profiles
  SET feedback_stats = v_current_stats
  WHERE id = p_user_id;
  
  -- Update daily streak record
  INSERT INTO daily_feedback_streaks (user_id, date, feedback_count, points_earned)
  VALUES (p_user_id, v_today, 1, p_points_earned)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    feedback_count = daily_feedback_streaks.feedback_count + 1,
    points_earned = daily_feedback_streaks.points_earned + p_points_earned;
  
  RETURN v_current_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS TABLE(new_achievements TEXT[]) AS $$
DECLARE
  v_stats JSONB;
  v_new_achievements TEXT[] := '{}';
  v_total_points INTEGER;
  v_total_feedback INTEGER;
  v_current_streak INTEGER;
BEGIN
  -- Get current stats
  SELECT feedback_stats INTO v_stats
  FROM profiles
  WHERE id = p_user_id;
  
  v_total_points := (v_stats->>'totalPoints')::INTEGER;
  v_total_feedback := (v_stats->>'totalFeedbackCount')::INTEGER;
  v_current_streak := (v_stats->>'currentStreak')::INTEGER;
  
  -- Check achievements
  -- First feedback
  IF v_total_feedback >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'first-feedback')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    IF FOUND THEN
      v_new_achievements := array_append(v_new_achievements, 'first-feedback');
    END IF;
  END IF;
  
  -- 10 feedback
  IF v_total_feedback >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'feedback-10')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    IF FOUND THEN
      v_new_achievements := array_append(v_new_achievements, 'feedback-10');
    END IF;
  END IF;
  
  -- 3-day streak
  IF v_current_streak >= 3 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'streak-3')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    IF FOUND THEN
      v_new_achievements := array_append(v_new_achievements, 'streak-3');
    END IF;
  END IF;
  
  -- 7-day streak
  IF v_current_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'streak-7')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    IF FOUND THEN
      v_new_achievements := array_append(v_new_achievements, 'streak-7');
    END IF;
  END IF;
  
  -- Points milestones
  IF v_total_points >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'points-100')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    IF FOUND THEN
      v_new_achievements := array_append(v_new_achievements, 'points-100');
    END IF;
  END IF;
  
  IF v_total_points >= 500 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'points-500')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    IF FOUND THEN
      v_new_achievements := array_append(v_new_achievements, 'points-500');
    END IF;
  END IF;
  
  IF v_total_points >= 1000 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'points-1000')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    IF FOUND THEN
      v_new_achievements := array_append(v_new_achievements, 'points-1000');
    END IF;
  END IF;
  
  RETURN QUERY SELECT v_new_achievements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats when feedback is given
CREATE OR REPLACE FUNCTION handle_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
  v_points INTEGER;
  v_updated_stats JSONB;
  v_new_achievements TEXT[];
BEGIN
  -- Calculate base points (this would match the frontend calculation)
  v_points := 10; -- Base points
  
  IF NEW.feedback_type = 'rating' THEN
    v_points := 20 + COALESCE(NEW.feedback_value, 0) * 2;
  END IF;
  
  IF array_length(NEW.context_tags, 1) > 0 THEN
    v_points := v_points + array_length(NEW.context_tags, 1) * 5;
  END IF;
  
  IF length(NEW.feedback_text) > 20 THEN
    v_points := v_points + 15;
  END IF;
  
  -- Update user stats
  v_updated_stats := update_user_feedback_stats(NEW.user_id, v_points);
  
  -- Log the reward
  INSERT INTO feedback_rewards (user_id, message_feedback_id, points_earned, reward_type, reward_metadata)
  VALUES (NEW.user_id, NEW.id, v_points, 'base', jsonb_build_object(
    'feedback_type', NEW.feedback_type,
    'has_tags', array_length(NEW.context_tags, 1) > 0,
    'has_text', length(NEW.feedback_text) > 20
  ));
  
  -- Check for new achievements
  SELECT * INTO v_new_achievements FROM check_and_award_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_feedback_created ON message_feedback;
CREATE TRIGGER on_feedback_created
  AFTER INSERT ON message_feedback
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_feedback();

-- Helper function to get user's current stats and achievements
CREATE OR REPLACE FUNCTION get_user_feedback_gamification_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'stats', p.feedback_stats,
    'achievements', COALESCE(
      json_agg(DISTINCT 
        json_build_object(
          'id', ua.achievement_id,
          'unlockedAt', ua.unlocked_at,
          'progress', ua.progress
        )
      ) FILTER (WHERE ua.achievement_id IS NOT NULL), 
      '[]'::json
    ),
    'recentRewards', COALESCE(
      json_agg(DISTINCT
        json_build_object(
          'points', fr.points_earned,
          'type', fr.reward_type,
          'createdAt', fr.created_at
        ) ORDER BY fr.created_at DESC
      ) FILTER (WHERE fr.id IS NOT NULL),
      '[]'::json
    )
  ) INTO v_result
  FROM profiles p
  LEFT JOIN user_achievements ua ON ua.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT * FROM feedback_rewards 
    WHERE user_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 10
  ) fr ON true
  WHERE p.id = p_user_id
  GROUP BY p.id, p.feedback_stats;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;