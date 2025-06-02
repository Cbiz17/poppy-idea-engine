const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

const PORT = process.env.MCP_DEVTOOLS_PORT || 8080;

console.log(`🚀 MCP Browser DevTools Server starting on port ${PORT}...`);

// Store connected clients
const clients = new Set();

wss.on('connection', (ws, req) => {
  console.log('✅ New client connected from:', req.socket.remoteAddress);
  clients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to MCP Browser DevTools Server',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📥 Received:', data.type, data);

      // Broadcast to all other clients
      clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });

      // Handle specific message types
      switch (data.type) {
        case 'console':
          console.log(`[${data.level}] ${data.message}`, data.data || '');
          break;
        case 'network':
          console.log(`[Network] ${data.method} ${data.url} - ${data.status}`);
          break;
        case 'error':
          console.error('[Error]', data.error);
          break;
        case 'performance':
          console.log('[Performance]', data.metrics);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('👋 Client disconnected');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✨ MCP Browser DevTools Server running on ws://localhost:${PORT}`);
  console.log('📡 Waiting for browser connections...');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
