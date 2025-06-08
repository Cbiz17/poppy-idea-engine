# Deployment Guide

This guide covers deploying the Poppy Idea Engine to production.

## 🚀 Deployment Platform

The project is configured for automatic deployment on **Vercel**:

- Automatic deploys from `main` branch
- Preview deployments for pull requests
- Environment variable management
- Edge function support

## 📋 Pre-Deployment Checklist

### 1. Code Verification

```bash
# Always run build check before deploying
npm run build

# Check TypeScript types
npx tsc --noEmit

# Test locally
npm run dev
```

### 2. Environment Variables

Ensure these are set in Vercel:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional
OPENAI_API_KEY=your_openai_key  # For embeddings
SENTRY_DSN=your_sentry_dsn      # For error tracking
```

### 3. Database Migrations

Before deploying new features, run any SQL migrations in Supabase:

1. Go to Supabase SQL Editor
2. Run migration files in order
3. Verify with test queries

## 🔄 Standard Deployment Process

### 1. Commit Changes

```bash
# Stage changes
git add -A

# Commit with descriptive message
git commit -m "feat: Add feedback gamification system"

# Push to main branch (triggers deployment)
git push origin main
```

### 2. Monitor Deployment

1. Check Vercel dashboard for build status
2. Watch for any build errors
3. Preview deployment before it goes live

### 3. Post-Deployment Verification

- [ ] Visit production URL
- [ ] Test new features
- [ ] Check browser console for errors
- [ ] Verify database operations
- [ ] Monitor Sentry for new errors

## 🛠 Common Deployment Scenarios

### Adding New Database Tables

1. Create migration SQL file
2. Run in Supabase SQL Editor
3. Update TypeScript types if needed
4. Deploy application code

### Updating Environment Variables

1. Add to Vercel project settings
2. Trigger redeployment:
   ```bash
   git commit --allow-empty -m "chore: Trigger deployment"
   git push origin main
   ```

### Rolling Back a Deployment

1. In Vercel dashboard, go to deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"

## 🔐 Security Considerations

### Row Level Security (RLS)

Always ensure new tables have proper RLS policies:

```sql
-- Example RLS policy
CREATE POLICY "Users can only see their own data"
ON public.table_name
FOR ALL
TO authenticated
USING (user_id = auth.uid());
```

### API Keys

- Never commit API keys to git
- Use environment variables
- Rotate keys periodically
- Set up key usage alerts

## 🐛 Troubleshooting Deployments

### Build Failures

**TypeScript Errors**

```bash
# Fix locally first
npm run build
# Then commit fixes
```

**Missing Dependencies**

```bash
npm install
npm run build
git add package-lock.json
git commit -m "fix: Update dependencies"
```

### Runtime Errors

1. Check Vercel Function logs
2. Review Sentry error reports
3. Test with production environment locally:
   ```bash
   npm run build
   npm run start
   ```

### Database Issues

**Missing Permissions**

```sql
-- Grant necessary permissions
GRANT ALL ON table_name TO authenticated;

-- Add RLS policies
CREATE POLICY "policy_name" ON table_name
FOR ALL TO authenticated
USING (user_id = auth.uid());
```

**Migration Failures**

- Run migrations one at a time
- Check for dependency order
- Verify foreign key constraints

## 📊 Monitoring Production

### Key Metrics to Watch

- Build time trends
- Function execution duration
- Error rate in Sentry
- Database query performance
- User feedback patterns

### Useful Commands

```bash
# View recent commits
git log --oneline -10

# Check deployment status
# Visit: https://vercel.com/[your-team]/poppy-idea-engine

# Test production API
curl https://poppy-idea-engine.vercel.app/api/health

# Monitor logs
# Use Vercel dashboard → Functions → Logs
```

## 🚨 Emergency Procedures

### Site is Down

1. Check Vercel status page
2. Review recent deployments
3. Rollback if needed
4. Check Supabase status

### Data Issues

1. **DO NOT** modify production data directly
2. Test fixes in development first
3. Use database transactions for updates
4. Always backup before major changes

### High Error Rate

1. Check Sentry for error patterns
2. Identify problematic deployment
3. Rollback if critical
4. Deploy hotfix ASAP

## 📝 Deployment Best Practices

1. **Deploy Early and Often**: Small, frequent deployments are safer
2. **Test in Production**: Use feature flags for gradual rollout
3. **Monitor Everything**: Set up alerts for anomalies
4. **Document Changes**: Update PROJECT_STATUS.md
5. **Communicate**: Let team know about major deployments

---

**Remember**: The simpler the deployment, the fewer things can go wrong. Keep deployments small and focused.
