#!/bin/bash

echo "Testing TypeScript compilation..."
cd /Users/christianbutler/Projects/poppy-idea-engine

# Run TypeScript compiler to check for errors
echo "Running tsc..."
npx tsc --noEmit

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ TypeScript compilation successful!"
else
  echo "❌ TypeScript compilation failed"
  exit 1
fi

echo ""
echo "Testing Next.js build..."
npm run build --no-lint

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed"
  exit 1
fi
