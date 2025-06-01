#!/bin/bash

echo "🚀 Deploying Global Navigation with Labs Button to Production"
echo "============================================"

# Add all the new and modified files
echo "📁 Adding new navigation components..."
git add src/components/navigation/GlobalNav.tsx
git add src/components/layout/AuthLayout.tsx

echo "📝 Adding updated pages..."
git add src/components/ideas/IdeasGallery.tsx
git add src/app/chat/page.tsx
git add src/app/ideas/page.tsx
git add src/app/discover/page.tsx
git add src/app/lab/page.tsx
git add src/app/admin/page.tsx
git add src/app/profile/page.tsx

# Show what's being committed
echo ""
echo "📋 Files to be committed:"
git status --short

# Commit the changes
echo ""
echo "💾 Committing changes..."
git commit -m "feat: Add global navigation with Labs button across all pages

- Created GlobalNav component with responsive navigation
- Added prominent Labs button with animated lightning bolt
- Created AuthLayout wrapper for consistent auth handling
- Updated all authenticated pages to use new navigation
- Removed duplicate navigation from IdeasGallery
- Improved user experience with consistent navigation pattern"

# Push to main
echo ""
echo "⬆️  Pushing to main branch..."
git push origin main

echo ""
echo "✅