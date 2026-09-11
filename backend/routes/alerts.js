const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { InMemoryStore } = require('../seed/seedData');
const { getIsMock } = require('../config/db');
const wsManager = require('../services/websocket');

// 1. GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const isMock = getIsMock();
    let alerts = [];

    if (!isMock) {
      alerts = await Alert.find({}).sort({ dispatched_at: -1 }).limit(100).catch(() => []);
    }

    if (!alerts || alerts.length === 0) {
      alerts = InMemoryStore.alerts;
    }

    return res.json(alerts);
  } catch (err) {
    return res.json(InMemoryStore.alerts);
  }
});

// 2. POST /api/alerts/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const isMock = getIsMock();

    if (!isMock) {
      await Alert.updateOne(
        { _id: id },
        { $set: { resolved: true, resolved_at: new Date() } }
      ).catch(() => null);
    }

    const memAlert = InMemoryStore.alerts.find(a => String(a._id) === id);
    if (memAlert) {
      memAlert.resolved = true;
      memAlert.resolved_at = new Date();
    }

    wsManager.broadcast({
      type: 'alert_cancelled',
      alert_id: id
    });

    return res.json({ status: 'cancelled', alert_id: id });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. POST /api/alerts/:id/mark-false
router.post('/:id/mark-false', async (req, res) => {
  try {
    const { id } = req.params;
    const isMock = getIsMock();

    if (!isMock) {
      await Alert.updateOne(
        { _id: id },
        { $set: { false_alarm: true, resolved: true, resolved_at: new Date() } }
      ).catch(() => null);
    }

    const memAlert = InMemoryStore.alerts.find(a => String(a._id) === id);
    if (memAlert) {
      memAlert.false_alarm = true;
      memAlert.resolved = true;
      memAlert.resolved_at = new Date();
    }

    return res.json({ status: 'marked_false', alert_id: id });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
