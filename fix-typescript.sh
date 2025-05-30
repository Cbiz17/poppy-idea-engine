#!/bin/bash
# Fix the TypeScript error by adding proper checks

# Fix line 555 - add check for conversation.ideas
sed -i '' '554,559s/setCurrentIdeaContext({/if (conversation.ideas) {\
      setCurrentIdeaContext({/; 559a\      }' src/components/chat/ChatInterface.tsx

echo "Fix applied!"
