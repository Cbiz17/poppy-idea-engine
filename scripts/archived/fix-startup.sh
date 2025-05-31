#!/bin/bash

echo "🔧 Fixing the app that won't start..."
echo ""

# Remove conflicting config files
echo "🗑️  Removing conflicting config files..."
rm -f tailwind.config.ts
rm -f postcss.config.mjs

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules is missing! Running npm install..."
    npm install
else
    echo "✅ node_modules exists"
fi

# Check the terminal output
echo ""
echo "📋 Please check your terminal where you ran 'npm run dev' for error messages."
echo ""
echo "Common issues:"
echo "1. Port 3001 might be in use. Try: lsof -i :3001"
echo "2. Missing dependencies. Try: rm -rf node_modules && npm install"
echo "3. Build errors. Check the terminal output."
echo ""
echo "🚀 To start fresh:"
echo "1. Kill any running Node processes: pkill -f node"
echo "2. Clear everything: rm -rf .next node_modules"
echo "3. Install dependencies: npm install"
echo "4. Start dev server: npm run dev"
