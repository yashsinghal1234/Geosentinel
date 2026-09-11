const express = require('express');
const router = express.Router();
const CitizenReport = require('../models/CitizenReport');
const { DEFAULT_REPORTS, InMemoryStore, SVG_FRACTURE_SOIL } = require('../seed/seedData');
const { getIsMock } = require('../config/db');
const wsManager = require('../services/websocket');

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function evaluateSeverity(widthMm) {
  if (widthMm >= 30.0) return 'Critical Evacuation Hazard';
  if (widthMm >= 15.0) return 'Severe Subsidence Crack';
  if (widthMm >= 6.0) return 'Moderate Shear Fissure';
  return 'Minor Surface Tension';
}

// 1. GET /api/reports (List reports with filter)
router.get('/', async (req, res) => {
  try {
    const { status, zone, limit = 50 } = req.query;
    const isMock = getIsMock();
    let reports = [];

    if (!isMock) {
      try {
        const query = {};
        if (status) query.status = status;
        if (zone) query.zone = new RegExp(zone, 'i');

        reports = await CitizenReport.find(query).sort({ time_epoch: -1 }).limit(parseInt(limit, 10));
      } catch (err) {
        console.warn('MongoDB reports query note:', err.message);
      }
    }

    if (!reports || reports.length === 0) {
      let filtered = InMemoryStore.reports.length > 0 ? InMemoryStore.reports : DEFAULT_REPORTS;
      if (status) {
        filtered = filtered.filter(r => r.status.toLowerCase() === status.toLowerCase());
      }
      if (zone) {
        filtered = filtered.filter(r => r.zone.toLowerCase().includes(zone.toLowerCase()));
      }
      reports = filtered.slice(0, parseInt(limit, 10));
    }

    return res.json(reports);
  } catch (err) {
    console.error('Reports router error:', err);
    return res.json(DEFAULT_REPORTS);
  }
});

// 2. GET /api/reports/analytics/summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const isMock = getIsMock();
    let allReports = [];

    if (!isMock) {
      allReports = await CitizenReport.find({}).limit(200).catch(() => []);
    }
    if (!allReports || allReports.length === 0) {
      allReports = InMemoryStore.reports.length > 0 ? InMemoryStore.reports : DEFAULT_REPORTS;
    }

    const total = allReports.length;
    const pending = allReports.filter(r => r.status === 'Pending Review').length;
    const approved = allReports.filter(r => r.status && (r.status.includes('Corroborated') || r.status.includes('Approved'))).length;
    const dismissed = allReports.filter(r => r.status && r.status.includes('Dismissed')).length;
    const critical = allReports.filter(r => (r.crack_width_estimate_mm || 0) >= 15.0).length;
    const sumWidth = allReports.reduce((acc, r) => acc + (r.crack_width_estimate_mm || 0), 0);
    const avgWidth = total > 0 ? Math.round((sumWidth / total) * 10) / 10 : 0.0;

    return res.json({
      total_reports: total,
      pending_count: pending,
      approved_count: approved,
      dismissed_count: dismissed,
      avg_crack_width_mm: avgWidth,
      critical_fissures_count: critical
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. POST /api/reports (Submit new crack report)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const count = InMemoryStore.reports.length + 804;
    const reportId = `CR-${count}`;

    const widthMm = parseFloat(body.crack_width_estimate_mm || 5.0);
    const severity = body.severity || evaluateSeverity(widthMm);
    const photo = body.photo_url || body.photo_base64 || SVG_FRACTURE_SOIL;

    const lat = parseFloat(body.latitude || 23.7480);
    const lng = parseFloat(body.longitude || 86.4200);

    // Calculate nearest IoT sensor node
    const knownNodes = [
      { id: 'NODE-A', lat: 23.7530, lng: 86.4215 },
      { id: 'NODE-B', lat: 23.7505, lng: 86.4240 },
      { id: 'NODE-C', lat: 23.7555, lng: 86.4180 },
      { id: 'NODE-X', lat: 23.7482, lng: 86.4195 },
      { id: 'NODE-Y', lat: 23.7455, lng: 86.4160 },
      { id: 'NODE-Z', lat: 23.7435, lng: 86.4210 },
    ];

    let nearestNode = 'NODE-A';
    let minDist = Infinity;
    for (const n of knownNodes) {
      const d = calculateDistanceMeters(lat, lng, n.lat, n.lng);
      if (d < minDist) {
        minDist = d;
        nearestNode = n.id;
      }
    }

    const reportDict = {
      _id: reportId,
      id: reportId,
      reporter_name: (body.reporter_name || 'Anonymous Resident').trim(),
      phone: (body.phone || '+91 94311 00000').trim(),
      zone: body.zone || 'Sector 1 (North Overburden Slope)',
      latitude: lat,
      longitude: lng,
      crack_width_estimate_mm: widthMm,
      photo_url: photo,
      description: body.description || '',
      severity: severity,
      status: 'Pending Review',
      submitted_at: 'Just now',
      time_epoch: Date.now(),
      reviewed_by: null,
      review_notes: null,
      nearest_sensor_id: nearestNode,
      nearest_sensor_distance_m: minDist,
      ai_corroboration_confidence: Math.round((80.0 + (minDist % 18)) * 10) / 10
    };

    const isMock = getIsMock();
    if (!isMock) {
      await CitizenReport.create(reportDict).catch(e => console.warn('Mongo insert report note:', e.message));
    }
    InMemoryStore.reports.unshift(reportDict);

    // Broadcast over WebSocket to all active operator consoles
    wsManager.broadcast({
      type: 'new_citizen_report',
      report: reportDict
    });

    return res.status(201).json(reportDict);
  } catch (err) {
    console.error('Submit report error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. POST /api/reports/:id/review
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewed_by, review_notes } = req.body || {};

    let target = InMemoryStore.reports.find(r => r.id === id || r._id === id);

    let status = 'Pending Review';
    let defaultReviewer = reviewed_by || 'DGMS Mining Safety Inspector';
    let defaultNotes = review_notes || '';

    if (action === 'approve' || action === 'corroborate' || action === 'confirm') {
      status = 'Corroborated & Approved';
      defaultNotes = review_notes || 'Corroborated with nearest IoT mesh tilt trend. Dispatched ground safety inspection.';
    } else if (action === 'dismiss' || action === 'reject') {
      status = 'Dismissed (Non-critical)';
      defaultNotes = review_notes || 'Dismissed: Superficial surface shrinkage crack without sub-surface shear.';
    }

    if (target) {
      target.status = status;
      target.reviewed_by = defaultReviewer;
      target.review_notes = defaultNotes;
    }

    const isMock = getIsMock();
    if (!isMock) {
      await CitizenReport.updateOne(
        { id },
        {
          $set: {
            status,
            reviewed_by: defaultReviewer,
            review_notes: defaultNotes
          }
        }
      ).catch(() => null);
    }

    // Broadcast review event
    wsManager.broadcast({
      type: 'citizen_report_reviewed',
      report_id: id,
      status,
      reviewed_by: defaultReviewer
    });

    return res.json({
      status: 'success',
      report_id: id,
      new_status: status,
      reviewed_by: defaultReviewer,
      review_notes: defaultNotes
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
