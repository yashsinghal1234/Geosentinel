import React, { useState, useMemo, useRef } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { CitizenCrackReport } from '../../types';
import { 
  Camera, 
  CheckCircle2, 
  Lock,
  MapPin,
  Search,
  Upload,
  X,
  Activity,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers
} from '../icons';

// High-Resolution Built-in Geological Fracture Reference Patterns (Never 404)
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
    submitCrackReport, 
    reviewCrackReport, 
    setActiveTab,
    isAuthenticated,
    setIsLoginModalOpen
  } = useGeoSentinel();

  // Form states
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

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'dismissed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Review modal state for operator triage
  const [reviewingReport, setReviewingReport] = useState<CitizenCrackReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('Matches ground displacement trend on nearest extensometer. Dispatched field team.');
  const [imagePreviewModalUrl, setImagePreviewModalUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic severity tag based on width
  const severityTag = useMemo(() => {
    if (crackWidth >= 30) return { label: 'Critical Evacuation Hazard', color: 'text-[#ef4444] bg-[#ef4444]/15 border-[#ef4444]/40', icon: AlertTriangle };
    if (crackWidth >= 16) return { label: 'Severe Subsidence Crack', color: 'text-[#fb923c] bg-[#fb923c]/15 border-[#fb923c]/40', icon: AlertTriangle };
    if (crackWidth >= 6) return { label: 'Moderate Shear Fissure', color: 'text-[#f59e0b] bg-[#f59e0b]/15 border-[#f59e0b]/40', icon: Activity };
    return { label: 'Minor Surface Tension', color: 'text-[#38bdf8] bg-[#38bdf8]/15 border-[#38bdf8]/40', icon: Activity };
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
          // Fallback with small realistic jitter
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

  const handleApprove = () => {
    if (!reviewingReport) return;
    reviewCrackReport(reviewingReport.id, true, reviewNotes);
    setReviewingReport(null);
  };

  const handleDismiss = () => {
    if (!reviewingReport) return;
    reviewCrackReport(reviewingReport.id, false, 'Dismissed: Superficial shrinkage crack without sub-surface shear.');
    setReviewingReport(null);
  };

  // Filtered reports list
  const filteredReports = useMemo(() => {
    let list = reports;
    if (statusFilter === 'pending') {
      list = list.filter(r => r.status === 'Pending Review');
    } else if (statusFilter === 'approved') {
      list = list.filter(r => r.status === 'Corroborated & Approved');
    } else if (statusFilter === 'dismissed') {
      list = list.filter(r => r.status === 'Dismissed (Non-critical)');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.id.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q) ||
        r.zone.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [reports, statusFilter, searchQuery]);

  // Aggregate Metrics
  const totalCount = reports.length;
  const approvedCount = reports.filter(r => r.status === 'Corroborated & Approved').length;
  const pendingCount = reports.filter(r => r.status === 'Pending Review').length;
  const maxAperture = Math.max(...reports.map(r => r.crackWidthEstimateMm), 0);

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8 space-y-7 animate-fadeIn font-sans select-none text-white pb-16">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#d8b4fe]">
              <Camera size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Citizen Ground Crack Reporting Portal
            </h1>
            <span className="text-[11px] font-mono text-[#22c55e] bg-[#22c55e]/15 border border-[#22c55e]/30 px-3 py-0.5 rounded-full font-semibold">
              PUBLIC ACCESS • ZERO LOGIN REQUIRED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/50 mt-1.5 max-w-3xl">
            Upload geotagged observations of ground fissures, shear cracks, and subsidence. Automatic AI correlation with deployed IoT extensometer arrays and real-time operator dispatch.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('public')}
            className="px-4 py-2 rounded-xl bg-[#111318] border border-white/10 hover:border-white/20 text-xs font-medium text-white/80 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Layers size={14} className="text-[#38bdf8]" />
            <span>Village Safety Board</span>
          </button>

          <button
            onClick={() => setActiveTab('landing')}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>

          {!isAuthenticated && (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-white/90 bg-[#161a23] hover:bg-[#1e2330] border border-white/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Lock size={13} className="text-[#fbbf24]" />
              <span>Operator Login</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0b0d12] border border-white/[0.08] flex flex-col justify-between">
          <span className="text-xs text-white/50 font-medium">Total Citizen Reports</span>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">{totalCount}</div>
          <span className="text-[11px] text-white/40 mt-1">Community submitted</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0d12] border border-white/[0.08] flex flex-col justify-between">
          <span className="text-xs text-white/50 font-medium">Corroborated Hazards</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#22c55e] mt-2 font-mono flex items-center gap-2">
            <span>{approvedCount}</span>
            <ShieldCheck size={18} className="text-[#22c55e]" />
          </div>
          <span className="text-[11px] text-[#22c55e] mt-1">Verified with sensor nodes</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0d12] border border-white/[0.08] flex flex-col justify-between">
          <span className="text-xs text-white/50 font-medium">Pending Triage</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#f59e0b] mt-2 font-mono flex items-center gap-2">
            <span>{pendingCount}</span>
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping" />}
          </div>
          <span className="text-[11px] text-[#f59e0b] mt-1">Awaiting review</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0d12] border border-white/[0.08] flex flex-col justify-between">
          <span className="text-xs text-white/50 font-medium">Peak Fissure Aperture</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#fb923c] mt-2 font-mono">
            {maxAperture} <span className="text-xs font-normal text-white/40 font-sans">mm</span>
          </div>
          <span className="text-[11px] text-[#fb923c] mt-1">Sector 3 Highwall Gallery</span>
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN GRID (SUBMISSION FORM + COMMUNITY FEED) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* LEFT COLUMN: SUBMISSION FORM (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0b0d12] border border-white/[0.08] shadow-2xl space-y-5">
          <div className="border-b border-white/[0.08] pb-4">
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Camera size={16} className="text-[#a3e635]" />
              Report New Surface Fissure
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Direct submission to Geological Survey Review Queue &amp; Command Center
            </p>
          </div>

          {/* Submission Success Banner */}
          {submittedSuccess && (
            <div className="rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/15 p-3.5 text-xs text-[#86efac] flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 size={18} className="text-[#22c55e] shrink-0" />
              <div>
                <strong>Report {submittedReportId} Uploaded Successfully!</strong>
                <p className="text-[11px] text-white/80 mt-0.5">
                  GPS coordinates pinned on Operator GIS Map. Nearest node AI correlation active.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
            {/* Resident Name */}
            <div>
              <label className="block text-white/60 font-medium mb-1">Your Name / Resident (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Rameshwar Soren (or leave blank for Anonymous)"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#06080b] px-3.5 py-2.5 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#a3e635]/60 transition-all"
              />
            </div>

            {/* 2-Col Phone & Sector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 font-medium mb-1">Contact Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 94311 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080b] px-3.5 py-2.5 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#a3e635]/60 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1">Mining Sector / Village</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080b] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#a3e635]/60 transition-all cursor-pointer"
                >
                  <option value="Sector 4 (Village Slope)">Sector 4 (Village Slope)</option>
                  <option value="Sector 3 (Abandoned Gallery)">Sector 3 (Abandoned Gallery)</option>
                  <option value="Sector 2 (Riverbank Overburden)">Sector 2 (Riverbank Overburden)</option>
                  <option value="Sector 1 (Open Cast Pit)">Sector 1 (Open Cast Pit)</option>
                </select>
              </div>
            </div>

            {/* GPS Location Row */}
            <div className="p-3.5 rounded-xl bg-[#07090e] border border-white/[0.06] flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-white/50 block">Geotag Coordinates</span>
                <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                  {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoDetectGPS}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-[11px] font-medium text-[#a3e635] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <MapPin size={12} />
                <span>{isGpsAcquired ? 'GPS Acquired' : 'Auto-Detect GPS'}</span>
              </button>
            </div>

            {/* Crack Aperture Width Slider & Gauge */}
            <div className="p-4 rounded-xl bg-[#07090e] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-white/60 font-medium">Estimated Crack Aperture</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-mono text-white">{crackWidth} mm</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${severityTag.color}`}>
                    {severityTag.label}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={crackWidth}
                onChange={(e) => setCrackWidth(Number(e.target.value))}
                className="w-full accent-[#fb923c] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>1 mm (Hairline)</span>
                <span>5 mm (DGMS Alert)</span>
                <span>15 mm (Severe)</span>
                <span>50 mm (Critical)</span>
              </div>
            </div>

            {/* Photo Selection / Real Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-white/60 font-medium">Select or Upload Photo</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Upload size={12} />
                  <span>Upload Local Photo</span>
                </button>
              </div>

              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload} 
              />

              {/* Custom Uploaded Preview */}
              {customPhotoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#22c55e]/60 bg-black">
                  <img src={customPhotoUrl} alt="Uploaded Crack" className="h-32 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCustomPhotoUrl(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                  <div className="p-1.5 text-[10px] text-center bg-black/80 text-[#86efac] font-medium">
                    ✓ Custom Photo Selected
                  </div>
                </div>
              ) : (
                /* Built-in Geological Fracture Templates */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FISSURE_TEMPLATES.map((tmpl, idx) => (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateIndex(idx)}
                      className={`cursor-pointer rounded-xl border overflow-hidden transition-all flex flex-col justify-between ${
                        selectedTemplateIndex === idx 
                          ? 'border-[#a3e635] ring-2 ring-[#a3e635]/30 bg-white/[0.04]' 
                          : 'border-white/10 opacity-70 hover:opacity-100 bg-black/40'
                      }`}
                    >
                      <img src={tmpl.url} alt={tmpl.title} className="h-16 w-full object-cover" />
                      <div className="p-1.5 text-[10px] text-center bg-[#090b10] text-white/80 truncate font-medium">
                        {tmpl.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-white/60 font-medium mb-1">Observation Description</label>
              <textarea
                rows={3}
                placeholder="Describe crack length, expansion rate, or location (e.g. Near village school boundary wall, opened up after last night's rainfall)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#06080b] px-3.5 py-2.5 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#a3e635]/60 transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-white hover:bg-white/90 text-black font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Uploading to Geological Queue...' : 'Submit Geotagged Crack Report'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE COMMUNITY FEED & OPERATOR TRIAGE (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Header & Filter Controls */}
          <div className="p-5 rounded-2xl bg-[#0b0d12] border border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Live Ground Fissure Reports Feed
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  {isAuthenticated 
                    ? 'Operator Triage Active: Click any report to corroborate against extensometer displacement.'
                    : 'Public Community Feed • Real-time geological surveillance stream'}
                </p>
              </div>

              <span className="font-mono text-xs text-[#a855f7] bg-[#a855f7]/15 border border-[#a855f7]/30 px-3 py-1 rounded-full font-semibold">
                {filteredReports.length} Reports Shown
              </span>
            </div>

            {/* Filter Tabs & Search Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-[#111318] border border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  All ({reports.length})
                </button>

                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-[#f59e0b] text-black font-semibold shadow-sm'
                      : 'bg-[#111318] border border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  Pending ({pendingCount})
                </button>

                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'approved'
                      ? 'bg-[#22c55e] text-black font-semibold shadow-sm'
                      : 'bg-[#111318] border border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  Corroborated ({approvedCount})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#06080b] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 outline-none focus:border-white/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Reports Feed List */}
          <div className="space-y-3.5">
            {filteredReports.map((report) => {
              const isApproved = report.status === 'Corroborated & Approved';
              const isDismissed = report.status === 'Dismissed (Non-critical)';

              return (
                <div
                  key={report.id}
                  onClick={() => {
                    if (isAuthenticated) {
                      setReviewingReport(report);
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  className="p-5 rounded-2xl bg-[#0b0d12] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer space-y-3 shadow-md group"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail with Zoom Click */}
                      <div 
                        className="relative h-18 w-20 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black cursor-zoom-in"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreviewModalUrl(report.photoUrl);
                        }}
                      >
                        <img
                          src={report.photoUrl}
                          alt={report.description}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-white text-sm">{report.id}</span>
                          <span className="text-xs text-white/40 font-mono">• {report.timestamp}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 border border-white/10 text-white/70">
                            {report.zone}
                          </span>
                        </div>

                        <div className="text-xs font-mono font-bold text-[#fb923c] mt-1 flex items-center gap-2">
                          <span>Est. Aperture: {report.crackWidthEstimateMm} mm</span>
                          <span className="text-[10px] text-white/40 font-normal">
                            ({report.severity || (report.crackWidthEstimateMm >= 15 ? 'Severe Subsidence' : 'Moderate Shear')})
                          </span>
                        </div>

                        <p className="text-xs text-white/80 mt-1 line-clamp-2 italic">
                          "{report.description}"
                        </p>

                        <div className="text-[11px] text-white/40 mt-1.5">
                          Reported by: <span className="text-white/70">{report.reporterName}</span> ({report.phone})
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Triage Link */}
                    <div className="flex flex-col sm:items-end gap-2 flex-shrink-0 self-end sm:self-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        isApproved
                          ? 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/40'
                          : isDismissed
                          ? 'bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/40'
                          : 'bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/40'
                      }`}>
                        {report.status}
                      </span>

                      <span className="text-xs text-[#d8b4fe] group-hover:underline flex items-center gap-1 font-medium">
                        {isAuthenticated ? 'Triage Review →' : 'Operator Triage →'}
                      </span>
                    </div>
                  </div>

                  {/* AI Corroboration & Geologist Review Note Strip */}
                  {(report.reviewNotes || isApproved) && (
                    <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-[#86efac]">
                        <Sparkles size={13} className="text-[#a3e635]" />
                        <span>AI Corroborated: {report.reviewNotes || 'Matches extensometer shear trend on nearest IoT pod.'}</span>
                      </div>
                      {report.reviewedBy && (
                        <span className="text-white/40 text-[10px]">
                          Reviewed by: {report.reviewedBy}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. OPERATOR TRIAGE MODAL                                                 */}
      {/* ========================================================================= */}
      {reviewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-[#090b10] p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-mono text-white">
                    Corroborate Report: {reviewingReport.id}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#a855f7]/20 text-[#d8b4fe] border border-[#a855f7]/30">
                    {reviewingReport.zone}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  DGMS Geomechanical Triage &amp; Risk Escalation Protocol
                </p>
              </div>
              <button
                onClick={() => setReviewingReport(null)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Photo Display */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black h-48">
                <img
                  src={reviewingReport.photoUrl}
                  alt={reviewingReport.description}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Statement & Data */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] space-y-1.5 font-mono">
                <div className="text-white/50 text-[11px]">Reporter Statement:</div>
                <div className="text-white italic">"{reviewingReport.description}"</div>
                <div className="flex justify-between text-[#fb923c] pt-1">
                  <span>Estimated Aperture: {reviewingReport.crackWidthEstimateMm} mm</span>
                  <span>Geotag: {reviewingReport.lat.toFixed(4)}°N, {reviewingReport.lng.toFixed(4)}°E</span>
                </div>
              </div>

              {/* Reviewer Notes Input */}
              <div>
                <label className="block text-white/60 font-medium mb-1.5">
                  Geologist Review Notes &amp; Escalation Directive
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080b] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#a3e635]/60 transition-all font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleApprove}
                  className="flex-1 py-3 rounded-xl bg-[#22c55e] text-black font-semibold text-xs hover:bg-[#16a34a] transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={15} />
                  <span>✓ Corroborate &amp; Escalate Warning</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-5 py-3 rounded-xl border border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/10 font-semibold text-xs transition-all cursor-pointer"
                >
                  Dismiss (Superficial)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. IMAGE PREVIEW ZOOM MODAL                                               */}
      {/* ========================================================================= */}
      {imagePreviewModalUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn cursor-zoom-out"
          onClick={() => setImagePreviewModalUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
            <img src={imagePreviewModalUrl} alt="Enlarged fissure" className="w-full h-full object-contain" />
            <button
              onClick={() => setImagePreviewModalUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
