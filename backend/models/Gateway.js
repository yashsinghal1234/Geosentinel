const mongoose = require('mongoose');

const GatewaySchema = new mongoose.Schema({
  gateway_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  mac: {
    type: String,
    default: 'E4:5F:01:9A:82:1C',
  },
  battery_pct: {
    type: Number,
    default: 95.0,
  },
  solar_watts: {
    type: Number,
    default: 120.0,
  },
  gsm_bars: {
    type: Number,
    default: 5,
  },
  cpu_temp_c: {
    type: Number,
    default: 41.5,
  },
  ram_usage_pct: {
    type: Number,
    default: 28.0,
  },
  internet_connected: {
    type: Boolean,
    default: true,
  },
  wifi_hotspot_ssid: {
    type: String,
    default: 'GEOSENTINEL_SEC1_MASTER',
  },
  local_siren_active: {
    type: Boolean,
    default: false,
  },
  buffer_count: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: 'online',
  },
  last_heartbeat: {
    type: Date,
    default: Date.now,
  },
  last_sync_time: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

const Gateway = mongoose.models.Gateway || mongoose.model('Gateway', GatewaySchema);

module.exports = Gateway;
