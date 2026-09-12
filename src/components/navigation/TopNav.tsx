import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Bell, 
  Moon, 
  Github, 
  LogOut,
  Lock,
  ChevronDown,
  Activity,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Sparkles
} from '../icons';

export const TopNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    villageSubTab,
    setVillageSubTab,
    risk,
    audioMuted,
    toggleAudioMuted,
    isAuthenticated,
    currentUser,
    setIsLoginModalOpen,
    logout,
  } = useGeoSentinel();

  const [isVillageDropdownOpen, setIsVillageDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#181818] bg-[#000000]/95 backdrop-blur-md">
      <div className="w-full flex h-16 sm:h-20 items-center justify-between px-3 sm:px-6 md:px-8 relative">
        {/* ========================================================================= */}
        {/* 1. LEFT: BRAND LOGO                                                       */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 sm:gap-5">
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
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER: Navigation Pills & Village Board Dropdown                      */}
        {/* ========================================================================= */}
        <nav className="hidden lg:flex items-center rounded-full border border-[#262626] bg-[#0c0d0e]/95 px-5 sm:px-6 py-2 sm:py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-[14px] sm:text-[15px] font-medium tracking-tight text-[#a1a1aa] gap-5 sm:gap-6">
          
          {/* 1. Public Village Safety Board Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (activeTab !== 'public') {
                  setActiveTab('public');
                }
                setIsVillageDropdownOpen(!isVillageDropdownOpen);
              }}
              onMouseEnter={() => setIsVillageDropdownOpen(true)}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'public' 
                  ? 'text-white font-bold bg-white/10 shadow-sm' 
                  : 'hover:text-white'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-ping" />
              <span>Village Board</span>
              <ChevronDown size={13} className={`text-[#808080] transition-transform duration-200 ${isVillageDropdownOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* Dropdown Menu - Sleek Pitch Black Horizontal Menu */}
            {isVillageDropdownOpen && (
              <div 
                onMouseLeave={() => setIsVillageDropdownOpen(false)}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[800px] max-w-[92vw] rounded-2xl border border-[#262626] bg-[#000000] p-3 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_1px_1px_rgba(255,255,255,0.08)] z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="grid grid-cols-5 gap-2">
                  {/* Option 1: Live Emergency Status */}
                  <button
                    onClick={() => {
                      setActiveTab('public');
                      setVillageSubTab('status');
                      setIsVillageDropdownOpen(false);
                    }}
                    className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      activeTab === 'public' && villageSubTab === 'status' 
                        ? 'bg-[#141414] border-[#444444] text-white shadow-sm' 
                        : 'bg-[#080808] border-[#1c1c1c] hover:bg-[#121212] hover:border-[#333333] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#111111] border border-[#262626] text-[#a3e635] mb-2 group-hover:scale-105 transition-transform">
                      <Activity size={15} />
                    </div>
                    <div className="text-[13px] font-bold text-white group-hover:text-[#a3e635] transition-colors leading-tight">
                      Live Status
                    </div>
                    <span className="text-[11px] text-[#71717a] mt-1 leading-snug">
                      Evacuation &amp; sirens
                    </span>
                  </button>

                  {/* Option 2: Report Ground Fissure */}
                  <button
                    onClick={() => {
                      setActiveTab('public');
                      setVillageSubTab('report');
                      setIsVillageDropdownOpen(false);
                    }}
                    className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      activeTab === 'public' && villageSubTab === 'report' 
                        ? 'bg-[#141414] border-[#444444] text-white shadow-sm' 
                        : 'bg-[#080808] border-[#1c1c1c] hover:bg-[#121212] hover:border-[#333333] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#111111] border border-[#262626] text-[#38bdf8] mb-2 group-hover:scale-105 transition-transform">
                      <Camera size={15} />
                    </div>
                    <div className="text-[13px] font-bold text-white group-hover:text-[#38bdf8] transition-colors leading-tight">
                      Report Crack
                    </div>
                    <span className="text-[11px] text-[#71717a] mt-1 leading-snug">
                      Photo &amp; crack width
                    </span>
                  </button>

                  {/* Option 3: Assembly Shelters */}
                  <button
                    onClick={() => {
                      setActiveTab('public');
                      setVillageSubTab('shelters');
                      setIsVillageDropdownOpen(false);
                    }}
                    className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      activeTab === 'public' && villageSubTab === 'shelters' 
                        ? 'bg-[#141414] border-[#444444] text-white shadow-sm' 
                        : 'bg-[#080808] border-[#1c1c1c] hover:bg-[#121212] hover:border-[#333333] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#111111] border border-[#262626] text-[#22c55e] mb-2 group-hover:scale-105 transition-transform">
                      <ShieldCheck size={15} />
                    </div>
                    <div className="text-[13px] font-bold text-white group-hover:text-[#22c55e] transition-colors leading-tight">
                      Shelters
                    </div>
                    <span className="text-[11px] text-[#71717a] mt-1 leading-snug">
                      Roster &amp; safe zones
                    </span>
                  </button>

                  {/* Option 4: Action Checklist */}
                  <button
                    onClick={() => {
                      setActiveTab('public');
                      setVillageSubTab('checklist');
                      setIsVillageDropdownOpen(false);
                    }}
                    className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      activeTab === 'public' && villageSubTab === 'checklist' 
                        ? 'bg-[#141414] border-[#444444] text-white shadow-sm' 
                        : 'bg-[#080808] border-[#1c1c1c] hover:bg-[#121212] hover:border-[#333333] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#111111] border border-[#262626] text-[#f59e0b] mb-2 group-hover:scale-105 transition-transform">
                      <ShieldAlert size={15} />
                    </div>
                    <div className="text-[13px] font-bold text-white group-hover:text-[#f59e0b] transition-colors leading-tight">
                      Checklist
                    </div>
                    <span className="text-[11px] text-[#71717a] mt-1 leading-snug">
                      112 &amp; Panchayat SOS
                    </span>
                  </button>

                  {/* Option 5: Village Safety Guide */}
                  <button
                    onClick={() => {
                      setActiveTab('public');
                      setVillageSubTab('docs');
                      setIsVillageDropdownOpen(false);
                    }}
                    className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      activeTab === 'public' && villageSubTab === 'docs' 
                        ? 'bg-[#141414] border-[#444444] text-white shadow-sm' 
                        : 'bg-[#080808] border-[#1c1c1c] hover:bg-[#121212] hover:border-[#333333] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#111111] border border-[#262626] text-[#a78bfa] mb-2 group-hover:scale-105 transition-transform">
                      <Sparkles size={15} />
                    </div>
                    <div className="text-[13px] font-bold text-white group-hover:text-[#a78bfa] transition-colors leading-tight">
                      Safety Guide
                    </div>
                    <span className="text-[11px] text-[#71717a] mt-1 leading-snug">
                      Disaster SOP &amp; Wi-Fi
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Documentation */}
          <button
            onClick={() => setActiveTab('citizen')}
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'citizen' 
                ? 'text-white font-bold bg-white/10' 
                : 'hover:text-white'
            }`}
          >
            <span>Documentation</span>
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
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
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
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
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
        {/* 3. RIGHT CONTROLS: GitHub Badge, Alerts Bell, Moon, Login/Logout          */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* GitHub 35k+ Pill Badge */}
          <a
            href="https://github.com/yashsinghal1234/Geosentinel"
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

      {/* Mobile Sub-Pill Navigation Bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-[#181818] bg-black px-3 py-2 gap-2 scrollbar-none items-center">
        <button
          onClick={() => {
            setActiveTab('public');
            setVillageSubTab('status');
          }}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer shrink-0 ${
            activeTab === 'public' && villageSubTab === 'status' ? 'bg-white/15 text-white font-bold' : 'text-[#808080]'
          }`}
        >
          Village Safety
        </button>
        <button
          onClick={() => {
            setActiveTab('public');
            setVillageSubTab('report');
          }}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer shrink-0 ${
            activeTab === 'public' && villageSubTab === 'report' ? 'bg-white/15 text-white font-bold' : 'text-[#808080]'
          }`}
        >
          Report Cracks
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
