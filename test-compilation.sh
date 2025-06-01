#!/bin/bash

# Test script to verify TypeScript compilation

cd /Users/christianbutler/Projects/poppy-idea-engine

echo "Testing TypeScript compilation..."
echo "================================"

# Test chat route
echo -n "Testing chat route... "
npx tsc --noEmit src/app/api/chat/route.ts 2>&1
if [ $? -eq 0 ]; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    npx tsc --noEmit src/app/api/chat/route.ts
fi

# Test chat-enhanced route
echo -n "Testing chat-enhanced route... "
npx tsc --noEmit src/app/api/chat-enhanced/route.ts 2>&1
if [ $? -eq 0 ]; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    npx tsc --noEmit src/app/api/chat-enhanced/route.ts
fi

echo "================================"
echo "Test complete!"
