# 🎮 Deploy Feedback Gamification - Quick Guide

## Current Status

The feedback gamification system is **built but not deployed** to the database. The code is ready and waiting for the schema to be applied.

## What Will Happen When Deployed

- ✨ **XP Points** - Users earn points for every feedback (10-50 XP based on quality)
- 🏆 **Achievements** - Unlock badges for milestones (first feedback, streaks, etc.)
- 📈 **Levels** - Progress through levels (100 XP per level)
- 🔥 **Streaks** - Track daily feedback streaks
- 📊 **Stats Bar** - Shows current level, XP, and achievements in the UI

## Deployment Steps (5 minutes)

### 1. Check Current Status

First, verify if gamification is already deployed:

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Run this query:

```sql
-- Quick check if gamification is deployed
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'user_achievements'
) as gamification_deployed;
```

If it returns `false`, continue with deployment.

### 2. Deploy the Schema

1. In SQL Editor, click "New query"
2. Copy the contents of `database/05-feedback-gamification.sql`
3. Paste and click "Run"

### 3. Verify Deployment

Run the verification script:

1. Copy contents of `database/check-gamification-status.sql`
2. Run in SQL Editor
3. You should see all green checkmarks ✅

### 4. Test It Out

1. Visit your app
2. Start a chat with Poppy
3. Give feedback (thumbs up/down)
4. You should see:
   - Points animation (+10 XP)
   - Stats bar showing Level 1
   - Achievement unlocked for first feedback

## Troubleshooting

### If deployment fails:

- Check that all prerequisite tables exist (profiles, message_feedback)
- Make sure you're running as an admin user
- Try running the schema in smaller chunks

### If stats don't show:

- Hard refresh the page (Ctrl+Shift+R)
- Check browser console for errors
- Verify the schema was applied correctly

## What's Next?

Once deployed, the system will:

- Automatically track all feedback
- Award points and achievements
- Update user levels and streaks
- Show progress in the UI

The more users give feedback, the better Poppy's AI becomes!

## Monitor Usage

After deployment, monitor the system with:

```sql
-- See recent feedback with points
SELECT
  points_earned,
  reward_type,
  created_at
FROM feedback_rewards
ORDER BY created_at DESC
LIMIT 10;

-- Check user stats
SELECT
  email,
  feedback_stats->>'totalPoints' as xp,
  feedback_stats->>'currentLevel' as level
FROM profiles
WHERE feedback_stats IS NOT NULL
ORDER BY (feedback_stats->>'totalPoints')::int DESC;
```

Ready to deploy? Let's make feedback fun! 🚀
