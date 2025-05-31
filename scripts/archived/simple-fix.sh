#!/bin/bash

echo "Fixing Tailwind CSS..."

# Clean everything first
echo "Cleaning old files..."
rm -rf .next
rm -f postcss.config.mjs

# Create new PostCSS config for Tailwind v3
echo "Creating postcss.config.js..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create Tailwind config
echo "Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Update globals.css
echo "Updating globals.css..."
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom animations */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-purple {
  0% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(147, 51, 234, 0); }
  100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fade-in 0.5s ease-out; }
.animate-pulse-purple { animation: pulse-purple 2s infinite; }
.animate-slide-up { animation: slide-up 0.3s ease-out; }

/* Input fixes */
input, textarea, select {
  color: black !important;
}
EOF

echo "Done! Now run these commands:"
echo "1. npm uninstall tailwindcss @tailwindcss/postcss"
echo "2. npm install -D tailwindcss@3.4.1 postcss@8.4.35 autoprefixer@10.4.17"
echo "3. npm run dev"
