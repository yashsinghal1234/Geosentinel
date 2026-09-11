const { WebSocketServer, WebSocket } = require('ws');

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  init(server) {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws);
      console.log(`🔌 WebSocket client connected (Active: ${this.clients.size})`);

      // Send initial welcome/ready packet
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'GeoSentinel Live Telemetry WebSocket Stream Active',
        timestamp: new Date().toISOString()
      }));

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch (e) {
          // Keep-alive or non-JSON message
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`🔌 WebSocket client disconnected (Active: ${this.clients.size})`);
      });

      ws.on('error', (err) => {
        console.warn('WebSocket client error:', err.message);
        this.clients.delete(ws);
      });
    });

    // Handle HTTP Upgrade to WebSocket
    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
      if (pathname === '/ws/live' || pathname === '/ws' || pathname === '/ws/') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    // Periodic heartbeat to prevent stale socket hanging
    setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        timestamp: Date.now()
      });
    }, 25000);
  }

  broadcast(data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err) {
          console.warn('WebSocket send error:', err.message);
        }
      }
    }
  }
}

const wsManager = new WebSocketManager();

module.exports = wsManager;
