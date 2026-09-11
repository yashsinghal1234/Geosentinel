const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SensorNode = require('../models/SensorNode');
const CitizenReport = require('../models/CitizenReport');
const Gateway = require('../models/Gateway');
const Alert = require('../models/Alert');

const SVG_FRACTURE_SOIL =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>" +
  "<rect width='100%' height='100%' fill='%2312151c'/>" +
  "<path d='M30 40 Q 110 90, 160 140 T 260 210 T 370 260' stroke='%2338bdf8' stroke-width='4' fill='none'/>" +
  "<path d='M160 140 Q 190 90, 240 70' stroke='%2338bdf8' stroke-width='2.5' fill='none' stroke-dasharray='4,2'/>" +
  "<path d='M260 210 Q 290 240, 320 280' stroke='%230284c7' stroke-width='2' fill='none'/>" +
  "<circle cx='160' cy='140' r='5' fill='%23ef4444'/>" +
  "<text x='20' y='280' fill='%2394a3b8' font-family='sans-serif' font-size='12'>SOIL SHEAR FISSURE • SECTOR 4</text>" +
  "</svg>";

const SVG_FRACTURE_WALL =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>" +
  "<rect width='100%' height='100%' fill='%231a141f'/>" +
  "<path d='M60 20 L 120 110 L 90 180 L 150 280' stroke='%23f59e0b' stroke-width='5' fill='none'/>" +
  "<path d='M120 110 L 220 130 L 310 160' stroke='%23f59e0b' stroke-width='3' fill='none'/>" +
  "<circle cx='120' cy='110' r='6' fill='%23ef4444'/>" +
  "<text x='20' y='280' fill='%23d8b4fe' font-family='sans-serif' font-size='12'>MASONRY WALL SEPARATION • SECTOR 3</text>" +
  "</svg>";

const SVG_FRACTURE_ROAD =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>" +
  "<rect width='100%' height='100%' fill='%230f141a'/>" +
  "<path d='M20 150 Q 140 140, 220 160 T 380 145' stroke='%23ef4444' stroke-width='6' fill='none'/>" +
  "<path d='M220 160 Q 250 80, 290 30' stroke='%23f87171' stroke-width='3' fill='none'/>" +
  "<circle cx='220' cy='160' r='6' fill='%23ef4444'/>" +
  "<text x='20' y='280' fill='%23cbd5e1' font-family='sans-serif' font-size='12'>ROADWAY EMBANKMENT CRACK • SECTOR 2</text>" +
  "</svg>";

const DEFAULT_USERS = [
  {
    username: 'admin@geo.com',
    email: 'admin@geo.com',
    name: 'Directorate General (DGMS Admin)',
    role: 'admin',
    password: 'password123',
    badge: 'ADMIN L4'
  },
  {
    username: 'admin',
    email: 'admin@geo.com',
    name: 'System Administrator',
    role: 'admin',
    password: 'password123',
    badge: 'ADMIN L4'
  },
  {
    username: 'operator@geosentinel.gov.in',
    email: 'operator@geosentinel.gov.in',
    name: 'S. K. Verma (Chief Mining Safety Engineer)',
    role: 'operator',
    password: 'password123',
    badge: 'OPERATOR L3'
  },
  {
    username: 'operator',
    email: 'operator@geosentinel.gov.in',
    name: 'Safety Operations Engineer',
    role: 'operator',
    password: 'password123',
    badge: 'OPERATOR L2'
  }
];

const DEFAULT_NODES = [
  {
    _id: 'NODE-A',
    id: 'NODE-A',
    name: 'Node A (Sector 1 High Ridge)',
    code: 'ESP32-S3-S1-A',
    type: 'multi_sensor_node',
    hardwareModel: 'ESP32-S3 (BNO085 + BME280 + Soil Moisture)',
    zone: 'Sector 1 (North Overburden Slope)',
    sector: 1,
    lat: 23.7530,
    lng: 86.4215,
    elevationMeters: 235,
    meshHopCount: 1,
    parentNodeId: 'MASTER-S1',
    masterId: 'MASTER-S1',
    status: 'online',
    readings: {
      tiltDeg: 1.42,
      rollDeg: 1.15,
      pitchDeg: 1.42,
      yawDeg: 14.5,
      vibrationMmS: 0.8,
      accelG: 0.998,
      tempC: 27.4,
      humidityPct: 62.0,
      pressureHpa: 1011.2,
      soilMoisturePct: 68.0,
      crackWidthMm: 2.1,
      gasPpm: 12,
      rainfallMmHr: 4.2,
      batteryPct: 96,
      rssiDbm: -68,
      lastHeartbeat: Date.now(),
    },
    thresholds: {
      tiltWarningDeg: 3.5,
      tiltCriticalDeg: 6.0,
      vibrationWarningMmS: 5.0,
      vibrationCriticalMmS: 12.0,
      soilMoistureWarningPct: 75.0,
      soilMoistureCriticalPct: 85.0,
      crackWarningMm: 8.0,
      crackCriticalMm: 18.0,
      gasWarningPpm: 50,
      gasCriticalPpm: 120,
    },
  },
  {
    _id: 'NODE-B',
    id: 'NODE-B',
    name: 'Node B (Sector 1 Bench Creep)',
    code: 'ESP32-S3-S1-B',
    type: 'multi_sensor_node',
    hardwareModel: 'ESP32-S3 (BNO085 + BME280 + Soil Moisture)',
    zone: 'Sector 1 (North Overburden Slope)',
    sector: 1,
    lat: 23.7505,
    lng: 86.4240,
    elevationMeters: 224,
    meshHopCount: 1,
    parentNodeId: 'MASTER-S1',
    masterId: 'MASTER-S1',
    status: 'warning',
    readings: {
      tiltDeg: 3.82,
      rollDeg: 2.90,
      pitchDeg: 3.82,
      yawDeg: 22.0,
      vibrationMmS: 2.4,
      accelG: 1.042,
      tempC: 28.1,
      humidityPct: 71.0,
      pressureHpa: 1009.5,
      soilMoisturePct: 78.5,
      crackWidthMm: 4.8,
      gasPpm: 18,
      rainfallMmHr: 4.2,
      batteryPct: 91,
      rssiDbm: -74,
      lastHeartbeat: Date.now(),
    },
    thresholds: {
      tiltWarningDeg: 3.5,
      tiltCriticalDeg: 6.0,
      vibrationWarningMmS: 4.5,
      vibrationCriticalMmS: 10.0,
      soilMoistureWarningPct: 75.0,
      soilMoistureCriticalPct: 85.0,
      crackWarningMm: 8.0,
      crackCriticalMm: 16.0,
      gasWarningPpm: 40,
      gasCriticalPpm: 100,
    },
  },
  {
    _id: 'NODE-C',
    id: 'NODE-C',
    name: 'Node C (Sector 1 Perimeter)',
    code: 'ESP32-S3-S1-C',
    type: 'multi_sensor_node',
    hardwareModel: 'ESP32-S3 (BNO085 + BME280 + Soil Moisture)',
    zone: 'Sector 1 (North Overburden Slope)',
    sector: 1,
    lat: 23.7555,
    lng: 86.4180,
    elevationMeters: 240,
    meshHopCount: 2,
    parentNodeId: 'NODE-A',
    masterId: 'MASTER-S1',
    status: 'online',
    readings: {
      tiltDeg: 0.85,
      rollDeg: 0.60,
      pitchDeg: 0.85,
      yawDeg: 8.2,
      vibrationMmS: 0.4,
      accelG: 0.999,
      tempC: 26.5,
      humidityPct: 56.0,
      pressureHpa: 1012.4,
      soilMoisturePct: 42.0,
      crackWidthMm: 0.5,
      gasPpm: 8,
      rainfallMmHr: 4.2,
      batteryPct: 98,
      rssiDbm: -82,
      lastHeartbeat: Date.now(),
    },
    thresholds: {
      tiltWarningDeg: 3.5,
      tiltCriticalDeg: 6.0,
      vibrationWarningMmS: 5.0,
      vibrationCriticalMmS: 12.0,
      soilMoistureWarningPct: 75.0,
      soilMoistureCriticalPct: 85.0,
      crackWarningMm: 8.0,
      crackCriticalMm: 18.0,
      gasWarningPpm: 50,
      gasCriticalPpm: 120,
    },
  },
  {
    _id: 'NODE-X',
    id: 'NODE-X',
    name: 'Node X (Sector 2 Village Buffer)',
    code: 'ESP32-S3-S2-X',
    type: 'multi_sensor_node',
    hardwareModel: 'ESP32-S3 (BNO085 + BME280 + Soil Moisture)',
    zone: 'Sector 2 (East Highwall & Village Buffer)',
    sector: 2,
    lat: 23.7482,
    lng: 86.4195,
    elevationMeters: 228,
    meshHopCount: 1,
    parentNodeId: 'MASTER-S2',
    masterId: 'MASTER-S2',
    status: 'critical',
    readings: {
      tiltDeg: 6.45,
      rollDeg: 5.10,
      pitchDeg: 6.45,
      yawDeg: 38.4,
      vibrationMmS: 5.8,
      accelG: 1.185,
      tempC: 29.5,
      humidityPct: 84.0,
      pressureHpa: 1004.2,
      soilMoisturePct: 86.2,
      crackWidthMm: 9.4,
      gasPpm: 32,
      rainfallMmHr: 4.2,
      batteryPct: 88,
      rssiDbm: -65,
      lastHeartbeat: Date.now(),
    },
    thresholds: {
      tiltWarningDeg: 3.5,
      tiltCriticalDeg: 6.0,
      vibrationWarningMmS: 5.0,
      vibrationCriticalMmS: 12.0,
      soilMoistureWarningPct: 75.0,
      soilMoistureCriticalPct: 85.0,
      crackWarningMm: 8.0,
      crackCriticalMm: 18.0,
      gasWarningPpm: 50,
      gasCriticalPpm: 120,
    },
  },
  {
    _id: 'NODE-Y',
    id: 'NODE-Y',
    name: 'Node Y (Sector 2 Highwall Edge)',
    code: 'ESP32-S3-S2-Y',
    type: 'multi_sensor_node',
    hardwareModel: 'ESP32-S3 (BNO085 + BME280 + Soil Moisture)',
    zone: 'Sector 2 (East Highwall & Village Buffer)',
    sector: 2,
    lat: 23.7455,
    lng: 86.4160,
    elevationMeters: 204,
    meshHopCount: 1,
    parentNodeId: 'MASTER-S2',
    masterId: 'MASTER-S2',
    status: 'warning',
    readings: {
      tiltDeg: 4.15,
      rollDeg: 3.40,
      pitchDeg: 4.15,
      yawDeg: 26.0,
      vibrationMmS: 3.1,
      accelG: 1.080,
      tempC: 28.8,
      humidityPct: 76.0,
      pressureHpa: 1007.0,
      soilMoisturePct: 79.8,
      crackWidthMm: 6.2,
      gasPpm: 26,
      rainfallMmHr: 4.2,
      batteryPct: 92,
      rssiDbm: -72,
      lastHeartbeat: Date.now(),
    },
    thresholds: {
      tiltWarningDeg: 3.0,
      tiltCriticalDeg: 5.5,
      vibrationWarningMmS: 4.0,
      vibrationCriticalMmS: 9.0,
      soilMoistureWarningPct: 75.0,
      soilMoistureCriticalPct: 85.0,
      crackWarningMm: 7.0,
      crackCriticalMm: 15.0,
      gasWarningPpm: 45,
      gasCriticalPpm: 110,
    },
  },
  {
    _id: 'NODE-Z',
    id: 'NODE-Z',
    name: 'Node Z (Sector 2 Haul Route)',
    code: 'ESP32-S3-S2-Z',
    type: 'multi_sensor_node',
    hardwareModel: 'ESP32-S3 (BNO085 + BME280 + Soil Moisture)',
    zone: 'Sector 2 (East Highwall & Village Buffer)',
    sector: 2,
    lat: 23.7435,
    lng: 86.4210,
    elevationMeters: 218,
    meshHopCount: 2,
    parentNodeId: 'NODE-Y',
    masterId: 'MASTER-S2',
    status: 'online',
    readings: {
      tiltDeg: 1.10,
      rollDeg: 0.90,
      pitchDeg: 1.10,
      yawDeg: 12.0,
      vibrationMmS: 1.2,
      accelG: 1.005,
      tempC: 27.2,
      humidityPct: 60.0,
      pressureHpa: 1011.0,
      soilMoisturePct: 49.0,
      crackWidthMm: 1.2,
      gasPpm: 10,
      rainfallMmHr: 4.2,
      batteryPct: 97,
      rssiDbm: -85,
      lastHeartbeat: Date.now(),
    },
    thresholds: {
      tiltWarningDeg: 3.0,
      tiltCriticalDeg: 5.0,
      vibrationWarningMmS: 3.5,
      vibrationCriticalMmS: 8.0,
      soilMoistureWarningPct: 75.0,
      soilMoistureCriticalPct: 85.0,
      crackWarningMm: 6.0,
      crackCriticalMm: 14.0,
      gasWarningPpm: 50,
      gasCriticalPpm: 100,
    },
  },
];

const DEFAULT_REPORTS = [
  {
    _id: 'CR-801',
    id: 'CR-801',
    reporter_name: 'Manoj Kumar Soren',
    phone: '+91 94311 88421',
    zone: 'Sector 4 (Village Slope)',
    latitude: 23.7482,
    longitude: 86.4215,
    crack_width_estimate_mm: 9.0,
    photo_url: SVG_FRACTURE_SOIL,
    description: 'Ground crack running across courtyard near primary school, expanded noticeably overnight.',
    severity: 'Moderate Shear Fissure',
    status: 'Corroborated & Approved',
    submitted_at: '28 mins ago',
    time_epoch: Date.now() - (28 * 60 * 1000),
    reviewed_by: 'DGMS Geologist Dr. K. Roy',
    review_notes: 'Corroborates with +1.8mm/hr displacement on SN-04 extensometer. Village advisory dispatched.',
    nearest_sensor_id: 'NODE-D',
    nearest_sensor_distance_m: 145.0,
    ai_corroboration_confidence: 94.2
  },
  {
    _id: 'CR-802',
    id: 'CR-802',
    reporter_name: 'Sujata Devi',
    phone: '+91 98210 44299',
    zone: 'Sector 3 (Abandoned Gallery)',
    latitude: 23.7462,
    longitude: 86.4168,
    crack_width_estimate_mm: 16.0,
    photo_url: SVG_FRACTURE_WALL,
    description: 'Wall splitting along eastern foundation of pump house adjacent to old incline gallery.',
    severity: 'Severe Subsidence Crack',
    status: 'Corroborated & Approved',
    submitted_at: '2 hours ago',
    time_epoch: Date.now() - (120 * 60 * 1000),
    reviewed_by: 'Mine Safety Inspector T. Sen',
    review_notes: 'Adjacent to underground void SN-03; High strain shear zone verified.',
    nearest_sensor_id: 'NODE-C',
    nearest_sensor_distance_m: 88.0,
    ai_corroboration_confidence: 98.7
  },
  {
    _id: 'CR-803',
    id: 'CR-803',
    reporter_name: 'Rameshwar Mahato',
    phone: '+91 91223 90812',
    zone: 'Sector 2 (Riverbank Overburden)',
    latitude: 23.7521,
    longitude: 86.4245,
    crack_width_estimate_mm: 4.0,
    photo_url: SVG_FRACTURE_ROAD,
    description: 'Superficial soil drying cracks observed on road embankment after blast cycle.',
    severity: 'Minor Surface Tension',
    status: 'Pending Review',
    submitted_at: '4 hours ago',
    time_epoch: Date.now() - (240 * 60 * 1000),
    reviewed_by: null,
    review_notes: null,
    nearest_sensor_id: 'NODE-B',
    nearest_sensor_distance_m: 210.0,
    ai_corroboration_confidence: 76.5
  }
];

const DEFAULT_MASTERS = [
  {
    id: 'MASTER-S1',
    name: 'Sector-1 Master Hub (Raspberry Pi 4)',
    code: 'RPI4-SEC1-HUB',
    hardware_model: 'Raspberry Pi 4 Model B',
    sector: 1,
    lat: 23.7535,
    lng: 86.4225,
    ip: '192.168.1.1',
    mac: 'DC:A6:32:4E:91:A1',
    status: 'online',
    internet_connected: true,
    battery_pct: 99,
    wifi_hotspot_ssid: 'GEOSENTINEL_SEC1_MASTER',
    edge_ai_status: 'inferencing',
    edge_ai_fps: 14.6,
    solar_watts: 120,
    gsm_bars: 5,
    cpu_temp_c: 41.5,
    ram_usage_pct: 28,
    lora_status: 'connected'
  },
  {
    id: 'MASTER-S2',
    name: 'Sector-2 Master Hub (Raspberry Pi 4)',
    code: 'RPI4-SEC2-HUB',
    hardware_model: 'Raspberry Pi 4 Model B',
    sector: 2,
    lat: 23.7465,
    lng: 86.4175,
    ip: '192.168.2.1',
    mac: 'DC:A6:32:4E:91:B2',
    status: 'online',
    internet_connected: true,
    battery_pct: 98,
    wifi_hotspot_ssid: 'GEOSENTINEL_SEC2_MASTER',
    edge_ai_status: 'inferencing',
    edge_ai_fps: 14.8,
    solar_watts: 120,
    gsm_bars: 5,
    cpu_temp_c: 42.1,
    ram_usage_pct: 31,
    lora_status: 'connected'
  }
];

// In-Memory Store for complete offline/fallback execution
const InMemoryStore = {
  users: [...DEFAULT_USERS.map(u => ({
    ...u,
    _id: u.username,
    password_hash: bcrypt.hashSync(u.password, 10),
    created_at: new Date()
  }))],
  nodes: [...DEFAULT_NODES],
  reports: [...DEFAULT_REPORTS],
  masters: [...DEFAULT_MASTERS],
  alerts: [
    {
      _id: 'alt-001',
      node_id: 'NODE-X',
      alert_level: 5,
      level_name: 'Critical',
      message: 'Critical tilt rate (>6.4°) & acoustic shear detected at Sector 2 Village Buffer',
      dispatched_at: new Date(Date.now() - 15 * 60 * 1000),
      resolved: false,
      false_alarm: false,
      sms_broadcast_count: 320,
      siren_triggered: true
    },
    {
      _id: 'alt-002',
      node_id: 'NODE-B',
      alert_level: 4,
      level_name: 'Warning',
      message: 'Bench Creep displacement accelerating (+3.8mm/hr) in Sector 1 North Slope',
      dispatched_at: new Date(Date.now() - 45 * 60 * 1000),
      resolved: false,
      false_alarm: false,
      sms_broadcast_count: 84,
      siren_triggered: false
    }
  ],
  gateways: [
    {
      gateway_id: 'GW-01',
      mac: 'E4:5F:01:9A:82:1C',
      battery_pct: 94.0,
      solar_watts: 120.0,
      gsm_bars: 5,
      cpu_temp_c: 41.2,
      ram_usage_pct: 27.5,
      internet_connected: true,
      wifi_hotspot_ssid: 'GeoSentinel-RescueNet-AP',
      local_siren_active: false,
      buffer_count: 0,
      status: 'online'
    }
  ],
  checkins: []
};

async function seedAllData() {
  const { getIsMock } = require('../config/db');
  if (getIsMock()) {
    console.log('⚡ Resilient in-memory database store ready with default users and sensor mesh.');
    return;
  }
  try {
    // 1. Seed Users
    for (const u of DEFAULT_USERS) {
      const existing = await User.findOne({
        $or: [
          { email: new RegExp(`^${u.email}$`, 'i') },
          { username: new RegExp(`^${u.username}$`, 'i') }
        ]
      }).catch(() => null);

      if (!existing) {
        const hash = await User.hashPassword(u.password);
        await User.create({
          username: u.username,
          email: u.email,
          name: u.name,
          role: u.role,
          badge: u.badge,
          password_hash: hash,
        }).catch(err => console.warn(`Note seeding user ${u.email}:`, err.message));
        console.log(`⚡ Seeded user: ${u.email} (${u.role})`);
      }
    }

    // 2. Seed Sensor Nodes
    const nodeCount = await SensorNode.countDocuments().catch(() => 0);
    if (nodeCount === 0) {
      for (const n of DEFAULT_NODES) {
        await SensorNode.create(n).catch(err => console.warn(`Note seeding node ${n.id}:`, err.message));
      }
      console.log('⚡ Seeded initial 8 IoT mesh nodes into MongoDB!');
    }

    // 3. Seed Citizen Reports
    const reportCount = await CitizenReport.countDocuments().catch(() => 0);
    if (reportCount === 0) {
      for (const r of DEFAULT_REPORTS) {
        await CitizenReport.create(r).catch(err => console.warn(`Note seeding report ${r.id}:`, err.message));
      }
      console.log('⚡ Seeded initial citizen fissure reports into MongoDB!');
    }

    // 4. Seed Gateway
    const gwCount = await Gateway.countDocuments().catch(() => 0);
    if (gwCount === 0) {
      await Gateway.create(InMemoryStore.gateways[0]).catch(err => console.warn('Note seeding gateway:', err.message));
      console.log('⚡ Seeded initial Edge Gateway GW-01 into MongoDB!');
    }

    // 5. Seed initial alerts if empty
    const alertCount = await Alert.countDocuments().catch(() => 0);
    if (alertCount === 0) {
      for (const a of InMemoryStore.alerts) {
        await Alert.create(a).catch(err => console.warn('Note seeding alert:', err.message));
      }
    }
  } catch (err) {
    console.warn('Note during MongoDB database auto-seeding:', err.message);
  }
}

module.exports = {
  DEFAULT_USERS,
  DEFAULT_NODES,
  DEFAULT_REPORTS,
  DEFAULT_MASTERS,
  InMemoryStore,
  seedAllData,
  SVG_FRACTURE_SOIL,
  SVG_FRACTURE_WALL,
  SVG_FRACTURE_ROAD
};
