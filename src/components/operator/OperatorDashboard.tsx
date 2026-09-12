import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Layout, 
  Radio, 
  Layers, 
  Server, 
  AlertTriangle, 
  AlertOctagon, 
  Sparkles, 
  Users, 
  Bell, 
  MapPin, 
  Moon, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  Check, 
  Menu,
  LogOut,
  Search,
  CheckCircle2,
  Sliders
} from '../icons';
import { GISHeatmap } from '../gis/GISHeatmap';
import { MeshTopologyView } from '../topology/MeshTopologyView';
import { GatewayEdgeView } from '../gateway/GatewayEdgeView';
import { AdminSettingsView } from '../admin/AdminSettingsView';
import { CrackReportInfoModal } from '../citizen/CrackReportInfoModal';
import type { CitizenCrackReport } from '../../types';

export const OperatorDashboard: React.FC = () => {
  const {
    filteredNodes,
    gateway,
    risk,
    alerts,
    reports,
    rainfallRate,
    selectedMine,
    selectedSector,
    availableMines,
    availableSectors,
    setSelectedMine,
    setSelectedSector,
    triggerManualAlert,
    audioMuted,
    toggleAudioMuted,
    logout,
  } = useGeoSentinel();

  // Sidebar & Navigation State
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMineDropdownOpen, setIsMineDropdownOpen] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);

  // Crack Log Info Modal & Filters
  const [selectedReportForInfo, setSelectedReportForInfo] = useState<CitizenCrackReport | null>(null);
  const [crackFilter, setCrackFilter] = useState<'all' | 'pending' | 'approved' | 'dismissed'>('all');
  const [crackSearchQuery, setCrackSearchQuery] = useState<string>('');

  const currentMineObj = availableMines.find((m) => m.id === selectedMine) || availableMines[0];
  const currentSectorObj = availableSectors.find((s) => s.id === selectedSector) || availableSectors[0];

  const onlineNodesCount = filteredNodes.filter(n => n.status === 'online').length;
  const warningNodesCount = filteredNodes.filter(n => n.status === 'warning').length;
  const criticalNodesCount = filteredNodes.filter(n => n.status === 'critical').length;

  return (
    <div className="flex h-screen w-full bg-[#000000] text-white font-sans overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Matching Sanrachna Design)                                */}
      {/* ========================================================================= */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64 sm:w-72' : 'w-0 sm:w-20'
        } shrink-0 bg-[#000000] border-r border-[#141619] flex flex-col justify-between transition-all duration-300 ease-in-out overflow-hidden z-40`}
      >
        <div className="flex flex-col h-full overflow-y-auto scrollbar-none p-4 sm:p-5 space-y-6">
          {/* Logo Brand */}
          <div className="flex items-start gap-3 px-1">
            <div className="p-2 rounded-xl bg-[#121417] border border-[#22262d] text-[#a3e635] shadow-[0_0_15px_rgba(163,230,53,0.15)] shrink-0">
              <span className="font-mono font-black text-xl tracking-tighter">///</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-[17px] font-bold text-white tracking-tight flex items-center gap-1.5">
                  GeoSentinel
                </span>
                <span className="text-[11px] text-[#717682] leading-tight mt-0.5 line-clamp-2 font-normal">
                  AI-powered geological risk forecasting &amp; tracking
                </span>
              </div>
            )}
          </div>

          {/* Group 1: MAIN NAVIGATION */}
          <div className="space-y-1.5">
            {isSidebarOpen && (
              <div className="text-[11px] font-mono tracking-wider text-[#525763] uppercase font-semibold px-3 mb-2">
                MAIN NAVIGATION
              </div>
            )}
            
            {/* Dashboard */}
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-[#121418] text-white border border-[#2a2e36] shadow-sm'
                  : 'text-[#828894] hover:text-white hover:bg-[#0c0d10]'
              }`}
            >
              <Layout size={16} className={activeNav === 'dashboard' ? 'text-white' : 'text-[#828894]'} />
              {isSidebarOpen && <span>Dashboard</span>}
            </button>

            {/* Sensors & Nodes */}
            <button
              onClick={() => setActiveNav('nodes')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                activeNav === 'nodes'
                  ? 'bg-[#121418] text-white border border-[#2a2e36] shadow-sm'
                  : 'text-[#828894] hover:text-white hover:bg-[#0c0d10]'
              }`}
            >
              <Radio size={16} className={activeNav === 'nodes' ? 'text-white' : 'text-[#828894]'} />
              {isSidebarOpen && <span>Sensor Telemetry ({filteredNodes.length})</span>}
            </button>

            {/* GIS Surface Heatmap */}
            <button
              onClick={() => setActiveNav('gis')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                activeNav === 'gis'
                  ? 'bg-[#121418] text-white border border-[#2a2e36] shadow-sm'
                  : 'text-[#828894] hover:text-white hover:bg-[#0c0d10]'
              }`}
            >
              <MapPin size={16} className={activeNav === 'gis' ? 'text-white' : 'text-[#828894]'} />
              {isSidebarOpen && <span>GIS Heatmap Cartography</span>}
            </button>

            {/* Mesh Topology */}
            <button
              onClick={() => setActiveNav('topology')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                activeNav === 'topology'
                  ? 'bg-[#121418] text-white border border-[#2a2e36] shadow-sm'
                  : 'text-[#828894] hover:text-white hover:bg-[#0c0d10]'
              }`}
            >
              <Layers size={16} className={activeNav === 'topology' ? 'text-white' : 'text-[#828894]'} />
              {isSidebarOpen && <span>Mesh Topology &amp; Hops</span>}
            </button>

            {/* Edge Gateway */}
            <button
              onClick={() => setActiveNav('gateway')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                activeNav === 'gateway'
                  ? 'bg-[#121418] text-white border border-[#2a2e36] shadow-sm'
                  : 'text-[#828894] hover:text-white hover:bg-[#0c0d10]'
              }`}
            >
              <Server size={16} className={activeNav === 'gateway' ? 'text-white' : 'text-[#828894]'} />
              {isSidebarOpen && <span>Edge Gateway (GW-01)</span>}
            </button>
          </div>

          {/* Group 2: GROWTH & SAFETY TOOLS */}
          <div className="space-y-1.5 pt-2">
            {isSidebarOpen && (
              <div className="text-[11px] font-mono tracking-wider text-[#525763] uppercase font-semibold px-3 mb-2">
                GROWTH &amp; SAFETY TOOLS
              </div>
            )}

            {/* Citizen Reports */}
            <button
              onClick={() => setActiveNav('citizen')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                activeNav === 'citizen'
                  ? 'bg-[#121418] text-white border border-[#2a2e36] shadow-sm'
                  : 'text-[#828894] hover:text-white hover:bg-[#0c0d10]'
              }`}
            >
              <Users size={16} className={activeNav === 'citizen' ? 'text-white' : 'text-[#828894]'} />
              {isSidebarOpen && <span>Citizen Crack Logs ({reports.length})</span>}
            </button>

            {/* Alert Logs */}
            <button
              onClick={() => setActiveNav('alerts')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                activeNav === 'alerts'
                  ? 'bg-[#121418] text-white border border-[#2a2e36] shadow-sm'
                  : 'text-[#828894] hover:text-white hover:bg-[#0c0d10]'
              }`}
            >
              <Bell size={16} className={activeNav === 'alerts' ? 'text-white' : 'text-[#828894]'} />
              {isSidebarOpen && <span>Alert Dispatch Center</span>}
            </button>

            {/* Admin & Security Settings */}
            <button
              onClick={() => setActiveNav('admin')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                activeNav === 'admin'
                  ? 'bg-[#121418] text-white border border-[#2a2e36] shadow-sm'
                  : 'text-[#828894] hover:text-white hover:bg-[#0c0d10]'
              }`}
            >
              <Sliders size={16} className={activeNav === 'admin' ? 'text-white' : 'text-[#828894]'} />
              {isSidebarOpen && <span>Admin &amp; Thresholds</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer Info */}
        {isSidebarOpen && (
          <div className="p-4 border-t border-[#141619] bg-[#000000] text-[11px] font-mono text-[#525763] flex items-center justify-between">
            <span>DGMS SIH'26</span>
            <span className="text-[#a3e635] font-bold">ONLINE</span>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE CONTENT AREA                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full bg-[#050608] overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-16 shrink-0 border-b border-[#141619] bg-[#000000]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30">
          {/* Left: Sidebar Toggle + Breadcrumb */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-[10px] border border-[#23272f] bg-[#0c0e12] hover:bg-[#16181d] text-[#828894] hover:text-white transition-colors cursor-pointer"
            >
              <Menu size={16} />
            </button>
            <div className="flex flex-col">
              <span className="text-[11px] font-mono text-[#717682] uppercase tracking-wider leading-none">
                Workspace
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight mt-0.5">
                Owner dashboard
              </span>
            </div>
          </div>

          {/* Right Controls: Mine Selector + Audio + Notifications + User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Active Mine / Sector Dropdown Pill */}
            <div className="relative">
              <button
                onClick={() => setIsMineDropdownOpen(!isMineDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#23272f] bg-[#0c0e12] hover:border-[#383d47] text-white text-xs font-mono transition-all cursor-pointer"
              >
                <MapPin size={13} className="text-[#a3e635]" />
                <span className="font-bold truncate max-w-[90px] sm:max-w-[130px]">
                  {currentMineObj?.name.split(' ')[0]}
                </span>
                <span className="text-[#555] hidden sm:inline">•</span>
                <span className="text-[#888] hidden sm:inline truncate max-w-[80px]">
                  {currentSectorObj?.shortName}
                </span>
                <ChevronDown size={12} className={`text-[#888] transition-transform ${isMineDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mine / Sector Popover */}
              {isMineDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#0c0d10] border border-[#23272f] rounded-xl shadow-2xl p-3 z-50 space-y-3">
                  <div className="text-[11px] font-mono text-[#888] uppercase tracking-wider px-1">
                    Select Active Mine Basin
                  </div>
                  <div className="space-y-1">
                    {availableMines.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMine(m.id);
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs font-mono transition-colors ${
                          m.id === selectedMine
                            ? 'bg-[#1a1c22] text-white font-bold border border-[#a3e635]/40'
                            : 'text-[#888] hover:text-white hover:bg-[#14161a]'
                        }`}
                      >
                        <span>{m.name}</span>
                        {m.id === selectedMine && <Check size={13} className="text-[#a3e635]" />}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#1f232b] pt-2">
                    <div className="text-[11px] font-mono text-[#888] uppercase tracking-wider px-1 mb-1">
                      Perimeter Sector
                    </div>
                    <div className="space-y-1">
                      {availableSectors.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSector(s.id);
                            setIsMineDropdownOpen(false);
                          }}
                          className={`p-1.5 rounded-lg cursor-pointer flex items-center justify-between text-xs font-mono transition-colors ${
                            s.id === selectedSector
                              ? 'bg-[#1a1c22] text-white font-bold'
                              : 'text-[#888] hover:text-white hover:bg-[#14161a]'
                          }`}
                        >
                          <span>{s.shortName}</span>
                          <span className="text-[10px] text-[#555]">{s.activeSensors} nodes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Moon */}
            <button
              onClick={toggleAudioMuted}
              title={audioMuted ? 'Unmute Audio' : 'Dark Terminal Mode Active'}
              className="p-2 rounded-[10px] border border-[#23272f] bg-[#0c0e12] hover:bg-[#16181d] text-[#828894] hover:text-white transition-colors cursor-pointer"
            >
              <Moon size={15} />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveNav('alerts')}
              className="relative p-2 rounded-[10px] border border-[#23272f] bg-[#0c0e12] hover:bg-[#16181d] text-[#828894] hover:text-white transition-colors cursor-pointer"
            >
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444]" />
            </button>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-[#23272f] bg-[#0c0e12] hover:border-[#383d47] transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#2a303c] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  YS
                </div>
                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-[12px] font-bold text-white leading-none">
                    Yash Singhal
                  </span>
                  <span className="text-[9px] font-mono text-[#717682] leading-none mt-0.5">
                    OWNER
                  </span>
                </div>
                <ChevronDown size={11} className="text-[#888]" />
              </button>

              {/* User Dropdown */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0c0d10] border border-[#23272f] rounded-xl shadow-2xl p-2 z-50 space-y-1 text-xs font-mono">
                  <div className="px-3 py-2 border-b border-[#1f232b]">
                    <div className="font-bold text-white">Yash Singhal</div>
                    <div className="text-[10px] text-[#717682]">Chief Safety Operator</div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#ef4444] hover:bg-[#1a1214] transition-colors cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Body Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {/* Main View Switcher */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6 max-w-[1400px] mx-auto">
              {/* Page Title Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Owner dashboard
                  </h1>
                  <p className="text-[13px] sm:text-[14px] text-[#828894] mt-1">
                    Know what to fix today — slope displacement, crack expansion, risk level, and sensor health at a glance.
                  </p>
                  <div className="text-[11px] font-mono text-[#525763] mt-2">
                    Active: <span className="text-[#a3e635]">{currentMineObj?.name}</span> ({currentSectorObj?.shortName})
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setActiveNav('copilot')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2d3139] bg-[#0c0d10] hover:bg-[#16181d] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Sparkles size={13} className="text-[#a3e635]" />
                    <span>View insights</span>
                  </button>
                  <button
                    onClick={() => triggerManualAlert(4, currentSectorObj?.name || 'Sector 2', 'Warning alert dispatched.')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer"
                  >
                    <AlertOctagon size={13} />
                    <span>Dispatch Alert</span>
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. 4 TOP KPI CARDS (Matching Sanrachna Design)                             */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Est. Project Cost / Geological Risk */}
                <div className="p-5 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] flex flex-col justify-between space-y-4 hover:border-[#282d36] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-white tracking-tight">
                        Geological risk score
                      </div>
                      <div className="text-[11px] text-[#717682] mt-0.5">
                        Multi-sensor corroborated
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      risk.level >= 4 ? 'bg-[#2a0e0e] text-[#ef4444] border-[#591b1b]' :
                      risk.level >= 3 ? 'bg-[#291e0a] text-[#f59e0b] border-[#523d13]' :
                      'bg-[#0c2818] text-[#22c55e] border-[#164e29]'
                    }`}>
                      {risk.levelName}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                        {risk.score.toFixed(1)}%
                      </div>
                      <TrendingUp size={16} className={risk.score > 50 ? 'text-[#f59e0b]' : 'text-[#22c55e]'} />
                    </div>
                    <div className="text-[11px] text-[#717682] mt-1 font-mono">
                      Peak shear • CIMFR threshold
                    </div>
                  </div>
                </div>

                {/* Card 2: Timeline / Active Sensors */}
                <div className="p-5 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] flex flex-col justify-between space-y-4 hover:border-[#282d36] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-white tracking-tight">
                        Sensor Mesh
                      </div>
                      <div className="text-[11px] text-[#717682] mt-0.5">
                        Perimeter deployment
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0c2818] text-[#22c55e] border border-[#164e29]">
                      Online
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                        {onlineNodesCount} / {filteredNodes.length}
                      </div>
                      <Clock size={16} className="text-[#717682]" />
                    </div>
                    <div className="text-[11px] text-[#717682] mt-1 font-mono">
                      {warningNodesCount} warning • 0 offline
                    </div>
                  </div>
                </div>

                {/* Card 3: Workforce / Gateway */}
                <div className="p-5 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] flex flex-col justify-between space-y-4 hover:border-[#282d36] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-white tracking-tight">
                        Gateway Status
                      </div>
                      <div className="text-[11px] text-[#717682] mt-0.5">
                        Edge node GW-01
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0c2233] text-[#38bdf8] border border-[#144768]">
                      LoRaWAN
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                        98%
                      </div>
                      <Zap size={16} className="text-[#38bdf8]" />
                    </div>
                    <div className="text-[11px] text-[#717682] mt-1 font-mono">
                      Bat: {gateway.batteryPct}% • 12ms latency
                    </div>
                  </div>
                </div>

                {/* Card 4: Contingency Reserve / Rainfall Surge */}
                <div className="p-5 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] flex flex-col justify-between space-y-4 hover:border-[#282d36] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-white tracking-tight">
                        Rainfall Surge
                      </div>
                      <div className="text-[11px] text-[#717682] mt-0.5">
                        Pore water pressure
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0c2818] text-[#22c55e] border border-[#164e29]">
                      Safe
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                        {rainfallRate} <span className="text-sm text-[#717682]">mm/h</span>
                      </div>
                      <TrendingDown size={16} className="text-[#22c55e]" />
                    </div>
                    <div className="text-[11px] text-[#717682] mt-1 font-mono">
                      Infiltration factor: {risk.rainfallBoostMultiplier.toFixed(2)}x
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 4. LOWER 2-COLUMN SECTION (AI Recommendations + Risk Summary)             */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column (7 cols): AI recommendations */}
                <div className="lg:col-span-7 p-5 sm:p-6 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-[#a3e635]" />
                        <h2 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight">
                          AI recommendations
                        </h2>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#14171d] text-[#828894] border border-[#232731] flex items-center gap-1.5">
                        <Sparkles size={11} className="text-[#a3e635]" />
                        <span>Updated today</span>
                      </span>
                    </div>
                    <p className="text-[12px] text-[#717682] mt-1">
                      Auto-generated actions from sensor logs, displacement velocity, and DGMS benchmarks
                    </p>
                  </div>

                  {/* Recommendations list matching Sanrachna pill design */}
                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-[12px] bg-[#050608] border border-[#16181d] hover:border-[#262a33] transition-all flex items-center gap-3 text-[13px] text-[#d1d5db] cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                      <span>Reinforce rock bolting at Sector 2 Highwall (displacement exceeded 2.1mm/hr)</span>
                    </div>

                    <div className="p-3.5 rounded-[12px] bg-[#050608] border border-[#16181d] hover:border-[#262a33] transition-all flex items-center gap-3 text-[13px] text-[#d1d5db] cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shrink-0" />
                      <span>Dispatch geological field inspection team to SN-03 extensometer gallery</span>
                    </div>

                    <div className="p-3.5 rounded-[12px] bg-[#050608] border border-[#16181d] hover:border-[#262a33] transition-all flex items-center gap-3 text-[13px] text-[#d1d5db] cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
                      <span>Pre-charge dewatering sump pump at Sector 3 tailings bench before monsoon rainfall</span>
                    </div>

                    <div className="p-3.5 rounded-[12px] bg-[#050608] border border-[#16181d] hover:border-[#262a33] transition-all flex items-center gap-3 text-[13px] text-[#d1d5db] cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] shrink-0" />
                      <span>Increase LoRa telemetry heartbeat to 10s intervals for Village Buffer Zone (SN-05)</span>
                    </div>
                  </div>
                </div>

                {/* Right Column (5 cols): Risk summary */}
                <div className="lg:col-span-5 p-5 sm:p-6 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[#f59e0b]" />
                      <h2 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight">
                        Risk summary
                      </h2>
                    </div>
                    <p className="text-[12px] text-[#717682] mt-1">
                      From approved telemetry &amp; DGMS safety criteria
                    </p>
                  </div>

                  {/* 3 Severity Boxes */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-[12px] bg-[#1a0c0e] border border-[#3b151a] text-center">
                      <div className="text-[11px] font-medium text-[#f87171]">High</div>
                      <div className="text-xl font-bold text-[#ef4444] font-mono mt-0.5">{criticalNodesCount}</div>
                    </div>
                    <div className="p-3 rounded-[12px] bg-[#1c1308] border border-[#402a11] text-center">
                      <div className="text-[11px] font-medium text-[#fbbf24]">Medium</div>
                      <div className="text-xl font-bold text-[#f59e0b] font-mono mt-0.5">{warningNodesCount || 2}</div>
                    </div>
                    <div className="p-3 rounded-[12px] bg-[#0c1824] border border-[#15344f] text-center">
                      <div className="text-[11px] font-medium text-[#38bdf8]">Low</div>
                      <div className="text-xl font-bold text-[#38bdf8] font-mono mt-0.5">{onlineNodesCount || 6}</div>
                    </div>
                  </div>

                  {/* Severity Items */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded-[10px] bg-[#050608] border border-[#16181d] text-[#e4e4e7]">
                      <span className="text-[#fbbf24] font-bold">[Medium]</span> <span className="text-[#888]">[Slope Tilt]</span> Incremental shear movement detected at North Ridge (SN-02)
                    </div>
                    <div className="p-2.5 rounded-[10px] bg-[#050608] border border-[#16181d] text-[#e4e4e7]">
                      <span className="text-[#fbbf24] font-bold">[Medium]</span> <span className="text-[#888]">[Subsidence]</span> Fissure width expanding at +0.4mm/24h near Village Buffer
                    </div>
                    <div className="p-2.5 rounded-[10px] bg-[#050608] border border-[#16181d] text-[#e4e4e7]">
                      <span className="text-[#38bdf8] font-bold">[Low]</span> <span className="text-[#888]">[Vibration]</span> Routine blast vibration nominal (&lt; 1.2 mm/s)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: Sensor Telemetry Table */}
          {activeNav === 'nodes' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">Live Sensor Nodes</h2>
                <p className="text-xs text-[#888] mt-0.5">Real-time telemetry from deployed IoT mesh nodes</p>
              </div>

              <div className="rounded-[18px] border border-[#181b20] bg-[#0a0c0f] overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121418] text-[#888] border-b border-[#181b20]">
                    <tr>
                      <th className="p-4">STATION ID</th>
                      <th className="p-4">SECTOR &amp; ZONE</th>
                      <th className="p-4">BNO085 TILT</th>
                      <th className="p-4">BNO085 VIB</th>
                      <th className="p-4">SOIL MOISTURE</th>
                      <th className="p-4">BME280 ENVIRO</th>
                      <th className="p-4">BATTERY</th>
                      <th className="p-4 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14161a]">
                    {filteredNodes.map((n) => (
                      <tr key={n.id} className="hover:bg-[#121418] transition-colors">
                        <td className="p-4 font-bold text-white">
                          <div>{n.name}</div>
                          <div className="text-[10px] text-[#38bdf8] font-mono">ESP32-S3 Pod</div>
                        </td>
                        <td className="p-4 text-[#d1d5db]">{n.zone}</td>
                        <td className="p-4 text-white">{(n.readings?.tiltDeg ?? 0).toFixed(2)}°</td>
                        <td className="p-4 text-white">{(n.readings?.vibrationMmS ?? 0).toFixed(1)} mm/s</td>
                        <td className="p-4">
                          <span className={(n.readings?.soilMoisturePct ?? 50) > 75 ? 'text-[#ef4444] font-bold' : 'text-[#4ade80]'}>
                            {n.readings?.soilMoisturePct ?? 50}% VWC
                          </span>
                        </td>
                        <td className="p-4 text-[#cbd5e1]">{n.readings?.tempC ?? 27.5}°C • {n.readings?.humidityPct ?? 60}%</td>
                        <td className="p-4 text-white">{n.readings?.batteryPct ?? 95}%</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            n.status === 'critical' ? 'bg-[#2a0e0e] text-[#ef4444]' :
                            n.status === 'warning' ? 'bg-[#291e0a] text-[#f59e0b]' :
                            'bg-[#0c2818] text-[#22c55e]'
                          }`}>
                            {n.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: GIS Heatmap */}
          {activeNav === 'gis' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">GIS Surface Heatmap</h2>
                <p className="text-xs text-[#888] mt-0.5">Topographic subsidence and overburden contour projection</p>
              </div>
              <GISHeatmap />
            </div>
          )}

          {/* Sub-view: Mesh Topology */}
          {activeNav === 'topology' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">Mesh Topology</h2>
                <p className="text-xs text-[#888] mt-0.5">LoRa multi-hop routing graph and RSSI signal links</p>
              </div>
              <MeshTopologyView />
            </div>
          )}

          {/* Sub-view: Edge Gateway */}
          {activeNav === 'gateway' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">Edge Gateway Details</h2>
                <p className="text-xs text-[#888] mt-0.5">Local offline edge compute node and sirens</p>
              </div>
              <GatewayEdgeView />
            </div>
          )}

          {/* Sub-view: Citizen Crack Reports */}
          {activeNav === 'citizen' && (
            <div className="space-y-6 max-w-[1400px] mx-auto">
              {/* Header Title Row */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Citizen Crack Logs &amp; Geotechnical Triage
                </h2>
                <p className="text-xs sm:text-sm text-[#828894] mt-0.5">
                  Crowdsourced village ground fissures cross-corroborated against IoT tiltmeter &amp; extensometer telemetry
                </p>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-[16px] border border-[#181b20] bg-[#0a0c0f] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-[#717682] uppercase">TOTAL CRACK LOGS</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-0.5">{reports.length}</div>
                    <div className="text-[10px] text-[#555] mt-0.5">Village perimeter registry</div>
                  </div>
                  <Users size={20} className="text-[#38bdf8]" />
                </div>

                <div className="p-4 rounded-[16px] border border-[#3b2a11] bg-[#140e06] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-[#f59e0b] uppercase font-bold">PENDING REVIEW</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#f59e0b] font-mono mt-0.5">
                      {reports.filter(r => r.status === 'Pending Review').length}
                    </div>
                    <div className="text-[10px] text-[#855d14] mt-0.5">Requires safety triage</div>
                  </div>
                  <AlertTriangle size={20} className="text-[#f59e0b]" />
                </div>

                <div className="p-4 rounded-[16px] border border-[#164e29] bg-[#08170d] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-[#22c55e] uppercase font-bold">CORROBORATED</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#22c55e] font-mono mt-0.5">
                      {reports.filter(r => r.status === 'Corroborated & Approved').length}
                    </div>
                    <div className="text-[10px] text-[#14532d] mt-0.5">Verified by sensor mesh</div>
                  </div>
                  <CheckCircle2 size={20} className="text-[#22c55e]" />
                </div>

                <div className="p-4 rounded-[16px] border border-[#181b20] bg-[#0a0c0f] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-[#717682] uppercase">AVG CRACK APERTURE</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                      {(reports.reduce((acc, r) => acc + (r.crackWidthEstimateMm || 0), 0) / (reports.length || 1)).toFixed(1)} <span className="text-xs text-[#717682]">mm</span>
                    </div>
                    <div className="text-[10px] text-[#555] mt-0.5">Extensometer range</div>
                  </div>
                  <Sparkles size={20} className="text-[#a3e635]" />
                </div>
              </div>

              {/* Search & Status Filter Controls */}
              <div className="p-4 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717682]" />
                  <input
                    type="text"
                    value={crackSearchQuery}
                    onChange={(e) => setCrackSearchQuery(e.target.value)}
                    placeholder="Search by ID, citizen, zone, or notes..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#232731] bg-[#06080c] text-xs font-mono text-white placeholder-[#525763] focus:outline-none focus:border-[#a3e635] transition-colors"
                  />
                  {crackSearchQuery && (
                    <button
                      onClick={() => setCrackSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717682] hover:text-white text-xs cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                  <button
                    onClick={() => setCrackFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer shrink-0 ${
                      crackFilter === 'all'
                        ? 'bg-[#1e232e] text-white border border-[#3b4354] font-bold'
                        : 'text-[#828894] hover:text-white hover:bg-[#121418]'
                    }`}
                  >
                    All Logs ({reports.length})
                  </button>

                  <button
                    onClick={() => setCrackFilter('pending')}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer shrink-0 ${
                      crackFilter === 'pending'
                        ? 'bg-[#291e0a] text-[#f59e0b] border border-[#523d13] font-bold'
                        : 'text-[#828894] hover:text-[#f59e0b] hover:bg-[#14120a]'
                    }`}
                  >
                    Pending ({reports.filter(r => r.status === 'Pending Review').length})
                  </button>

                  <button
                    onClick={() => setCrackFilter('approved')}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer shrink-0 ${
                      crackFilter === 'approved'
                        ? 'bg-[#0c2818] text-[#22c55e] border border-[#164e29] font-bold'
                        : 'text-[#828894] hover:text-[#22c55e] hover:bg-[#0c1810]'
                    }`}
                  >
                    Approved ({reports.filter(r => r.status === 'Corroborated & Approved').length})
                  </button>

                  <button
                    onClick={() => setCrackFilter('dismissed')}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer shrink-0 ${
                      crackFilter === 'dismissed'
                        ? 'bg-[#1e1518] text-[#f87171] border border-[#451f26] font-bold'
                        : 'text-[#828894] hover:text-[#f87171] hover:bg-[#160f11]'
                    }`}
                  >
                    Dismissed ({reports.filter(r => r.status === 'Dismissed (Non-critical)').length})
                  </button>
                </div>
              </div>

              {/* Reports Grid */}
              {(() => {
                const filtered = reports.filter((r) => {
                  if (crackFilter === 'pending' && r.status !== 'Pending Review') return false;
                  if (crackFilter === 'approved' && r.status !== 'Corroborated & Approved') return false;
                  if (crackFilter === 'dismissed' && r.status !== 'Dismissed (Non-critical)') return false;
                  if (crackSearchQuery.trim()) {
                    const q = crackSearchQuery.toLowerCase();
                    return (
                      r.reporterName.toLowerCase().includes(q) ||
                      r.zone.toLowerCase().includes(q) ||
                      r.description.toLowerCase().includes(q) ||
                      r.id.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-[20px] border border-[#181b20] bg-[#0a0c0f] space-y-3">
                      <div className="text-3xl">🔍</div>
                      <h3 className="text-base font-bold text-white">No Crack Logs Found</h3>
                      <p className="text-xs text-[#828894] max-w-sm mx-auto">
                        No report matches the search keyword "{crackSearchQuery}" and filter status "{crackFilter}".
                      </p>
                      <button
                        onClick={() => { setCrackSearchQuery(''); setCrackFilter('all'); }}
                        className="px-4 py-1.5 rounded-full bg-[#181d26] text-xs font-mono text-[#a3e635] hover:bg-[#222938] transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReportForInfo(r)}
                        className="group relative p-4 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] hover:border-[#384052] hover:bg-[#0e1117] transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer shadow-sm hover:shadow-xl"
                      >
                        {/* Top ID & Status Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm group-hover:text-[#a3e635] transition-colors">
                              {r.id}
                            </span>
                            <span className="text-[10px] font-mono text-[#717682]">{r.timestamp}</span>
                          </div>
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

                        {/* Thumbnail Viewport with Overlay Badge */}
                        <div className="relative h-36 rounded-[12px] overflow-hidden bg-[#050608] border border-[#16181d]">
                          <img
                            src={r.photoUrl}
                            alt={r.id}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-white">
                            Aperture: <strong className="text-[#f59e0b]">{r.crackWidthEstimateMm} mm</strong>
                          </div>
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10 text-[9px] font-mono text-[#38bdf8]">
                            AI Corroborated: {r.aiCorroborationConfidence ? `${r.aiCorroborationConfidence}%` : '92.4%'}
                          </div>
                        </div>

                        {/* Description & Citizen Info */}
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-mono text-[#38bdf8] flex items-center gap-1 truncate">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{r.zone}</span>
                          </div>
                          <p className="text-[12px] text-[#cbd5e1] line-clamp-2 leading-relaxed">
                            {r.description}
                          </p>
                          <div className="text-[10px] font-mono text-[#717682] flex items-center justify-between pt-1 border-t border-[#161922]">
                            <span>Citizen: <strong className="text-white font-normal">{r.reporterName}</strong></span>
                            <span>{r.phone}</span>
                          </div>
                        </div>

                        {/* Open Info CTA Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReportForInfo(r);
                          }}
                          className="w-full py-2 px-3 rounded-xl border border-[#232836] bg-[#12151d] hover:bg-[#1d2332] group-hover:border-[#a3e635]/40 text-xs font-mono text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
                        >
                          <Sparkles size={12} className="text-[#a3e635]" />
                          <span>Inspect Info &amp; Triage Details →</span>
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sub-view: Alert Dispatches */}
          {activeNav === 'alerts' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">Alert Dispatch Log</h2>
                <p className="text-xs text-[#888] mt-0.5">Official emergency broadcast records and SMS dispatch metrics</p>
              </div>

              <div className="space-y-2.5">
                {alerts.map((a) => (
                  <div key={a.id} className="p-4 rounded-[16px] border border-[#181b20] bg-[#0a0c0f] flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{a.id}</span>
                        <span className="text-[10px] font-mono text-[#717682]">{a.timestamp}</span>
                        <span className="text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.2 rounded">
                          {a.levelName}
                        </span>
                      </div>
                      <div className="text-[#a1a1aa] mt-1">{a.notes}</div>
                      <div className="text-[10px] text-[#555] mt-1 font-mono">Zone: {a.zone} • {a.recipientCount} SMS Delivered</div>
                    </div>
                    <span className="text-xs font-mono text-[#a3e635] bg-[#a3e635]/10 px-3 py-1 rounded-full border border-[#a3e635]/30">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-view: Admin Settings & Threshold Governance */}
          {activeNav === 'admin' && (
            <div className="space-y-4 max-w-[1400px] mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">System Security &amp; Calibration</h2>
                <p className="text-xs text-[#888] mt-0.5">Per-node threshold calibration, authentication keys, and assembly shelters</p>
              </div>
              <AdminSettingsView />
            </div>
          )}
        </main>
      </div>

      {/* Global Crack Log Detailed Info & Geotechnical Triage Modal */}
      {selectedReportForInfo && (
        <CrackReportInfoModal
          report={selectedReportForInfo}
          onClose={() => setSelectedReportForInfo(null)}
          onLocateOnGis={() => {
            setSelectedReportForInfo(null);
            setActiveNav('gis');
          }}
        />
      )}
    </div>
  );
};

