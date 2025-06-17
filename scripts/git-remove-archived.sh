#!/bin/bash
# This script removes archived folders from Git history
# Run this locally after checking out the cleanup branch

echo "🗑️ Removing archived folders from Git..."

# Remove folders from Git (not just filesystem)
git rm -r archived-chats
git rm -r keepit_comparison

# Commit the removal
git commit -m "Remove archived folders: archived-chats and keepit_comparison"

echo "✅ Folders removed from Git"
echo "📤 Now push the changes: git push origin cleanup/remove-archived-folders"
