import React, { useState, useMemo, useRef } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { TRANSLATIONS } from '../../services/Localization';
import { 
  ShieldAlert, 
  ShieldCheck, 
  PhoneCall, 
  Camera, 
  CheckCircle2, 
  AlertOctagon,
  X,
  MapPin,
  Upload,
  Activity,
  AlertTriangle,
  Sparkles,
  ChevronDown
} from '../icons';

// Built-in Geological Fracture Reference Patterns (Instant 1-Click for villagers without camera)
const FISSURE_TEMPLATES = [
  {
    id: 'soil',
    title: 'Ground Fissure in Soil',
    subtitle: 'Sector 4 Village Slope',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%2312151c'/><path d='M30 40 Q 110 90, 160 140 T 260 210 T 370 260' stroke='%2338bdf8' stroke-width='4' fill='none'/><path d='M160 140 Q 190 90, 240 70' stroke='%2338bdf8' stroke-width='2.5' fill='none' stroke-dasharray='4,2'/><circle cx='160' cy='140' r='5' fill='%23ef4444'/><text x='20' y='280' fill='%2394a3b8' font-family='sans-serif' font-size='12'>SOIL SHEAR FISSURE • SECTOR 4</text></svg>"
  },
  {
    id: 'wall',
    title: 'Masonry Wall Separation',
    subtitle: 'Sector 4 Village House',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%231a141f'/><path d='M60 20 L 120 110 L 90 180 L 150 280' stroke='%23f59e0b' stroke-width='5' fill='none'/><path d='M120 110 L 220 130 L 310 160' stroke='%23f59e0b' stroke-width='3' fill='none'/><circle cx='120' cy='110' r='6' fill='%23ef4444'/><text x='20' y='280' fill='%23d8b4fe' font-family='sans-serif' font-size='12'>MASONRY WALL CRACK • SECTOR 4</text></svg>"
  },
  {
    id: 'road',
    title: 'Road Surface Crack',
    subtitle: 'Sector 4 Village Access Road',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%230f141a'/><path d='M20 150 Q 140 140, 220 160 T 380 145' stroke='%23ef4444' stroke-width='6' fill='none'/><path d='M220 160 Q 250 80, 290 30' stroke='%23f87171' stroke-width='3' fill='none'/><circle cx='220' cy='160' r='6' fill='%23ef4444'/><text x='20' y='280' fill='%23cbd5e1' font-family='sans-serif' font-size='12'>ROADWAY EMBANKMENT FRACTURE</text></svg>"
  },
  {
    id: 'highwall',
    title: 'Perimeter Ridge Subsidence',
    subtitle: 'High Ground Buffer Zone',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23141a16'/><path d='M40 30 L 180 160 L 240 280' stroke='%23a3e635' stroke-width='5' fill='none'/><circle cx='180' cy='160' r='6' fill='%23ef4444'/><text x='20' y='280' fill='%2386efac' font-family='sans-serif' font-size='12'>SLOPE SHEAR FISSURE</text></svg>"
  }
];

export const PublicSafetyView: React.FC = () => {
  const { 
    risk, 
    assemblyPoints, 
    reports,
    submitCrackReport,
    language, 
    setLanguage, 
    submitCheckIn
  } = useGeoSentinel();

  // Internal Navigation within Village Dashboard
  const [villageTab, setVillageTab] = useState<'status' | 'report' | 'shelters' | 'checklist' | 'docs'>('status');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Check-In State
  const [residentName, setResidentName] = useState('');
  const [familyCount, setFamilyCount] = useState(4);
  const [residentPhone, setResidentPhone] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState<'safe' | 'help' | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  // Crack Reporting Form State
  const [reporterName, setReporterName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [zone, setZone] = useState<string>('Sector 4 (Village Slope)');
  const [lat, setLat] = useState<number>(23.7482);
  const [lng, setLng] = useState<number>(86.4215);
  const [isGpsAcquired, setIsGpsAcquired] = useState<boolean>(false);
  const [crackWidth, setCrackWidth] = useState<number>(14);
  const [description, setDescription] = useState<string>('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const currentStatus = t.statusLevels[risk.level] || t.statusLevels[1];

  // Dynamic severity evaluation based on aperture width
  const severityTag = useMemo(() => {
    if (crackWidth >= 30) return { label: 'Critical Evacuation Hazard (>30mm)', color: 'text-[#ef4444] bg-[#ef4444]/15 border-[#ef4444]/40', icon: AlertTriangle };
    if (crackWidth >= 16) return { label: 'Severe Subsidence Crack (16-30mm)', color: 'text-[#fb923c] bg-[#fb923c]/15 border-[#fb923c]/40', icon: AlertTriangle };
    if (crackWidth >= 6) return { label: 'Moderate Shear Fissure (6-15mm)', color: 'text-[#f59e0b] bg-[#f59e0b]/15 border-[#f59e0b]/40', icon: Activity };
    return { label: 'Minor Surface Tension (1-5mm)', color: 'text-[#38bdf8] bg-[#38bdf8]/15 border-[#38bdf8]/40', icon: Activity };
  }, [crackWidth]);

  // Tab definitions for the dropdown
  const tabOptions = [
    { id: 'status', label: 'Live Emergency Status', icon: Activity, tag: 'Level ' + risk.level, color: 'text-[#a3e635]' },
    { id: 'report', label: 'Report Ground Fissure', icon: Camera, tag: reports.length + ' Logs', color: 'text-[#38bdf8]' },
    { id: 'shelters', label: 'Assembly Shelters & Safe Zones', icon: ShieldCheck, tag: assemblyPoints.length + ' Shelters', color: 'text-[#22c55e]' },
    { id: 'checklist', label: 'Action Checklist & Hotlines', icon: ShieldAlert, tag: 'SOP Guide', color: 'text-[#f59e0b]' },
    { id: 'docs', label: 'Village Safety Documentation', icon: Sparkles, tag: 'Disaster Manual', color: 'text-[#a78bfa]' }
  ] as const;

  const activeTabObj = tabOptions.find(t => t.id === villageTab) || tabOptions[0];

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
      setIsGpsAcquired(true);
    }
  };

  // Handle Custom File Upload
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

  // Submit Crack Report to Backend & Context
  const handleCrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportSuccessMessage(null);

    const activePhoto = customPhotoUrl || FISSURE_TEMPLATES[selectedTemplateIndex].url;

    await submitCrackReport({
      reporterName: reporterName.trim() || 'Village Resident (Anonymous)',
      phone: phone.trim() || '9431100000',
      zone,
      lat,
      lng,
      photoUrl: activePhoto,
      crackWidthEstimateMm: Number(crackWidth),
      description: description.trim() || `Citizen reported ${crackWidth}mm surface fissure in ${zone}.`,
    });

    setIsSubmittingReport(false);
    setReportSuccessMessage(`Your crack report has been registered and cross-referenced with nearby LoRa tiltmeter nodes!`);
    setDescription('');
    setCustomPhotoUrl(null);

    setTimeout(() => {
      setReportSuccessMessage(null);
    }, 6000);
  };

  // 1-Click Instant Safe Check-in
  const handleInstantSafeClick = () => {
    submitCheckIn({
      residentName: residentName.trim() || 'Anonymous Resident (1-Tap Check-In)',
      familyCount: Number(familyCount) || 1,
      zone: 'Sector 4 Village',
      status: 'Safe at High Ground Shelter',
      locationNote: locationNote.trim() || 'Checked in via Public Notice Board Link',
      phone: residentPhone.trim() || 'N/A',
    });

    setHasCheckedIn(true);
    setShowCheckInModal(null);
  };

  const handleHelpCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    submitCheckIn({
      residentName: residentName.trim() || 'URGENT RESIDENT',
      familyCount: Number(familyCount) || 1,
      zone: 'Sector 4 Village',
      status: 'Trapped - Need Immediate Rescue',
      locationNote: locationNote.trim() || 'CRITICAL SOS RESCUE REQUEST',
      phone: residentPhone.trim() || 'N/A',
    });

    setHasCheckedIn(true);
    setShowCheckInModal(null);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 space-y-7 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & LOCAL WI-FI HOTSPOT BAR (Cleaned Up)                      */}
      {/* ========================================================================= */}
      <div className="border-b border-[#1a1f29] pb-5">
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full bg-[#3fcb7f] animate-ping" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Live Village Safety Board
          </h1>
          <span className="text-[11px] font-mono font-semibold text-[#3fcb7f] bg-[#3fcb7f]/10 border border-[#3fcb7f]/30 px-2.5 py-0.5 rounded-full">
            PUBLIC ACCESS • NO LOGIN
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#828894] mt-1">
          Zone: Jharia Coalfield Sector 4 &amp; High Ground Ridge • Updated Every 3.5s
        </p>
      </div>

      {/* Edge Hotspot & Language Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1e232d] bg-[#080a0d] px-4.5 py-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5 text-[#3fcb7f]">
          <span className="h-2 w-2 rounded-full bg-[#3fcb7f] animate-ping" />
          <span className="font-semibold text-white">{t.offlineEdgeBadge}</span>
          <span className="text-[11px] text-[#828894] hidden sm:inline">(Local Wi-Fi SSID: GEOSENTINEL_EDGE_GW01)</span>
        </div>

        {/* Language Selector in 5 Local Tongues */}
        <div className="flex items-center gap-1 bg-[#0f1218] p-1 rounded-xl border border-[#222733]">
          {(['en', 'hi', 'bn', 'or', 'sat'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                language === lang ? 'bg-white text-black font-bold shadow-sm' : 'text-[#828894] hover:text-white'
              }`}
            >
              {lang === 'en' ? 'English' :
               lang === 'hi' ? 'हिंदी' :
               lang === 'bn' ? 'বাংলা' :
               lang === 'or' ? 'ଓଡ଼ିଆ' : 'संथाली'}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VILLAGE DASHBOARD DROPDOWN & QUICK NAV SELECTOR                         */}
      {/* ========================================================================= */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#1e232d] bg-[#080a0d] shadow-sm">
          {/* Main Dropdown Trigger */}
          <div className="relative w-full sm:w-80">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[#262c38] bg-[#0c0e14] hover:border-[#38bdf8]/50 text-white transition-all cursor-pointer shadow-sm text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <activeTabObj.icon size={16} className={activeTabObj.color} />
                <span className="text-sm font-bold text-white truncate">{activeTabObj.label}</span>
              </div>
              <ChevronDown size={15} className={`text-[#828894] group-hover:text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Modal */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full sm:w-96 rounded-2xl border border-[#262c38] bg-[#0c0e14] p-2 shadow-2xl z-30 space-y-1 animate-in fade-in duration-150 backdrop-blur-xl">
                {tabOptions.map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = villageTab === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setVillageTab(opt.id as any);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#181d26] border border-[#3b4354] text-white shadow-sm' 
                          : 'hover:bg-[#121620] text-[#828894] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-black/60 border border-white/5 ${opt.color}`}>
                          <IconComp size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">{opt.label}</div>
                          <span className="text-[10px] text-[#717682]">{opt.tag}</span>
                        </div>
                      </div>
                      {isSelected && <span className="text-[#a3e635] text-xs font-bold font-mono">ACTIVE</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Tab Pills (Desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {tabOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVillageTab(opt.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  villageTab === opt.id
                    ? 'bg-[#181d26] text-white border border-[#3b4354] shadow-sm font-bold'
                    : 'text-[#828894] hover:text-white hover:bg-[#121620]'
                }`}
              >
                {opt.label.split(' ')[0]} {opt.label.split(' ')[1] || ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasCheckedIn && (
        <div className="rounded-2xl border border-[#3fcb7f]/40 bg-[#3fcb7f]/10 p-4.5 text-xs text-white flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-[#3fcb7f]" />
            <span className="font-medium">Thank you. Your resident safety check-in status has been transmitted to Gateway GW-01.</span>
          </div>
          <button onClick={() => setHasCheckedIn(false)} className="text-[#828894] hover:text-white text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: LIVE EMERGENCY STATUS HERO & 1-TAP SOS                             */}
      {/* ========================================================================= */}
      {villageTab === 'status' && (
        <div className="space-y-6">
          {/* Main Status Hero Card (High Contrast, Bold, Color-coded) */}
          <div className={`rounded-2xl border p-6 sm:p-10 text-center space-y-4 shadow-xl ${
            risk.level === 5 ? 'border-[#ef4444] bg-[#ef4444]/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]' :
            risk.level === 4 ? 'border-[#fb923c] bg-[#fb923c]/10 shadow-[0_0_30px_rgba(251,146,60,0.15)]' :
            risk.level === 3 ? 'border-[#facc15] bg-[#facc15]/10 shadow-[0_0_30px_rgba(250,204,21,0.15)]' :
            'border-[#3fcb7f]/40 bg-[#3fcb7f]/5 shadow-[0_0_20px_rgba(63,203,127,0.1)]'
          }`}>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-black/80 border border-white/20 text-white">
              {currentStatus.badge}
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {currentStatus.label}
            </h2>

            <p className="text-sm sm:text-lg text-[#e8eaee] max-w-2xl mx-auto leading-relaxed font-medium">
              {currentStatus.action}
            </p>

            {/* Time-to-Critical Countdown if Hazard Active */}
            {risk.timeToCriticalHours && (
              <div className="pt-3">
                <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">
                  {t.timeToCritical}
                </div>
                <div className="text-3xl sm:text-5xl font-bold text-white font-mono tracking-tight mt-1.5 animate-pulse">
                  0{Math.floor(risk.timeToCriticalHours)}h : {Math.floor((risk.timeToCriticalHours % 1) * 60)}m : 00s
                </div>
              </div>
            )}
          </div>

          {/* 1-Tap Resident SOS & Check-in Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setShowCheckInModal('safe')}
              className="flex items-center justify-center gap-3.5 rounded-2xl border border-[#3fcb7f]/50 bg-[#3fcb7f]/10 hover:bg-[#3fcb7f]/20 p-5 text-white transition-all transform active:scale-[0.99] cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="h-8 w-8 text-[#3fcb7f] shrink-0" />
              <div className="text-left">
                <div className="text-base sm:text-lg font-bold text-white">{t.imSafeBtn}</div>
                <div className="text-xs text-[#94a3b8] mt-0.5">1-Tap: Count family as safely arrived at shelter</div>
              </div>
            </button>

            <button
              onClick={() => setShowCheckInModal('help')}
              className="flex items-center justify-center gap-3.5 rounded-2xl border border-[#ef4444]/60 bg-[#ef4444]/15 hover:bg-[#ef4444]/25 p-5 text-white transition-all transform active:scale-[0.99] cursor-pointer shadow-sm"
            >
              <AlertOctagon className="h-8 w-8 text-[#ef4444] shrink-0 animate-pulse" />
              <div className="text-left">
                <div className="text-base sm:text-lg font-bold text-[#ef4444]">{t.needHelpBtn}</div>
                <div className="text-xs text-[#94a3b8] mt-0.5">Send immediate rescue team to your GPS location</div>
              </div>
            </button>
          </div>

          {/* Quick Crack Report Banner */}
          <div className="p-5 rounded-2xl border border-[#1e232d] bg-[#080a0d] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#38bdf8]/10 text-[#38bdf8]">
                <Camera size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Spotted a new ground crack or wall fissure?</h3>
                <p className="text-xs text-[#828894] mt-0.5">Crowdsourced citizen reports directly alert mine safety inspectors and calibrate our early warning models.</p>
              </div>
            </div>
            <button
              onClick={() => setVillageTab('report')}
              className="px-5 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              Report Fissure Directly →
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: IN-PAGE CITIZEN CRACK REPORTING FORM & COMMUNITY LOGS              */}
      {/* ========================================================================= */}
      {villageTab === 'report' && (
        <div className="space-y-6">
          {reportSuccessMessage && (
            <div className="p-4 rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e] text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 size={18} />
              <span>{reportSuccessMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Crack Submission Form */}
            <div className="lg:col-span-7 p-6 rounded-2xl border border-[#1e232d] bg-[#080a0d] space-y-5 shadow-sm">
              <div className="border-b border-[#161920] pb-3.5">
                <div className="flex items-center gap-2">
                  <Camera size={18} className="text-[#38bdf8]" />
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Submit Ground Fissure / Crack Report
                  </h2>
                </div>
                <p className="text-xs text-[#828894] mt-1">
                  Take a photo or pick a reference fracture pattern. Zero login required for village residents.
                </p>
              </div>

              <form onSubmit={handleCrackSubmit} className="space-y-4 text-xs">
                {/* 1. Photo Selection or Reference Pattern */}
                <div>
                  <label className="block text-[#828894] font-semibold mb-2">
                    1. Crack Photo / Visual Evidence
                  </label>
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
                            : 'border-[#222733] bg-[#0c0e14] hover:border-[#3b4354]'
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
                      className="px-4 py-2 rounded-xl border border-[#2d3444] bg-[#12161f] hover:bg-[#1b202c] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload size={13} className="text-[#a3e635]" />
                      <span>{customPhotoUrl ? 'Replace Uploaded Image' : 'Upload From Phone / Camera'}</span>
                    </button>
                    {customPhotoUrl && (
                      <span className="text-[11px] text-[#22c55e] font-mono font-medium">✓ Custom image attached</span>
                    )}
                  </div>
                </div>

                {/* 2. Aperture Slider */}
                <div className="pt-2 border-t border-[#161920]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#828894] font-semibold">2. Estimated Crack Aperture (Width)</label>
                    <span className="text-base font-bold font-mono text-white">{crackWidth} mm</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={crackWidth}
                    onChange={(e) => setCrackWidth(Number(e.target.value))}
                    className="w-full h-2 bg-[#1c212c] rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
                  />
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                    <span className={`px-2.5 py-1 rounded-full border ${severityTag.color}`}>
                      {severityTag.label}
                    </span>
                    <span className="text-[#717682]">Range: 1mm (Micro) to 60mm (Fault)</span>
                  </div>
                </div>

                {/* 3. Location & GPS */}
                <div className="pt-2 border-t border-[#161920] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[#828894] font-semibold">3. Location / Sector</label>
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
                    className="w-full rounded-xl border border-[#262c38] bg-[#0c0e14] px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-[#38bdf8]"
                  >
                    <option value="Sector 4 (Village Slope)">Sector 4 (Village Slope - Near High Ground)</option>
                    <option value="Sector 3 (Incline Gallery)">Sector 3 (Incline Gallery Buffer)</option>
                    <option value="Sector 2 (Riverbank Embankment)">Sector 2 (Riverbank Embankment)</option>
                    <option value="Sector 1 (Open Cast Ridge)">Sector 1 (Open Cast Ridge)</option>
                  </select>
                </div>

                {/* 4. Resident Contact & Notes */}
                <div className="pt-2 border-t border-[#161920] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#828894] font-semibold mb-1">Your Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Rakesh Kumar"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full rounded-xl border border-[#262c38] bg-[#0c0e14] px-3 py-2 text-white placeholder-[#525763] focus:outline-none focus:border-[#38bdf8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#828894] font-semibold mb-1">Mobile Phone (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+91 94311..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-[#262c38] bg-[#0c0e14] px-3 py-2 text-white placeholder-[#525763] focus:outline-none focus:border-[#38bdf8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#828894] font-semibold mb-1">Additional Observations / Danger to Homes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Crack widened overnight near water well. Water pipes buckling."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-[#262c38] bg-[#0c0e14] px-3 py-2 text-white placeholder-[#525763] focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="w-full py-3 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50 mt-2"
                >
                  {isSubmittingReport ? 'Transmitting to IoT Mesh Gateway...' : 'Submit Ground Fissure Report'}
                </button>
              </form>
            </div>

            {/* Right: Recent Community Crack Log Feed */}
            <div className="lg:col-span-5 p-6 rounded-2xl border border-[#1e232d] bg-[#080a0d] flex flex-col justify-between shadow-sm space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-[#161920] pb-3.5">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-[#a3e635]" />
                    <h3 className="text-sm font-bold text-white tracking-tight">Village Perimeter Crack Logs</h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#828894]">{reports.length} Reports</span>
                </div>

                <div className="space-y-3 mt-4 max-h-[480px] overflow-y-auto scrollbar-none pr-1">
                  {reports.map((r) => (
                    <div key={r.id} className="p-3.5 rounded-xl border border-[#1a1f29] bg-[#050608] space-y-2">
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

              <div className="pt-3 border-t border-[#161920] text-[11px] text-[#717682] flex items-center gap-1.5 font-mono">
                <Sparkles size={13} className="text-[#a3e635]" />
                <span>AI model corroborates photo fissures with IoT tilt meters</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ASSEMBLY SHELTERS & ROSTER                                         */}
      {/* ========================================================================= */}
      {villageTab === 'shelters' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl border border-[#1e232d] bg-[#080a0d] space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#161920] pb-3.5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[#3fcb7f]" />
                <h3 className="text-base font-bold text-white">{t.safeAssembly}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#3fcb7f]/15 text-[#3fcb7f] border border-[#3fcb7f]/30">
                OPEN &amp; SECURE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assemblyPoints.map((ap) => (
                <div key={ap.id} className="rounded-xl border border-[#1a1f29] bg-[#050608] p-4.5 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-white">{ap.name}</h4>
                      <p className="text-xs text-[#828894] mt-0.5">{ap.zone} • Elevation: {ap.elevationMeters}m</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-[#3fcb7f]">
                        {ap.currentCheckedIn} / {ap.capacityPersons}
                      </span>
                      <span className="text-[10px] text-[#717682] block">Residents Sheltered</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#161922] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#3fcb7f] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (ap.currentCheckedIn / ap.capacityPersons) * 100)}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px] text-[#cbd5e1]">
                    {ap.amenities.map((am, i) => (
                      <span key={i} className="rounded-lg border border-[#222733] bg-[#0d1016] px-2 py-0.5">
                        ✓ {am}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#161920] pt-2.5 text-xs text-[#828894]">
                    <span>Officer: {ap.contactOfficer}</span>
                    <a href={`tel:${ap.officerPhone}`} className="text-[#3fcb7f] font-mono font-semibold flex items-center gap-1 hover:underline">
                      <PhoneCall className="h-3.5 w-3.5" />
                      {ap.officerPhone}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#9984d8]/10 border border-[#9984d8]/30 p-3.5 text-xs text-[#e8eaee] flex items-center gap-2">
              <span className="font-bold text-[#a78bfa]">Evacuation Route Advisory:</span>
              <span>{t.evacuationRoutes}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACTION CHECKLIST & EMERGENCY HOTLINES                              */}
      {/* ========================================================================= */}
      {villageTab === 'checklist' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl border border-[#1e232d] bg-[#080a0d] space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-[#161920] pb-3.5">
              <ShieldAlert className="h-5 w-5 text-[#fb923c]" />
              <h3 className="text-base font-bold text-white">{t.emergencyGuideTitle}</h3>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-[#cbd5e1]">
              {t.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-[#050608] border border-[#161920]">
                  <span className="h-6 w-6 rounded-full bg-[#181d26] text-[#a3e635] font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[#e8eaee] leading-relaxed pt-0.5">{item}</span>
                </li>
              ))}
            </ul>

            {/* Emergency Hotline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#161920]">
              <div className="p-3.5 rounded-xl bg-[#050608] border border-[#222733] text-center space-y-1">
                <span className="text-[10px] font-mono text-[#828894] uppercase">National Disaster Help</span>
                <div className="text-lg font-bold font-mono text-[#38bdf8]">112</div>
                <span className="text-[10px] text-[#717682] block">Toll-Free 24/7</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050608] border border-[#222733] text-center space-y-1">
                <span className="text-[10px] font-mono text-[#828894] uppercase">DGMS Mining Safety</span>
                <div className="text-lg font-bold font-mono text-[#22c55e]">1800-345-6789</div>
                <span className="text-[10px] text-[#717682] block">Dhanbad HQ</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050608] border border-[#222733] text-center space-y-1">
                <span className="text-[10px] font-mono text-[#828894] uppercase">Local Panchayat SOS</span>
                <div className="text-lg font-bold font-mono text-[#f59e0b]">+91 94311-88421</div>
                <span className="text-[10px] text-[#717682] block">Village Headman</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: VILLAGE SAFETY DOCUMENTATION & EARLY WARNING GUIDELINES            */}
      {/* ========================================================================= */}
      {villageTab === 'docs' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[#1e232d] bg-[#080a0d] space-y-6 shadow-sm">
            <div className="border-b border-[#161920] pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-[#a78bfa]" />
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Village Geotechnical Safety &amp; Early Warning Documentation
                </h3>
              </div>
              <p className="text-xs text-[#828894] mt-1">
                Standard operating procedures and strata hazard guidelines compiled for community members.
              </p>
            </div>

            {/* Section A: Hazard Stage Classification */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#38bdf8] font-bold">
                1. Early Warning Risk Severity Stages
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-[#164e29] bg-[#08170d] space-y-1">
                  <div className="text-xs font-bold text-[#22c55e]">Stage 1-2: Normal / Active Monitoring</div>
                  <p className="text-[11px] text-[#86efac] leading-relaxed">Continuous baseline telemetry. Tilt variation is &lt;0.5° with normal ground stability. No action required by residents.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#523d13] bg-[#1a1306] space-y-1">
                  <div className="text-xs font-bold text-[#facc15]">Stage 3: Pre-Warning Advisory</div>
                  <p className="text-[11px] text-[#fef08a] leading-relaxed">Minor subsurface strain detected on multiple nodes. Stay alert to siren chimes and inspect residential compound walls for hairline cracks.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#5a2e12] bg-[#1f0f06] space-y-1">
                  <div className="text-xs font-bold text-[#fb923c]">Stage 4: Warning &amp; Preparation</div>
                  <p className="text-[11px] text-[#fed7aa] leading-relaxed">Piezometric pore-water pressure accelerating shear deformation. Prepare emergency documents, medicines, and move to designated high ground.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#5c1d24] bg-[#220a0d] space-y-1">
                  <div className="text-xs font-bold text-[#f87171]">Stage 5: Critical Mandatory Evacuation</div>
                  <p className="text-[11px] text-[#fca5a5] leading-relaxed">Knothe failure envelope breached. 110 dB physical acoustic sirens active. Evacuate immediately via designated North Ridge corridor.</p>
                </div>
              </div>
            </div>

            {/* Section B: Siren Audio Code Reference */}
            <div className="space-y-3 pt-3 border-t border-[#161920]">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#a3e635] font-bold">
                2. Solar Gateway Edge Siren Acoustic Signals
              </h4>
              <div className="p-4 rounded-xl border border-[#1e232d] bg-[#050608] space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="font-bold text-white">Three Short High-Pitch Pulses (500Hz)</span>
                  <span className="text-[#ef4444] font-mono font-bold">MANDATORY EVACUATION</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="font-bold text-white">Single Intermittent Beep (30s interval)</span>
                  <span className="text-[#f59e0b] font-mono font-bold">PRE-WARNING STAGE 3/4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Two Steady Continuous Chimes</span>
                  <span className="text-[#22c55e] font-mono font-bold">ALL-CLEAR STABLE</span>
                </div>
              </div>
            </div>

            {/* Section C: Offline Local Wi-Fi Connection Guide */}
            <div className="space-y-3 pt-3 border-t border-[#161920]">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#818cf8] font-bold">
                3. Zero-Internet Edge Wi-Fi Access
              </h4>
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                If national cellular towers or fiber internet disconnects during a severe monsoon event, the Solar Edge Gateway broadcasts a local Wi-Fi network named <strong className="text-white">GEOSENTINEL_EDGE_GW01</strong>. Connect to this network on any mobile browser and open <code className="text-[#a3e635] bg-[#161a22] px-1.5 py-0.5 rounded font-mono">http://192.168.4.1</code> to view live emergency status and register your safe arrival.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZERO-FRICTION CHECK-IN MODAL (SAFE / SOS)                                 */}
      {/* ========================================================================= */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#262c38] bg-[#0c0e14] p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between border-b border-[#1a1f29] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {showCheckInModal === 'safe' ? "I'm Safe Check-In" : "Emergency SOS Check-In"}
                </h3>
                <p className="text-xs text-[#828894] mt-0.5">
                  No login or password needed. Transmits to shelter roster.
                </p>
              </div>
              <button
                onClick={() => setShowCheckInModal(null)}
                className="text-[#828894] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={showCheckInModal === 'safe' ? (e) => { e.preventDefault(); handleInstantSafeClick(); } : handleHelpCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#828894] font-semibold mb-1">Your Name / Head of Family (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Manoj Soren"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full rounded-xl border border-[#262c38] bg-black px-3.5 py-2.5 text-white placeholder-[#525763] focus:outline-none focus:border-[#3fcb7f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#828894] font-semibold mb-1">Family Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={familyCount}
                    onChange={(e) => setFamilyCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#262c38] bg-black px-3.5 py-2.5 text-white focus:outline-none focus:border-[#3fcb7f]"
                  />
                </div>

                <div>
                  <label className="block text-[#828894] font-semibold mb-1">Mobile No (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 94311..."
                    value={residentPhone}
                    onChange={(e) => setResidentPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#262c38] bg-black px-3.5 py-2.5 text-white placeholder-[#525763] focus:outline-none focus:border-[#3fcb7f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#828894] font-semibold mb-1">Location / Current Shelter Note</label>
                <input
                  type="text"
                  placeholder="e.g. Hall 2 at Community Center"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  className="w-full rounded-xl border border-[#262c38] bg-black px-3.5 py-2.5 text-white placeholder-[#525763] focus:outline-none focus:border-[#3fcb7f]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md ${
                    showCheckInModal === 'safe'
                      ? 'bg-[#3fcb7f] text-black hover:bg-[#22c55e]'
                      : 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                  }`}
                >
                  {showCheckInModal === 'safe' ? "Confirm Safe Check-in" : "Send Emergency SOS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
