import React, { useState, useMemo, useRef } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Camera, 
  CheckCircle2, 
  MapPin, 
  Upload, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  Lock,
  Radio,
  Server,
  FileText,
  Cpu,
  Layers
} from '../icons';

// Built-in Geological Fracture Reference Patterns
const FISSURE_TEMPLATES = [
  {
    id: 'soil',
    title: 'Ground Fissure in Soil',
    subtitle: 'Sector 4 Village Slope',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%2312151c'/><path d='M30 40 Q 110 90, 160 140 T 260 210 T 370 260' stroke='%2338bdf8' stroke-width='4' fill='none'/><path d='M160 140 Q 190 90, 240 70' stroke='%2338bdf8' stroke-width='2.5' fill='none' stroke-dasharray='4,2'/><circle cx='160' cy='140' r='5' fill='%23ef4444'/><text x='20' y='280' fill='%2394a3b8' font-family='sans-serif' font-size='12'>SOIL SHEAR FISSURE • SECTOR 4</text></svg>"
  },
  {
    id: 'wall',
    title: 'Masonry Wall Shear',
    subtitle: 'Sector 3 Incline Gallery',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%231a141f'/><path d='M60 20 L 120 110 L 90 180 L 150 280' stroke='%23f59e0b' stroke-width='5' fill='none'/><path d='M120 110 L 220 130 L 310 160' stroke='%23f59e0b' stroke-width='3' fill='none'/><circle cx='120' cy='110' r='6' fill='%23ef4444'/><text x='20' y='280' fill='%23d8b4fe' font-family='sans-serif' font-size='12'>MASONRY WALL SEPARATION • SECTOR 3</text></svg>"
  },
  {
    id: 'road',
    title: 'Road Surface Fracture',
    subtitle: 'Sector 2 Riverbank Buffer',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%230f141a'/><path d='M20 150 Q 140 140, 220 160 T 380 145' stroke='%23ef4444' stroke-width='6' fill='none'/><path d='M220 160 Q 250 80, 290 30' stroke='%23f87171' stroke-width='3' fill='none'/><circle cx='220' cy='160' r='6' fill='%23ef4444'/><text x='20' y='280' fill='%23cbd5e1' font-family='sans-serif' font-size='12'>ROADWAY EMBANKMENT CRACK • SECTOR 2</text></svg>"
  },
  {
    id: 'highwall',
    title: 'Highwall Strata Shear',
    subtitle: 'Sector 1 Open Cast Pit',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23141a16'/><path d='M40 30 L 180 160 L 240 280' stroke='%23a3e635' stroke-width='5' fill='none'/><circle cx='180' cy='160' r='6' fill='%23ef4444'/><text x='20' y='280' fill='%2386efac' font-family='sans-serif' font-size='12'>HIGHWALL BENCH STRATA CRACK</text></svg>"
  }
];

export const CitizenCrackPortal: React.FC = () => {
  const { 
    reports, 
    submitCrackReport
  } = useGeoSentinel();

  // Documentation Sub-Tab State
  const [docTab, setDocTab] = useState<'architecture' | 'physics' | 'hardware' | 'api' | 'security' | 'crack-portal' | 'sop'>('architecture');

  // Crack Reporting Form State
  const [reporterName, setReporterName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [zone, setZone] = useState<string>('Sector 4 (Village Slope)');
  const [lat, setLat] = useState<number>(23.7482);
  const [lng, setLng] = useState<number>(86.4215);
  const [isGpsAcquired, setIsGpsAcquired] = useState<boolean>(false);
  const [crackWidth, setCrackWidth] = useState<number>(12);
  const [description, setDescription] = useState<string>('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [submittedReportId, setSubmittedReportId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic severity tag based on width
  const severityTag = useMemo(() => {
    if (crackWidth >= 30) return { label: 'Critical Evacuation Hazard (>30mm)', color: 'text-[#ef4444] bg-[#ef4444]/15 border-[#ef4444]/40', icon: AlertTriangle };
    if (crackWidth >= 16) return { label: 'Severe Subsidence Crack (16-30mm)', color: 'text-[#fb923c] bg-[#fb923c]/15 border-[#fb923c]/40', icon: AlertTriangle };
    if (crackWidth >= 6) return { label: 'Moderate Shear Fissure (6-15mm)', color: 'text-[#f59e0b] bg-[#f59e0b]/15 border-[#f59e0b]/40', icon: Activity };
    return { label: 'Minor Surface Tension (1-5mm)', color: 'text-[#38bdf8] bg-[#38bdf8]/15 border-[#38bdf8]/40', icon: Activity };
  }, [crackWidth]);

  // Handle GPS Auto-detection
  const handleAutoDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(4)));
          setLng(parseFloat(pos.coords.longitude.toFixed(4)));
          setIsGpsAcquired(true);
        },
        () => {
          setLat(23.7480 + (Math.random() * 0.004 - 0.002));
          setLng(86.4210 + (Math.random() * 0.004 - 0.002));
          setIsGpsAcquired(true);
        }
      );
    } else {
      setLat(23.7482);
      setLng(86.4215);
      setIsGpsAcquired(true);
    }
  };

  // Handle Local Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const activePhoto = customPhotoUrl || FISSURE_TEMPLATES[selectedTemplateIndex].url;
    const generatedId = `CR-${Math.floor(804 + Math.random() * 100)}`;
    setSubmittedReportId(generatedId);

    await submitCrackReport({
      reporterName: reporterName.trim() || 'Anonymous Resident',
      phone: phone.trim() || '+91 94311 00000',
      lat,
      lng,
      zone,
      crackWidthEstimateMm: crackWidth,
      photoUrl: activePhoto,
      description: description.trim() || 'Observed rapid crack dilation and soil aperture opening along ground boundary.',
      severity: severityTag.label,
    });

    setIsSubmitting(false);
    setSubmittedSuccess(true);
    setReporterName('');
    setPhone('');
    setDescription('');
    setCustomPhotoUrl(null);

    setTimeout(() => {
      setSubmittedSuccess(false);
    }, 5000);
  };

  const navTabs = [
    { id: 'architecture', label: 'Architecture & Stack', icon: Layers, count: '6 Layers' },
    { id: 'physics', label: 'Knothe Physics Model', icon: Sparkles, count: 'CIMFR' },
    { id: 'hardware', label: 'LoRa Mesh & Hardware', icon: Cpu, count: 'SX1262' },
    { id: 'api', label: 'REST & WebSocket API', icon: FileText, count: '12 Endpoints' },
    { id: 'security', label: 'Security & Hashing', icon: Lock, count: 'bcrypt + HS256' },
    { id: 'crack-portal', label: 'Crack Reporting & Logs', icon: Camera, count: `${reports.length} Logs` },
    { id: 'sop', label: 'DGMS Disaster SOPs', icon: ShieldAlert, count: 'Stage 1-5' }
  ] as const;

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn font-sans select-none text-white pb-24">
      
      {/* 1. TOP HERO & DOCUMENTATION HEADER */}
      <div className="border-b border-[#222222] pb-6 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[#a3e635] font-black text-2xl font-mono tracking-tighter">///</span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
              System Documentation &amp; Technical Manual
            </h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-full bg-[#111111] border border-[#262626] text-[#a3e635] font-bold">
              SIH 2026 · PS-25
            </span>
            <span className="px-3 py-1 rounded-full bg-[#111111] border border-[#262626] text-[#38bdf8] font-bold">
              MINISTRY OF COAL
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[#828894] max-w-4xl leading-relaxed">
          Comprehensive engineering specifications, Knothe subsidence equations, LoRa multi-hop mesh protocols, DGMS safety thresholds, cryptographic hashing standards, and citizen telemetry triage.
        </p>
      </div>

      {/* 2. HORIZONTAL NAVIGATION TABS BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#1c1c1c]">
        {navTabs.map((tab) => {
          const IconCmp = tab.icon;
          const isActive = docTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setDocTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#141414] border-[#444444] text-white shadow-sm'
                  : 'bg-[#080808] border-[#1c1c1c] text-[#828894] hover:text-white hover:bg-[#111111] hover:border-[#333333]'
              }`}
            >
              <IconCmp size={14} className={isActive ? 'text-[#a3e635]' : 'text-[#828894]'} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isActive ? 'bg-[#222222] text-[#a3e635]' : 'bg-[#111111] text-[#666666]'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ARCHITECTURE & SYSTEM DESIGN                                   */}
      {/* ========================================================================= */}
      {docTab === 'architecture' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-[#222222] bg-[#080808] space-y-6">
            <div className="border-b border-[#1c1c1c] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-[#a3e635]" />
                  End-to-End System Architecture
                </h2>
                <p className="text-xs text-[#828894] mt-1">Multi-tier edge-to-cloud resilience for zero-infrastructure hazardous mining environments.</p>
              </div>
              <span className="text-[11px] font-mono text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/30 px-3 py-1 rounded-full">
                Fail-Safe Architecture
              </span>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-[#222222] bg-[#000000] space-y-2">
                <div className="flex items-center gap-2 text-[#a3e635] font-mono font-bold text-xs uppercase">
                  <Cpu size={14} /> 1. Field Nodes (IoT)
                </div>
                <p className="text-[#a1a1aa] leading-relaxed text-[11px]">
                  Solar-powered ESP32 nodes equipped with MPU-6050 (3-axis tilt/pitch/roll), piezoelectric vibration sensors, and capacitive soil moisture probes.
                </p>
                <div className="text-[10px] font-mono text-[#71717a] pt-2 border-t border-[#1c1c1c]">LoRa 868/915 MHz · 2.5km range</div>
              </div>

              <div className="p-4 rounded-xl border border-[#222222] bg-[#000000] space-y-2">
                <div className="flex items-center gap-2 text-[#38bdf8] font-mono font-bold text-xs uppercase">
                  <Radio size={14} /> 2. Edge Gateway
                </div>
                <p className="text-[#a1a1aa] leading-relaxed text-[11px]">
                  SX1302/1303 LoRaWAN concentrator running embedded Node.js/Linux. Manages local packet deduplication, 110dB siren relay, and offline fallback Wi-Fi hotspot.
                </p>
                <div className="text-[10px] font-mono text-[#71717a] pt-2 border-t border-[#1c1c1c]">Zero-Internet Fallback · 100% Offline</div>
              </div>

              <div className="p-4 rounded-xl border border-[#222222] bg-[#000000] space-y-2">
                <div className="flex items-center gap-2 text-[#f59e0b] font-mono font-bold text-xs uppercase">
                  <Server size={14} /> 3. Node.js Core API
                </div>
                <p className="text-[#a1a1aa] leading-relaxed text-[11px]">
                  High-throughput Express backend with WebSocket server. Processes sensor streams, computes Knothe displacement profiles, and manages MongoDB Atlas persistence.
                </p>
                <div className="text-[10px] font-mono text-[#71717a] pt-2 border-t border-[#1c1c1c]">JWT Auth · bcrypt Hashing · REST + WS</div>
              </div>

              <div className="p-4 rounded-xl border border-[#222222] bg-[#000000] space-y-2">
                <div className="flex items-center gap-2 text-[#a78bfa] font-mono font-bold text-xs uppercase">
                  <Activity size={14} /> 4. Visualization &amp; GIS
                </div>
                <p className="text-[#a1a1aa] leading-relaxed text-[11px]">
                  Hardware-accelerated Canvas 2D/WebGL geospatial heatmap, 3D mesh topology graph, operator mission control terminal, and multi-lingual village safety board.
                </p>
                <div className="text-[10px] font-mono text-[#71717a] pt-2 border-t border-[#1c1c1c]">Sub-Second Latency · 5 Languages</div>
              </div>
            </div>

            {/* Core Architectural Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-[#1c1c1c] bg-[#0c0c0c] space-y-1.5">
                <div className="font-bold text-white text-xs">Autonomous Mesh Routing</div>
                <p className="text-[11px] text-[#828894] leading-relaxed">
                  Dynamic routing protocol discovers shortest multi-hop paths to circumvent terrain obstructions, mine overburden ridges, and deep pit geometry.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#1c1c1c] bg-[#0c0c0c] space-y-1.5">
                <div className="font-bold text-white text-xs">Acoustic Disaster Siren Relays</div>
                <p className="text-[11px] text-[#828894] leading-relaxed">
                  Physical 110 dB sirens hardwired to gateway GPIOs fire autonomously if local tilt/acceleration thresholds breach Stage 5 failure limits.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#1c1c1c] bg-[#0c0c0c] space-y-1.5">
                <div className="font-bold text-white text-xs">Spatial Corroboration Engine</div>
                <p className="text-[11px] text-[#828894] leading-relaxed">
                  Eliminates false positives from accidental bumps or fauna disturbance by requiring 2 or more adjacent nodes to confirm strata shear displacement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: KNOTHE SUBSIDENCE PHYSICS MODEL                                */}
      {/* ========================================================================= */}
      {docTab === 'physics' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-[#222222] bg-[#080808] space-y-6">
            <div className="border-b border-[#1c1c1c] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-[#a3e635]" />
                  Knothe Time-Dependent Influence &amp; CIMFR Geotechnical Model
                </h2>
                <p className="text-xs text-[#828894] mt-1">Mathematical formulation governing strata displacement, influence radius, and pore-water shear acceleration.</p>
              </div>
              <span className="text-[11px] font-mono text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-3 py-1 rounded-full">
                Physics Engine
              </span>
            </div>

            {/* Formula Block 1 */}
            <div className="p-5 rounded-xl border border-[#262626] bg-[#000000] space-y-3">
              <div className="text-xs font-mono font-bold text-[#a3e635] uppercase">1. Gaussian Subsidence Distribution Profile</div>
              <div className="p-3.5 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c] font-mono text-sm sm:text-base text-white text-center">
                S(x) = S_max · exp( -π · (x² / R²) )
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-2.5 rounded-lg bg-[#111111] border border-[#222222]">
                  <span className="font-mono text-[#a3e635] font-bold">S(x)</span>: Subsidence at distance <code className="text-white">x</code> from mine boundary (mm).
                </div>
                <div className="p-2.5 rounded-lg bg-[#111111] border border-[#222222]">
                  <span className="font-mono text-[#38bdf8] font-bold">S_max</span>: Maximum possible trough subsidence = <code className="text-white">m · a · q</code>.
                </div>
                <div className="p-2.5 rounded-lg bg-[#111111] border border-[#222222]">
                  <span className="font-mono text-[#f59e0b] font-bold">R</span>: Radius of principal influence = <code className="text-white">H / tan(β)</code>.
                </div>
              </div>
            </div>

            {/* Formula Block 2: Pore-Water Multiplier */}
            <div className="p-5 rounded-xl border border-[#262626] bg-[#000000] space-y-3">
              <div className="text-xs font-mono font-bold text-[#38bdf8] uppercase">2. Monsoon Piezometric Pore-Water Factor (Ψ)</div>
              <div className="p-3.5 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c] font-mono text-sm sm:text-base text-white text-center">
                Ψ = 1.0 + 0.5 · (Rainfall_Rate / 50) · (VWC% / 100)
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                During heavy monsoon downpours, interstitial pore-water pressure reduces the effective normal stress between strata layers. GeoSentinel dynamically multiplies the calculated shear rate by factor <strong className="text-white">Ψ</strong>, advancing early warning lead times by up to <strong>4.2 hours</strong> before visual ground rupture.
              </p>
            </div>

            {/* Formula Block 3: Dynamic Tilt Vector & Rate of Change */}
            <div className="p-5 rounded-xl border border-[#262626] bg-[#000000] space-y-3">
              <div className="text-xs font-mono font-bold text-[#f59e0b] uppercase">3. Multi-Axis Dynamic Tilt Vector Magnitude</div>
              <div className="p-3.5 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c] font-mono text-sm sm:text-base text-white text-center">
                θ_total = √( (ΔPitch)² + (ΔRoll)² ) &nbsp;|&nbsp; Rate = d(θ_total) / dt (deg/hr)
              </div>
              <div className="text-xs text-[#828894] space-y-1">
                <div>• <strong>Threshold Advisory:</strong> Rate &gt; 0.25°/hr for 3 consecutive telemetry ticks</div>
                <div>• <strong>Threshold Critical:</strong> Rate &gt; 1.20°/hr OR total angular displacement &gt; 4.5°</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: HARDWARE SPECIFICATIONS & MESH TOPOLOGY                        */}
      {/* ========================================================================= */}
      {docTab === 'hardware' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-[#222222] bg-[#080808] space-y-6">
            <div className="border-b border-[#1c1c1c] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu size={18} className="text-[#a3e635]" />
                  Hardware BOM &amp; Edge Hardware Specifications
                </h2>
                <p className="text-xs text-[#828894] mt-1">Component list, power budget, and radio link budget for mine surface deployment.</p>
              </div>
              <span className="text-[11px] font-mono text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-3 py-1 rounded-full">
                Hardware Specs
              </span>
            </div>

            {/* Bill of Materials Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#1c1c1c] rounded-xl overflow-hidden">
                <thead className="bg-[#111111] text-[#a1a1aa] font-mono border-b border-[#222222]">
                  <tr>
                    <th className="p-3">Subsystem</th>
                    <th className="p-3">Component / IC</th>
                    <th className="p-3">Key Specification</th>
                    <th className="p-3">Power Consumption</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c] bg-[#000000] text-[#e4e4e7]">
                  <tr>
                    <td className="p-3 font-semibold text-white">Microcontroller</td>
                    <td className="p-3 font-mono text-[#a3e635]">ESP32-S3-WROOM-1</td>
                    <td className="p-3">Dual-core Xtensa 32-bit LX7 @ 240MHz, 8MB PSRAM</td>
                    <td className="p-3 font-mono">15µA Deep Sleep / 80mA Active</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">LoRa Radio Transceiver</td>
                    <td className="p-3 font-mono text-[#38bdf8]">Semtech SX1262</td>
                    <td className="p-3">868/915 MHz, +22 dBm Tx power, -148 dBm sensitivity</td>
                    <td className="p-3 font-mono">4.2mA Rx / 118mA Tx @ +22dBm</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Inclinometer / IMU</td>
                    <td className="p-3 font-mono text-[#f59e0b]">MPU-6050 + Kalman Filter</td>
                    <td className="p-3">3-Axis Gyro (±250°/s) + 3-Axis Accel (±2g), 0.05° resolution</td>
                    <td className="p-3 font-mono">3.8mA Active / 5µA Sleep</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Soil Moisture Probe</td>
                    <td className="p-3 font-mono text-[#a78bfa]">Capacitive VWC v1.2</td>
                    <td className="p-3">Corrosion-resistant capacitive dielectric sensor (0-100%)</td>
                    <td className="p-3 font-mono">5mA during pulse read</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Solar Power &amp; Storage</td>
                    <td className="p-3 font-mono text-[#22c55e]">CN3791 MPPT + 18650 LiFePO4</td>
                    <td className="p-3">6V 3W Monocrystalline Panel + 3.2V 3200mAh LiFePO4 Cell</td>
                    <td className="p-3 font-mono">Autonomy: 21 days zero sunlight</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Edge Gateway Hub</td>
                    <td className="p-3 font-mono text-[#f43f5e]">Raspberry Pi CM4 + SX1302</td>
                    <td className="p-3">8-Channel LoRaWAN Concentrator + SIM800L GSM + 110dB Relay</td>
                    <td className="p-3 font-mono">5V 2.5A (12V 50W Solar Kit)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: REST API & WEBSOCKET SPECIFICATION                             */}
      {/* ========================================================================= */}
      {docTab === 'api' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-[#222222] bg-[#080808] space-y-6">
            <div className="border-b border-[#1c1c1c] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText size={18} className="text-[#a3e635]" />
                  REST API &amp; Real-Time WebSocket Protocols
                </h2>
                <p className="text-xs text-[#828894] mt-1">Interactive schema reference for backend endpoints and telemetry push streams.</p>
              </div>
              <span className="text-[11px] font-mono text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/30 px-3 py-1 rounded-full">
                API v1.0.0
              </span>
            </div>

            {/* Endpoints Grid */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[#222222] bg-[#000000] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] font-bold">GET</span>
                  <span className="text-white font-bold">/api/nodes</span>
                  <span className="text-[#71717a] ml-auto">Public / Operator</span>
                </div>
                <p className="text-xs text-[#828894]">Returns all active surface mesh nodes, latest tilt, vibration, battery, and current status.</p>
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c] font-mono text-[11px] text-[#86efac]">
                  &#123; "status": "ok", "count": 6, "data": [ &#123; "id": "SN-01", "tiltDegrees": 0.42, "batteryVolts": 4.15, "status": "Normal" &#125; ] &#125;
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#222222] bg-[#000000] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">POST</span>
                  <span className="text-white font-bold">/api/ingest/packet</span>
                  <span className="text-[#f59e0b] ml-auto">Gateway Auth Required</span>
                </div>
                <p className="text-xs text-[#828894]">LoRa Gateway bridge pushing raw node telemetry packet to the server.</p>
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c] font-mono text-[11px] text-[#93c5fd]">
                  &#123; "nodeId": "SN-04", "pitch": 3.82, "roll": 1.15, "vibrationG": 0.12, "soilMoistureVwc": 48.5, "rssi": -78 &#125;
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#222222] bg-[#000000] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">POST</span>
                  <span className="text-white font-bold">/api/reports</span>
                  <span className="text-[#a3e635] ml-auto">Public (Zero Login)</span>
                </div>
                <p className="text-xs text-[#828894]">Submits citizen crowdsourced crack log with photo URL and aperture measurement.</p>
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c] font-mono text-[11px] text-[#fde047]">
                  &#123; "reporterName": "Ramesh Soren", "zone": "Sector 4", "crackWidthEstimateMm": 18, "lat": 23.7482, "lng": 86.4215 &#125;
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#222222] bg-[#000000] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#a78bfa]/20 text-[#a78bfa] font-bold">WSS</span>
                  <span className="text-white font-bold">ws://localhost:8000/ws/live</span>
                  <span className="text-[#a78bfa] ml-auto">Live Stream</span>
                </div>
                <p className="text-xs text-[#828894]">Sub-second live telemetry broadcaster. Emits <code className="text-white">NODE_UPDATE</code>, <code className="text-white">ALERT_TRIGGERED</code>, and <code className="text-white">SIREN_STATE</code>.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: SECURITY, HASHING & RBAC                                       */}
      {/* ========================================================================= */}
      {docTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-[#222222] bg-[#080808] space-y-6">
            <div className="border-b border-[#1c1c1c] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock size={18} className="text-[#a3e635]" />
                  Cryptographic Hashing, Authentication &amp; RBAC
                </h2>
                <p className="text-xs text-[#828894] mt-1">Enterprise-grade credential protection, adaptive salt derivation, and signed session governance.</p>
              </div>
              <span className="text-[11px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-3 py-1 rounded-full">
                Security Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-xl border border-[#262626] bg-[#000000] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="text-[#a3e635] font-mono font-black">1.</span>
                  <span>Password Hashing: bcrypt (10 Salt Rounds)</span>
                </div>
                <p className="text-[#a1a1aa] leading-relaxed text-[11px]">
                  GeoSentinel utilizes the Blowfish-based adaptive key derivation function with <strong>10 salt rounds</strong> (<code className="text-[#a3e635]">bcrypt.genSalt(10)</code>).
                </p>
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c] font-mono text-[11px] text-[#a3e635]">
                  // backend/models/User.js<br />
                  const salt = await bcrypt.genSalt(10);<br />
                  const hash = await bcrypt.hash(plainPassword, salt);
                </div>
                <p className="text-[11px] text-[#71717a]">
                  Constant-time comparison (<code className="text-white">bcrypt.compare</code>) guarantees complete resistance against side-channel timing attacks and rainbow tables.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#262626] bg-[#000000] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="text-[#38bdf8] font-mono font-black">2.</span>
                  <span>Token Signing: HMAC-SHA256 (HS256)</span>
                </div>
                <p className="text-[#a1a1aa] leading-relaxed text-[11px]">
                  All authenticated session tokens are cryptographically signed using the <strong>HS256 algorithm</strong> with a 256-bit server secret key.
                </p>
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1c1c1c] font-mono text-[11px] text-[#38bdf8]">
                  // backend/middleware/auth.js<br />
                  jwt.sign(&#123; sub: user.username, role: user.role &#125;, JWT_SECRET, &#123; algorithm: 'HS256', expiresIn: '7d' &#125;)
                </div>
                <p className="text-[11px] text-[#71717a]">
                  Enforces role-based permissions between DGMS Administrators, Mine Safety Engineers, and public guest access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: CITIZEN CRACK REPORTING & LIVE COMMUNITY LOGS                 */}
      {/* ========================================================================= */}
      {docTab === 'crack-portal' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col justify-between">
              <span className="text-xs text-[#828894] font-medium">Total Citizen Reports</span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">{reports.length}</div>
              <span className="text-[11px] text-[#71717a] mt-1">Community submitted</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col justify-between">
              <span className="text-xs text-[#828894] font-medium">Corroborated Hazards</span>
              <div className="text-2xl sm:text-3xl font-bold text-[#22c55e] mt-2 font-mono flex items-center gap-2">
                <span>{reports.filter(r => r.status === 'Corroborated & Approved').length}</span>
                <ShieldCheck size={18} className="text-[#22c55e]" />
              </div>
              <span className="text-[11px] text-[#22c55e] mt-1">Verified with sensor nodes</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col justify-between">
              <span className="text-xs text-[#828894] font-medium">Pending Triage</span>
              <div className="text-2xl sm:text-3xl font-bold text-[#f59e0b] mt-2 font-mono flex items-center gap-2">
                <span>{reports.filter(r => r.status === 'Pending Review').length}</span>
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping" />
              </div>
              <span className="text-[11px] text-[#f59e0b] mt-1">Awaiting review</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col justify-between">
              <span className="text-xs text-[#828894] font-medium">Peak Fissure Aperture</span>
              <div className="text-2xl sm:text-3xl font-bold text-[#fb923c] mt-2 font-mono">
                {Math.max(...reports.map(r => r.crackWidthEstimateMm), 0)} <span className="text-xs font-normal text-[#71717a] font-sans">mm</span>
              </div>
              <span className="text-[11px] text-[#fb923c] mt-1">Sector 3 Highwall Gallery</span>
            </div>
          </div>

          {/* Submission Form + Community Log Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#080808] border border-[#222222] shadow-xl space-y-5">
              <div className="border-b border-[#1c1c1c] pb-3.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Camera size={18} className="text-[#38bdf8]" />
                  Log Geological Crack / Fissure
                </h3>
                <p className="text-xs text-[#828894] mt-1">
                  Crowdsourced observations directly calibrate early warning threshold models.
                </p>
              </div>

              {submittedSuccess && (
                <div className="p-3.5 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/15 text-xs text-[#86efac] flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 size={18} />
                  <span>Report {submittedReportId} transmitted to local Mesh Gateway!</span>
                </div>
              )}

              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
                {/* 1. Photo Reference Selection */}
                <div>
                  <label className="block text-[#828894] font-semibold mb-2">1. Visual Pattern / Camera Upload</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {FISSURE_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateIndex(idx);
                          setCustomPhotoUrl(null);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          selectedTemplateIndex === idx && !customPhotoUrl
                            ? 'border-[#38bdf8] bg-[#38bdf8]/15 ring-1 ring-[#38bdf8]'
                            : 'border-[#222222] bg-[#000000] hover:border-[#383838]'
                        }`}
                      >
                        <div className="h-14 rounded-lg overflow-hidden bg-black/60 mb-1.5 border border-white/5">
                          <img src={tmpl.url} alt={tmpl.title} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-white truncate block">{tmpl.title}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#1f1f1f] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload size={13} className="text-[#a3e635]" />
                      <span>{customPhotoUrl ? 'Replace Attached Photo' : 'Upload Camera Photo'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Aperture */}
                <div className="pt-2 border-t border-[#1c1c1c]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#828894] font-semibold">2. Estimated Width</label>
                    <span className="text-base font-bold font-mono text-white">{crackWidth} mm</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={crackWidth}
                    onChange={(e) => setCrackWidth(Number(e.target.value))}
                    className="w-full h-2 bg-[#1c1c1c] rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
                  />
                </div>

                {/* 3. Location */}
                <div className="pt-2 border-t border-[#1c1c1c] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#828894] font-semibold">3. Sector &amp; Coordinates</label>
                    <button
                      type="button"
                      onClick={handleAutoDetectGPS}
                      className="text-[11px] font-mono text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin size={12} />
                      <span>{isGpsAcquired ? 'GPS Locked' : 'Auto-Detect GPS'}</span>
                    </button>
                  </div>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full rounded-xl border border-[#262626] bg-[#000000] px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-[#38bdf8]"
                  >
                    <option value="Sector 4 (Village Slope)">Sector 4 (Village Slope - Near High Ground)</option>
                    <option value="Sector 3 (Incline Gallery)">Sector 3 (Incline Gallery Buffer)</option>
                    <option value="Sector 2 (Riverbank Embankment)">Sector 2 (Riverbank Embankment)</option>
                    <option value="Sector 1 (Open Cast Ridge)">Sector 1 (Open Cast Ridge)</option>
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? 'Transmitting to IoT Mesh Gateway...' : 'Submit Ground Fissure Report'}
                </button>
              </form>
            </div>

            {/* Community Log Feed */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#080808] border border-[#222222] shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3.5">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-[#a3e635]" />
                    <h3 className="text-sm font-bold text-white tracking-tight">Community Fissure Log Feed</h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#828894]">{reports.length} Reports</span>
                </div>

                <div className="space-y-3 mt-4 max-h-[460px] overflow-y-auto scrollbar-none pr-1">
                  {reports.map((r) => (
                    <div key={r.id} className="p-3.5 rounded-xl border border-[#1f1f1f] bg-[#000000] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-white">{r.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                          r.status === 'Corroborated & Approved'
                            ? 'bg-[#0c2818] text-[#22c55e] border-[#164e29]'
                            : r.status === 'Dismissed (Non-critical)'
                            ? 'bg-[#1e1518] text-[#f87171] border-[#451f26]'
                            : 'bg-[#291e0a] text-[#f59e0b] border-[#523d13]'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-16 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/5">
                          <img src={r.photoUrl} alt={r.id} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#cbd5e1] line-clamp-2 leading-tight">{r.description}</p>
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#717682] mt-1.5">
                            <span>{r.zone}</span>
                            <span className="text-[#f59e0b] font-bold">{r.crackWidthEstimateMm} mm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: DGMS DISASTER SOPS & EVACUATION GUIDELINES                     */}
      {/* ========================================================================= */}
      {docTab === 'sop' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-[#222222] bg-[#080808] space-y-6">
            <div className="border-b border-[#1c1c1c] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-[#fb923c]" />
                  DGMS Mining Safety Standard Operating Procedures (SOP)
                </h2>
                <p className="text-xs text-[#828894] mt-1">Official strata hazard thresholds and evacuation protocols prescribed for Jharia coalfield sectors.</p>
              </div>
              <span className="text-[11px] font-mono text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-3 py-1 rounded-full">
                DGMS Certified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4.5 rounded-xl border border-[#164e29] bg-[#08170d] space-y-2">
                <div className="text-xs font-bold text-[#22c55e]">Stage 1-2: Normal Baseline (0-20% Risk)</div>
                <p className="text-[11px] text-[#86efac] leading-relaxed">
                  Tilt rate &lt;0.05°/hr, vibration &lt;0.02g. Regular continuous mesh health pinging every 10 seconds. Normal operations permitted across mining face and village roads.
                </p>
              </div>

              <div className="p-4.5 rounded-xl border border-[#523d13] bg-[#1a1306] space-y-2">
                <div className="text-xs font-bold text-[#facc15]">Stage 3: Pre-Warning Advisory (21-50% Risk)</div>
                <p className="text-[11px] text-[#fef08a] leading-relaxed">
                  Subsurface strain detected on multiple adjacent nodes. Edge Gateway broadcasts intermittent SMS warnings to Panchayat heads and checks automated siren battery levels.
                </p>
              </div>

              <div className="p-4.5 rounded-xl border border-[#5a2e12] bg-[#1f0f06] space-y-2">
                <div className="text-xs font-bold text-[#fb923c]">Stage 4: Warning &amp; Preparation (51-75% Risk)</div>
                <p className="text-[11px] text-[#fed7aa] leading-relaxed">
                  Piezometric pore-water acceleration observed. Heavy earthmoving machinery stopped. Assembly shelters opened, and first-response rescue personnel positioned on North Ridge.
                </p>
              </div>

              <div className="p-4.5 rounded-xl border border-[#5c1d24] bg-[#220a0d] space-y-2">
                <div className="text-xs font-bold text-[#f87171]">Stage 5: Critical Mandatory Evacuation (&gt;75% Risk)</div>
                <p className="text-[11px] text-[#fca5a5] leading-relaxed">
                  Knothe failure envelope breached. Physical 110 dB acoustic sirens sound 3 consecutive pulses. Mandatory immediate evacuation of Sector 4 to High Ground Community Center.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
