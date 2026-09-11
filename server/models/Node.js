import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema({
  timestamp: String,
  timeEpoch: Number,
  tiltDeg: Number,
  vibrationMmS: Number,
  crackWidthMm: Number,
  gasPpm: Number,
  riskScore: Number
}, { _id: false });

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  code: String,
  type: String, // e.g. 'tiltmeter', 'geophone'
  zone: String,
  lat: Number,
  lng: Number,
  elevationMeters: Number,
  depthMeters: Number,
  meshHopCount: Number,
  parentNodeId: String,
  status: String,
  readings: {
    tiltDeg: Number,
    vibrationMmS: Number,
    crackWidthMm: Number,
    gasPpm: Number,
    rainfallMmHr: Number,
    batteryPct: Number,
    rssiDbm: Number,
    lastHeartbeat: Number
  },
  history: [telemetrySchema],
  thresholds: {
    tiltWarningDeg: Number,
    tiltCriticalDeg: Number,
    vibrationWarningMmS: Number,
    vibrationCriticalMmS: Number,
    crackWarningMm: Number,
    crackCriticalMm: Number,
    gasWarningPpm: Number,
    gasCriticalPpm: Number
  }
}, { timestamps: true });

const Node = mongoose.model('Node', nodeSchema);
export default Node;
