import React, { useState, useRef, useEffect } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Bell, 
  Moon, 
  Github, 
  LogOut,
  Lock,
  MapPin,
  Layers,
  ChevronDown,
  Check,
  Sparkles,
  X
} from '../icons';

export const TopNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    risk,
    audioMuted,
    toggleAudioMuted,
    isAuthenticated,
    currentUser,
    setIsLoginModalOpen,
    logout,
    selectedMine,
    selectedSector,
    availableMines,
    availableSectors,
    setSelectedMine,
    setSelectedSector,
  } = useGeoSentinel();

  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [activeSelectorTab, setActiveSelectorTab] = useState<'mine' | 'sector'>('mine');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsSelectorOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSelectorOpen(false);
      }
    };

    if (isSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelectorOpen]);

  const currentMineObj = availableMines.find((m) => m.id === selectedMine) || availableMines[0];
  const currentSectorObj = availableSectors.find((s) => s.id === selectedSector) || availableSectors[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#181818] bg-[#000000]/95 backdrop-blur-md">
      <div className="w-full flex h-16 sm:h-20 items-center justify-between px-3 sm:px-6 md:px-8 relative">
        {/* ========================================================================= */}
        {/* 1. LEFT: LOGO + MINE & SECTOR SELECTOR FIELD                             */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Logo: "/// geosentinel" */}
          <div 
            onClick={() => setActiveTab('landing')} 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <span className="text-[#a3e635] font-black text-2xl sm:text-3xl tracking-[-0.12em] font-mono group-hover:scale-105 transition-transform">
              ///
            </span>
            <span className="text-[18px] sm:text-[22px] font-extrabold text-white tracking-tight lowercase">
              geosentinel
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#a3e635] border border-[#a3e635]/30 bg-[#a3e635]/10 px-1.5 sm:px-2 py-0.5 rounded hidden xl:inline-block">
              SIH'26 PS-25
            </span>
          </div>

          {/* Sector & Mine Selector Pill Widget in Navbar */}
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsSelectorOpen((prev) => !prev)}
              className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-full border transition-all cursor-pointer text-left ${
                isSelectorOpen 
                  ? 'border-[#a3e635] bg-[#151719] shadow-[0_0_15px_rgba(163,230,53,0.15)]' 
                  : 'border-[#262626] bg-[#0c0d0e]/95 hover:border-[#404040] hover:bg-[#121315]'
              }`}
              title="Select Mine Basin & Perimeter Sector"
            >
              {/* Mine status indicator */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    currentMineObj?.overallRisk === 'Warning' ? 'bg-[#f59e0b]' :
                    currentMineObj?.overallRisk === 'Advisory' ? 'bg-[#38bdf8]' : 'bg-[#a3e635]'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    currentMineObj?.overallRisk === 'Warning' ? 'bg-[#f59e0b]' :
                    currentMineObj?.overallRisk === 'Advisory' ? 'bg-[#38bdf8]' : 'bg-[#a3e635]'
                  }`} />
                </span>
                <MapPin size={13} className="text-[#a3e635] shrink-0" />
                <span className="text-[12px] sm:text-[13px] font-bold text-white tracking-tight truncate max-w-[85px] sm:max-w-[130px]">
                  {currentMineObj?.name.replace(' Coalfield', '').replace(' Open-Cast', '').replace(' West Basin', '')}
                </span>
              </div>

              {/* Divider */}
              <span className="text-[#333333] text-[11px] select-none hidden sm:inline">•</span>

              {/* Active Sector badge */}
              <div className="hidden sm:flex items-center gap-1">
                <Layers size={11} className="text-[#888888]" />
                <span className="text-[11px] sm:text-[12px] font-mono text-[#a1a1aa] truncate max-w-[85px] md:max-w-[110px]">
                  {currentSectorObj?.shortName || 'All Sectors'}
                </span>
              </div>

              {/* Risk Level Pill */}
              <span className={`hidden lg:inline-block text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                currentSectorObj?.riskLevel === 'Warning' ? 'border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b]/10' :
                currentSectorObj?.riskLevel === 'Advisory' ? 'border-[#38bdf8]/40 text-[#38bdf8] bg-[#38bdf8]/10' :
                currentSectorObj?.riskLevel === 'Monitor' ? 'border-[#eab308]/40 text-[#eab308] bg-[#eab308]/10' :
                'border-[#a3e635]/40 text-[#a3e635] bg-[#a3e635]/10'
              }`}>
                {currentSectorObj?.riskLevel || 'Normal'}
              </span>

              {/* Chevron */}
              <ChevronDown 
                size={12} 
                className={`text-[#71717a] transition-transform duration-200 ${isSelectorOpen ? 'rotate-180 text-[#a3e635]' : ''}`} 
              />
            </button>

            {/* Dropdown Popover Modal */}
            {isSelectorOpen && (
              <div 
                ref={dropdownRef}
                className="absolute top-full left-0 mt-2.5 w-[330px] sm:w-[480px] md:w-[540px] bg-[#0c0d0e]/98 border border-[#262626] rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-50 backdrop-blur-xl overflow-hidden"
              >
                {/* Header & Tabs */}
                <div className="border-b border-[#1f1f1f] bg-[#080809] p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#a3e635]" />
                      <span className="text-[12px] sm:text-[13px] font-mono font-bold text-white uppercase tracking-wider">
                        Mining Basin & Sector Target
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSelectorOpen(false)}
                      className="text-[#71717a] hover:text-white p-1 rounded hover:bg-[#1a1a1a] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Tab Selector */}
                  <div className="grid grid-cols-2 gap-1.5 bg-[#141517] p-1 rounded-lg border border-[#222]">
                    <button
                      type="button"
                      onClick={() => setActiveSelectorTab('mine')}
                      className={`flex items-center justify-center gap-2 py-1.5 rounded-md text-[12px] font-mono transition-colors ${
                        activeSelectorTab === 'mine'
                          ? 'bg-[#222428] text-white font-bold shadow-sm'
                          : 'text-[#888] hover:text-white'
                      }`}
                    >
                      <MapPin size={12} className={activeSelectorTab === 'mine' ? 'text-[#a3e635]' : ''} />
                      <span>1. Mine Site ({availableMines.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSelectorTab('sector')}
                      className={`flex items-center justify-center gap-2 py-1.5 rounded-md text-[12px] font-mono transition-colors ${
                        activeSelectorTab === 'sector'
                          ? 'bg-[#222428] text-white font-bold shadow-sm'
                          : 'text-[#888] hover:text-white'
                      }`}
                    >
                      <Layers size={12} className={activeSelectorTab === 'sector' ? 'text-[#a3e635]' : ''} />
                      <span>2. Sector ({availableSectors.length})</span>
                    </button>
                  </div>
                </div>

                {/* Tab 1: Mine Site List */}
                {activeSelectorTab === 'mine' && (
                  <div className="p-3 sm:p-4 space-y-2 max-h-[340px] overflow-y-auto scrollbar-none">
                    <div className="text-[11px] font-mono text-[#71717a] uppercase tracking-wider px-1 mb-1">
                      Select Deployed Geological Basin
                    </div>
                    {availableMines.map((mine) => {
                      const isSelected = mine.id === selectedMine;
                      return (
                        <div
                          key={mine.id}
                          onClick={() => {
                            setSelectedMine(mine.id);
                            setActiveSelectorTab('sector');
                          }}
                          className={`group p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-[#a3e635] bg-[#a3e635]/5 shadow-[inset_0_0_12px_rgba(163,230,53,0.05)]'
                              : 'border-[#1f1f1f] bg-[#111214]/70 hover:border-[#383838] hover:bg-[#16171a]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-2 rounded-lg border ${
                              isSelected 
                                ? 'border-[#a3e635]/50 bg-[#a3e635]/15 text-[#a3e635]' 
                                : 'border-[#262626] bg-[#18191c] text-[#71717a] group-hover:text-white'
                            }`}>
                              <MapPin size={15} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[13px] sm:text-[14px] font-bold ${
                                  isSelected ? 'text-white' : 'text-[#e4e4e7] group-hover:text-white'
                                }`}>
                                  {mine.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[#2a2a2a] bg-[#171717] text-[#888]">
                                  {mine.code}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#71717a] mt-0.5 font-mono flex items-center gap-2">
                                <span>{mine.location}</span>
                                <span>•</span>
                                <span>{mine.totalSensors} Nodes</span>
                                <span>•</span>
                                <span>{mine.activeSectorsCount} Sectors</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              mine.overallRisk === 'Warning' ? 'border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b]/10' :
                              mine.overallRisk === 'Advisory' ? 'border-[#38bdf8]/40 text-[#38bdf8] bg-[#38bdf8]/10' :
                              'border-[#a3e635]/40 text-[#a3e635] bg-[#a3e635]/10'
                            }`}>
                              {mine.overallRisk}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#a3e635] text-black flex items-center justify-center font-bold">
                                <Check size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab 2: Sector List */}
                {activeSelectorTab === 'sector' && (
                  <div className="p-3 sm:p-4 space-y-2 max-h-[340px] overflow-y-auto scrollbar-none">
                    <div className="text-[11px] font-mono text-[#71717a] uppercase tracking-wider px-1 mb-1 flex items-center justify-between">
                      <span>Perimeter Sectors ({currentMineObj?.name})</span>
                      <span className="text-[#a3e635]">Live Telemetry Filter</span>
                    </div>
                    {availableSectors.map((sector) => {
                      const isSelected = sector.id === selectedSector;
                      return (
                        <div
                          key={sector.id}
                          onClick={() => {
                            setSelectedSector(sector.id);
                            setIsSelectorOpen(false);
                          }}
                          className={`group p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-[#a3e635] bg-[#a3e635]/5 shadow-[inset_0_0_12px_rgba(163,230,53,0.05)]'
                              : 'border-[#1f1f1f] bg-[#111214]/70 hover:border-[#383838] hover:bg-[#16171a]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-2 rounded-lg border ${
                              isSelected 
                                ? 'border-[#a3e635]/50 bg-[#a3e635]/15 text-[#a3e635]' 
                                : 'border-[#262626] bg-[#18191c] text-[#71717a] group-hover:text-white'
                            }`}>
                              <Layers size={14} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[12px] sm:text-[13px] font-bold ${
                                  isSelected ? 'text-white' : 'text-[#e4e4e7] group-hover:text-white'
                                }`}>
                                  {sector.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#71717a] mt-0.5 line-clamp-1">
                                {sector.description}
                              </p>
                              <div className="text-[10px] text-[#555] mt-1 font-mono flex items-center gap-2">
                                <span className="text-[#888]">{sector.activeSensors} Nodes Deployed</span>
                                {sector.maxRiskScore !== undefined && (
                                  <>
                                    <span>•</span>
                                    <span>Peak Risk: {sector.maxRiskScore}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              sector.riskLevel === 'Warning' ? 'border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b]/10' :
                              sector.riskLevel === 'Advisory' ? 'border-[#38bdf8]/40 text-[#38bdf8] bg-[#38bdf8]/10' :
                              sector.riskLevel === 'Monitor' ? 'border-[#eab308]/40 text-[#eab308] bg-[#eab308]/10' :
                              'border-[#a3e635]/40 text-[#a3e635] bg-[#a3e635]/10'
                            }`}>
                              {sector.riskLevel}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#a3e635] text-black flex items-center justify-center font-bold">
                                <Check size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer Bar */}
                <div className="border-t border-[#1f1f1f] bg-[#080809] px-3 sm:px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-[#71717a]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" />
                    <span>Perimeter: <strong className="text-white">{currentMineObj?.name.split(' ')[0]}</strong> / <strong className="text-[#a3e635]">{currentSectorObj?.shortName}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelectorOpen(false)}
                    className="text-[11px] font-mono text-[#a3e635] hover:underline cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER: Drizzle Floating Pill Navigation Container (Bigger Text/Pill)  */}
        {/* ========================================================================= */}
        <nav className="hidden lg:flex items-center rounded-full border border-[#262626] bg-[#0c0d0e]/95 px-5 sm:px-6 py-2 sm:py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-[14px] sm:text-[15px] font-medium tracking-tight text-[#a1a1aa] gap-5 sm:gap-6">
          {/* 1. Public Village Safety Board */}
          <button
            onClick={() => setActiveTab('public')}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'public' 
                ? 'text-white font-bold bg-white/10' 
                : 'hover:text-white'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-ping" />
            <span>Get Started</span>
          </button>

          {/* 2. Citizen Crack & Fissure Portal */}
          <button
            onClick={() => setActiveTab('citizen')}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'citizen' 
                ? 'text-white font-bold bg-white/10' 
                : 'hover:text-white'
            }`}
          >
            Documentation
          </button>

          {/* 3. Operator Mission Control */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                setActiveTab('operator');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'operator' || activeTab === 'gis' 
                ? 'text-white font-bold bg-white/10' 
                : 'hover:text-white'
            }`}
          >
            <span>Studio</span>
            {!isAuthenticated && <Lock size={12} className="text-[#f59e0b]" />}
          </button>

          {/* 4. Mesh Topology & Physics Benchmarks */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                setActiveTab('topology');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'topology' 
                ? 'text-white font-bold bg-white/10' 
                : 'hover:text-white'
            }`}
          >
            <span>Benchmarks</span>
            {!isAuthenticated && <Lock size={12} className="text-[#f59e0b]" />}
          </button>
        </nav>

        {/* ========================================================================= */}
        {/* 3. RIGHT CONTROLS: GitHub 35k+ Pill, Notification Bell, Moon Icon (Scaled)*/}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* GitHub 35k+ Pill Badge */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 rounded-full border border-[#262626] bg-[#0c0d0e] px-3.5 sm:px-4 py-1.5 text-[13px] sm:text-[14px] font-mono text-white/90 hover:border-[#444444] transition-colors cursor-pointer"
          >
            <Github size={15} className="text-white" />
            <span className="font-bold text-white">35k+</span>
          </a>

          {/* Notification Bell with Red Badge Dot */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                setActiveTab('operator');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            title={risk.level >= 4 ? 'Emergency Alert Active' : 'System Notifications'}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[10px] border border-[#262626] bg-[#0c0d0e] text-[#a1a1aa] hover:text-white hover:border-[#444444] transition-colors cursor-pointer"
          >
            <Bell size={17} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ef4444] animate-ping" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ef4444]" />
          </button>

          {/* Dark Mode Moon Icon */}
          <button
            onClick={toggleAudioMuted}
            title={audioMuted ? 'Unmute Audio Relay' : 'Audio Active (Dark Terminal Mode)'}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[10px] border border-[#262626] bg-[#0c0d0e] text-[#a1a1aa] hover:text-white hover:border-[#444444] transition-colors cursor-pointer"
          >
            <Moon size={17} className="text-white/90" />
          </button>

          {/* Authenticated State vs. Quick Operator Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 border border-[#262626] bg-[#0c0d0e] px-3 py-1.5 rounded-[8px] text-[12px] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#a3e635]" />
                <span className="text-white font-medium truncate max-w-[110px]">{currentUser.name.split(' ')[0]}</span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[10px] border border-[#262626] bg-[#0c0d0e] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-[10px] border border-[#262626] bg-[#0c0d0e] px-3.5 sm:px-4 py-2 text-[13px] sm:text-[14px] font-mono text-white/90 hover:border-[#444444] transition-colors cursor-pointer font-medium"
            >
              <Lock size={13} className="text-[#f59e0b]" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Pill Navigation Bar with quick selector & tabs */}
      <div className="flex lg:hidden overflow-x-auto border-t border-[#181818] bg-black px-3 py-2 gap-2 scrollbar-none items-center">
        {/* Mobile quick sector selector trigger */}
        <button
          onClick={() => setIsSelectorOpen(true)}
          className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-mono border border-[#a3e635]/40 bg-[#a3e635]/10 text-[#a3e635] flex items-center gap-1.5 shrink-0"
        >
          <MapPin size={11} />
          <span>{currentMineObj?.name.split(' ')[0]} • {currentSectorObj?.shortName || 'All'}</span>
          <ChevronDown size={10} />
        </button>

        <button
          onClick={() => setActiveTab('public')}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer shrink-0 ${
            activeTab === 'public' ? 'bg-white/15 text-white font-bold' : 'text-[#808080]'
          }`}
        >
          Get Started
        </button>
        <button
          onClick={() => setActiveTab('citizen')}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer shrink-0 ${
            activeTab === 'citizen' ? 'bg-white/15 text-white font-bold' : 'text-[#808080]'
          }`}
        >
          Documentation
        </button>
        <button
          onClick={() => {
            if (isAuthenticated) setActiveTab('operator');
            else setIsLoginModalOpen(true);
          }}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer shrink-0 ${
            activeTab === 'operator' ? 'bg-white/15 text-white font-bold' : 'text-[#808080]'
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => {
            if (isAuthenticated) setActiveTab('topology');
            else setIsLoginModalOpen(true);
          }}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer shrink-0 ${
            activeTab === 'topology' ? 'bg-white/15 text-white font-bold' : 'text-[#808080]'
          }`}
        >
          Benchmarks
        </button>
      </div>
    </header>
  );
};

