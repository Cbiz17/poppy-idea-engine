#!/bin/bash

# Browser DevTools MCP Server Dependencies Installation Script
# This script installs all required dependencies for the browser devtools MCP server

set -e  # Exit on any error

echo "🚀 Installing Browser DevTools MCP Server Dependencies..."
echo "============================================================"

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node --version)
echo "Node.js version: $node_version"

# Verify minimum Node.js version (18.0.0)
required_version="18.0.0"
if ! node -e "process.exit(process.version.slice(1).split('.').map(Number).reduce((a,v,i)=>a+v*Math.pow(1000,2-i),0) >= '$required_version'.split('.').map(Number).reduce((a,v,i)=>a+v*Math.pow(1000,2-i),0) ? 0 : 1)"; then
    echo "❌ Error: Node.js version $required_version or higher is required"
    echo "Current version: $node_version"
    echo "Please update Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version check passed"

# Install npm dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Install Puppeteer browser binaries
echo ""
echo "🌐 Installing Puppeteer browser binaries..."
npx puppeteer install

# Check for system dependencies (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    echo "🐧 Checking Linux system dependencies..."
    
    # Check if we're in a Docker container or CI environment
    if [ -f /.dockerenv ] || [ "$CI" = "true" ]; then
        echo "🐳 Container/CI environment detected"
        echo "ℹ️  System dependencies should be installed in the container image"
    else
        echo "🖥️  Desktop Linux environment detected"
        echo "ℹ️  Checking for required system packages..."
        
        # List of required packages for Puppeteer on Linux
        required_packages=(
            "ca-certificates"
            "fonts-liberation"
            "libasound2"
            "libatk-bridge2.0-0"
            "libdrm2"
            "libgtk-3-0"
            "libnspr4"
            "libnss3"
            "libxss1"
            "libxtst6"
            "xdg-utils"
        )
        
        missing_packages=()
        
        for package in "${required_packages[@]}"; do
            if ! dpkg -l | grep -q "^ii  $package "; then
                missing_packages+=("$package")
            fi
        done
        
        if [ ${#missing_packages[@]} -gt 0 ]; then
            echo "⚠️  Missing system packages detected:"
            printf '%s\n' "${missing_packages[@]}"
            echo ""
            echo "📋 To install missing packages, run:"
            echo "sudo apt-get update && sudo apt-get install -y ${missing_packages[*]}"
            echo ""
            echo "🔄 Would you like to install them now? (y/N)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                echo "🔧 Installing system dependencies..."
                sudo apt-get update
                sudo apt-get install -y "${missing_packages[@]}"
                echo "✅ System dependencies installed"
            else
                echo "⚠️  Skipping system dependency installation"
                echo "ℹ️  You may encounter issues running Puppeteer without these packages"
            fi
        else
            echo "✅ All required system packages are installed"
        fi
    fi

# macOS specific checks
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🍎 macOS environment detected"
    echo "ℹ️  Puppeteer should work out of the box on macOS"
    echo "⚠️  If you encounter permission issues, grant accessibility permissions to your terminal/IDE"

# Windows specific checks
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo ""
    echo "🪟 Windows environment detected"
    echo "ℹ️  Puppeteer should work out of the box on Windows"
fi

# Test the installation
echo ""
echo "🧪 Testing installation..."

# Check if main modules can be imported
if node -e "import('puppeteer').then(() => console.log('✅ Puppeteer import successful')).catch(e => {console.error('❌ Puppeteer import failed:', e.message); process.exit(1)})"; then
    echo "✅ Puppeteer installation verified"
else
    echo "❌ Puppeteer installation verification failed"
    exit 1
fi

if node -e "import('ws').then(() => console.log('✅ WebSocket import successful')).catch(e => {console.error('❌ WebSocket import failed:', e.message); process.exit(1)})"; then
    echo "✅ WebSocket installation verified"
else
    echo "❌ WebSocket installation verification failed"
    exit 1
fi

if node -e "import('@modelcontextprotocol/sdk/server/index.js').then(() => console.log('✅ MCP SDK import successful')).catch(e => {console.error('❌ MCP SDK import failed:', e.message); process.exit(1)})"; then
    echo "✅ MCP SDK installation verified"
else
    echo "❌ MCP SDK installation verification failed"
    exit 1
fi

# Make the main script executable
echo ""
echo "🔧 Setting permissions..."
chmod +x index.js
echo "✅ Made index.js executable"

# Success message
echo ""
echo "🎉 Installation completed successfully!"
echo "============================================================"
echo ""
echo "📋 Next steps:"
echo "1. Start the MCP server: node index.js"
echo "2. Test with MCP Inspector: npm run test"
echo "3. Integrate with your development workflow"
echo ""
echo "🔧 Usage:"
echo "- Console monitoring: Live browser console logs"
echo "- Network analysis: API call monitoring"
echo "- Performance testing: Browser metrics collection"
echo "- Visual testing: Automated screenshots"
echo "- Debug execution: Run code in browser context"
echo ""
echo "📚 Documentation: See README.md for detailed usage instructions"
echo ""
echo "🐛 Troubleshooting:"
echo "- Check that Node.js >= 18.0.0 is installed"
echo "- Ensure no other processes are using port 3000-3100 range"
echo "- Grant necessary permissions on macOS/Linux"
echo "- Check firewall settings for WebSocket connections"
