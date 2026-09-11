const express = require('express');
const router = express.Router();
const SensorNode = require('../models/SensorNode');
const { DEFAULT_NODES, InMemoryStore } = require('../seed/seedData');
const { getIsMock } = require('../config/db');
const wsManager = require('../services/websocket');

// 1. GET /api/nodes
router.get('/', async (req, res) => {
  try {
    const isMock = getIsMock();
    let nodes = [];

    if (!isMock) {
      try {
        nodes = await SensorNode.find({});
      } catch (err) {
        console.warn('MongoDB nodes find note:', err.message);
      }
    }

    if (!nodes || nodes.length === 0) {
      nodes = InMemoryStore.nodes.length > 0 ? InMemoryStore.nodes : DEFAULT_NODES;
    }

    return res.json(nodes);
  } catch (err) {
    console.error('Error fetching nodes:', err);
    return res.json(DEFAULT_NODES);
  }
});

// 2. GET /api/nodes/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isMock = getIsMock();
    let node = null;

    if (!isMock) {
      node = await SensorNode.findOne({ id }).catch(() => null);
    }
    if (!node) {
      node = InMemoryStore.nodes.find(n => n.id === id || n._id === id);
    }
    if (!node) {
      return res.status(404).json({ status: 'error', message: `Node ${id} not found.` });
    }
    return res.json(node);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. POST /api/nodes (Register new node)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const nodeId = body.id || `NODE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newNode = {
      _id: nodeId,
      id: nodeId,
      name: body.name || `Node ${nodeId}`,
      code: body.code || `ESP32-S3-${nodeId}`,
      type: body.type || 'multi_sensor_node',
      hardwareModel: body.hardwareModel || 'ESP32-S3 (BNO085 + BME280 + Soil Moisture)',
      zone: body.zone || 'Sector 1 (North Overburden Slope)',
      sector: body.sector || 1,
      lat: body.lat || 23.7500,
      lng: body.lng || 86.4200,
      elevationMeters: body.elevationMeters || 225,
      meshHopCount: body.meshHopCount || 1,
      parentNodeId: body.parentNodeId || 'MASTER-S1',
      masterId: body.masterId || 'MASTER-S1',
      status: body.status || 'online',
      readings: body.readings || {
        tiltDeg: 0.0,
        rollDeg: 0.0,
        pitchDeg: 0.0,
        yawDeg: 0.0,
        vibrationMmS: 0.0,
        accelG: 1.0,
        tempC: 25.0,
        humidityPct: 50.0,
        pressureHpa: 1013.25,
        soilMoisturePct: 30.0,
        crackWidthMm: 0.0,
        gasPpm: 0,
        rainfallMmHr: 0.0,
        batteryPct: 100,
        rssiDbm: -70,
        lastHeartbeat: Date.now()
      },
      thresholds: body.thresholds || {
        tiltWarningDeg: 3.5,
        tiltCriticalDeg: 6.0,
        vibrationWarningMmS: 5.0,
        vibrationCriticalMmS: 12.0,
        soilMoistureWarningPct: 75.0,
        soilMoistureCriticalPct: 85.0,
        crackWarningMm: 8.0,
        crackCriticalMm: 18.0,
        gasWarningPpm: 50,
        gasCriticalPpm: 120
      }
    };

    const isMock = getIsMock();
    if (!isMock) {
      await SensorNode.create(newNode).catch(e => console.warn('Mongo insert node note:', e.message));
    }
    InMemoryStore.nodes.push(newNode);

    wsManager.broadcast({
      type: 'new_node_registered',
      node: newNode
    });

    return res.status(201).json(newNode);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. PUT /api/nodes/:id/thresholds (Update node thresholds)
router.put('/:id/thresholds', async (req, res) => {
  try {
    const { id } = req.params;
    const { thresholds } = req.body || {};

    if (!thresholds) {
      return res.status(400).json({ status: 'error', message: 'Thresholds object required' });
    }

    const isMock = getIsMock();
    if (!isMock) {
      await SensorNode.updateOne({ id }, { $set: { thresholds } }).catch(() => null);
    }

    const memNode = InMemoryStore.nodes.find(n => n.id === id || n._id === id);
    if (memNode) {
      memNode.thresholds = { ...memNode.thresholds, ...thresholds };
    }

    wsManager.broadcast({
      type: 'node_thresholds_updated',
      node_id: id,
      thresholds
    });

    return res.json({ status: 'success', node_id: id, thresholds });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
