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
  AlertLevel
} from '../types';
import { evaluateGeologicalRisk } from '../services/PhysicsEngine';
import { audioService } from '../services/AudioService';

// Initial 8 Sensor Nodes
const INITIAL_NODES: SensorNode[] = [
  {
    id: 'SN-01',
    name: 'Sector 4 Ridge Inclinometer',
    code: 'TILT-S4-01',
    type: 'tiltmeter',
    zone: 'Sector 4 (Village Slope)',
    lat: 23.7482,
    lng: 86.4195,
    elevationMeters: 228,
    meshHopCount: 1,
    parentNodeId: 'GW-01',
    status: 'online',
    readings: {
      tiltDeg: 1.42,
      vibrationMmS: 0.8,
      crackWidthMm: 2.1,
      gasPpm: 12,
      rainfallMmHr: 4.2,
      batteryPct: 94,
      rssiDbm: -72,
      lastHeartbeat: Date.now(),
    },
    history: [],
    thresholds: {
      tiltWarningDeg: 3.5,
      tiltCriticalDeg: 6.0,
      vibrationWarningMmS: 5.0,
      vibrationCriticalMmS: 12.0,
      crackWarningMm: 8.0,
      crackCriticalMm: 18.0,
      gasWarningPpm: 50,
      gasCriticalPpm: 120,
    },
  },
  {
    id: 'SN-02',
    name: 'North Overburden Geophone',
    code: 'GEO-S2-02',
    type: 'geophone',
    zone: 'Sector 2 (Riverbank Overburden)',
    lat: 23.7530,
    lng: 86.4230,
    elevationMeters: 215,
    meshHopCount: 2,
    parentNodeId: 'MR-01',
    status: 'online',
    readings: {
      tiltDeg: 0.9,
      vibrationMmS: 1.6,
      crackWidthMm: 1.8,
      gasPpm: 18,
      rainfallMmHr: 4.2,
      batteryPct: 88,
      rssiDbm: -84,
      lastHeartbeat: Date.now(),
    },
    history: [],
    thresholds: {
      tiltWarningDeg: 3.5,
      tiltCriticalDeg: 6.0,
      vibrationWarningMmS: 4.5,
      vibrationCriticalMmS: 10.0,
      crackWarningMm: 8.0,
      crackCriticalMm: 16.0,
      gasWarningPpm: 40,
      gasCriticalPpm: 100,
    },
  },
  {
    id: 'SN-03',
    name: 'Abandoned Gallery Extensometer',
    code: 'EXT-S3-03',
    type: 'extensometer',
    zone: 'Sector 3 (Abandoned Gallery)',
    lat: 23.7450,
    lng: 86.4150,
    elevationMeters: 198,
    meshHopCount: 2,
    parentNodeId: 'MR-02',
    status: 'online',
    readings: {
      tiltDeg: 1.85,
      vibrationMmS: 1.2,
      crackWidthMm: 4.6,
      gasPpm: 34,
      rainfallMmHr: 4.2,
      batteryPct: 91,
      rssiDbm: -78,
      lastHeartbeat: Date.now(),
    },
    history: [],
    thresholds: {
      tiltWarningDeg: 3.0,
      tiltCriticalDeg: 5.5,
      vibrationWarningMmS: 4.0,
      vibrationCriticalMmS: 9.0,
      crackWarningMm: 7.0,
      crackCriticalMm: 15.0,
      gasWarningPpm: 45,
      gasCriticalPpm: 110,
    },
  },
  {
    id: 'SN-04',
    name: 'Pillar Seam Gas Sensor',
    code: 'GAS-S3-04',
    type: 'gas_sensor',
    zone: 'Sector 3 (Abandoned Gallery)',
    lat: 23.7438,
    lng: 86.4172,
    elevationMeters: 195,
    depthMeters: 45,
    meshHopCount: 3,
    parentNodeId: 'SN-03',
    status: 'online',
    readings: {
      tiltDeg: 0.4,
      vibrationMmS: 0.6,
      crackWidthMm: 3.1,
      gasPpm: 28,
      rainfallMmHr: 4.2,
      batteryPct: 79,
      rssiDbm: -89,
      lastHeartbeat: Date.now(),
    },
    history: [],
    thresholds: {
      tiltWarningDeg: 3.0,
      tiltCriticalDeg: 5.0,
      vibrationWarningMmS: 3.5,
      vibrationCriticalMmS: 8.0,
      crackWarningMm: 6.0,
      crackCriticalMm: 14.0,
      gasWarningPpm: 50,
      gasCriticalPpm: 100,
    },
  },
  {
    id: 'SN-05',
    name: 'Village School Extensometer',
    code: 'EXT-S4-05',
    type: 'extensometer',
    zone: 'Sector 4 (Village Slope)',
    lat: 23.7495,
    lng: 86.4215,
    elevationMeters: 232,
    meshHopCount: 1,
    parentNodeId: 'GW-01',
    status: 'online',
    readings: {
      tiltDeg: 1.1,
      vibrationMmS: 0.5,
      crackWidthMm: 3.4,
      gasPpm: 8,
      rainfallMmHr: 4.2,
      batteryPct: 96,
      rssiDbm: -68,
      lastHeartbeat: Date.now(),
    },
    history: [],
    thresholds: {
      tiltWarningDeg: 3.2,
      tiltCriticalDeg: 5.5,
      vibrationWarningMmS: 4.0,
      vibrationCriticalMmS: 10.0,
      crackWarningMm: 7.5,
      crackCriticalMm: 16.0,
      gasWarningPpm: 35,
      gasCriticalPpm: 90,
    },
  },
  {
    id: 'SN-06',
    name: 'Open Cast Crest Geophone',
    code: 'GEO-S1-06',
    type: 'geophone',
    zone: 'Sector 1 (Open Cast Pit)',
    lat: 23.7565,
    lng: 86.4110,
    elevationMeters: 245,
    meshHopCount: 2,
    parentNodeId: 'MR-01',
    status: 'online',
    readings: {
      tiltDeg: 0.8,
      vibrationMmS: 2.1,
      crackWidthMm: 1.5,
      gasPpm: 14,
      rainfallMmHr: 4.2,
      batteryPct: 84,
      rssiDbm: -82,
      lastHeartbeat: Date.now(),
    },
    history: [],
    thresholds: {
      tiltWarningDeg: 4.0,
      tiltCriticalDeg: 7.0,
      vibrationWarningMmS: 6.0,
      vibrationCriticalMmS: 15.0,
      crackWarningMm: 9.0,
      crackCriticalMm: 20.0,
      gasWarningPpm: 60,
      gasCriticalPpm: 150,
    },
  },
  {
    id: 'SN-07',
    name: 'Riverbed Embankment Tilt',
    code: 'TILT-S2-07',
    type: 'tiltmeter',
    zone: 'Sector 2 (Riverbank Overburden)',
    lat: 23.7542,
    lng: 86.4265,
    elevationMeters: 202,
    meshHopCount: 3,
    parentNodeId: 'SN-02',
    status: 'online',
    readings: {
      tiltDeg: 1.7,
      vibrationMmS: 1.1,
      crackWidthMm: 2.9,
      gasPpm: 10,
      rainfallMmHr: 4.2,
      batteryPct: 82,
      rssiDbm: -91,
      lastHeartbeat: Date.now(),
    },
    history: [],
    thresholds: {
      tiltWarningDeg: 3.0,
      tiltCriticalDeg: 5.0,
      vibrationWarningMmS: 3.5,
      vibrationCriticalMmS: 8.5,
      crackWarningMm: 6.5,
      crackCriticalMm: 14.0,
      gasWarningPpm: 40,
      gasCriticalPpm: 100,
    },
  },
  {
    id: 'SN-08',
    name: 'Sector 4 Optical Rain Gauge',
    code: 'RAIN-S4-08',
    type: 'rain_gauge',
    zone: 'Sector 4 (Village Slope)',
    lat: 23.7470,
    lng: 86.4220,
    elevationMeters: 235,
    meshHopCount: 1,
    parentNodeId: 'GW-01',
    status: 'online',
    readings: {
      tiltDeg: 0.1,
      vibrationMmS: 0.2,
      crackWidthMm: 0.0,
      gasPpm: 4,
      rainfallMmHr: 4.2,
      batteryPct: 99,
      rssiDbm: -65,
      lastHeartbeat: Date.now(),
    },
    history: [],
    thresholds: {
      tiltWarningDeg: 2.0,
      tiltCriticalDeg: 5.0,
      vibrationWarningMmS: 3.0,
      vibrationCriticalMmS: 8.0,
      crackWarningMm: 5.0,
      crackCriticalMm: 12.0,
      gasWarningPpm: 30,
      gasCriticalPpm: 80,
    },
  },
];

// Initial Gateway
const INITIAL_GATEWAY: GatewayDevice = {
  id: 'GW-01',
  name: 'Jharia Sector 4 Edge Gateway',
  code: 'EDGE-GW-JHR-04',
  lat: 23.7480,
  lng: 86.4200,
  ip: '192.168.4.1',
  mac: 'A4:E5:7C:18:99:F2',
  status: 'online',
  internetConnected: true,
  batteryPct: 98,
  wifiHotspotSsid: 'GEOSENTINEL_EDGE_GW01',
  localSirenActive: false,
  gsmSignalBars: 4,
  storeAndForwardBufferCount: 0,
  lastSyncTime: new Date().toLocaleTimeString(),
  firmwareVersion: 'v3.8.4-edge-ai',
  cpuTempC: 44.2,
  ramUsagePct: 32,
};

// Initial Mesh Links
const INITIAL_LINKS: MeshLink[] = [
  { id: 'L1', sourceId: 'SN-01', targetId: 'GW-01', rssiDbm: -72, packetLossPct: 0.2, protocol: 'LoRa 868MHz', active: true },
  { id: 'L2', sourceId: 'SN-05', targetId: 'GW-01', rssiDbm: -68, packetLossPct: 0.1, protocol: 'ESP-NOW 2.4GHz', active: true },
  { id: 'L3', sourceId: 'SN-08', targetId: 'GW-01', rssiDbm: -65, packetLossPct: 0.0, protocol: 'ESP-NOW 2.4GHz', active: true },
  { id: 'L4', sourceId: 'MR-01', targetId: 'GW-01', rssiDbm: -76, packetLossPct: 0.4, protocol: 'LoRa 868MHz', active: true },
  { id: 'L5', sourceId: 'SN-02', targetId: 'MR-01', rssiDbm: -84, packetLossPct: 1.2, protocol: 'LoRa 868MHz', active: true },
  { id: 'L6', sourceId: 'SN-06', targetId: 'MR-01', rssiDbm: -82, packetLossPct: 0.8, protocol: 'LoRa 868MHz', active: true },
  { id: 'L7', sourceId: 'SN-07', targetId: 'SN-02', rssiDbm: -91, packetLossPct: 2.1, protocol: 'LoRa 868MHz', active: true },
  { id: 'L8', sourceId: 'MR-02', targetId: 'GW-01', rssiDbm: -74, packetLossPct: 0.3, protocol: 'LoRa 868MHz', active: true },
  { id: 'L9', sourceId: 'SN-03', targetId: 'MR-02', rssiDbm: -78, packetLossPct: 0.5, protocol: 'LoRa 868MHz', active: true },
  { id: 'L10', sourceId: 'SN-04', targetId: 'SN-03', rssiDbm: -89, packetLossPct: 1.8, protocol: 'LoRa 868MHz', active: true },
];

// Initial Citizen Crack Reports
const INITIAL_REPORTS: CitizenCrackReport[] = [
  {
    id: 'CR-801',
    reporterName: 'Manoj Kumar Soren',
    phone: '+91 94311 88421',
    timestamp: '28 mins ago',
    timeEpoch: Date.now() - 28 * 60 * 1000,
    lat: 23.7490,
    lng: 86.4210,
    zone: 'Sector 4 (Village Slope)',
    crackWidthEstimateMm: 9,
    photoUrl: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
    description: 'Ground crack running across courtyard near primary school, expanded overnight.',
    status: 'Corroborated & Approved',
    reviewedBy: 'Chief Geologist R. V. Sharma',
    reviewNotes: 'Matches SN-05 extensometer displacement trend. Corroborated.',
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
    photoUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80',
    description: 'Wall splitting along eastern foundation of pump house adjacent to old incline.',
    status: 'Corroborated & Approved',
    reviewedBy: 'Mine Safety Inspector T. Sen',
    reviewNotes: 'Close to SN-03; high shear zone verified.',
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
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
    description: 'Superficial soil drying cracks observed on road embankment.',
    status: 'Pending Review',
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
  selectedNodeId: string | null;
  rainfallRate: number;
  audioMuted: boolean;
  
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

const GeoSentinelContext = createContext<GeoSentinelContextType | undefined>(undefined);

export const GeoSentinelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    name: 'S. K. Verma',
    role: 'Chief Mining Safety Engineer',
    email: 'verma.sk@geosentinel.gov.in',
    badge: 'OPERATOR L3',
  });

  const [nodes, setNodes] = useState<SensorNode[]>(INITIAL_NODES);

  const [gateway, setGateway] = useState<GatewayDevice>(INITIAL_GATEWAY);
  const [links] = useState<MeshLink[]>(INITIAL_LINKS);
  const [alerts, setAlerts] = useState<AlertDispatchRecord[]>(INITIAL_ALERTS);
  const [reports, setReports] = useState<CitizenCrackReport[]>(INITIAL_REPORTS);
  const [assemblyPoints, setAssemblyPoints] = useState<EvacuationAssemblyPoint[]>(INITIAL_ASSEMBLY_POINTS);
  const [checkIns, setCheckIns] = useState<CommunityCheckIn[]>(INITIAL_CHECKINS);
  const [scenario, setScenarioState] = useState<SimulationScenario>('baseline');
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<'landing' | 'operator' | 'gis' | 'topology' | 'gateway' | 'public' | 'citizen' | 'admin'>('landing');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rainfallRate, setRainfallRate] = useState<number>(4.2);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [falseAlarmSuppression, setFalseAlarmSuppression] = useState<boolean>(false);

  const login = useCallback(async (email?: string, password?: string) => {
    try {
      let data: any = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const text = await res.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.warn("Non-JSON login response:", text);
          }
        }
        if (res.ok && data) {
          setIsAuthenticated(true);
          setIsLoginModalOpen(false);
          setActiveTab('operator');
          setCurrentUser({
            name: data.name || 'Chief Mining Safety Engineer',
            role: data.role || 'operator',
            email: data.email || email || 'operator@geosentinel.gov.in',
            badge: (data.role || 'OPERATOR').toUpperCase(),
          });
          if (data.token || data.access_token) {
            localStorage.setItem('geosentinel_token', data.token || data.access_token);
          }
          return;
        }
      } catch (networkErr) {
        console.warn("Backend auth unreachable, utilizing offline demo session:", networkErr);
      }

      // Offline demo login fallback
      setIsAuthenticated(true);
      setIsLoginModalOpen(false);
      setActiveTab('operator');
      setCurrentUser({
        name: email?.includes('admin') ? 'Directorate General (Admin)' : 'S. K. Verma (Chief Engineer)',
        role: email?.includes('admin') ? 'admin' : 'operator',
        email: email || 'operator@geosentinel.gov.in',
        badge: email?.includes('admin') ? 'ADMIN' : 'OPERATOR L3',
      });
    } catch (err: any) {
      console.error("Login error:", err);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setActiveTab('landing');
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

  const submitCrackReport = useCallback((reportData: Omit<CitizenCrackReport, 'id' | 'timestamp' | 'timeEpoch' | 'status'>) => {
    const newReport: CitizenCrackReport = {
      ...reportData,
      id: `CR-${Math.floor(800 + Math.random() * 200)}`,
      timestamp: 'Just now',
      timeEpoch: Date.now(),
      status: 'Pending Review',
    };
    setReports((prev) => [newReport, ...prev]);
  }, []);

  const reviewCrackReport = useCallback((reportId: string, approved: boolean, reviewNotes: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: approved ? 'Corroborated & Approved' : 'Dismissed (Non-critical)',
              reviewedBy: 'Operator on Duty (Shift A)',
              reviewNotes,
            }
          : r
      )
    );
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
                setNodes(data);
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

    return () => clearInterval(interval);
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

  return (
    <GeoSentinelContext.Provider
      value={{
        nodes,
        gateway,
        links,
        risk,
        alerts,
        reports,
        assemblyPoints,
        checkIns,
        scenario,
        userRole,
        language,
        activeTab,
        selectedNodeId,
        rainfallRate,
        audioMuted,
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
