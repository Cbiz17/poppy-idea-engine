# TROUBLESHOOTING GUIDE - Poppy Idea Engine

## Common Issues & Solutions

### 1. "Expected unicode escape" Error in Admin Console

**Error**: When accessing `/admin/prompts`, you see:

```
Build Error
Error: × Expected unicode escape
```

**Cause**: This is a hydration error that occurs when server-side rendering tries to pass data to client components.

**Solution**:

- This has been fixed in the latest update
- The admin pages now use client-side data fetching
- Clear your browser cache and restart the dev server

**Prevention**:

- Always use 'use client' directive for pages that need client-side features
- Fetch data within useEffect for client components
- Don't mix server and client rendering patterns

### 2. Feedback Not Saving

**Symptoms**: Clicking feedback buttons doesn't seem to work

**Common Causes**:

1. Invalid message IDs (not proper UUIDs)
2. Database connection issues
3. RLS policies blocking writes

**Solutions**:

- Check browser console for errors
- Verify message IDs are valid UUIDs (contain dashes)
- Check Supabase logs for RLS policy violations
- Ensure user is authenticated

### 3. Admin Dashboard Shows No Data

**Symptoms**: All stats show 0 even after using the app

**Solutions**:

1. Verify feedback is being saved:
   ```sql
   SELECT COUNT(*) FROM message_feedback;
   ```
2. Check if user has admin access
3. Ensure tables have proper permissions
4. Run seed-dynamic-prompts.sql if not done

### 4. Ideas Not Saving

**Common Issues**:

- Conversation ID not set
- Embedding generation fails
- Database connection timeout

**Debug Steps**:

1. Check browser console for API errors
2. Verify conversation exists in database
3. Check Supabase logs for errors
4. Test without embeddings temporarily

### 5. Chat Interface Not Loading

**Symptoms**: Blank screen or infinite loading

**Solutions**:

- Check authentication status
- Verify Supabase connection
- Clear browser localStorage
- Check for JavaScript errors

### 6. MCP Server Connection Issues

**Error**: Browser DevTools MCP server not connecting

**Solutions**:

```bash
# Ensure dependencies installed
cd mcp-servers/browser-devtools
npm install

# Check port availability
lsof -i :3000  # Should not conflict with Next.js

# Run with debug output
DEBUG=* node index.js
```

### 7. Sentry Errors Not Appearing

**Check**:

- Verify NEXT_PUBLIC_SENTRY_DSN is set
- Check Sentry project settings
- Ensure environment is correct (development/production)
- Test with manual error: `Sentry.captureException(new Error('Test'))`

### 8. Vector Search Not Working

**Symptoms**: Semantic search returns no results

**Solutions**:

1. Verify embeddings are being generated
2. Check vector extension is installed:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Rebuild indexes if needed
4. Test with simple similarity query

### 9. Development Panel Not Showing

**Issue**: Floating 🐛 button missing

**Check**:

- DevPanel component is imported in layout.tsx
- Browser console for errors
- Component visibility CSS
- Local storage for panel state

### 10. Performance Issues

**Symptoms**: Slow response times, timeouts

**Optimizations**:

1. Add database indexes:
   ```sql
   CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id);
   CREATE INDEX idx_feedback_created ON message_feedback(created_at DESC);
   ```
2. Implement pagination for large datasets
3. Use React.memo for expensive components
4. Enable Sentry performance monitoring

## Debug Commands

### Check System Health

```bash
# Test API endpoints
curl http://localhost:3000/api/health

# Check database connection
npm run test:db

# Verify environment variables
npm run check:env
```

### Database Queries

```sql
-- Check recent errors
SELECT * FROM dev_logs
WHERE level = 'error'
ORDER BY created_at DESC
LIMIT 10;

-- Verify user permissions
SELECT * FROM pg_roles WHERE rolname = 'authenticated';

-- Check table row counts
SELECT
  'conversations' as table_name, COUNT(*) as count FROM conversations
UNION ALL
SELECT 'ideas', COUNT(*) FROM ideas
UNION ALL
SELECT 'message_feedback', COUNT(*) FROM message_feedback;
```

### Quick Fixes

**Reset local state**:

```javascript
localStorage.clear()
sessionStorage.clear()
window.location.reload()
```

**Force refresh data**:

```javascript
// In browser console
await window.__supabase.auth.refreshSession()
```

**Enable debug logging**:

```javascript
// Add to .env.local
NEXT_PUBLIC_DEBUG = true
```

## Getting Help

1. Check browser console for detailed errors
2. Review Supabase logs in dashboard
3. Check Sentry for production errors
4. Review recent git commits for changes
5. Search closed GitHub issues

## Prevention Tips

1. Always run database migrations in order
2. Test features in development first
3. Monitor Sentry for early warning signs
4. Keep dependencies updated
5. Use TypeScript strict mode
6. Add proper error boundaries
7. Implement graceful degradation
8. Log errors with context
9. Test with slow network conditions
10. Validate user input thoroughly
