#!/bin/bash
# Cleanup script to remove archived folders
# This will be run during the build process

echo "🧹 Cleaning up archived folders..."

# Remove archived-chats folder
if [ -d "archived-chats" ]; then
  rm -rf archived-chats
  echo "✅ Removed archived-chats"
fi

# Remove keepit_comparison folder  
if [ -d "keepit_comparison" ]; then
  rm -rf keepit_comparison
  echo "✅ Removed keepit_comparison"
fi

echo "✨ Cleanup complete!"
