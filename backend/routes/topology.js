const express = require('express');
const router = express.Router();
const SensorNode = require('../models/SensorNode');
const { DEFAULT_NODES, DEFAULT_MASTERS, InMemoryStore } = require('../seed/seedData');
const { getIsMock } = require('../config/db');

// 1. GET /api/topology
router.get('/', async (req, res) => {
  try {
    const isMock = getIsMock();
    let nodeDocs = [];

    if (!isMock) {
      try {
        nodeDocs = await SensorNode.find({});
      } catch (err) {
        console.warn('MongoDB topology nodes note:', err.message);
      }
    }

    if (!nodeDocs || nodeDocs.length === 0) {
      nodeDocs = InMemoryStore.nodes.length > 0 ? InMemoryStore.nodes : DEFAULT_NODES;
    }

    const masters = DEFAULT_MASTERS;

    // Collect all points for dynamic bounding box calculation
    const allPoints = [];

    for (const m of masters) {
      allPoints.push({
        id: m.id,
        name: m.name,
        code: m.code,
        lat: parseFloat(m.lat || 23.7500),
        lng: parseFloat(m.lng || 86.4200),
        role: 'master',
        sector: m.sector || 1,
        status: m.status || 'online',
        data: m
      });
    }

    for (const n of nodeDocs) {
      const nId = n.id || n._id || 'NODE';
      allPoints.push({
        id: nId,
        name: n.name || `Node ${nId}`,
        code: n.code || nId,
        lat: parseFloat(n.lat || 23.7500),
        lng: parseFloat(n.lng || 86.4200),
        role: 'node',
        sector: n.sector || 1,
        status: n.status || 'online',
        parentNodeId: n.parentNodeId,
        masterId: n.masterId,
        meshHopCount: n.meshHopCount || 1,
        readings: n.readings || {},
        data: n
      });
    }

    const lats = allPoints.map(p => p.lat);
    const lngs = allPoints.map(p => p.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    let latSpan = maxLat - minLat;
    let lngSpan = maxLng - minLng;
    if (latSpan < 0.0001) latSpan = 0.01;
    if (lngSpan < 0.0001) lngSpan = 0.01;

    // Normalize to SVG Canvas (Width: 1000, Height: 520)
    const canvasNodes = [];
    const masterMap = {};
    masters.forEach(m => { masterMap[m.id] = m; });

    for (const p of allPoints) {
      const normX = 100 + ((p.lng - minLng) / lngSpan) * 800;
      const normY = 440 - ((p.lat - minLat) / latSpan) * 360;

      let colorPrimary = '#22c55e';
      let colorBorder = '#86efac';
      let badgeLabel = 'POD';

      if (p.role === 'master') {
        colorPrimary = '#a855f7';
        colorBorder = '#d8b4fe';
        badgeLabel = 'MASTER';
      } else if (p.status === 'critical') {
        colorPrimary = '#ef4444';
        colorBorder = '#fca5a5';
        badgeLabel = 'CRITICAL';
      } else if (p.status === 'warning') {
        colorPrimary = '#f59e0b';
        colorBorder = '#fde68a';
        badgeLabel = 'WARNING';
      }

      canvasNodes.push({
        id: p.id,
        name: p.name,
        code: p.code,
        role: p.role,
        sector: p.sector,
        status: p.status,
        lat: p.lat,
        lng: p.lng,
        x: Math.round(normX * 10) / 10,
        y: Math.round(normY * 10) / 10,
        colorPrimary,
        colorBorder,
        badgeLabel,
        meshHopCount: p.meshHopCount || 1,
        parentNodeId: p.parentNodeId,
        masterId: p.masterId,
        readings: p.readings,
        data: p.data
      });
    }

    // Dynamic Topology Links
    const links = [];

    // Inter-Master LoRa Bridge
    for (let i = 0; i < masters.length; i++) {
      for (let j = i + 1; j < masters.length; j++) {
        const m1 = masters[i];
        const m2 = masters[j];
        links.push({
          id: `link-intermaster-${m1.id}-${m2.id}`,
          sourceId: m1.id,
          targetId: m2.id,
          protocol: 'LoRa 868MHz',
          linkType: 'inter_master_lora',
          rssiDbm: -79,
          packetLossPct: 0.0,
          active: true,
          color: '#c084fc',
          label: 'LoRa 868MHz Bridge (ACK Sync)'
        });
      }
    }

    // Pod Mesh Links
    for (const n of canvasNodes) {
      if (n.role === 'master') continue;

      let targetId = n.parentNodeId;
      if (!targetId || targetId === n.id) {
        targetId = n.masterId || (masterMap[`MASTER-S${n.sector}`] ? `MASTER-S${n.sector}` : 'MASTER-S1');
      }

      const rssi = (n.readings && n.readings.rssiDbm) ? n.readings.rssiDbm : -70;
      const isDirectToMaster = targetId.startsWith('MASTER');

      links.push({
        id: `link-${n.id}-${targetId}`,
        sourceId: n.id,
        targetId: targetId,
        protocol: 'WiFi Mesh 2.4GHz',
        linkType: isDirectToMaster ? 'mesh_direct' : 'mesh_multi_hop',
        rssiDbm: rssi,
        packetLossPct: rssi > -75 ? 0.1 : 0.4,
        active: n.status !== 'offline',
        color: '#38bdf8',
        label: `WiFi Mesh Hop ${n.meshHopCount || 1}`
      });
    }

    return res.json({
      status: 'success',
      nodes: canvasNodes,
      links: links,
      masters: masters,
      metrics: {
        totalNodes: canvasNodes.length,
        masterCount: masters.length,
        linkCount: links.length,
        packetDeliveryRate: 99.8,
        avgHopCount: 1.4,
        selfHealingStatus: 'Active'
      }
    });
  } catch (err) {
    console.error('Topology router error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
