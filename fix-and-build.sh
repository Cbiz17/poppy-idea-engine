#!/bin/bash

echo "🔧 Applying TypeScript fixes for Vercel deployment..."

# First, restore the original file to ensure we're starting fresh
echo "📋 Restoring original file..."
git checkout src/components/chat/ChatInterface.tsx

# Apply both fixes using sed
echo "🔨 Applying fix for line 161..."
sed -i '' '161s/if (lastConv?.conversation_messages?.length > 0) {/if (lastConv \&\& lastConv.conversation_messages \&\& Array.isArray(lastConv.conversation_messages) \&\& lastConv.conversation_messages.length > 0) {/' src/components/chat/ChatInterface.tsx

echo "🔨 Applying fix for line 554..."
# This is more complex, so we'll use a different approach
# Find the line with setCurrentIdeaContext and add the if check
sed -i '' '/setCurrentIdeaContext({/{
i\
        if (conversation.ideas) {
a\
        }
}' src/components/chat/ChatInterface.tsx

echo "✅ Fixes applied!"
echo ""
echo "📦 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Build successful! Ready to deploy to Vercel."
    echo ""
    echo "Next steps:"
    echo "1. git add -A"
    echo "2. git commit -m 'Fix TypeScript errors for Vercel deployment'"
    echo "3. git push"
else
    echo ""
    echo "❌ Build still failing. Check the error messages above."
fi
