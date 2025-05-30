# Browser DevTools MCP Server

A custom Model Context Protocol (MCP) server that provides real-time browser debugging capabilities for the Poppy Idea Engine development workflow.

## 🎯 Overview

This MCP server eliminates the frustrations of traditional browser console debugging by providing programmatic access to browser state, console logs, network requests, and performance metrics through Claude's interface.

## ✨ Features

### Real-time Monitoring
- **Console Logs**: Live capture of all console output (log, warn, error, debug)
- **Network Requests**: Monitor API calls, resource loading, and performance
- **JavaScript Errors**: Automatic capture of page errors and exceptions
- **Performance Metrics**: Detailed browser performance analysis

### Interactive Debugging
- **JavaScript Execution**: Execute arbitrary code in browser context
- **Screenshot Capture**: Automated visual testing and documentation
- **Browser Navigation**: Programmatic page navigation and control
- **Storage Management**: Clear localStorage, sessionStorage, cookies, and cache

### WebSocket Integration
- **Real-time Communication**: Live connection between browser and MCP server
- **Event Streaming**: Continuous monitoring without polling
- **Automatic Reconnection**: Resilient connection handling

## 🛠️ Technical Architecture

### Components
- **Puppeteer Integration**: Headless Chrome automation
- **WebSocket Server**: Real-time communication layer
- **MCP Protocol**: Standardized tool interface for Claude
- **Event Collectors**: Browser instrumentation for data capture

### Data Flow
1. Browser loads with injected monitoring scripts
2. WebSocket connection established with MCP server
3. Browser events streamed to server in real-time
4. Claude can query and interact with browser state
5. Results returned through MCP protocol

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn package manager

### Installation
```bash
# Navigate to the MCP server directory
cd mcp-servers/browser-devtools

# Install dependencies
npm install

# Make executable (Unix-like systems)
chmod +x index.js

# Start the server
node index.js
```

### Dependencies
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "puppeteer": "^21.0.0",
  "ws": "^8.14.0"
}
```

## 📋 Available Tools

### Console Monitoring
```typescript
// Get console logs with filtering
await mcpClient.call('get_console_logs', {
  level: 'error',    // 'all', 'log', 'warn', 'error', 'debug'
  limit: 50          // Number of recent logs to retrieve
});
```

### Network Analysis
```typescript
// Monitor network requests
await mcpClient.call('get_network_requests', {
  filter: 'failed',  // 'all', 'failed', 'slow', 'api'
  limit: 20          // Number of recent requests
});
```

### Error Tracking
```typescript
// Get JavaScript errors
await mcpClient.call('get_page_errors', {
  limit: 10          // Number of recent errors
});
```

### Code Execution
```typescript
// Execute debugging code in browser
await mcpClient.call('execute_script', {
  script: `
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage)
    };
  `
});
```

### Visual Testing
```typescript
// Capture screenshots
await mcpClient.call('take_screenshot', {
  fullPage: true     // Capture full page or just viewport
});
```

### Browser Control
```typescript
// Navigate to URL
await mcpClient.call('navigate_to', {
  url: 'http://localhost:3000/chat'
});
```

### Performance Analysis
```typescript
// Get performance metrics
await mcpClient.call('get_performance_metrics');
```

### Storage Management
```typescript
// Clear browser data
await mcpClient.call('clear_browser_data', {
  types: ['localStorage', 'sessionStorage', 'cookies', 'cache']
});
```

## 🔧 Configuration

### Environment Variables
```bash
# Browser configuration
BROWSER_DEVTOOLS_HEADLESS=false          # Show browser window
BROWSER_DEVTOOLS_VIEWPORT_WIDTH=1920     # Browser width
BROWSER_DEVTOOLS_VIEWPORT_HEIGHT=1080    # Browser height

# WebSocket configuration
BROWSER_DEVTOOLS_WEBSOCKET_PORT=0        # Auto-assign port (recommended)

# Development settings
NODE_ENV=development                      # Enable debug features
```

### Server Configuration
The server automatically:
- Launches Puppeteer with appropriate settings
- Starts WebSocket server on available port
- Injects monitoring scripts into pages
- Handles reconnections and errors gracefully

## 🐛 Debugging & Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check if ports are in use
lsof -i :3000

# Kill existing processes
pkill -f "node.*browser-devtools"

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### WebSocket Connection Failures
- Ensure firewall allows WebSocket connections
- Check that port isn't blocked by security software
- Verify browser can access localhost WebSocket server

#### Browser Automation Issues
```bash
# Install Chromium dependencies (Linux)
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xdg-utils

# macOS permissions
# Grant Terminal/VSCode accessibility permissions in System Preferences
```

### Debug Mode
```bash
# Start with debug logging
DEBUG=* node index.js

# Monitor WebSocket connections
DEBUG=ws node index.js
```

## 📊 Usage Examples

### Debugging API Calls
```typescript
// Monitor API performance
const networkLogs = await mcpClient.call('get_network_requests', {
  filter: 'api',
  limit: 10
});

// Check for failed requests
const errors = await mcpClient.call('get_network_requests', {
  filter: 'failed',
  limit: 5
});
```

### Performance Analysis
```typescript
// Get page performance
const metrics = await mcpClient.call('get_performance_metrics');

// Execute performance test
const result = await mcpClient.call('execute_script', {
  script: `
    const start = performance.now();
    // Simulate expensive operation
    for(let i = 0; i < 1000000; i++) {}
    return performance.now() - start;
  `
});
```

### Error Investigation
```typescript
// Get recent errors
const errors = await mcpClient.call('get_page_errors', {
  limit: 5
});

// Get console errors
const consoleLogs = await mcpClient.call('get_console_logs', {
  level: 'error',
  limit: 10
});
```

### Visual Testing
```typescript
// Navigate and capture
await mcpClient.call('navigate_to', {
  url: 'http://localhost:3000/ideas'
});

// Wait for page load then screenshot
await mcpClient.call('execute_script', {
  script: 'return new Promise(resolve => setTimeout(resolve, 2000));'
});

await mcpClient.call('take_screenshot', {
  fullPage: true
});
```

## 🔒 Security Considerations

### Development Only
- This server is intended for development environments only
- Disable in production builds
- Restrict network access appropriately

### Browser Security
- WebSocket server binds to localhost only
- Browser automation limited to development domains
- No persistent data storage of sensitive information

### Access Control
```typescript
// Example access restriction
const isDevelopment = process.env.NODE_ENV === 'development';
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

if (!isDevelopment) {
  throw new Error('Browser DevTools MCP Server disabled in production');
}
```

## 🚀 Integration with Poppy Idea Engine

### Development Workflow
1. Start the MCP server alongside your development environment
2. Use Claude to monitor console logs during development
3. Debug API calls and performance issues in real-time
4. Capture screenshots for visual regression testing
5. Execute debugging scripts without browser console limitations

### Continuous Integration
- Automated screenshot capture for visual testing
- Performance regression detection
- Error monitoring during automated tests
- Browser state validation in CI pipelines

## 🔮 Future Enhancements

### Planned Features
- **Multi-browser Support**: Firefox, Safari automation
- **Mobile Device Emulation**: Responsive testing capabilities
- **Advanced Performance Profiling**: Memory usage, CPU analysis
- **Network Throttling**: Simulate slow connections
- **Accessibility Testing**: WCAG compliance checking
- **Visual Regression Testing**: Automated screenshot comparison

### Integration Possibilities
- **Database MCP Server**: Correlate browser events with database changes
- **API Testing MCP Server**: Coordinate with API testing workflows
- **Deployment MCP Server**: Integration with deployment pipelines

This Browser DevTools MCP Server transforms the development experience by providing programmatic access to browser debugging capabilities, eliminating the traditional pain points of console debugging and enabling sophisticated automated testing workflows.
