import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { 
  SensorNode, 
  GatewayDevice, 
  MeshLink, 
  RiskEvaluation, 
  AlertDispatchRecord, 
  CitizenCrackReport, 
  EvacuationAssemblyPoint, 
  CommunityCheckIn, 
  SimulationScenario, 
  UserRole, 
  SupportedLanguage,
  AlertLevel,
  MineSite,
  SectorInfo,
  DynamicTopologyResponse
} from '../types';
import { evaluateGeologicalRisk } from '../services/PhysicsEngine';
import { audioService } from '../services/AudioService';

export const AVAILABLE_MINES: MineSite[] = [
  {
    id: 'jharia-04',
    name: 'Jharia Coalfield',
    code: 'BCCL-JH-04',
    location: 'Dhanbad, Jharkhand',
    state: 'Jharkhand',
    totalSensors: 42,
    activeSectorsCount: 4,
    overallRisk: 'Warning',
  },
  {
    id: 'raniganj-02',
    name: 'Raniganj Coalfield',
    code: 'ECL-RG-02',
    location: 'Asansol, West Bengal',
    state: 'West Bengal',
    totalSensors: 28,
    activeSectorsCount: 3,
    overallRisk: 'Advisory',
  },
  {
    id: 'singrauli-01',
    name: 'Singrauli Open-Cast',
    code: 'NCL-SG-01',
    location: 'Singrauli, Madhya Pradesh',
    state: 'Madhya Pradesh',
    totalSensors: 36,
    activeSectorsCount: 4,
    overallRisk: 'Normal',
  },
  {
    id: 'korba-03',
    name: 'Korba West Basin',
    code: 'SECL-KB-03',
    location: 'Korba, Chhattisgarh',
    state: 'Chhattisgarh',
    totalSensors: 24,
    activeSectorsCount: 3,
    overallRisk: 'Normal',
  },
];

export const AVAILABLE_SECTORS: SectorInfo[] = [
  {
    id: 'all',
    name: 'All Mine Sectors',
    shortName: 'All Sectors',
    description: 'Full perimeter telemetry across all deployed mesh sectors',
    activeSensors: 42,
    maxRiskScore: 76.6,
    riskLevel: 'Warning',
  },
  {
    id: '1',
    sectorNum: 1,
    name: 'Sector 1 (North Overburden Slope)',
    shortName: 'Sector 1 (North)',
    description: 'Upper bench steep face and overburden shear zone',
    activeSensors: 14,
    maxRiskScore: 40.9,
    riskLevel: 'Advisory',
  },
  {
    id: '2',
    sectorNum: 2,
    name: 'Sector 2 (East Highwall & Village Buffer)',
    shortName: 'Sector 2 (East)',
    description: 'Village residential buffer zone and highwall subsidence area',
    activeSensors: 12,
    maxRiskScore: 76.6,
    riskLevel: 'Warning',
  },
  {
    id: '3',
    sectorNum: 3,
    name: 'Sector 3 (South Tailings Embankment)',
    shortName: 'Sector 3 (South)',
    description: 'Slurry retention wall and hydro-pressurized piezometers',
    activeSensors: 8,
    maxRiskScore: 18.0,
    riskLevel: 'Normal',
  },
  {
    id: '4',
    sectorNum: 4,
    name: 'Sector 4 (West Haulage Bench)',
    shortName: 'Sector 4 (West)',
    description: 'Heavy machinery route, blast vibration and extensometer mesh',
    activeSensors: 8,
    maxRiskScore: 23.6,
    riskLevel: 'Monitor',
  },
];

// Initial Multi-Sensor ESP32-S3 Nodes (Nodes A, B, C in Sector 1; Nodes X, Y, Z in Sector 2)
const INITIAL_NODES: SensorNode[] = [
  {
    id: 'NODE-A',
    name: 'Node A (Sector 1 Ridge)',
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
    history: [],
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
    history: [],
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
    history: [],
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
    history: [],
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
    history: [],
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
    history: [],
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

// Initial Sector Master Gateway (Raspberry Pi 4 Model B)
const INITIAL_GATEWAY: GatewayDevice = {
  id: 'MASTER-S1',
  name: 'Sector-1 Master (Raspberry Pi 4)',
  code: 'RPI4-MASTER-SEC1',
  hardwareModel: 'Raspberry Pi 4 Model B (Sector Master Hub)',
  sectorNum: 1,
  lat: 23.7520,
  lng: 86.4220,
  ip: '192.168.1.1',
  mac: 'DC:A6:32:4E:91:A1',
  status: 'online',
  internetConnected: true,
  batteryPct: 99,
  wifiHotspotSsid: 'GEOSENTINEL_SEC1_MASTER',
  localSirenActive: false,
  gsmSignalBars: 5,
  gsmStatus: 'online',
  loraStatus: 'connected',
  edgeAiStatus: 'inferencing',
  edgeAiInferenceFps: 14.6,
  solarMpptWatts: 120,
  selfHealingActive: true,
  storeAndForwardBufferCount: 0,
  lastSyncTime: new Date().toLocaleTimeString(),
  firmwareVersion: 'v4.2.0-rpi-edge-ai',
  cpuTempC: 41.5,
  ramUsagePct: 28,
};

// Initial WiFi Mesh & LoRa Inter-Master Links
const INITIAL_LINKS: MeshLink[] = [
  // Sector 1 WiFi Mesh
  { id: 'L1', sourceId: 'NODE-A', targetId: 'MASTER-S1', rssiDbm: -68, packetLossPct: 0.1, protocol: 'WiFi Mesh', linkType: 'mesh_leaf', active: true },
  { id: 'L2', sourceId: 'NODE-B', targetId: 'MASTER-S1', rssiDbm: -74, packetLossPct: 0.2, protocol: 'WiFi Mesh', linkType: 'mesh_leaf', active: true },
  { id: 'L3', sourceId: 'NODE-C', targetId: 'NODE-A', rssiDbm: -82, packetLossPct: 0.4, protocol: 'WiFi Mesh', linkType: 'mesh_leaf', active: true },

  // Sector 2 WiFi Mesh
  { id: 'L4', sourceId: 'NODE-X', targetId: 'MASTER-S2', rssiDbm: -65, packetLossPct: 0.1, protocol: 'WiFi Mesh', linkType: 'mesh_leaf', active: true },
  { id: 'L5', sourceId: 'NODE-Y', targetId: 'MASTER-S2', rssiDbm: -72, packetLossPct: 0.2, protocol: 'WiFi Mesh', linkType: 'mesh_leaf', active: true },
  { id: 'L6', sourceId: 'NODE-Z', targetId: 'NODE-Y', rssiDbm: -85, packetLossPct: 0.6, protocol: 'WiFi Mesh', linkType: 'mesh_leaf', active: true },

  // LoRa SX1278 Inter-Master Bridge (Self-Healing / ACK)
  { id: 'L-MASTER', sourceId: 'MASTER-S1', targetId: 'MASTER-S2', rssiDbm: -79, packetLossPct: 0.0, protocol: 'LoRa (SX1278)', linkType: 'inter_master_lora', active: true },
];

// Reliable SVG Geological Fissure Patterns (Never 404)
export const SVG_CRACK_SOIL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%2312151c'/><path d='M30 40 Q 110 90, 160 140 T 260 210 T 370 260' stroke='%2338bdf8' stroke-width='4' fill='none'/><path d='M160 140 Q 190 90, 240 70' stroke='%2338bdf8' stroke-width='2.5' fill='none' stroke-dasharray='4,2'/><circle cx='160' cy='140' r='5' fill='%23ef4444'/><text x='20' y='280' fill='%2394a3b8' font-family='sans-serif' font-size='12'>SOIL SHEAR FISSURE • SECTOR 4</text></svg>";
export const SVG_CRACK_WALL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%231a141f'/><path d='M60 20 L 120 110 L 90 180 L 150 280' stroke='%23f59e0b' stroke-width='5' fill='none'/><path d='M120 110 L 220 130 L 310 160' stroke='%23f59e0b' stroke-width='3' fill='none'/><circle cx='120' cy='110' r='6' fill='%23ef4444'/><text x='20' y='280' fill='%23d8b4fe' font-family='sans-serif' font-size='12'>MASONRY WALL SEPARATION • SECTOR 3</text></svg>";
export const SVG_CRACK_ROAD = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%230f141a'/><path d='M20 150 Q 140 140, 220 160 T 380 145' stroke='%23ef4444' stroke-width='6' fill='none'/><path d='M220 160 Q 250 80, 290 30' stroke='%23f87171' stroke-width='3' fill='none'/><circle cx='220' cy='160' r='6' fill='%23ef4444'/><text x='20' y='280' fill='%23cbd5e1' font-family='sans-serif' font-size='12'>ROADWAY EMBANKMENT CRACK • SECTOR 2</text></svg>";

// Initial Citizen Crack Reports
const INITIAL_REPORTS: CitizenCrackReport[] = [
  {
    id: 'CR-801',
    reporterName: 'Manoj Kumar Soren',
    phone: '+91 94311 88421',
    timestamp: '28 mins ago',
    timeEpoch: Date.now() - 28 * 60 * 1000,
    lat: 23.7482,
    lng: 86.4215,
    zone: 'Sector 4 (Village Slope)',
    crackWidthEstimateMm: 9,
    photoUrl: SVG_CRACK_SOIL,
    description: 'Ground crack running across courtyard near primary school, expanded overnight.',
    severity: 'Moderate Shear Fissure',
    status: 'Corroborated & Approved',
    reviewedBy: 'Chief Geologist R. V. Sharma',
    reviewNotes: 'Matches SN-04 extensometer displacement trend (+1.8mm/hr). Corroborated.',
    nearestSensorId: 'NODE-D',
    nearestSensorDistanceM: 145.0,
    aiCorroborationConfidence: 94.2
  },
  {
    id: 'CR-802',
    reporterName: 'Sujata Devi',
    phone: '+91 98210 44299',
    timestamp: '2 hours ago',
    timeEpoch: Date.now() - 120 * 60 * 1000,
    lat: 23.7462,
    lng: 86.4168,
    zone: 'Sector 3 (Abandoned Gallery)',
    crackWidthEstimateMm: 16,
    photoUrl: SVG_CRACK_WALL,
    description: 'Wall splitting along eastern foundation of pump house adjacent to old incline.',
    severity: 'Severe Subsidence Crack',
    status: 'Corroborated & Approved',
    reviewedBy: 'Mine Safety Inspector T. Sen',
    reviewNotes: 'Close to SN-03 void gallery; high shear zone verified.',
    nearestSensorId: 'NODE-C',
    nearestSensorDistanceM: 88.0,
    aiCorroborationConfidence: 98.7
  },
  {
    id: 'CR-803',
    reporterName: 'Rameshwar Mahato',
    phone: '+91 91223 90812',
    timestamp: '4 hours ago',
    timeEpoch: Date.now() - 240 * 60 * 1000,
    lat: 23.7521,
    lng: 86.4245,
    zone: 'Sector 2 (Riverbank Overburden)',
    crackWidthEstimateMm: 4,
    photoUrl: SVG_CRACK_ROAD,
    description: 'Superficial soil drying cracks observed on road embankment after blast cycle.',
    severity: 'Minor Surface Tension',
    status: 'Pending Review',
    nearestSensorId: 'NODE-B',
    nearestSensorDistanceM: 210.0,
    aiCorroborationConfidence: 76.5
  },
];

// Initial Assembly Points
const INITIAL_ASSEMBLY_POINTS: EvacuationAssemblyPoint[] = [
  {
    id: 'AP-01',
    name: 'Sector 4 High Ridge Community Hall',
    zone: 'Sector 4 High Ground',
    lat: 23.7430,
    lng: 86.4250,
    elevationMeters: 262,
    capacityPersons: 450,
    currentCheckedIn: 84,
    status: 'Open & Safe',
    amenities: ['Emergency Solar Power', 'First Aid Station', '20,000L Potable Water', 'Satellite Phone Link'],
    contactOfficer: 'Anand Prakash (Disaster Mgmt Officer)',
    officerPhone: '+91 94311 00212',
  },
  {
    id: 'AP-02',
    name: 'North Central School Stadium Grounds',
    zone: 'Sector 1 Safe Buffer',
    lat: 23.7590,
    lng: 86.4170,
    elevationMeters: 255,
    capacityPersons: 800,
    currentCheckedIn: 120,
    status: 'Open & Safe',
    amenities: ['Helipad LZ', 'Medical Triage Camp', 'Backup Diesel Genset', 'Food Rations'],
    contactOfficer: 'Dr. Meena Soren (Medical Relief)',
    officerPhone: '+91 98350 49110',
  },
];

// Initial Check-ins
const INITIAL_CHECKINS: CommunityCheckIn[] = [
  {
    id: 'CK-1',
    timestamp: '15 mins ago',
    residentName: 'Gopal Soren & Family',
    familyCount: 5,
    zone: 'Sector 4',
    status: 'Safe at High Ground Shelter',
    locationNote: 'Arrived at Shelter A, hall 2.',
    phone: '+91 94311 88421',
  },
  {
    id: 'CK-2',
    timestamp: '42 mins ago',
    residentName: 'Lakhan Murmu',
    familyCount: 3,
    zone: 'Sector 3',
    status: 'Safe at High Ground Shelter',
    locationNote: 'Safe with cattle at perimeter pen.',
    phone: '+91 91223 90812',
  },
];

// Initial Alert Log
const INITIAL_ALERTS: AlertDispatchRecord[] = [
  {
    id: 'ALT-1094',
    timestamp: '09:45:12 AM',
    level: 3,
    levelName: 'Advisory',
    zone: 'Sector 3 & Sector 4',
    corroboratedNodes: ['SN-03', 'SN-05'],
    channelsTriggered: ['Dashboard Popup', 'Basic-SIM SMS', 'Fast2SMS Gateway'],
    recipientCount: 342,
    status: 'Dispatched',
    notes: 'Rainfall surge triggered advisory threshold. Escalation contacts notified.',
  },
];

interface UserProfile {
  name: string;
  role: string;
  email: string;
  badge: string;
}

interface GeoSentinelContextType {
  nodes: SensorNode[];
  gateway: GatewayDevice;
  links: MeshLink[];
  risk: RiskEvaluation;
  alerts: AlertDispatchRecord[];
  reports: CitizenCrackReport[];
  assemblyPoints: EvacuationAssemblyPoint[];
  checkIns: CommunityCheckIn[];
  scenario: SimulationScenario;
  userRole: UserRole;
  language: SupportedLanguage;
  activeTab: 'landing' | 'operator' | 'gis' | 'topology' | 'gateway' | 'public' | 'citizen' | 'admin';
  villageSubTab: 'status' | 'report' | 'shelters' | 'checklist' | 'docs';
  setVillageSubTab: (tab: 'status' | 'report' | 'shelters' | 'checklist' | 'docs') => void;
  selectedNodeId: string | null;
  rainfallRate: number;
  audioMuted: boolean;

  // Mine & Sector selection
  selectedMine: string;
  selectedSector: string;
  availableMines: MineSite[];
  availableSectors: SectorInfo[];
  setSelectedMine: (mineId: string) => void;
  setSelectedSector: (sectorId: string) => void;
  filteredNodes: SensorNode[];
  topologyData: DynamicTopologyResponse | null;
  refreshTopology: () => Promise<void>;
  
  // Auth state
  isAuthenticated: boolean;
  currentUser: UserProfile;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => void;

  // Actions
  setScenario: (scenario: SimulationScenario) => void;
  setUserRole: (role: UserRole) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setActiveTab: (tab: 'landing' | 'operator' | 'gis' | 'topology' | 'gateway' | 'public' | 'citizen' | 'admin') => void;
  setSelectedNodeId: (id: string | null) => void;
  setRainfallRate: (rate: number) => void;
  toggleAudioMuted: () => void;
  toggleInternetConnection: () => void;
  triggerManualAlert: (level: AlertLevel, zone: string, notes: string) => void;
  cancelAlertAsFalseAlarm: (alertId: string) => void;
  triggerEdgeSiren: (active: boolean) => void;
  submitCrackReport: (report: Omit<CitizenCrackReport, 'id' | 'timestamp' | 'timeEpoch' | 'status'>) => void;
  reviewCrackReport: (reportId: string, approved: boolean, notes: string) => void;
  submitCheckIn: (checkIn: Omit<CommunityCheckIn, 'id' | 'timestamp'>) => void;
  updateNodeThresholds: (nodeId: string, thresholds: SensorNode['thresholds']) => void;
  flushGatewayBuffer: () => void;
}

// Cookie persistence helpers
export const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
};

const getInitialAuth = (): { isAuthenticated: boolean; user: UserProfile } => {
  try {
    if (typeof window !== 'undefined') {
      const cookieAuth = getCookie('geosentinel_auth');
      const localAuth = localStorage.getItem('geosentinel_auth');
      const authStr = cookieAuth || localAuth;
      if (authStr) {
        const parsed = JSON.parse(authStr);
        if (parsed && parsed.isAuthenticated) {
          return {
            isAuthenticated: true,
            user: parsed.user || {
              name: 'S. K. Verma',
              role: 'Chief Mining Safety Engineer',
              email: 'verma.sk@geosentinel.gov.in',
              badge: 'OPERATOR L3',
            },
          };
        }
      }
    }
  } catch (e) {
    console.warn("Failed to restore auth from cookie/storage:", e);
  }
  return {
    isAuthenticated: false,
    user: {
      name: 'S. K. Verma',
      role: 'Chief Mining Safety Engineer',
      email: 'verma.sk@geosentinel.gov.in',
      badge: 'OPERATOR L3',
    },
  };
};

const GeoSentinelContext = createContext<GeoSentinelContextType | undefined>(undefined);

export const GeoSentinelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialAuth = getInitialAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth.isAuthenticated);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialAuth.user);

  const [selectedMine, setSelectedMine] = useState<string>('jharia-04');
  const [selectedSector, setSelectedSector] = useState<string>('all');

  const [nodes, setNodes] = useState<SensorNode[]>(INITIAL_NODES);

  const [gateway, setGateway] = useState<GatewayDevice>(INITIAL_GATEWAY);
  const [links, setLinks] = useState<MeshLink[]>(INITIAL_LINKS);
  const [topologyData, setTopologyData] = useState<DynamicTopologyResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertDispatchRecord[]>(INITIAL_ALERTS);
  const [reports, setReports] = useState<CitizenCrackReport[]>(INITIAL_REPORTS);
  const [assemblyPoints, setAssemblyPoints] = useState<EvacuationAssemblyPoint[]>(INITIAL_ASSEMBLY_POINTS);
  const [checkIns, setCheckIns] = useState<CommunityCheckIn[]>(INITIAL_CHECKINS);
  const [scenario, setScenarioState] = useState<SimulationScenario>('baseline');
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<'landing' | 'operator' | 'gis' | 'topology' | 'gateway' | 'public' | 'citizen' | 'admin'>(
    initialAuth.isAuthenticated ? 'operator' : 'landing'
  );
  const [villageSubTab, setVillageSubTab] = useState<'status' | 'report' | 'shelters' | 'checklist' | 'docs'>('status');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rainfallRate, setRainfallRate] = useState<number>(4.2);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [falseAlarmSuppression, setFalseAlarmSuppression] = useState<boolean>(false);

  const filteredNodes = nodes.filter((n) => {
    if (selectedSector === 'all') return true;
    const secNum = parseInt(selectedSector, 10);
    if ((n as any).sector !== undefined) {
      return (n as any).sector == secNum;
    }
    return n.zone?.toLowerCase().includes(`sector ${selectedSector}`) || n.id.includes(`S${selectedSector}`) || n.name?.includes(`Sector ${selectedSector}`);
  });

  const login = useCallback(async (email?: string, password?: string) => {
    const inputEmail = (email || '').trim();
    const inputPass = (password || '').trim();

    if (!inputEmail || !inputPass) {
      throw new Error("Please enter both email and password.");
    }

    let authenticatedUser: UserProfile | null = null;
    let receivedToken: string = `jwt_client_token_${Date.now()}`;

    // 1. Try Backend API first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail, password: inputPass })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success') {
          authenticatedUser = {
            name: data.name || (data.role === 'admin' ? 'Directorate General (DGMS Admin)' : 'S. K. Verma (Chief Mining Safety Engineer)'),
            role: data.role || (data.email?.includes('admin') ? 'admin' : 'operator'),
            email: data.email || inputEmail,
            badge: (data.badge || data.role || 'OPERATOR').toUpperCase(),
          };
          receivedToken = data.token || data.access_token || receivedToken;
        }
      } else if (res.status === 401) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Incorrect password or account not found.");
      }
    } catch (apiErr: any) {
      // If error is an explicit 401 credential rejection, rethrow
      if (apiErr.message?.includes("Incorrect password") || apiErr.message?.includes("Account not found")) {
        throw apiErr;
      }
      console.warn("Backend API not reachable in deployment (static host mode), using client auth fallback.");
    }

    // 2. If Backend was unreachable (404/405/502 in static deployment), validate credentials locally
    if (!authenticatedUser) {
      const isEmailAdmin = inputEmail.toLowerCase() === 'admin@geo.com' || inputEmail.toLowerCase() === 'admin';
      const isEmailOperator = inputEmail.toLowerCase() === 'operator@geosentinel.gov.in' || inputEmail.toLowerCase() === 'operator';
      const isValidAdminPass = inputPass === 'password123' || inputPass === '282007@aA';
      const isValidOpPass = inputPass === 'password123';

      if (isEmailAdmin && isValidAdminPass) {
        authenticatedUser = {
          name: 'Directorate General (DGMS Admin)',
          role: 'admin',
          email: 'admin@geo.com',
          badge: 'ADMIN L4',
        };
      } else if (isEmailOperator && isValidOpPass) {
        authenticatedUser = {
          name: 'S. K. Verma (Chief Mining Safety Engineer)',
          role: 'operator',
          email: 'operator@geosentinel.gov.in',
          badge: 'OPERATOR L3',
        };
      } else if (isValidAdminPass || isValidOpPass) {
        // Generic fallback for authorized mine personnel
        authenticatedUser = {
          name: inputEmail.includes('admin') ? 'Directorate General (DGMS Admin)' : 'Mining Safety Officer',
          role: inputEmail.includes('admin') ? 'admin' : 'operator',
          email: inputEmail,
          badge: inputEmail.includes('admin') ? 'ADMIN L4' : 'OPERATOR L2',
        };
      } else {
        throw new Error("Invalid credentials. Please use registered account (admin@geo.com / password123).");
      }
    }

    // Persist authenticated state
    setCookie('geosentinel_token', receivedToken, 7);
    localStorage.setItem('geosentinel_token', receivedToken);

    setIsAuthenticated(true);
    setIsLoginModalOpen(false);
    setActiveTab('operator');
    setCurrentUser(authenticatedUser);

    const authData = JSON.stringify({ isAuthenticated: true, user: authenticatedUser });
    setCookie('geosentinel_auth', authData, 7);
    localStorage.setItem('geosentinel_auth', authData);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setActiveTab('landing');
    deleteCookie('geosentinel_auth');
    deleteCookie('geosentinel_token');
    localStorage.removeItem('geosentinel_auth');
    localStorage.removeItem('geosentinel_token');
  }, []);

  // Compute Risk
  const [risk, setRisk] = useState<RiskEvaluation>({
    level: 1, levelName: 'Normal', score: 0, cimfrSubsidenceDepthMm: 0,
    timeToCriticalHours: null, rateOfChangeFactor: 1.0, rainfallBoostMultiplier: 1.0,
    structuralProximityBoost: 1.0, corroboratedNodeIds: [], falseAlarmSuppressed: false,
    triggerExplanation: 'System Online', lastEvaluatedAt: new Date().toLocaleTimeString()
  });

  const toggleAudioMuted = useCallback(() => {
    setAudioMuted((prev) => !prev);
  }, []);

  const triggerEdgeSiren = useCallback((active: boolean) => {
    setGateway((prev) => ({ ...prev, localSirenActive: active }));
    if (!audioMuted) {
      audioService.toggleSiren(active);
    }
  }, [audioMuted]);

  // Set scenario with automated parameter ramp
  const setScenario = useCallback((newScenario: SimulationScenario) => {
    setScenarioState(newScenario);
    setFalseAlarmSuppression(newScenario === 'blasting_false_alarm');

    if (newScenario === 'monsoon_surge') {
      setRainfallRate(48.5); // High monsoon rain
    } else if (newScenario === 'baseline') {
      setRainfallRate(4.2);
      triggerEdgeSiren(false);
    } else if (newScenario === 'pillar_collapse') {
      setRainfallRate(12.0);
    }
  }, [triggerEdgeSiren]);

  const toggleInternetConnection = useCallback(() => {
    setGateway((prev) => {
      const nextConnected = !prev.internetConnected;
      const nextStatus = nextConnected ? 'online' : 'edge_offline_mode';
      return {
        ...prev,
        internetConnected: nextConnected,
        status: nextStatus,
        lastSyncTime: nextConnected ? new Date().toLocaleTimeString() : prev.lastSyncTime,
      };
    });
  }, []);

  const flushGatewayBuffer = useCallback(() => {
    setGateway((prev) => ({
      ...prev,
      storeAndForwardBufferCount: 0,
      lastSyncTime: new Date().toLocaleTimeString(),
    }));
  }, []);

  const triggerManualAlert = useCallback((level: AlertLevel, zone: string, notes: string) => {
    const levelNames = ['Normal', 'Monitor', 'Advisory', 'Warning', 'Evacuate Now'] as const;
    const newRecord: AlertDispatchRecord = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      levelName: levelNames[level - 1],
      zone,
      corroboratedNodes: ['SN-01', 'SN-03', 'SN-05'],
      channelsTriggered: ['Local Siren', 'Basic-SIM SMS', 'Cloud SMS (Twilio)', 'Fast2SMS Gateway', 'Dashboard Popup'],
      recipientCount: 520,
      status: level === 5 ? 'Active Siren' : 'Dispatched',
      notes,
      operatorActionTimestamp: new Date().toLocaleTimeString(),
    };

    setAlerts((prev) => [newRecord, ...prev]);

    if (level >= 4) {
      triggerEdgeSiren(true);
    }
  }, [triggerEdgeSiren]);

  const cancelAlertAsFalseAlarm = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'Cancelled (False Alarm)',
              notes: `${a.notes} [CANCEL BROADCAST DISPATCHED: Operator confirmed safe blast/false vibration.]`,
            }
          : a
      )
    );
    triggerEdgeSiren(false);
    setFalseAlarmSuppression(true);
  }, [triggerEdgeSiren]);

  const submitCrackReport = useCallback(async (reportData: Omit<CitizenCrackReport, 'id' | 'timestamp' | 'timeEpoch' | 'status'>) => {
    const tempId = `CR-${Math.floor(804 + Math.random() * 100)}`;
    const optimisticReport: CitizenCrackReport = {
      ...reportData,
      id: tempId,
      timestamp: 'Just now',
      timeEpoch: Date.now(),
      status: 'Pending Review',
    };
    setReports((prev) => [optimisticReport, ...prev]);

    // Send to backend API
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_name: reportData.reporterName,
          phone: reportData.phone,
          zone: reportData.zone,
          latitude: reportData.lat,
          longitude: reportData.lng,
          crack_width_estimate_mm: reportData.crackWidthEstimateMm,
          photo_url: reportData.photoUrl,
          description: reportData.description,
          severity: reportData.severity,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.id) {
          setReports((prev) =>
            prev.map((r) =>
              r.id === tempId
                ? {
                    ...r,
                    id: saved.id,
                    severity: saved.severity,
                    nearestSensorId: saved.nearest_sensor_id,
                    nearestSensorDistanceM: saved.nearest_sensor_distance_m,
                    aiCorroborationConfidence: saved.ai_corroboration_confidence,
                  }
                : r
            )
          );
        }
      }
    } catch (err) {
      console.warn('Backend crack report submission fallback active:', err);
    }
  }, []);

  const reviewCrackReport = useCallback(async (reportId: string, approved: boolean, reviewNotes: string) => {
    // Optimistic UI update
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: approved ? 'Corroborated & Approved' : 'Dismissed (Non-critical)',
              reviewedBy: 'DGMS Mining Safety Inspector',
              reviewNotes,
            }
          : r
      )
    );

    // Call backend
    try {
      await fetch(`/api/reports/${reportId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approved ? 'approve' : 'dismiss',
          review_notes: reviewNotes,
          reviewed_by: 'DGMS Mining Safety Inspector',
        }),
      });
    } catch (err) {
      console.warn('Review report backend sync note:', err);
    }
  }, []);

  const submitCheckIn = useCallback((checkInData: Omit<CommunityCheckIn, 'id' | 'timestamp'>) => {
    const newCheckIn: CommunityCheckIn = {
      ...checkInData,
      id: `CK-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: 'Just now',
    };
    setCheckIns((prev) => [newCheckIn, ...prev]);
    if (!audioMuted) {
      audioService.playSafeChime();
    }

    // Increment shelter count
    setAssemblyPoints((prev) =>
      prev.map((ap) => {
        if (ap.id === 'AP-01') {
          return { ...ap, currentCheckedIn: ap.currentCheckedIn + checkInData.familyCount };
        }
        return ap;
      })
    );
  }, [audioMuted]);

  const updateNodeThresholds = useCallback((nodeId: string, newThresholds: SensorNode['thresholds']) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, thresholds: newThresholds } : n))
    );
  }, []);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await fetch('/api/nodes');
        if (res.ok) {
          const text = await res.text();
          if (text) {
            try {
              const data = JSON.parse(text);
              if (Array.isArray(data) && data.length > 0) {
                const normalized: SensorNode[] = data.map((n: any) => ({
                  id: n.id || n._id || `SN-${Math.floor(Math.random() * 100)}`,
                  name: n.name || `Sensor Node ${n.id || ''}`,
                  code: n.code || n.id || 'SN-XX',
                  type: n.type || 'tiltmeter',
                  zone: n.zone || 'Sector 4 (Village Slope)',
                  lat: typeof n.lat === 'number' ? n.lat : (n.latitude || 23.7482),
                  lng: typeof n.lng === 'number' ? n.lng : (n.longitude || 86.4195),
                  elevationMeters: n.elevationMeters || 220,
                  depthMeters: n.depthMeters,
                  meshHopCount: n.meshHopCount || 1,
                  parentNodeId: n.parentNodeId || 'GW-01',
                  status: n.status || 'online',
                  history: Array.isArray(n.history) ? n.history : [],
                  readings: {
                    tiltDeg: n.readings?.tiltDeg ?? n.tilt_x ?? 0.8,
                    vibrationMmS: n.readings?.vibrationMmS ?? n.vibration ?? 0.5,
                    crackWidthMm: n.readings?.crackWidthMm ?? 0.0,
                    gasPpm: n.readings?.gasPpm ?? 10,
                    rainfallMmHr: n.readings?.rainfallMmHr ?? 4.2,
                    batteryPct: n.readings?.batteryPct ?? n.battery ?? 95,
                    rssiDbm: n.readings?.rssiDbm ?? -70,
                    lastHeartbeat: n.readings?.lastHeartbeat ?? Date.now(),
                  },
                  thresholds: {
                    tiltWarningDeg: n.thresholds?.tiltWarningDeg ?? 3.5,
                    tiltCriticalDeg: n.thresholds?.tiltCriticalDeg ?? 6.0,
                    vibrationWarningMmS: n.thresholds?.vibrationWarningMmS ?? 5.0,
                    vibrationCriticalMmS: n.thresholds?.vibrationCriticalMmS ?? 12.0,
                    crackWarningMm: n.thresholds?.crackWarningMm ?? 8.0,
                    crackCriticalMm: n.thresholds?.crackCriticalMm ?? 18.0,
                    gasWarningPpm: n.thresholds?.gasWarningPpm ?? 50,
                    gasCriticalPpm: n.thresholds?.gasCriticalPpm ?? 120,
                  }
                }));
                setNodes(normalized);
              }
            } catch (e) {
              // Ignore non-json
            }
          }
        }
      } catch (err) {
        // Keep initial nodes
      }
    };
    
    fetchNodes();
    const interval = setInterval(fetchNodes, 3000);

    // Initial and periodic fetch for citizen reports
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const text = await res.text();
          if (text) {
            try {
              const data = JSON.parse(text);
              if (Array.isArray(data) && data.length > 0) {
                const normalizedReports: CitizenCrackReport[] = data.map((r: any) => ({
                  id: r.id || r._id || `CR-${Math.floor(Math.random() * 900)}`,
                  reporterName: r.reporter_name || r.reporterName || 'Anonymous Resident',
                  phone: r.phone || '+91 94311 00000',
                  timestamp: r.submitted_at || r.timestamp || 'Recent',
                  timeEpoch: r.time_epoch || r.timeEpoch || Date.now(),
                  lat: typeof r.latitude === 'number' ? r.latitude : (r.lat || 23.7482),
                  lng: typeof r.longitude === 'number' ? r.longitude : (r.lng || 86.4215),
                  zone: r.zone || 'Sector 4 (Village Slope)',
                  crackWidthEstimateMm: r.crack_width_estimate_mm ?? r.crackWidthEstimateMm ?? 8.0,
                  photoUrl: r.photo_url || r.photoUrl || SVG_CRACK_SOIL,
                  description: r.description || 'Ground crack observation.',
                  severity: r.severity || (r.crack_width_estimate_mm >= 15 ? 'Severe Subsidence Crack' : 'Moderate Shear Fissure'),
                  status: r.status || 'Pending Review',
                  reviewedBy: r.reviewed_by || r.reviewedBy,
                  reviewNotes: r.review_notes || r.reviewNotes,
                  nearestSensorId: r.nearest_sensor_id || r.nearestSensorId,
                  nearestSensorDistanceM: r.nearest_sensor_distance_m ?? r.nearestSensorDistanceM,
                  aiCorroborationConfidence: r.ai_corroboration_confidence ?? r.aiCorroborationConfidence,
                }));
                setReports(normalizedReports);
              }
            } catch (e) {
              // Ignore non-json
            }
          }
        }
      } catch (err) {
        // Keep initial reports
      }
    };

    fetchReports();
    const reportsInterval = setInterval(fetchReports, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(reportsInterval);
    };
  }, []);

  // Recalculate Risk whenever nodes, rainfall, or scenario changes
  useEffect(() => {
    const calculatedRisk = evaluateGeologicalRisk(
      nodes,
      rainfallRate,
      1.15,
      falseAlarmSuppression
    );
    setRisk(calculatedRisk);

    // Auto-trigger siren on Level 5 if not muted and gateway online
    if (calculatedRisk.level === 5 && !gateway.localSirenActive) {
      triggerEdgeSiren(true);
    }
  }, [nodes, rainfallRate, falseAlarmSuppression, gateway.localSirenActive, triggerEdgeSiren]);

  const refreshTopology = useCallback(async () => {
    try {
      const res = await fetch('/api/topology');
      if (res.ok) {
        const text = await res.text();
        if (text) {
          try {
            const data: DynamicTopologyResponse = JSON.parse(text);
            if (data && data.nodes && data.nodes.length > 0) {
              setTopologyData(data);
              if (data.links && data.links.length > 0) {
                setLinks(data.links);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    refreshTopology();
    const topInterval = setInterval(refreshTopology, 4000);
    return () => clearInterval(topInterval);
  }, [refreshTopology]);

  return (
    <GeoSentinelContext.Provider
      value={{
        nodes,
        gateway,
        links,
        topologyData,
        refreshTopology,
        risk,
        alerts,
        reports,
        assemblyPoints,
        checkIns,
        scenario,
        userRole,
        language,
        activeTab,
        villageSubTab,
        setVillageSubTab,
        selectedNodeId,
        rainfallRate,
        audioMuted,
        selectedMine,
        selectedSector,
        availableMines: AVAILABLE_MINES,
        availableSectors: AVAILABLE_SECTORS,
        setSelectedMine,
        setSelectedSector,
        filteredNodes,
        isAuthenticated,
        currentUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        logout,
        setScenario,
        setUserRole,
        setLanguage,
        setActiveTab,
        setSelectedNodeId,
        setRainfallRate,
        toggleAudioMuted,
        toggleInternetConnection,
        triggerManualAlert,
        cancelAlertAsFalseAlarm,
        triggerEdgeSiren,
        submitCrackReport,
        reviewCrackReport,
        submitCheckIn,
        updateNodeThresholds,
        flushGatewayBuffer,
      }}
    >
      {children}
    </GeoSentinelContext.Provider>
  );
};

export const useGeoSentinel = () => {
  const context = useContext(GeoSentinelContext);
  if (!context) {
    throw new Error('useGeoSentinel must be used within a GeoSentinelProvider');
  }
  return context;
};
