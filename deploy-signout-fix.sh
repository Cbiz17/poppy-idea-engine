#!/bin/bash

# Deploy script for sign out functionality fix

echo "🚀 Deploying sign out functionality fix..."

# Stage the changed files
echo "📝 Staging changes..."
git add src/app/chat/page.tsx
git add src/components/chat/ChatInterface.tsx

# Show what we're about to commit
echo "📋 Changes to be committed:"
git diff --cached --stat

# Commit the changes
echo "💾 Committing changes..."
git commit -m "Fix sign out functionality - redirect to home page instead of non-existent /auth/signin

- Updated chat/page.tsx to redirect to '/' instead of '/auth/signin'
- Enhanced ChatInterface handleSignOut to use server-side signout route
- Added proper error handling and fallback for signout
- Fixes 404 error when signing out"

# Push to remote
echo "📤 Pushing to remote..."
git push origin main

echo "✅ Sign out fix deployed successfully!"
echo "🔄 Vercel should automatically deploy these changes."
