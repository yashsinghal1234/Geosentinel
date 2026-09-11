const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const { seedAllData } = require('./seed/seedData');
const wsManager = require('./services/websocket');

// Route Imports
const authRoutes = require('./routes/auth');
const nodesRoutes = require('./routes/nodes');
const topologyRoutes = require('./routes/topology');
const reportsRoutes = require('./routes/reports');
const alertsRoutes = require('./routes/alerts');
const gatewayRoutes = require('./routes/gateway');
const checkinRoutes = require('./routes/checkin');
const dashboardRoutes = require('./routes/dashboard');
const ingestRoutes = require('./routes/ingest');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/topology', topologyRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ingest', ingestRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    backend: 'node-express',
    version: '1.0.0',
    system: 'GeoSentinel Early Warning Network',
    timestamp: new Date().toISOString()
  });
});

// Public Zone Status
app.get('/api/status/:zone', (req, res) => {
  const { zone } = req.params;
  res.json({
    zone,
    status: 'Normal',
    message: 'No active evacuation alerts in your designated sector.'
  });
});

// Create HTTP and WebSocket Server
const server = http.createServer(app);
wsManager.init(server);

// Start Server immediately and connect/seed database asynchronously
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`
======================================================================
  GEOSENTINEL NODE.JS EXPRESS BACKEND SERVER ONLINE
======================================================================
  Port:              http://localhost:${PORT}
  API Health:        http://localhost:${PORT}/api/health
  WebSocket Stream:  ws://localhost:${PORT}/ws/live
  Default Admin:     admin@geo.com / password123
  Default Operator:  operator@geosentinel.gov.in / password123
======================================================================
  `);

  try {
    await connectDB();
    await seedAllData();
  } catch (err) {
    console.warn('Startup database initialization note:', err.message);
  }
});

module.exports = { app, server };
