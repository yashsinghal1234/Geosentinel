const mongoose = require('mongoose');

const SensorNodeSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'multi_sensor_node',
  },
  hardwareModel: {
    type: String,
    default: 'ESP32-S3 (BNO085 + BME280 + Soil Moisture)',
  },
  zone: {
    type: String,
    default: 'Sector 1 (North Overburden Slope)',
  },
  sector: {
    type: Number,
    default: 1,
    index: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  elevationMeters: {
    type: Number,
    default: 220,
  },
  meshHopCount: {
    type: Number,
    default: 1,
  },
  parentNodeId: {
    type: String,
    default: 'MASTER-S1',
  },
  masterId: {
    type: String,
    default: 'MASTER-S1',
  },
  status: {
    type: String,
    enum: ['online', 'warning', 'critical', 'offline'],
    default: 'online',
  },
  readings: {
    tiltDeg: { type: Number, default: 0.0 },
    rollDeg: { type: Number, default: 0.0 },
    pitchDeg: { type: Number, default: 0.0 },
    yawDeg: { type: Number, default: 0.0 },
    vibrationMmS: { type: Number, default: 0.0 },
    accelG: { type: Number, default: 1.0 },
    tempC: { type: Number, default: 25.0 },
    humidityPct: { type: Number, default: 50.0 },
    pressureHpa: { type: Number, default: 1013.25 },
    soilMoisturePct: { type: Number, default: 30.0 },
    crackWidthMm: { type: Number, default: 0.0 },
    gasPpm: { type: Number, default: 0 },
    rainfallMmHr: { type: Number, default: 0.0 },
    batteryPct: { type: Number, default: 100 },
    rssiDbm: { type: Number, default: -70 },
    lastHeartbeat: { type: Number, default: () => Date.now() },
  },
  thresholds: {
    tiltWarningDeg: { type: Number, default: 3.5 },
    tiltCriticalDeg: { type: Number, default: 6.0 },
    vibrationWarningMmS: { type: Number, default: 5.0 },
    vibrationCriticalMmS: { type: Number, default: 12.0 },
    soilMoistureWarningPct: { type: Number, default: 75.0 },
    soilMoistureCriticalPct: { type: Number, default: 85.0 },
    crackWarningMm: { type: Number, default: 8.0 },
    crackCriticalMm: { type: Number, default: 18.0 },
    gasWarningPpm: { type: Number, default: 50 },
    gasCriticalPpm: { type: Number, default: 120 },
  }
}, {
  timestamps: true,
  _id: false,
});

const SensorNode = mongoose.models.SensorNode || mongoose.model('SensorNode', SensorNodeSchema);

module.exports = SensorNode;
