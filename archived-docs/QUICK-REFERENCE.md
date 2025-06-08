# QUICK REFERENCE - Poppy Idea Engine

**For Future Claude Sessions**

## 🚨 CURRENT STATE (May 29, 2025)

- **App Status**: FULLY BUILT AND WORKING
- **Missing**: USER FEEDBACK DATA
- **Next Action**: Run seed-dynamic-prompts.sql and add-branching-support.sql, then USE THE APP

## 📁 Key Files

- **Main Chat**: `/src/components/chat/ChatInterface.tsx` (COMPLETE with branching)
- **Feedback**: `/src/components/feedback/FeedbackComponent.tsx` (COMPLETE)
- **Ideas Gallery**: `/src/components/ideas/IdeasGallery.tsx` (ENHANCED with stats)
- **Admin**: `/src/components/admin/AdminDashboard.tsx` (COMPLETE)
- **Status**: `PROJECT-STATUS.md` (READ THIS FIRST!)
- **Next Steps**: `NEXT-STEPS.md` (FOLLOW THESE!)

## 🔗 Quick Links

- **Supabase**: https://supabase.com/dashboard/project/eaahmigctnbqhaqptlvw
- **Local Dev**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **MCP Server**: `/mcp-servers/browser-devtools/`

## ✅ What's Done

1. All UI components built
2. Feedback system integrated
3. Admin dashboard complete
4. Database schemas deployed
5. MCP server implemented
6. Self-improvement infrastructure ready
7. Idea branching support added
8. Contributor tracking implemented
9. Statistics dashboard working
10. Smart continuation detection active

## ❌ What's NOT Done

1. Dynamic prompts not seeded (run seed-dynamic-prompts.sql)
2. Branching columns not added (run add-branching-support.sql)
3. No user feedback collected yet
4. No learning patterns emerged (needs data)

## 🎯 To Activate Self-Improvement

1. Run SQL files: `seed-dynamic-prompts.sql` and `add-branching-support.sql`
2. Use chat and CLICK FEEDBACK BUTTONS
3. Check admin dashboard for results
4. Create and branch ideas

## 🆘 Common Confusions

- **"Feedback not working"** → It IS working, just no data yet
- **"Admin shows nothing"** → Correct, needs feedback data first
- **"Can't see DevButton"** → It's there, floating 🐛 button
- **"MCP not connected"** → It's optional, main app works without it
- **"Can't branch ideas"** → Run add-branching-support.sql first

## 📊 Database Tables Status

- ✅ All tables created
- ✅ RLS policies active
- ✅ Functions deployed
- ⏳ Waiting for data: message_feedback, learning_patterns
- 🔧 Needs seeding: dynamic_prompts, ab_tests
- 🔧 Needs columns: ideas table (run add-branching-support.sql)

## 🚀 Key Features Working

- **Chat**: Streaming responses, personalized welcome, commands
- **Ideas**: Create, edit, branch, version history, contributors
- **Feedback**: Thumbs, ratings, tags, written feedback
- **Admin**: Real-time stats, learning patterns, metrics
- **Development**: MCP server, Sentry, enhanced logging

## 📈 Recent Enhancements (May 29)

- Enhanced idea gallery with stats dashboard
- Idea branching ("Branch as New" button)
- Contributor tracking for collaboration
- Pin/Archive functionality
- Bulk export to Markdown
- List/Grid view modes
- Advanced filtering

---

**Remember**: Everything is built. Just needs DATA from actual usage!
