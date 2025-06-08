# Poppy Idea Engine - Testing Checklist

## 🔧 Pre-Launch Testing Checklist

### 1. Environment Setup

- [ ] Verify all environment variables are set correctly
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`
  - [ ] `NEXTAUTH_URL` matches development port (3000)
  - [ ] `NEXTAUTH_SECRET` is set
  - [ ] `OPENAI_API_KEY` for embeddings
  - [ ] Sentry configuration (DSN, org, project)
- [ ] Database types are generated and up-to-date
- [ ] All npm dependencies are installed
- [ ] MCP Browser DevTools server can start

### 2. Authentication Flow

- [ ] Google OAuth sign-in works
- [ ] Email sign-in works (if enabled)
- [ ] Sign-out properly clears session
- [ ] Protected routes redirect to login
- [ ] User profile is created on first sign-in
- [ ] Onboarding flow completes successfully

### 3. Core Chat Functionality

- [ ] Messages send and receive properly
- [ ] AI responses stream correctly
- [ ] Message IDs are proper UUIDs
- [ ] Conversation history loads correctly
- [ ] Special commands work (`/history`, etc.)
- [ ] Welcome message appears for new conversations
- [ ] Continuation detection works when revisiting ideas
- [ ] Messages are saved with embeddings

### 4. Idea Management

- [ ] Ideas can be saved from conversations
- [ ] Smart save detection prompts appear
- [ ] Idea review modal functions properly
- [ ] Enhanced save modal for updates/merges works
- [ ] Ideas appear in gallery
- [ ] Idea search works (semantic and text)
- [ ] Public/private toggle works
- [ ] Idea development history tracks changes
- [ ] Branching ideas works correctly

### 5. Feedback System

- [ ] Thumbs up/down buttons work
- [ ] 5-star ratings can be submitted
- [ ] Feedback is stored in database
- [ ] Feedback prompts appear periodically
- [ ] Achievement notifications show
- [ ] Gamification stats update
- [ ] Feedback contributes to learning patterns

### 6. Self-Improvement System

- [ ] Dynamic prompts load from database
- [ ] A/B tests assign users to groups
- [ ] Prompt analytics dashboard shows data
- [ ] Learning patterns are extracted from feedback
- [ ] System can generate improved prompts
- [ ] Personal context tracks user preferences

### 7. Discovery Features

- [ ] Public ideas appear in discover page
- [ ] View counts increment
- [ ] Like functionality works
- [ ] Idea stats update correctly

### 8. Developer Tools

- [ ] Dev panel (🐛 button) appears in development
- [ ] Console logs are captured
- [ ] Database logs are stored
- [ ] Export logs functionality works
- [ ] MCP Browser DevTools connects
- [ ] Network monitoring works

### 9. Error Handling

- [ ] Sentry captures client-side errors
- [ ] Sentry captures server-side errors
- [ ] Error boundaries prevent app crashes
- [ ] User-friendly error pages display
- [ ] API errors return appropriate status codes
- [ ] Rate limiting prevents abuse

### 10. Performance

- [ ] Health dashboard loads and updates
- [ ] API response times are acceptable (<2s)
- [ ] Database queries use indexes efficiently
- [ ] Vector search returns relevant results
- [ ] Page load times are reasonable
- [ ] No memory leaks in long sessions

### 11. UI/UX Polish

- [ ] All animations work smoothly
- [ ] Mobile responsive design works
- [ ] Dark mode compatibility (if applicable)
- [ ] Loading states appear appropriately
- [ ] Scroll behavior in chat is smooth
- [ ] Modals don't break layout
- [ ] Floating buttons positioned correctly

### 12. Security

- [ ] API keys are not exposed to client
- [ ] RLS policies enforce data isolation
- [ ] Input validation prevents injection
- [ ] Rate limiting protects endpoints
- [ ] CORS configured appropriately
- [ ] Session management is secure

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] All tests pass
- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] Sentry project configured
- [ ] Analytics tracking ready

### Deployment

- [ ] Build completes without errors
- [ ] Deployment to hosting platform succeeds
- [ ] Domain/SSL configured
- [ ] Environment variables verified
- [ ] Database connection works

### Post-Deployment

- [ ] Health check endpoint responds
- [ ] Can sign in with production auth
- [ ] Basic user flow works end-to-end
- [ ] Error tracking captures issues
- [ ] Performance monitoring active

## 📊 Monitoring Setup

### Real-time Monitoring

- [ ] Health dashboard accessible at `/health`
- [ ] Sentry dashboard configured
- [ ] Database metrics available
- [ ] API performance tracked
- [ ] User activity monitored

### Alerts

- [ ] Error rate alerts configured
- [ ] Performance degradation alerts
- [ ] Database connection alerts
- [ ] API quota alerts
- [ ] Disk space alerts

## 🐛 Known Issues to Address

1. **Database Types**: Ensure types stay synchronized with schema
2. **Message UUIDs**: Verify all messages get proper IDs
3. **Port Configuration**: Ensure NEXTAUTH_URL matches server
4. **Feedback Bootstrap**: Need initial positive feedback to start learning
5. **Rate Limiting**: Implement Redis for production scale

## 📝 Testing Commands

```bash
# Development
npm run dev

# Run MCP DevTools
npm run mcp:browser-devtools

# Type checking
npm run type-check

# Build
npm run build

# Production preview
npm run start
```

## 🎯 Success Criteria

- [ ] User can sign up and complete onboarding
- [ ] User can have a conversation with AI
- [ ] User can save and manage ideas
- [ ] Feedback improves AI responses over time
- [ ] System remains stable under normal load
- [ ] Errors are caught and reported properly
- [ ] Performance meets acceptable thresholds
