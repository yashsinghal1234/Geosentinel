const mongoose = require('mongoose');

const CitizenReportSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
    index: true,
  },
  reporter_name: {
    type: String,
    default: 'Anonymous Resident',
  },
  phone: {
    type: String,
    default: '+91 94311 00000',
  },
  zone: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  crack_width_estimate_mm: {
    type: Number,
    required: true,
  },
  photo_url: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  severity: {
    type: String,
    default: 'Minor Surface Tension',
  },
  status: {
    type: String,
    enum: ['Pending Review', 'Corroborated & Approved', 'Dismissed (Non-critical)'],
    default: 'Pending Review',
    index: true,
  },
  submitted_at: {
    type: String,
    default: 'Just now',
  },
  time_epoch: {
    type: Number,
    default: () => Date.now(),
    index: true,
  },
  reviewed_by: {
    type: String,
    default: null,
  },
  review_notes: {
    type: String,
    default: null,
  },
  nearest_sensor_id: {
    type: String,
    default: 'NODE-A',
  },
  nearest_sensor_distance_m: {
    type: Number,
    default: 120,
  },
  ai_corroboration_confidence: {
    type: Number,
    default: 85.0,
  },
}, {
  timestamps: true,
  _id: false,
});

const CitizenReport = mongoose.models.CitizenReport || mongoose.model('CitizenReport', CitizenReportSchema);

module.exports = CitizenReport;
