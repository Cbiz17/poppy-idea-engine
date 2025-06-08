# Poppy Idea Engine - Deployment Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase project created
- Anthropic API key
- OpenAI API key (optional, for embeddings)
- Sentry account (optional, for error tracking)

### Local Development Setup

1. **Clone and install dependencies**

```bash
git clone [repository-url]
cd poppy-idea-engine
npm install
```

2. **Set up environment variables**

```bash
cp .env.local.example .env.local
# Edit .env.local with your actual keys
```

3. **Generate database types**

```bash
npx supabase login
npx supabase link --project-ref [your-project-ref]
npx supabase gen types typescript --linked > src/types/database.types.ts
```

4. **Run database migrations**

```bash
# Apply all SQL files in order:
# 1. database-setup.sql
# 2. self-improvement-schema.sql
# 3. dev-logging-schema.sql
# 4. onboarding-schema.sql
```

5. **Start development servers**

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: MCP DevTools (optional)
cd mcp-servers/browser-devtools
npm install
npm start
```

## 🌐 Production Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

2. **Connect to Vercel**

- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Configure environment variables in Vercel dashboard
- Deploy

3. **Set production environment variables in Vercel**

- All variables from `.env.local.example`
- Set `NODE_ENV=production`
- Set `NEXTAUTH_URL` to your production domain

### Manual Deployment

1. **Build the application**

```bash
npm run build
```

2. **Start production server**

```bash
npm run start
```

3. **Use a process manager (PM2)**

```bash
npm install -g pm2
pm2 start npm --name "poppy-idea-engine" -- start
pm2 save
pm2 startup
```

## 📊 Database Setup

### Supabase Configuration

1. **Enable pgvector extension**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

2. **Run migrations in order**

- Execute each SQL file in Supabase SQL editor
- Verify all tables and functions are created

3. **Set up Row Level Security (RLS)**

- Ensure RLS is enabled on all tables
- Verify policies are working correctly

4. **Configure Auth**

- Enable Google OAuth provider
- Set redirect URLs for your domain
- Configure email templates (optional)

## 🔒 Security Checklist

- [ ] All API keys are in environment variables
- [ ] `.env.local` is in `.gitignore`
- [ ] RLS policies are enabled and tested
- [ ] Rate limiting is configured
- [ ] CORS settings are appropriate
- [ ] Content Security Policy headers set

## 🔧 Configuration Options

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
ANTHROPIC_API_KEY=[your-key]
NEXTAUTH_URL=https://[your-domain]
NEXTAUTH_SECRET=[generate-with-openssl-rand-base64-32]

# Optional but recommended
OPENAI_API_KEY=[your-key]  # For embeddings
ANTHROPIC_MODEL=claude-3-haiku-20240307  # Or newer model

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=[your-dsn]
SENTRY_ORG=[your-org]
SENTRY_PROJECT=[your-project]
SENTRY_AUTH_TOKEN=[your-token]

# Development
NODE_ENV=production
```

### Performance Tuning

1. **Database indexes** - Already included in migrations
2. **Edge runtime** - API routes use edge runtime where possible
3. **Caching** - Implement Redis for production scale
4. **CDN** - Use Vercel's CDN or Cloudflare

## 📱 Post-Deployment

### Monitoring Setup

1. **Health Check**

- Visit `/health` to see system status
- Set up uptime monitoring (e.g., Uptime Robot)

2. **Error Tracking**

- Check Sentry dashboard for errors
- Set up error alerts

3. **Analytics**

- Monitor user activity in Supabase dashboard
- Track AI performance in admin dashboard

### First User Setup

1. **Admin user**

- First user to sign up should be marked as admin
- Access admin features at `/admin`

2. **Seed data**

- Create initial dynamic prompts
- Set up A/B tests

## 🆘 Troubleshooting

### Common Issues

1. **"Database types are empty"**

   - Regenerate types: `npx supabase gen types typescript --linked > src/types/database.types.ts`

2. **"Authentication not working"**

   - Check `NEXTAUTH_URL` matches your domain
   - Verify OAuth redirect URLs in Supabase

3. **"AI not responding"**

   - Verify `ANTHROPIC_API_KEY` is valid
   - Check API rate limits

4. **"Embeddings failing"**
   - OpenAI API key may be missing or invalid
   - System works without embeddings but search is limited

### Support

- Check logs in Supabase dashboard
- Review Sentry for error details
- Use Dev Panel (🐛) in development
- Check `/api/health` endpoint

## 🎉 Success!

Your Poppy Idea Engine should now be running. Visit your domain and:

1. Sign in with Google
2. Complete onboarding
3. Start chatting with Poppy
4. Save your first idea
5. Provide feedback to train the AI

Remember: The more feedback collected, the better Poppy becomes at helping users!
