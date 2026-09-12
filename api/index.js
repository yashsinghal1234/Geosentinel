const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const { connectDB } = require('../backend/config/db');
const { seedAllData } = require('../backend/seed/seedData');

// Route Imports
const authRoutes = require('../backend/routes/auth');
const nodesRoutes = require('../backend/routes/nodes');
const topologyRoutes = require('../backend/routes/topology');
const reportsRoutes = require('../backend/routes/reports');
const alertsRoutes = require('../backend/routes/alerts');
const gatewayRoutes = require('../backend/routes/gateway');
const checkinRoutes = require('../backend/routes/checkin');
const dashboardRoutes = require('../backend/routes/dashboard');
const ingestRoutes = require('../backend/routes/ingest');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/topology', topologyRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ingest', ingestRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: 'vercel-serverless',
    timestamp: new Date().toISOString()
  });
});

let dbInitialized = false;

module.exports = async (req, res) => {
  if (!dbInitialized) {
    try {
      await connectDB();
      await seedAllData();
      dbInitialized = true;
    } catch (err) {
      console.warn('Vercel serverless DB connect note:', err.message);
    }
  }
  return app(req, res);
};
