const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
  node_id: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  tilt_x: { type: Number, default: 0.0 },
  tilt_y: { type: Number, default: 0.0 },
  tiltDeg: { type: Number, default: 0.0 },
  rollDeg: { type: Number, default: 0.0 },
  pitchDeg: { type: Number, default: 0.0 },
  yawDeg: { type: Number, default: 0.0 },
  acceleration: { type: Number, default: 9.8 },
  accelG: { type: Number, default: 1.0 },
  vibration: { type: Number, default: 0.0 },
  vibrationMmS: { type: Number, default: 0.0 },
  soil_moist: { type: Number, default: 30.0 },
  soilMoisturePct: { type: Number, default: 30.0 },
  temperature: { type: Number, default: 25.0 },
  tempC: { type: Number, default: 25.0 },
  humidity: { type: Number, default: 50.0 },
  humidityPct: { type: Number, default: 50.0 },
  pressure: { type: Number, default: 1013.25 },
  pressureHpa: { type: Number, default: 1013.25 },
  crackWidthMm: { type: Number, default: 0.0 },
  gasPpm: { type: Number, default: 0 },
  battery: { type: Number, default: 100.0 },
  batteryPct: { type: Number, default: 100 },
  packet_loss: { type: Number, default: 0.0 },
  risk_score: { type: Number, default: 0.0 },
  risk_level: { type: String, default: 'NORMAL' },
  anomaly_score: { type: Number, default: 0.0 },
  gateway_id: { type: String, default: 'GW-01' },
}, {
  timestamps: true,
});

// Index for fast time-series queries
ReadingSchema.index({ node_id: 1, timestamp: -1 });

const Reading = mongoose.models.Reading || mongoose.model('Reading', ReadingSchema);

module.exports = Reading;
