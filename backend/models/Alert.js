const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  node_id: {
    type: String,
    required: true,
    index: true,
  },
  alert_level: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  level_name: {
    type: String,
    default: 'Advisory',
  },
  message: {
    type: String,
    required: true,
  },
  dispatched_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true,
  },
  resolved_at: {
    type: Date,
    default: null,
  },
  false_alarm: {
    type: Boolean,
    default: false,
  },
  sms_broadcast_count: {
    type: Number,
    default: 0,
  },
  siren_triggered: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

module.exports = Alert;
