import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Activity, 
  AlertTriangle, 
  AlertOctagon, 
  Radio, 
  Battery, 
  Volume2, 
  VolumeX, 
  FileText, 
  Zap, 
  Sparkles
} from '../icons';
import { GISHeatmap } from '../gis/GISHeatmap';
import { AlertAuditTable } from './AlertAuditTable';
import { NodeDrilldownModal } from './NodeDrilldownModal';
import { IncidentReportModal } from './IncidentReportModal';

export const OperatorDashboard: React.FC = () => {
  const {
    nodes,
    gateway,
    risk,
    scenario,
    selectedNodeId,
    rainfallRate,
    setSelectedNodeId,
    setScenario,
    setRainfallRate,
    triggerManualAlert,
    triggerEdgeSiren,
  } = useGeoSentinel();

  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);
  const [isIncidentReportOpen, setIsIncidentReportOpen] = useState<boolean>(false);
  const [drilldownNodeId, setDrilldownNodeId] = useState<string>('SN-01');
  const [customDistanceX, setCustomDistanceX] = useState<number>(25);

  const handleOpenDrilldown = (nodeId: string) => {
    setDrilldownNodeId(nodeId);
    setIsDrilldownOpen(true);
    setSelectedNodeId(nodeId);
  };

  const activeNodesCount = nodes.filter(n => n.status === 'online' || n.status === 'warning' || n.status === 'critical').length;
  const criticalNodesCount = nodes.filter(n => n.status === 'critical').length;
  const warningNodesCount = nodes.filter(n => n.status === 'warning').length;

  // Knothe equation calculations
  const cimfrSmax = (risk.score * 1.8).toFixed(1);
  const R = 85; // Radius of principal influence
  const localDeflection = (parseFloat(cimfrSmax) * Math.exp(-Math.PI * Math.pow(customDistanceX, 2) / Math.pow(R, 2))).toFixed(1);

  // Dynamic values for the glowing horizontal bars (matching user image)
  const maxCrackNode = nodes.reduce((prev, curr) => (curr.readings.crackWidthMm > prev.readings.crackWidthMm ? curr : prev), nodes[0]);
  const maxTiltNode = nodes.reduce((prev, curr) => (curr.readings.tiltDeg > prev.readings.tiltDeg ? curr : prev), nodes[0]);
  const maxVibNode = nodes.reduce((prev, curr) => (curr.readings.vibrationMmS > prev.readings.vibrationMmS ? curr : prev), nodes[0]);
  const maxGasNode = nodes.reduce((prev, curr) => (curr.readings.gasPpm > prev.readings.gasPpm ? curr : prev), nodes[0]);

  const crackScore = Math.min(100, Math.round((maxCrackNode.readings.crackWidthMm / maxCrackNode.thresholds.crackCriticalMm) * 100));
  const tiltScore = Math.min(100, Math.round((maxTiltNode.readings.tiltDeg / maxTiltNode.thresholds.tiltCriticalDeg) * 100));
  const vibScore = Math.min(100, Math.round((maxVibNode.readings.vibrationMmS / maxVibNode.thresholds.vibrationCriticalMmS) * 100));
  const gasScore = Math.min(100, Math.round((maxGasNode.readings.gasPpm / maxGasNode.thresholds.gasCriticalPpm) * 100));
  const rainScore = Math.min(100, Math.round((rainfallRate / 50) * 100));

  // Donut Arc Angle Calculations
  const riskRatio = Math.min(1.0, Math.max(0.08, risk.score / 100));
  const circumference = 2 * Math.PI * 72; // radius = 72
  const strokeDashoffset = circumference - (circumference * riskRatio * 0.75); // 270 deg gauge

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner: Status & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-xl border border-[#1a1c20] bg-[#050607]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border border-white/15 bg-white/5 text-white/90">
              <span className="w-2 h-2 rounded-full bg-[#3fcb7f] animate-ping" />
              DIRECTORATE GENERAL OF MINES SAFETY (DGMS) TELEMETRY
            </span>
            <span className="text-[11px] font-mono text-[#808080]">GEO-GRID: JHARIA COALFIELD SECTOR IV</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-white tracking-tight">
            Subsidence Risk Observatory &amp; Command Hub
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsIncidentReportOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <FileText size={14} className="text-[#a855f7]" />
            DGMS Form IV Audit Report
          </button>

          <button
            onClick={() => triggerEdgeSiren(!gateway.localSirenActive)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
              gateway.localSirenActive
                ? 'bg-[#ef4444] text-white border border-[#ef4444] animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'border border-white/15 bg-white/5 hover:bg-white/10 text-white/80'
            }`}
          >
            {gateway.localSirenActive ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {gateway.localSirenActive ? 'SILENCE LOCAL SIREN' : 'TEST SIREN RELAY'}
          </button>

          <button
            onClick={() => triggerManualAlert(5, 'Sector 4 & Sector 3', 'Immediate evacuation triggered by mine safety commander.')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-semibold bg-[#ef4444] hover:bg-[#dc2626] text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
          >
            <AlertOctagon size={14} />
            DISPATCH EVACUATE NOW
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 HERO OBSERVATORY SHOWCASE (Matching User's Glowing Terminal Image)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Circular Donut Ring Arc Gauge */}
        <div className="lg:col-span-5 observatory-panel p-6 flex flex-col justify-between min-h-[340px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3fcb7f] animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#b3b3b3]">
                Threat Matrix Gauge
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#808080] border border-[#222222] px-2 py-0.5 rounded">
              SECTOR 4
            </span>
          </div>

          {/* Radial Donut Gauge Visual (Matching Screenshot) */}
          <div className="relative flex items-center justify-center py-4">
            <svg width="220" height="220" viewBox="0 0 200 200" className="transform -rotate-90">
              <defs>
                {/* Glow Filter for Donut Ring */}
                <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3fcb7f" />
                  <stop offset="40%" stopColor="#a855f7" />
                  <stop offset="75%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Background Outer Ring Track */}
              <circle
                cx="100"
                cy="100"
                r="72"
                fill="none"
                stroke="#12151b"
                strokeWidth="18"
                strokeDasharray="452.39"
                strokeDashoffset="113.1"
                strokeLinecap="round"
              />

              {/* Segment Markers on Ring */}
              <circle
                cx="100"
                cy="100"
                r="72"
                fill="none"
                stroke="#1c202a"
                strokeWidth="18"
                strokeDasharray="2 16"
                strokeDashoffset="113.1"
              />

              {/* Active Glowing Arc */}
              <circle
                cx="100"
                cy="100"
                r="72"
                fill="none"
                stroke="url(#arcGrad)"
                strokeWidth="18"
                strokeDasharray="452.39"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                filter="url(#gauge-glow)"
                className="transition-all duration-1000 ease-out"
              />

              {/* Inner Decorative Dot Track */}
              <circle
                cx="100"
                cy="100"
                r="54"
                fill="none"
                stroke="#222222"
                strokeWidth="1"
                strokeDasharray="3 6"
              />
            </svg>

            {/* Glowing Phosphor Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-[10px] font-mono text-[#808080] tracking-widest uppercase">
                STAGE
              </span>
              <span className="text-5xl font-mono font-extrabold text-white text-neon-glow-white tracking-tighter my-0.5">
                {risk.level}
              </span>
              <span className="text-[12px] font-mono text-[#3fcb7f] text-neon-glow-mint font-semibold">
                ({(risk.rateOfChangeFactor * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Bottom Metas */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1a1c20] text-xs font-mono">
            <div>
              <span className="text-[#808080] block text-[10px]">CURRENT LEVEL</span>
              <span className="text-white font-semibold text-neon-glow-white">{risk.levelName.toUpperCase()}</span>
            </div>
            <div className="text-right">
              <span className="text-[#808080] block text-[10px]">TIME TO CRITICAL</span>
              <span className={risk.level >= 4 ? 'text-[#ef4444] text-neon-glow-danger font-bold' : 'text-[#3fcb7f]'}>
                {risk.timeToCriticalHours !== null ? `${risk.timeToCriticalHours} HRS` : 'STABLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Glowing Horizontal Telemetry Bars with Axis Markers */}
        <div className="lg:col-span-7 observatory-panel p-6 flex flex-col justify-between min-h-[340px]">
          {/* Header (styled like "Dock items by app" from user image) */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1a1c20]">
            <div>
              <h2 className="text-[15px] font-mono font-medium text-white text-neon-glow-white tracking-tight">
                Dock items by app
              </h2>
              <span className="text-[11px] font-mono text-[#808080]">
                Jan 19 · Telemetry Sub-channels
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#808080]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3fcb7f] bar-neon-mint" />
                Live Feed
              </span>
            </div>
          </div>

          {/* Horizontal Bar Chart Container */}
          <div className="space-y-4 my-auto pt-3">
            {/* Axis Scale Markers (0, 20, 40, 60, 80, 100) */}
            <div className="relative w-full flex justify-between text-[10px] font-mono text-[#666666] px-1 select-none">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>

            {/* Background Grid Lines */}
            <div className="relative space-y-3.5">
              {/* Subtle vertical tick guidelines */}
              <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
                <div className="w-[1px] h-full bg-white" />
                <div className="w-[1px] h-full bg-white" />
                <div className="w-[1px] h-full bg-white" />
                <div className="w-[1px] h-full bg-white" />
                <div className="w-[1px] h-full bg-white" />
                <div className="w-[1px] h-full bg-white" />
              </div>

              {/* Bar 1: Crack Extensometer (103 Peak mm) */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/80">Extensometer Crack Shear (SN-03/05)</span>
                  <span className="font-bold text-white text-neon-glow-white">103</span>
                </div>
                <div className="h-3 w-full bg-[#12151b] rounded-full overflow-hidden p-[1px]">
                  <div 
                    className="h-full rounded-full bar-neon-lavender transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(15, crackScore)}%` }}
                  />
                </div>
              </div>

              {/* Bar 2: Inclinometer Slope Tilt (89) */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/80">Inclinometer Slope Tilt (SN-01/07)</span>
                  <span className="font-bold text-white text-neon-glow-white">89</span>
                </div>
                <div className="h-3 w-full bg-[#12151b] rounded-full overflow-hidden p-[1px]">
                  <div 
                    className="h-full rounded-full bar-neon-mint transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(15, tiltScore)}%` }}
                  />
                </div>
              </div>

              {/* Bar 3: Geophone PPV Vibration (65) */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/80">Geophone Velocity PPV (SN-02/06)</span>
                  <span className="font-bold text-white text-neon-glow-white">65</span>
                </div>
                <div className="h-3 w-full bg-[#12151b] rounded-full overflow-hidden p-[1px]">
                  <div 
                    className="h-full rounded-full bar-neon-mint transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(15, vibScore)}%` }}
                  />
                </div>
              </div>

              {/* Bar 4: Pore Water & Rain Surge (48) */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/80">Pore Pressure Hydrostatic (Rain Gauge)</span>
                  <span className="font-bold text-white text-neon-glow-white">48</span>
                </div>
                <div className="h-3 w-full bg-[#12151b] rounded-full overflow-hidden p-[1px]">
                  <div 
                    className="h-full rounded-full bar-neon-amber transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(15, rainScore)}%` }}
                  />
                </div>
              </div>

              {/* Bar 5: Methane Cavity PPM (34) */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/80">Coal Seam Methane PPM (SN-04)</span>
                  <span className="font-bold text-white text-neon-glow-white">34</span>
                </div>
                <div className="h-3 w-full bg-[#12151b] rounded-full overflow-hidden p-[1px]">
                  <div 
                    className="h-full rounded-full bar-neon-mint transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(15, gasScore)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Legend / Health Metric */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#808080] pt-3 border-t border-[#1a1c20]">
            <span>Peak Particle Velocity: <strong className="text-white">{maxVibNode.readings.vibrationMmS} mm/s</strong></span>
            <span>Rainfall Sensitivity: <strong className="text-[#a855f7]">{risk.rainfallBoostMultiplier.toFixed(2)}x</strong></span>
            <span>Triangulated: <strong className="text-[#3fcb7f]">{risk.corroboratedNodeIds.length} Nodes</strong></span>
          </div>
        </div>
      </div>

      {/* Primary Telemetry Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Level Badge */}
        <div className="p-4 rounded-xl border border-[#1a1c20] bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#808080]">5-Stage Risk Status</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">
              LVL {risk.level} / 5
            </span>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-white mb-1">
              {risk.levelName}
            </div>
            <p className="text-xs text-white/70 font-mono leading-relaxed line-clamp-2">
              {risk.triggerExplanation}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#1a1c20] flex items-center justify-between text-xs font-mono">
            <span className="text-[#808080]">Calculated Score</span>
            <span className="text-white font-semibold text-neon-glow-white">{risk.score} / 100</span>
          </div>
        </div>

        {/* Time-to-Critical Countdown */}
        <div className="p-4 rounded-xl border border-[#1a1c20] bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#808080]">Est. Time to Critical</span>
            <AlertTriangle size={14} className={risk.level >= 4 ? 'text-[#ef4444]' : 'text-white/30'} />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {risk.timeToCriticalHours !== null ? `${risk.timeToCriticalHours} hrs` : 'STABLE'}
            </div>
            <p className="text-xs text-[#808080] font-mono mt-1">
              Rate of change: +{(risk.rateOfChangeFactor * 100).toFixed(1)}%/hr
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#1a1c20] flex items-center justify-between text-xs font-mono">
            <span className="text-[#808080]">Rainfall Multiplier</span>
            <span className="text-[#a855f7]">{risk.rainfallBoostMultiplier.toFixed(2)}x sensitivity</span>
          </div>
        </div>

        {/* CIMFR Knothe Subsidence Depth */}
        <div className="p-4 rounded-xl border border-[#1a1c20] bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#808080]">CIMFR Peak Deflection (Smax)</span>
            <Activity size={14} className="text-[#a855f7]" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {risk.cimfrSubsidenceDepthMm} <span className="text-base text-[#808080] font-normal">mm</span>
            </div>
            <p className="text-xs text-[#808080] font-mono mt-1">
              Gaussian curvature: R = 85m
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#1a1c20] flex items-center justify-between text-xs font-mono">
            <span className="text-[#808080]">Corroborated Sensors</span>
            <span className="text-[#3fcb7f] font-semibold">{risk.corroboratedNodeIds.length} Triangulated</span>
          </div>
        </div>

        {/* Mesh & Gateway Health */}
        <div className="p-4 rounded-xl border border-[#1a1c20] bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#808080]">LoRa Mesh &amp; Gateway</span>
            <Radio size={14} className="text-[#3fcb7f]" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {activeNodesCount} / {nodes.length} <span className="text-base text-[#808080] font-normal">Nodes</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#808080] font-mono mt-1">
              <span className="text-[#ef4444]">{criticalNodesCount} Critical</span>
              <span className="text-[#f59e0b]">{warningNodesCount} Warning</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#1a1c20] flex items-center justify-between text-xs font-mono">
            <span className="text-[#808080]">Edge Hotspot</span>
            <span className="text-white/80">{gateway.wifiHotspotSsid}</span>
          </div>
        </div>
      </div>

      {/* Simulation Scenario Switcher & Environmental Controls */}
      <div className="p-4 rounded-xl border border-[#1a1c20] bg-[#050607]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#a855f7]" />
            <span className="text-xs font-mono uppercase tracking-wider text-white/80">
              Live Field Scenario Simulation Engine
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-mono text-white/60">Rainfall: {rainfallRate.toFixed(1)} mm/hr</label>
            <input 
              type="range" 
              min="0" 
              max="65" 
              step="0.5" 
              value={rainfallRate}
              onChange={(e) => setRainfallRate(parseFloat(e.target.value))}
              className="w-28 accent-[#a855f7] cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { id: 'baseline', label: '1. Baseline Stable', desc: 'Normal diurnal micro-creep' },
            { id: 'monsoon_surge', label: '2. Monsoon Surge', desc: 'Rainfall 48.5mm/hr pore pressure' },
            { id: 'pillar_collapse', label: '3. Pillar Collapse', desc: 'Galleries 3-4 catastrophic shear' },
            { id: 'gas_cavity_breach', label: '4. Gas Cavity Spike', desc: 'CH4 release + void deflation' },
            { id: 'blasting_false_alarm', label: '5. Blasting False Alert', desc: 'Surface PPV spike, 0 tilt change' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setScenario(sc.id as any)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                scenario === sc.id
                  ? 'border-[#a855f7] bg-[#a855f7]/10 text-white'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <div className="text-xs font-mono font-medium">{sc.label}</div>
              <div className="text-[10px] text-[#808080] font-mono mt-0.5 truncate">{sc.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 8 Sensor Node Matrix with Glowing Telemetry Bars */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3fcb7f]" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-white/90">
              Sensor Node Telemetry Grid (LoRa / ESP-NOW Mesh)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#808080]">3.5s Live Ingestion Ticker</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const statusBorder = 
              node.status === 'critical' ? 'border-[#ef4444] bg-[#ef4444]/5' :
              node.status === 'warning' ? 'border-[#f59e0b] bg-[#f59e0b]/5' :
              'border-[#1a1c20] bg-[#050607] hover:border-[#333333]';

            return (
              <div
                key={node.id}
                onClick={() => handleOpenDrilldown(node.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${statusBorder} ${isSelected ? 'ring-2 ring-[#a855f7]' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-white">{node.id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                      {node.type}
                    </span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${
                    node.status === 'critical' ? 'bg-[#ef4444] animate-ping' :
                    node.status === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#3fcb7f]'
                  }`} />
                </div>

                <div className="text-xs font-medium text-white/90 truncate mb-1">{node.name}</div>
                <div className="text-[11px] font-mono text-[#808080] mb-3">{node.zone}</div>

                {/* Primary Reading Display */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 mb-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#808080] block">Tilt Slope</span>
                    <span className={`font-semibold ${node.readings.tiltDeg >= node.thresholds.tiltCriticalDeg ? 'text-[#ef4444] text-neon-glow-danger' : 'text-white'}`}>
                      {node.readings.tiltDeg.toFixed(2)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#808080] block">Crack Width</span>
                    <span className={`font-semibold ${node.readings.crackWidthMm >= node.thresholds.crackCriticalMm ? 'text-[#ef4444] text-neon-glow-danger' : 'text-white'}`}>
                      {node.readings.crackWidthMm.toFixed(1)} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#808080] block">Vibration PPV</span>
                    <span className={`font-semibold ${node.readings.vibrationMmS >= node.thresholds.vibrationCriticalMmS ? 'text-[#ef4444] text-neon-glow-danger' : 'text-white'}`}>
                      {node.readings.vibrationMmS.toFixed(1)} mm/s
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#808080] block">Gas CH4/CO</span>
                    <span className={`font-semibold ${node.readings.gasPpm >= node.thresholds.gasCriticalPpm ? 'text-[#ef4444] text-neon-glow-danger' : 'text-white'}`}>
                      {node.readings.gasPpm} PPM
                    </span>
                  </div>
                </div>

                {/* Bottom Node Meta */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#808080] pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Battery size={11} className="text-[#3fcb7f]" />
                    {node.readings.batteryPct.toFixed(0)}%
                  </span>
                  <span>{node.readings.rssiDbm} dBm</span>
                  <span>Hop {node.meshHopCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Physics & Subsidence Trough Equation Module */}
      <div className="p-5 rounded-xl border border-[#1a1c20] bg-[#050607]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-[#a855f7]" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-white/90">
                Physics-Informed CIMFR Subsidence Trough Simulator
              </h2>
            </div>
            <p className="text-xs font-mono text-[#808080]">
              Knothe Gaussian profile: S(x) = Smax · exp(-π · x² / R²) | Overburden depth H = 140m, tan(β) = 1.65
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/60">Distance from Seam Center (x): {customDistanceX}m</span>
            <input 
              type="range" 
              min="0" 
              max="90" 
              value={customDistanceX}
              onChange={(e) => setCustomDistanceX(parseInt(e.target.value))}
              className="w-36 accent-[#a855f7] cursor-pointer"
            />
          </div>
        </div>

        {/* Live Mathematical Curve Graphic */}
        <div className="h-40 w-full bg-black/40 border border-white/5 rounded-lg p-3 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#808080]">
            <span>Seam Center (x=0m)</span>
            <span>Inflection Point (x=35m)</span>
            <span>Draw Limit (x=85m)</span>
          </div>

          {/* SVG Profile Line */}
          <svg className="w-full h-24 overflow-visible">
            <defs>
              <linearGradient id="troughGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={`M 0,10 Q 150,${Math.min(80, parseFloat(cimfrSmax) * 0.7)} 300,${Math.min(75, parseFloat(cimfrSmax) * 0.6)} T 600,15 T 900,10 L 900,90 L 0,90 Z`}
              fill="url(#troughGradient)"
            />
            <path
              d={`M 0,10 Q 150,${Math.min(80, parseFloat(cimfrSmax) * 0.7)} 300,${Math.min(75, parseFloat(cimfrSmax) * 0.6)} T 600,15 T 900,10`}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
            />
            {/* Indicator Marker */}
            <circle
              cx={`${(customDistanceX / 90) * 100}%`}
              cy={Math.min(80, Math.max(15, parseFloat(localDeflection) * 0.6))}
              r="5"
              fill="#ef4444"
              className="animate-pulse"
            />
          </svg>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/60">
              Max Centerline Drop: <strong className="text-white">{cimfrSmax} mm</strong>
            </span>
            <span className="text-[#a855f7]">
              Estimated Surface Drop at {customDistanceX}m: <strong>{localDeflection} mm</strong>
            </span>
          </div>
        </div>
      </div>

      {/* GIS Cartography & Alert Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <GISHeatmap onSelectNode={(n) => handleOpenDrilldown(n.id)} />
        </div>
        <div className="lg:col-span-4">
          <AlertAuditTable />
        </div>
      </div>

      {/* Modals */}
      {isDrilldownOpen && (
        <NodeDrilldownModal 
          nodeId={drilldownNodeId} 
          onClose={() => setIsDrilldownOpen(false)} 
        />
      )}

      {isIncidentReportOpen && (
        <IncidentReportModal 
          onClose={() => setIsIncidentReportOpen(false)} 
        />
      )}
    </div>
  );
};
