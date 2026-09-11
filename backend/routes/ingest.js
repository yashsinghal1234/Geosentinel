const express = require('express');
const router = express.Router();
const SensorNode = require('../models/SensorNode');
const Alert = require('../models/Alert');
const Reading = require('../models/Reading');
const { InMemoryStore } = require('../seed/seedData');
const { getIsMock } = require('../config/db');
const wsManager = require('../services/websocket');

// 1. POST /api/ingest (Batch or Single IoT telemetry ingestion)
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const packets = Array.isArray(payload) ? payload : (payload.packets || [payload]);

    const results = [];

    for (const pkt of packets) {
      const nodeId = pkt.node_id || pkt.id || 'NODE-A';
      const readings = pkt.readings || pkt;

      const tiltDeg = parseFloat(readings.tiltDeg || readings.tilt || 0.0);
      const vibrationMmS = parseFloat(readings.vibrationMmS || readings.vibration || 0.0);
      const crackWidthMm = parseFloat(readings.crackWidthMm || 0.0);
      const soilMoisturePct = parseFloat(readings.soilMoisturePct || readings.soil_moist || 30.0);

      // Simple physics risk evaluation
      const riskScore = Math.min(100, Math.round((tiltDeg * 7 + vibrationMmS * 5 + crackWidthMm * 4 + soilMoisturePct * 0.3) * 10) / 10);
      let status = 'online';
      if (riskScore >= 80) status = 'critical';
      else if (riskScore >= 60) status = 'warning';

      const updateData = {
        'readings.tiltDeg': tiltDeg,
        'readings.vibrationMmS': vibrationMmS,
        'readings.crackWidthMm': crackWidthMm,
        'readings.soilMoisturePct': soilMoisturePct,
        'readings.lastHeartbeat': Date.now(),
        status
      };

      const isMock = getIsMock();
      if (!isMock) {
        await SensorNode.updateOne({ id: nodeId }, { $set: updateData }).catch(() => null);
        await Reading.create({
          node_id: nodeId,
          tiltDeg,
          vibrationMmS,
          crackWidthMm,
          soilMoisturePct,
          risk_score: riskScore,
          timestamp: new Date()
        }).catch(() => null);
      }

      // Update in memory store
      const memNode = InMemoryStore.nodes.find(n => n.id === nodeId || n._id === nodeId);
      if (memNode) {
        memNode.status = status;
        memNode.readings = {
          ...memNode.readings,
          tiltDeg,
          vibrationMmS,
          crackWidthMm,
          soilMoisturePct,
          lastHeartbeat: Date.now()
        };
      }

      // If critical, trigger alert
      if (status === 'critical') {
        const alertObj = {
          node_id: nodeId,
          alert_level: 5,
          level_name: 'Critical',
          message: `Critical threshold exceeded on ${nodeId}: Tilt ${tiltDeg}°, Crack ${crackWidthMm}mm`,
          dispatched_at: new Date(),
          resolved: false,
          false_alarm: false,
          sms_broadcast_count: 150,
          siren_triggered: true
        };

        if (!isMock) {
          await Alert.create(alertObj).catch(() => null);
        }
        InMemoryStore.alerts.unshift(alertObj);

        wsManager.broadcast({
          type: 'new_alert',
          alert: alertObj
        });
      }

      // Broadcast telemetry to dashboard
      wsManager.broadcast({
        type: 'node_telemetry_update',
        node_id: nodeId,
        readings: {
          tiltDeg,
          vibrationMmS,
          crackWidthMm,
          soilMoisturePct,
          riskScore
        },
        status
      });

      results.push({ node_id: nodeId, status: 'processed', riskScore });
    }

    return res.status(200).json({ status: 'ok', processed_count: results.length, results });
  } catch (err) {
    console.error('Ingest router error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
