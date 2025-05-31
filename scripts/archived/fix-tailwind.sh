#!/bin/bash

echo "Downgrading to Tailwind CSS v3 for stability..."

# Remove Tailwind v4
npm uninstall tailwindcss @tailwindcss/postcss

# Install Tailwind v3
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# Create proper Tailwind v3 config
npx tailwindcss init -p

echo "Creating Tailwind v3 globals.css..."
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-purple {
  0% {
    box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(147, 51, 234, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(147, 51, 234, 0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom utility classes */
@layer utilities {
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
  
  .animate-pulse-purple {
    animation: pulse-purple 2s infinite;
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
}

/* Input fixes */
input, textarea, select {
  color: black !important;
}
EOF

echo "Updating Tailwind config..."
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

echo "Done! Now run:"
echo "1. rm -rf .next"
echo "2. npm run dev"
