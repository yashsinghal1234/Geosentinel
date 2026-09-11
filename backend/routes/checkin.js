const express = require('express');
const router = express.Router();
const Checkin = require('../models/Checkin');
const { InMemoryStore } = require('../seed/seedData');
const { getIsMock } = require('../config/db');
const wsManager = require('../services/websocket');

// 1. POST /api/checkin
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const checkinDoc = {
      user_name: body.user_name || 'Resident',
      phone: body.phone || '',
      alert_id: body.alert_id || null,
      zone: body.zone || 'Sector 1',
      status: body.status || 'safe',
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      members_count: body.members_count || 1,
      notes: body.notes || '',
      submitted_at: new Date()
    };

    const isMock = getIsMock();
    if (!isMock) {
      await Checkin.create(checkinDoc).catch(() => null);
    }
    InMemoryStore.checkins.push(checkinDoc);

    wsManager.broadcast({
      type: 'new_checkin',
      status: checkinDoc.status,
      alert_id: checkinDoc.alert_id,
      zone: checkinDoc.zone,
      user_name: checkinDoc.user_name
    });

    return res.json({ status: 'received', checkin: checkinDoc });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. GET /api/checkin
router.get('/', async (req, res) => {
  try {
    const isMock = getIsMock();
    let list = [];
    if (!isMock) {
      list = await Checkin.find({}).sort({ submitted_at: -1 }).limit(100).catch(() => []);
    }
    if (!list || list.length === 0) {
      list = InMemoryStore.checkins;
    }
    return res.json(list);
  } catch (err) {
    return res.json(InMemoryStore.checkins);
  }
});

module.exports = router;
