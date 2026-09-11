const express = require('express');
const router = express.Router();
const Gateway = require('../models/Gateway');
const { InMemoryStore } = require('../seed/seedData');
const { getIsMock } = require('../config/db');
const wsManager = require('../services/websocket');

// 1. GET /api/gateway/status
router.get('/status', async (req, res) => {
  try {
    const isMock = getIsMock();
    let gateways = [];

    if (!isMock) {
      gateways = await Gateway.find({}).catch(() => []);
    }

    if (!gateways || gateways.length === 0) {
      gateways = InMemoryStore.gateways;
    }

    return res.json(gateways);
  } catch (err) {
    return res.json(InMemoryStore.gateways);
  }
});

// 2. POST /api/gateway/telemetry
router.post('/telemetry', async (req, res) => {
  try {
    const body = req.body || {};
    const gwId = body.gateway_id || 'GW-01';

    const gwData = {
      gateway_id: gwId,
      mac: body.mac || 'E4:5F:01:9A:82:1C',
      battery_pct: body.battery_pct !== undefined ? body.battery_pct : 95.0,
      solar_watts: body.solar_watts !== undefined ? body.solar_watts : 120.0,
      gsm_bars: body.gsm_bars !== undefined ? body.gsm_bars : 5,
      cpu_temp_c: body.cpu_temp_c !== undefined ? body.cpu_temp_c : 41.5,
      ram_usage_pct: body.ram_usage_pct !== undefined ? body.ram_usage_pct : 28.0,
      internet_connected: body.internet_connected !== undefined ? body.internet_connected : true,
      wifi_hotspot_ssid: body.wifi_hotspot_ssid || 'GEOSENTINEL_SEC1_MASTER',
      local_siren_active: body.local_siren_active || false,
      last_heartbeat: new Date()
    };

    const isMock = getIsMock();
    if (!isMock) {
      await Gateway.updateOne({ gateway_id: gwId }, { $set: gwData }, { upsert: true }).catch(() => null);
    }

    const memGw = InMemoryStore.gateways.find(g => g.gateway_id === gwId);
    if (memGw) {
      Object.assign(memGw, gwData);
    } else {
      InMemoryStore.gateways.push(gwData);
    }

    wsManager.broadcast({
      type: 'gateway_telemetry_update',
      gateway: gwData,
      timestamp: new Date().toISOString()
    });

    return res.json({ status: 'ok', gateway_id: gwId });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. POST /api/gateway/sync (Store and forward packet buffer flush)
router.post('/sync', async (req, res) => {
  try {
    const { gateway_id, packets = [], gateway_telemetry } = req.body || {};
    const gwId = gateway_id || 'GW-01';

    wsManager.broadcast({
      type: 'gateway_sync_complete',
      gateway_id: gwId,
      synced_packets_count: packets.length,
      timestamp: new Date().toISOString()
    });

    return res.json({
      status: 'synced',
      gateway_id: gwId,
      packets_processed: packets.length,
      results: packets.map(p => ({ packet_id: p.id || p.node_id, status: 'processed' }))
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. POST /api/gateway/siren (Toggle audible siren)
router.post('/siren', async (req, res) => {
  try {
    const { gateway_id = 'GW-01', active = true } = req.body || {};
    const isMock = getIsMock();

    if (!isMock) {
      await Gateway.updateOne({ gateway_id }, { $set: { local_siren_active: active } }).catch(() => null);
    }

    const memGw = InMemoryStore.gateways.find(g => g.gateway_id === gateway_id);
    if (memGw) {
      memGw.local_siren_active = active;
    }

    wsManager.broadcast({
      type: 'gateway_siren_state',
      gateway_id,
      active
    });

    return res.json({ status: 'ok', gateway_id, siren_active: active });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
