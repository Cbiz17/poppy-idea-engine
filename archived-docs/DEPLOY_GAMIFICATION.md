# Feedback Gamification Deployment Steps

## Step 1: Install Dependencies

```bash
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

## Step 2: Apply Database Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `/database/05-feedback-gamification.sql`
5. Run the query

This will:
- Add gamification fields to profiles table
- Create achievement tracking tables
- Set up automatic point calculation
- Create necessary database functions

## Step 3: Update Components

Replace the existing feedback component with the enhanced version:

1. Rename the current `/src/components/feedback/FeedbackComponent.tsx` to `FeedbackComponent.original.tsx`
2. Rename `/src/components/feedback/EnhancedFeedbackComponent.tsx` to `FeedbackComponent.tsx`

OR update the import in ChatMessage.tsx:

```typescript
// Change this:
import FeedbackComponent from '@/components/feedback/FeedbackComponent'

// To this:
import FeedbackComponent from '@/components/feedback/EnhancedFeedbackComponent'
```

## Step 4: Integrate Stats in ChatInterface

Update `/src/components/chat/ChatInterface.tsx`:

1. Add imports at the top:
```typescript
import { useFeedbackStats } from '@/hooks/useFeedbackStats'
import { UserFeedbackStats } from '@/components/feedback/UserFeedbackStats'
import { useAchievementNotifications } from '@/components/feedback/AchievementNotification'
```

2. Inside the component, add:
```typescript
const { stats, refreshStats } = useFeedbackStats({ user })
const { showAchievement, AchievementComponent } = useAchievementNotifications()
```

3. Add UserFeedbackStats before the main chat area:
```typescript
return (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">
    <ChatHeader ... />
    <UserFeedbackStats user={user} />  {/* Add this line */}
    
    {/* Rest of your UI */}
    
    <AchievementComponent />  {/* Add this at the end */}
  </div>
)
```

## Step 5: Update ChatMessage Component

In `/src/components/chat/components/ChatMessage.tsx`, pass stats to feedback:

```typescript
<FeedbackComponent 
  messageId={message.id} 
  userStats={stats ? {
    totalFeedback: stats.totalFeedback,
    currentStreak: stats.currentStreak,
    level: stats.level,
    pointsToNextLevel: stats.pointsToNextLevel
  } : undefined}
  onFeedbackSubmitted={async () => {
    await refreshStats()
    // Check for new achievements
    const response = await fetch('/api/feedback')
    const data = await response.json()
    if (data.newAchievements?.length > 0) {
      data.newAchievements.forEach((achievement: any) => {
        showAchievement({
          id: achievement,
          name: getAchievementName(achievement),
          description: getAchievementDescription(achievement),
          icon: getAchievementIcon(achievement)
        })
      })
    }
  }}
/>
```

## Step 6: Add Achievement Helpers

Add these helper functions to ChatInterface or a utils file:

```typescript
const getAchievementName = (id: string) => {
  const names: Record<string, string> = {
    'first-feedback': 'First Steps',
    'feedback-10': 'Helpful Human',
    'streak-3': 'Consistent Contributor',
    'streak-7': 'Week Warrior',
    'points-100': 'Point Collector',
    'points-500': 'XP Hunter',
    'points-1000': 'Master Trainer'
  }
  return names[id] || 'Achievement'
}

const getAchievementDescription = (id: string) => {
  const descriptions: Record<string, string> = {
    'first-feedback': 'Give your first feedback',
    'feedback-10': 'Give 10 pieces of feedback',
    'streak-3': 'Maintain a 3-day streak',
    'streak-7': 'Maintain a 7-day streak',
    'points-100': 'Earn 100 total points',
    'points-500': 'Earn 500 total points',
    'points-1000': 'Earn 1000 total points'
  }
  return descriptions[id] || 'New achievement unlocked!'
}

const getAchievementIcon = (id: string) => {
  const icons: Record<string, string> = {
    'first-feedback': 'star',
    'feedback-10': 'trophy',
    'streak-3': 'zap',
    'streak-7': 'fire',
    'points-100': 'coins',
    'points-500': 'gem',
    'points-1000': 'diamond'
  }
  return icons[id] || 'star'
}
```

## Step 7: Test the Implementation

1. Start your dev server: `npm run dev`
2. Open the chat interface
3. Send a message to Poppy
4. Click the feedback buttons on the response
5. You should see:
   - Points animation (+10 XP)
   - Level progress update
   - Streak tracking
   - Achievement notifications (if unlocked)

## Step 8: Verify Database Updates

Check in Supabase:
1. Look at the `profiles` table - should see `feedback_stats` column with data
2. Check `user_achievements` table for unlocked achievements
3. Check `feedback_rewards` table for point logs
4. Check `daily_feedback_streaks` for streak tracking

## Common Issues:

1. **"function does not exist" error**: The database schema wasn't applied correctly
2. **No points showing**: Check if the trigger was created properly
3. **Stats not updating**: Verify RLS policies are correct
4. **Achievements not unlocking**: Check if the achievement checking function is running

## Next Steps:

After basic implementation works:
- Customize point values
- Add more achievements
- Create special events (double XP weekends)
- Add leaderboards
- Create badges or visual rewards