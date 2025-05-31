#!/bin/bash

echo "🔍 Debugging the Internal Server Error..."
echo ""

# Check current directory
echo "📁 Current directory:"
pwd
echo ""

# Check if node_modules exists
echo "📦 Checking node_modules:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "❌ node_modules is missing!"
fi
echo ""

# Check if .next exists
echo "🏗️ Checking .next build directory:"
if [ -d ".next" ]; then
    echo "✅ .next exists"
else
    echo "❌ .next is missing!"
fi
echo ""

# List PostCSS related files
echo "📄 PostCSS configuration files:"
ls -la postcss.config.* 2>/dev/null || echo "No PostCSS config files found"
echo ""

# Check Tailwind config
echo "📄 Tailwind configuration:"
ls -la tailwind.config.* 2>/dev/null || echo "No Tailwind config files found"
echo ""

# Check package.json for Tailwind
echo "📦 Checking installed Tailwind version:"
if [ -f "package.json" ]; then
    grep -E "tailwindcss|@tailwindcss/postcss" package.json || echo "Tailwind not found in package.json"
fi
echo ""

echo "💡 Recommended fix:"
echo "1. Make sure you ran: npm uninstall tailwindcss @tailwindcss/postcss"
echo "2. Then ran: npm install -D tailwindcss@3.4.1 postcss@8.4.35 autoprefixer@10.4.17"
echo "3. Delete .next folder: rm -rf .next"
echo "4. Delete node_modules: rm -rf node_modules"
echo "5. Reinstall all: npm install"
echo "6. Start dev server: npm run dev"
