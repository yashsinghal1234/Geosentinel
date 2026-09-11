export type AlertLevel = 1 | 2 | 3 | 4 | 5;
export type AlertLevelName = 'Normal' | 'Monitor' | 'Advisory' | 'Warning' | 'Evacuate Now';

export type SensorType = 
  | 'tiltmeter' 
  | 'geophone' 
  | 'extensometer' 
  | 'gas_sensor' 
  | 'rain_gauge';

export interface SensorReading {
  tiltDeg: number;            // Surface tilt / slope inclination in degrees
  vibrationMmS: number;       // Peak particle velocity (PPV) in mm/s
  crackWidthMm: number;       // Extensometer crack aperture in mm
  gasPpm: number;             // Hazardous coal seam gas (CH4 / CO) in PPM
  rainfallMmHr: number;       // Precipitation rate in mm/hr
  batteryPct: number;         // Solar/LiFePO4 battery level %
  rssiDbm: number;            // LoRa / ESP-NOW signal strength in dBm
  lastHeartbeat: number;      // Epoch ms
}

export interface TelemetryPoint {
  timestamp: string;
  timeEpoch: number;
  tiltDeg: number;
  vibrationMmS: number;
  crackWidthMm: number;
  gasPpm: number;
  riskScore: number;
}

export interface SensorNode {
  id: string;
  name: string;
  code: string;
  type: SensorType;
  zone: string;
  lat: number;
  lng: number;
  elevationMeters: number;
  depthMeters?: number;
  meshHopCount: number;
  parentNodeId: string | null; // routing tree
  status: 'online' | 'warning' | 'critical' | 'offline' | 'corroborating';
  readings: SensorReading;
  history: TelemetryPoint[];
  thresholds: {
    tiltWarningDeg: number;
    tiltCriticalDeg: number;
    vibrationWarningMmS: number;
    vibrationCriticalMmS: number;
    crackWarningMm: number;
    crackCriticalMm: number;
    gasWarningPpm: number;
    gasCriticalPpm: number;
  };
}

export interface MeshLink {
  id: string;
  sourceId: string;
  targetId: string;
  rssiDbm: number;
  packetLossPct: number;
  protocol: 'LoRa 868MHz' | 'ESP-NOW 2.4GHz';
  active: boolean;
}

export interface GatewayDevice {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  ip: string;
  mac: string;
  status: 'online' | 'edge_offline_mode';
  internetConnected: boolean;
  batteryPct: number;
  wifiHotspotSsid: string;
  localSirenActive: boolean;
  gsmSignalBars: number; // 0 to 5
  storeAndForwardBufferCount: number;
  lastSyncTime: string;
  firmwareVersion: string;
  cpuTempC: number;
  ramUsagePct: number;
}

export interface RiskEvaluation {
  level: AlertLevel;
  levelName: AlertLevelName;
  score: number; // 0 to 100
  cimfrSubsidenceDepthMm: number; // Calculated max trough subsidence
  timeToCriticalHours: number | null; // e.g. 3.4 hours or null if stable
  rateOfChangeFactor: number;
  rainfallBoostMultiplier: number;
  structuralProximityBoost: number;
  corroboratedNodeIds: string[];
  falseAlarmSuppressed: boolean;
  triggerExplanation: string;
  lastEvaluatedAt: string;
}

export interface AlertDispatchRecord {
  id: string;
  timestamp: string;
  level: AlertLevel;
  levelName: AlertLevelName;
  zone: string;
  corroboratedNodes: string[];
  channelsTriggered: Array<
    'Local Siren' | 
    'Basic-SIM SMS' | 
    'Cloud SMS (Twilio)' | 
    'Fast2SMS Gateway' | 
    'WhatsApp Broadcast' | 
    'Dashboard Popup'
  >;
  recipientCount: number;
  status: 'Dispatched' | 'Acknowledged' | 'Active Siren' | 'Cancelled (False Alarm)';
  notes: string;
  operatorActionTimestamp?: string;
}

export interface CitizenCrackReport {
  id: string;
  reporterName: string;
  phone: string;
  timestamp: string;
  timeEpoch: number;
  lat: number;
  lng: number;
  zone: string;
  crackWidthEstimateMm: number;
  photoUrl: string;
  description: string;
  status: 'Pending Review' | 'Corroborated & Approved' | 'Dismissed (Non-critical)';
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface EvacuationAssemblyPoint {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  elevationMeters: number;
  capacityPersons: number;
  currentCheckedIn: number;
  status: 'Open & Safe' | 'Approaching Capacity' | 'At Risk - Divert';
  amenities: string[];
  contactOfficer: string;
  officerPhone: string;
}

export interface CommunityCheckIn {
  id: string;
  timestamp: string;
  residentName: string;
  familyCount: number;
  zone: string;
  status: 'Safe at High Ground Shelter' | 'Trapped - Need Immediate Rescue' | 'Evacuating on Foot';
  locationNote: string;
  phone: string;
}

export type SimulationScenario = 
  | 'baseline' 
  | 'monsoon_surge' 
  | 'pillar_collapse' 
  | 'gas_cavity_breach' 
  | 'blasting_false_alarm';

export type UserRole = 'operator' | 'public' | 'admin';
export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'or' | 'sat';

export interface MineSite {
  id: string;
  name: string;
  code: string;
  location: string;
  state: string;
  totalSensors: number;
  activeSectorsCount: number;
  overallRisk: 'Normal' | 'Monitor' | 'Advisory' | 'Warning' | 'Critical';
}

export interface SectorInfo {
  id: string; // 'all' | '1' | '2' | '3' | '4'
  name: string;
  shortName: string;
  sectorNum?: number;
  description: string;
  activeSensors: number;
  maxRiskScore: number;
  riskLevel: 'Normal' | 'Monitor' | 'Advisory' | 'Warning' | 'Critical';
}

