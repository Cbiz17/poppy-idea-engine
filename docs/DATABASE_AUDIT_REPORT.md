# Database Table Usage Audit Report
Generated on: June 17, 2025

## Executive Summary
This audit analyzes all 28 database tables in the Poppy Idea Engine to identify:
- Tables actively used in the codebase
- Foreign key dependencies
- API endpoint usage patterns
- Unused tables (candidates for deletion)
- Safe deletion order

## 🟢 Actively Used Tables (11 tables)

### Core Tables (High Usage)
1. **profiles** 
   - Used by: Authentication system, user preferences
   - Dependencies: Referenced by most user-related tables
   - Status: CRITICAL - Do not delete

2. **ideas**
   - Used by: `/api/ideas`, `/api/detect-continuation`, various UI components
   - Dependencies: Referenced by idea_development_history, idea_likes, idea_discovery_stats, etc.
   - Status: CRITICAL - Core functionality

3. **conversations**
   - Used by: `/api/chat`, `/api/feedback`, chat UI
   - Dependencies: Referenced by conversation_messages, conversation_outcomes
   - Status: CRITICAL - Core functionality

4. **conversation_messages**
   - Used by: `/api/feedback`, chat history
   - Dependencies: Foreign key to conversations
   - Status: CRITICAL - Core functionality

### AI Learning & Improvement Tables (Active)
5. **dynamic_prompts**
   - Used by: `/api/chat`, `/api/chat-enhanced`, `/api/analytics/prompts`
   - Dependencies: Referenced in A/B tests
   - Status: ACTIVE - Self-improvement system

6. **learning_patterns**
   - Used by: `/api/chat-enhanced`, `/api/feedback`
   - Dependencies: None
   - Status: ACTIVE - AI learning system

7. **message_feedback**
   - Used by: `/api/feedback`
   - Dependencies: Foreign keys to conversations, conversation_messages
   - Status: ACTIVE - Feedback collection

8. **user_actions**
   - Used by: `/api/chat`, A/B testing tracking
   - Dependencies: Foreign keys to users, conversations, ideas
   - Status: ACTIVE - Analytics

### A/B Testing Tables (Active)
9. **ab_tests**
   - Used by: `/api/chat`, `/api/chat-enhanced`
   - Dependencies: Referenced by ab_test_results, user_test_assignments
   - Status: ACTIVE - A/B testing

10. **user_test_assignments**
    - Used by: `/api/chat`, `/api/chat-enhanced`
    - Dependencies: Foreign keys to users, ab_tests
    - Status: ACTIVE - A/B testing

### Development Features (Active)
11. **idea_development_history**
    - Used by: `/api/detect-continuation`
    - Dependencies: Foreign key to ideas
    - Status: ACTIVE - Idea versioning

## 🟡 Partially Used Tables (7 tables)

These tables are defined in the schema but have limited usage:

12. **conversation_continuity**
    - Used by: `/api/ideas` (for tracking related ideas)
    - Status: PARTIALLY USED

13. **dev_logs**
    - Likely used by: Error logging system
    - Status: PARTIALLY USED - Check `/api/dev-logs`

14. **ab_test_results**
    - Schema defined but no direct API usage found
    - Status: LIKELY USED via RPC functions

15. **conversation_outcomes**
    - Schema defined but no direct usage found
    - Status: POTENTIALLY UNUSED

16. **smart_save_suggestions**
    - Schema defined but no direct usage found
    - Status: POTENTIALLY UNUSED

17. **idea_discovery_stats**
    - Related to public idea sharing
    - Status: CHECK `/api/ideas/discover`

18. **idea_likes**
    - Related to public idea sharing
    - Status: CHECK `/api/ideas/[id]/like`

## 🔴 Unused Tables (10 tables)

These tables appear to be completely unused in the current codebase:

19. **old_conversations_backup**
    - Purpose: Backup table
    - Status: SAFE TO DELETE

20. **daily_feedback_streaks**
    - Purpose: Gamification feature
    - Status: UNUSED - No gamification implementation found

21. **feedback_rewards**
    - Purpose: Gamification rewards
    - Status: UNUSED - No gamification implementation found

22. **user_achievements**
    - Purpose: Gamification achievements
    - Status: UNUSED - No gamification implementation found

23. **user_ab_preferences**
    - Purpose: A/B test preferences
    - Status: UNUSED - Using user_test_assignments instead

24. **idea_comments**
    - Purpose: Social features
    - Status: UNUSED - No commenting system implemented

25. **idea_contributors**
    - Purpose: Collaboration features
    - Status: UNUSED - No collaboration implemented

26. **idea_remixes**
    - Purpose: Idea remixing feature
    - Status: UNUSED - Feature not implemented

27. **idea_shares**
    - Purpose: Sharing features
    - Status: UNUSED - No sharing system found

28. **idea_version_timeline**
    - Purpose: Version control
    - Status: UNUSED - Using idea_development_history instead

## 📊 API Endpoint to Table Mapping

| API Endpoint | Tables Used |
|--------------|-------------|
| `/api/chat` | dynamic_prompts, ab_tests, user_actions |
| `/api/chat-enhanced` | dynamic_prompts, ab_tests, user_actions, learning_patterns |
| `/api/ideas` | ideas, conversation_continuity |
| `/api/feedback` | conversation_messages, conversations, message_feedback, learning_patterns |
| `/api/detect-continuation` | ideas, idea_development_history |
| `/api/analytics/prompts` | dynamic_prompts (+ RPC functions) |
| `/api/smart-merge` | Unknown - needs investigation |
| `/api/ab-tests` | ab_tests, ab_test_results, user_test_assignments |

## 🔗 Foreign Key Dependencies

### Primary Dependencies
- **profiles** ← Most tables reference user_id
- **ideas** ← idea_development_history, idea_likes, idea_discovery_stats
- **conversations** ← conversation_messages, conversation_outcomes
- **ab_tests** ← ab_test_results, user_test_assignments

### Secondary Dependencies
- **conversation_messages** ← message_feedback
- **ideas.branched_from_id** → ideas (self-referential)

## 🗑️ Safe Deletion Order

Based on foreign key dependencies, delete in this order:

### Phase 1: No Dependencies (Safe to Delete Now)
1. old_conversations_backup
2. daily_feedback_streaks
3. feedback_rewards
4. user_achievements
5. user_ab_preferences
6. idea_version_timeline

### Phase 2: Idea-Related Social Features
1. idea_shares
2. idea_remixes
3. idea_comments
4. idea_contributors

### Phase 3: Optional Features (Verify First)
1. smart_save_suggestions (verify not used)
2. conversation_outcomes (verify not used)

## 🚀 Recommendations

### Immediate Actions
1. **Delete Phase 1 tables** - These are completely unused with no dependencies
2. **Verify Phase 2 tables** - Check if any social features are planned before deletion
3. **Investigate** - Check `/api/smart-merge` and discovery endpoints for additional usage

### Code Cleanup
1. Remove TypeScript types for deleted tables from `database.types.ts`
2. Remove any UI components referencing deleted tables
3. Update documentation to reflect current schema

### Future Considerations
1. **Gamification**: If planning to implement, keep streak/reward tables
2. **Social Features**: If planning collaboration, keep comment/contributor tables
3. **Public Sharing**: Verify discovery_stats and likes usage before deletion

## 📝 Notes

- This audit is based on code search and may miss dynamically generated queries
- RPC functions (stored procedures) may use additional tables not visible in API code
- Always backup database before deleting tables
- Consider running a query log analysis for 24-48 hours to confirm unused tables

## Next Steps

1. Review this audit with the team
2. Create a backup of the database
3. Create a new branch for cleanup: `feature/database-cleanup-phase-2`
4. Delete Phase 1 tables first
5. Update TypeScript types
6. Test thoroughly in preview deployment
7. Monitor for any errors after deployment