#!/usr/bin/env node

/**
 * Deploy Gamification Schema Helper
 * This script guides you through applying the feedback gamification schema
 */

const fs = require('fs');
const path = require('path');

console.log('🎮 Feedback Gamification Deployment Helper\n');

// Read the schema file
const schemaPath = path.join(__dirname, '../database/05-feedback-gamification.sql');
const testPath = path.join(__dirname, '../database/test-gamification.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found at:', schemaPath);
  process.exit(1);
}

console.log('📋 Steps to deploy the feedback gamification system:\n');

console.log('1. Open your Supabase Dashboard');
console.log('   👉 https://supabase.com/dashboard/project/YOUR_PROJECT_ID\n');

console.log('2. Navigate to the SQL Editor');
console.log('   👉 Click on "SQL Editor" in the left sidebar\n');

console.log('3. Create a new query');
console.log('   👉 Click the "New query" button\n');

console.log('4. Copy and paste the gamification schema');
console.log('   📄 File location: database/05-feedback-gamification.sql');
console.log('   Or copy from the console output below:\n');

console.log('--- BEGIN SCHEMA ---');
console.log(fs.readFileSync(schemaPath, 'utf8'));
console.log('--- END SCHEMA ---\n');

console.log('5. Run the schema');
console.log('   👉 Click "Run" or press Ctrl/Cmd + Enter\n');

console.log('6. Verify the deployment');
console.log('   👉 Create another query with the test script:');
console.log('   📄 File location: database/test-gamification.sql\n');

console.log('7. Check the results');
console.log('   ✅ All tables should exist');
console.log('   ✅ Functions should be created');
console.log('   ✅ Trigger should be active\n');

console.log('🎉 Once complete, your gamification system will be live!');
console.log('\n💡 What happens next:');
console.log('   - Users will see XP points when giving feedback');
console.log('   - Achievements will unlock automatically');
console.log('   - Stats bar will show levels and streaks');
console.log('   - AI will learn faster with more feedback!\n');

console.log('📊 To monitor usage, run these queries in SQL Editor:');
console.log(`
-- Check recent feedback with points
SELECT 
  fr.points_earned,
  fr.created_at,
  mf.feedback_type,
  u.email
FROM feedback_rewards fr
JOIN message_feedback mf ON fr.message_feedback_id = mf.id
JOIN auth.users u ON fr.user_id = u.id
ORDER BY fr.created_at DESC
LIMIT 10;

-- See user leaderboard
SELECT 
  email,
  feedback_stats->>'totalPoints' as points,
  feedback_stats->>'currentLevel' as level,
  feedback_stats->>'currentStreak' as streak
FROM profiles
WHERE feedback_stats IS NOT NULL
ORDER BY (feedback_stats->>'totalPoints')::int DESC;
`);

console.log('\n🚀 Ready to deploy? Follow the steps above!');
