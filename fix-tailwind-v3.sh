#!/bin/bash

echo "🔧 Fixing Tailwind CSS by downgrading to v3..."

# Stop any running processes
echo "⏹️  Please stop the dev server (Ctrl+C) before continuing..."
echo "Press Enter when ready to continue..."
read

# Remove Tailwind v4 and related packages
echo "📦 Removing Tailwind v4..."
npm uninstall tailwindcss @tailwindcss/postcss

# Install Tailwind v3 with PostCSS and Autoprefixer
echo "📦 Installing Tailwind v3..."
npm install -D tailwindcss@3.4.1 postcss@8.4.35 autoprefixer@10.4.17

# Create PostCSS config for v3
echo "📝 Creating postcss.config.js..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create Tailwind config
echo "📝 Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'pulse-purple': 'pulse-purple 2s infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
EOF

# Update globals.css for Tailwind v3
echo "📝 Updating globals.css..."
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

/* Force black text in all inputs */
input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
input[type="tel"],
input[type="url"],
input[type="search"],
input[type="date"],
input[type="time"],
input[type="datetime-local"],
input[type="month"],
input[type="week"],
input:not([type]),
textarea,
select {
  color: #000000 !important;
  opacity: 1 !important;
  -webkit-text-fill-color: #000000 !important;
  background-color: #ffffff !important;
}

/* Placeholder text */
input::placeholder,
textarea::placeholder {
  color: #9CA3AF !important;
  opacity: 1 !important;
  -webkit-text-fill-color: #9CA3AF !important;
}

/* Focus states */
input:focus,
textarea:focus,
select:focus {
  color: #000000 !important;
  opacity: 1 !important;
  -webkit-text-fill-color: #000000 !important;
}

/* Disabled states */
input:disabled,
textarea:disabled,
select:disabled {
  color: #374151 !important;
  opacity: 1 !important;
  -webkit-text-fill-color: #374151 !important;
  background-color: #F3F4F6 !important;
}

/* Autofill fixes */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
textarea:-webkit-autofill:active,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus,
select:-webkit-autofill:active {
  -webkit-text-fill-color: #000000 !important;
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  background-color: #ffffff !important;
  transition: background-color 5000s ease-in-out 0s;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="number"],
  input[type="tel"],
  input[type="url"],
  input[type="search"],
  input[type="date"],
  input[type="time"],
  input[type="datetime-local"],
  input[type="month"],
  input[type="week"],
  input:not([type]),
  textarea,
  select {
    color: #000000 !important;
    background-color: #ffffff !important;
    -webkit-text-fill-color: #000000 !important;
  }
}

/* Select dropdown options */
select option {
  color: #000000 !important;
  background-color: #ffffff !important;
}

/* Legacy modal-input class */
.modal-input {
  color: #000000 !important;
  opacity: 1 !important;
  -webkit-text-fill-color: #000000 !important;
}

.modal-input::placeholder {
  color: #9CA3AF !important;
  opacity: 1 !important;
}
EOF

# Remove old PostCSS config
echo "🗑️  Removing old PostCSS config..."
rm -f postcss.config.mjs

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next

echo "✅ Tailwind CSS v3 setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run dev"
echo "2. Visit: http://localhost:3001/test"
echo "3. You should see a blue page with styled content!"
