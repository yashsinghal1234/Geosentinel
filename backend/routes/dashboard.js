const express = require('express');
const router = express.Router();
const SensorNode = require('../models/SensorNode');
const Alert = require('../models/Alert');
const Reading = require('../models/Reading');
const { DEFAULT_NODES, InMemoryStore } = require('../seed/seedData');
const { getIsMock } = require('../config/db');

// 1. GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const isMock = getIsMock();
    let nodes = [];
    let recentAlerts = [];

    if (!isMock) {
      nodes = await SensorNode.find({}).catch(() => []);
      recentAlerts = await Alert.find({}).sort({ dispatched_at: -1 }).limit(10).catch(() => []);
    }

    if (!nodes || nodes.length === 0) {
      nodes = InMemoryStore.nodes.length > 0 ? InMemoryStore.nodes : DEFAULT_NODES;
    }
    if (!recentAlerts || recentAlerts.length === 0) {
      recentAlerts = InMemoryStore.alerts;
    }

    const totalNodes = nodes.length;
    let activeCount = 0;
    let offlineCount = 0;
    let maxRisk = 0.0;
    const sectorRisks = { 1: [], 2: [], 3: [], 4: [] };

    for (const n of nodes) {
      const status = String(n.status || 'normal').toLowerCase();
      if (status === 'offline') {
        offlineCount++;
      } else {
        activeCount++;
      }

      // Compute proxy risk score
      const r = n.readings || {};
      const tilt = r.tiltDeg || 0;
      const vib = r.vibrationMmS || 0;
      const soil = r.soilMoisturePct || 0;
      const crack = r.crackWidthMm || 0;
      const rScore = Math.min(100, Math.round((tilt * 7 + vib * 5 + crack * 4 + soil * 0.3) * 10) / 10);

      if (rScore > maxRisk) maxRisk = rScore;

      const sector = n.sector || 1;
      if (!sectorRisks[sector]) sectorRisks[sector] = [];
      sectorRisks[sector].push(rScore);
    }

    let highestAlertLevel = 'Normal';
    if (maxRisk >= 80) highestAlertLevel = 'Critical';
    else if (maxRisk >= 60) highestAlertLevel = 'Warning';
    else if (maxRisk >= 40) highestAlertLevel = 'Advisory';
    else if (maxRisk >= 20) highestAlertLevel = 'Monitor';

    const zoneNames = {
      1: 'Zone North (Sector 1)',
      2: 'Zone East (Sector 2)',
      3: 'Zone South (Sector 3)',
      4: 'Zone West (Sector 4)'
    };

    const zoneBars = Object.keys(sectorRisks).map(sec => {
      const sId = parseInt(sec, 10);
      const scores = sectorRisks[sId];
      const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0.0;
      return {
        sector: sId,
        name: zoneNames[sId] || `Sector ${sId}`,
        risk_score: avg
      };
    });

    const alertRecords = recentAlerts.map(a => ({
      id: String(a._id || a.id),
      node_id: a.node_id,
      level: a.alert_level || 1,
      level_name: a.level_name || (a.alert_level >= 5 ? 'Critical' : a.alert_level >= 4 ? 'Warning' : 'Advisory'),
      message: a.message,
      dispatched_at: a.dispatched_at
    }));

    return res.json({
      current_alert_level: highestAlertLevel,
      highest_risk_score: maxRisk,
      active_nodes: activeCount > 0 ? activeCount : totalNodes,
      offline_nodes: offlineCount,
      total_nodes: totalNodes,
      high_risk_zones: zoneBars,
      alert_log: alertRecords
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. GET /api/dashboard/heatmap
router.get('/heatmap', async (req, res) => {
  try {
    const isMock = getIsMock();
    let nodes = [];

    if (!isMock) {
      nodes = await SensorNode.find({}).catch(() => []);
    }
    if (!nodes || nodes.length === 0) {
      nodes = InMemoryStore.nodes.length > 0 ? InMemoryStore.nodes : DEFAULT_NODES;
    }

    const heatmapData = nodes.map(n => {
      const r = n.readings || {};
      const tilt = r.tiltDeg || 0;
      const vib = r.vibrationMmS || 0;
      const crack = r.crackWidthMm || 0;
      const soil = r.soilMoisturePct || 0;
      const rScore = Math.min(100, Math.round((tilt * 7 + vib * 5 + crack * 4 + soil * 0.3) * 10) / 10);

      return {
        node_id: n.id || n._id,
        name: n.name,
        sector: n.sector || 1,
        x: n.lat ? (n.lat - 23.74) * 5000 : 50,
        y: n.lng ? (n.lng - 86.41) * 5000 : 50,
        lat: n.lat || 23.7500,
        lng: n.lng || 86.4200,
        riskScore: rScore,
        riskLevel: rScore >= 80 ? 'CRITICAL' : rScore >= 60 ? 'WARNING' : rScore >= 40 ? 'ADVISORY' : 'NORMAL',
        anomalyScore: rScore > 50 ? 0.85 : 0.12,
        tilt_x: r.rollDeg || 0.0,
        tilt_y: r.pitchDeg || 0.0,
        acceleration: r.accelG || 1.0,
        vibration: r.vibrationMmS || 0.0,
        soil_moist: r.soilMoisturePct || 30.0,
        temperature: r.tempC || 25.0,
        humidity: r.humidityPct || 50.0,
        pressure: r.pressureHpa || 1013.25,
        battery: r.batteryPct || 100,
        packet_loss: 0.1,
        status: n.status || 'online',
        node_status: n.status === 'offline' ? 'OFFLINE' : 'ONLINE'
      };
    });

    return res.json(heatmapData);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. GET /api/dashboard/topology
router.get('/topology', async (req, res) => {
  try {
    const isMock = getIsMock();
    let nodes = [];

    if (!isMock) {
      nodes = await SensorNode.find({}).catch(() => []);
    }
    if (!nodes || nodes.length === 0) {
      nodes = InMemoryStore.nodes.length > 0 ? InMemoryStore.nodes : DEFAULT_NODES;
    }

    const topoList = nodes.map(n => ({
      id: n.id || n._id,
      name: n.name,
      sector: n.sector || 1,
      status: n.status || 'normal',
      node_status: n.status === 'offline' ? 'OFFLINE' : 'ONLINE',
      risk_score: n.status === 'critical' ? 84.5 : n.status === 'warning' ? 62.0 : 14.2,
      risk_level: (n.status || 'NORMAL').toUpperCase(),
      last_heartbeat: n.readings?.lastHeartbeat || Date.now()
    }));

    return res.json(topoList);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
