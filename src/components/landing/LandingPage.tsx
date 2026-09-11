import React from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Lock,
  Camera,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  Compass
} from '../icons';


export const LandingPage: React.FC = () => {
  const { setIsLoginModalOpen, setActiveTab } = useGeoSentinel();

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#a3e635]/30 selection:text-white pb-24">
      {/* ========================================================================= */}
      {/* 1. DRIZZLE-STYLE HERO SECTION                                             */}
      {/* ========================================================================= */}
      <section className="relative pt-20 sm:pt-28 lg:pt-32 pb-24 sm:pb-32 text-center px-4 max-w-4xl mx-auto space-y-8">
        {/* Lime Accent Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#0c0d0e] px-4 py-1.5 text-[12px] font-mono font-medium text-[#a3e635]">
          <span className="font-bold">///</span>
          <span>SIH 2026 · PROBLEM STATEMENT 25</span>
          <span className="text-[#555555]">|</span>
          <span className="text-white/80">MINISTRY OF COAL</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
          Wireless Surface Mesh for<br />
          <span className="text-[#a3e635]">Real-Time Mine Subsidence</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-[#a1a1aa] text-sm sm:text-lg max-w-3xl mx-auto font-medium leading-relaxed">
          Autonomous geological early warning powered by low-cost LoRa surface mesh nodes and edge AI. Zero internet required for instant acoustic sirens and direct SIM SMS dispatches.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-6">
          <button
            onClick={() => setActiveTab('public')}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-black hover:bg-white/90 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Village Safety Board</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={() => setActiveTab('citizen')}
            className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#0c0d0e] px-5 py-3 text-[14px] font-medium text-white hover:border-[#444444] transition-colors cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera size={15} className="text-[#a3e635]" />
            <span>Report Fissure</span>
          </button>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#0c0d0e] px-5 py-3 text-[14px] font-mono text-[#a1a1aa] hover:text-white hover:border-[#444444] transition-colors cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Lock size={13} className="text-[#f59e0b]" />
            <span>Operator Studio</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PARTNER / DEPLOYMENT STRIP                                             */}
      {/* ========================================================================= */}
      <section className="border-y border-[#1a1c20] bg-[#050607]/50 py-10 w-screen relative left-1/2 right-1/2 -mx-[50vw] overflow-hidden">
        <p className="text-center text-[10px] sm:text-[11px] font-mono font-semibold text-[#808080] tracking-[0.2em] uppercase mb-8">
          Powering early warning analytics for national agencies
        </p>
        
        {/* Marquee Container */}
        <div className="relative w-full flex overflow-hidden">
          {/* Inner scrolling track (double width to allow seamless loop) */}
          <div className="flex w-max animate-marquee opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            
            {/* Group 1 (Original) */}
            <div className="flex shrink-0 items-center gap-16 px-8">
              <div className="flex items-center gap-2">
                <span className="text-xl font-serif font-bold text-white tracking-tight whitespace-nowrap">Ministry of Coal</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-white" />
                <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">DGMS</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-white" />
                <span className="text-xl font-extrabold text-white tracking-tighter whitespace-nowrap">NDRF</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-white" />
                <span className="text-xl font-bold font-mono text-white tracking-tight whitespace-nowrap">CIMFR</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-white" />
                <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">CMPDI</span>
              </div>
            </div>

            {/* Group 2 (Duplicate for seamless loop) */}
            <div className="flex shrink-0 items-center gap-16 px-8">
              <div className="flex items-center gap-2">
                <span className="text-xl font-serif font-bold text-white tracking-tight whitespace-nowrap">Ministry of Coal</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-white" />
                <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">DGMS</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-white" />
                <span className="text-xl font-extrabold text-white tracking-tighter whitespace-nowrap">NDRF</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-white" />
                <span className="text-xl font-bold font-mono text-white tracking-tight whitespace-nowrap">CIMFR</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-white" />
                <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">CMPDI</span>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* ========================================================================= */}
      {/* 3. PERFORMANCE & BENCHMARKS SECTION                                       */}
      {/* ========================================================================= */}
      <section className="max-w-[1060px] mx-auto px-4 pt-16 pb-24">
        {/* Section Headline */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Performance
          </h2>
          <p className="text-[#a1a1aa] text-sm sm:text-base mt-1.5 font-medium">
            GeoSentinel doesn't slow you down
          </p>
        </div>

        {/* Main Benchmark Comparison Card (Exact Drizzle Grid Layout) */}
        <div className="rounded-[16px] border border-[#222222] bg-[#08090a] p-5 sm:p-7 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* =================================================================== */}
            {/* LEFT COLUMN: GeoSentinel (Drizzle Style)                            */}
            {/* =================================================================== */}
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#0f1115] px-3.5 py-2 text-left">
                  <span className="text-[#a3e635] font-black text-sm tracking-[-0.1em] font-mono">///</span>
                  <div>
                    <div className="text-[13px] font-bold text-white font-mono leading-none">GeoSentinel</div>
                    <div className="text-[10px] font-mono text-[#808080] mt-0.5">v1.0.0-edge.ai</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#0f1115] px-3 py-1 text-[11px] font-mono text-[#a1a1aa]">
                  <span className="w-2 h-2 rounded-full bg-[#a3e635]" />
                  <span>ESP32 / LoRa 868</span>
                </div>
              </div>

              {/* Chart 1: Latency (Flat ultra-fast cyan line) */}
              <div className="rounded-xl border border-[#1f2228] bg-[#050607] p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[12px] font-mono text-[#a1a1aa]">
                  <span>avg latency: <strong className="text-white">3.7ms</strong></span>
                </div>

                {/* SVG Latency Chart */}
                <div className="h-16 w-full relative flex items-end">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 60">
                    {/* Grid Guidelines */}
                    <line x1="0" y1="15" x2="300" y2="15" stroke="#1f2228" strokeDasharray="3 3" />
                    <line x1="0" y1="35" x2="300" y2="35" stroke="#1f2228" strokeDasharray="3 3" />
                    <line x1="0" y1="52" x2="300" y2="52" stroke="#1f2228" strokeDasharray="3 3" />

                    {/* Flat Fast Cyan Telemetry Line */}
                    <path
                      d="M 0,52 Q 75,51.8 150,52 T 290,52 L 298,52"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {/* Endpoint Dot */}
                    <circle cx="298" cy="52" r="3" fill="#000000" stroke="#38bdf8" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Chart 2: Requests / Packets per sec (Dense purple vertical bars) */}
              <div className="rounded-xl border border-[#1f2228] bg-[#050607] p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[12px] font-mono text-[#a1a1aa]">
                  <span>avg: <strong className="text-white">6.8k req/sec</strong></span>
                  <span className="text-[#808080]">2.33M</span>
                </div>

                {/* Vertical Purple Bar Spectrum */}
                <div className="h-16 w-full flex items-end justify-between gap-[2px] pt-1">
                  {Array.from({ length: 58 }).map((_, i) => {
                    const height = 75 + Math.sin(i * 0.3) * 12 + (i % 3) * 4;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-[#818cf8] rounded-[0.5px] opacity-90 hover:opacity-100 transition-opacity"
                        style={{ height: `${Math.min(96, Math.max(25, height))}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Chart 3: CPU Load / Solar Power (Steady smooth blue line) */}
              <div className="rounded-xl border border-[#1f2228] bg-[#050607] p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[12px] font-mono text-[#a1a1aa]">
                  <span>avg CPU load: <strong className="text-white">74.8%</strong></span>
                </div>

                {/* SVG CPU Load Line */}
                <div className="h-16 w-full relative">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 60">
                    <defs>
                      <linearGradient id="blueGradLeft" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid line */}
                    <line x1="0" y1="12" x2="300" y2="12" stroke="#1f2228" strokeDasharray="3 3" />

                    {/* Area Fill */}
                    <path
                      d="M 0,16 L 285,16 L 298,48 L 298,60 L 0,60 Z"
                      fill="url(#blueGradLeft)"
                    />
                    {/* Top Stroke */}
                    <path
                      d="M 0,16 L 285,16 L 298,48"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2"
                    />
                    <circle cx="298" cy="48" r="3" fill="#000000" stroke="#38bdf8" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* RIGHT COLUMN: Traditional Survey / Prisma (Comparison Style)       */}
            {/* =================================================================== */}
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#0f1115] px-3.5 py-2 text-left">
                  {/* Triangle Prisma-style Icon */}
                  <span className="text-white font-bold text-sm">▲</span>
                  <div>
                    <div className="text-[13px] font-bold text-white font-mono leading-none">Traditional Survey</div>
                    <div className="text-[10px] font-mono text-[#808080] mt-0.5">Cloud / Satellite Periodic</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#0f1115] px-3 py-1 text-[11px] font-mono text-[#a1a1aa]">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    <span>Cellular / Manual</span>
                  </div>
                  <span className="rounded-[4px] border border-[#262626] bg-[#0f1115] px-2 py-1 text-[11px] font-mono text-[#808080]">
                    Queries
                  </span>
                </div>
              </div>

              {/* Chart 1: Latency (Mountainous High Fluctuating Latency Wave) */}
              <div className="rounded-xl border border-[#1f2228] bg-[#050607] p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[12px] font-mono text-[#a1a1aa]">
                  <span>avg latency: <strong className="text-white">588ms</strong></span>
                </div>

                {/* SVG Mountainous Wave */}
                <div className="h-16 w-full relative">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 60">
                    <defs>
                      <linearGradient id="darkMountainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="15" x2="300" y2="15" stroke="#1f2228" strokeDasharray="3 3" />
                    <line x1="0" y1="35" x2="300" y2="35" stroke="#1f2228" strokeDasharray="3 3" />

                    {/* Mountain Area Fill */}
                    <path
                      d="M 0,38 Q 30,28 60,32 T 120,24 T 180,20 T 240,16 T 295,22 L 298,28 L 298,60 L 0,60 Z"
                      fill="url(#darkMountainGrad)"
                    />
                    {/* Top Green Accent Line */}
                    <path
                      d="M 0,38 Q 30,28 60,32 T 120,24 T 180,20 T 240,16 T 295,22 L 298,28"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                    />
                    <circle cx="298" cy="22" r="2.5" fill="#000000" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx="298" cy="28" r="2.5" fill="#000000" stroke="#38bdf8" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              {/* Chart 2: Throughput (Sparse Short Bars) */}
              <div className="rounded-xl border border-[#1f2228] bg-[#050607] p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[12px] font-mono text-[#a1a1aa]">
                  <span>avg: <strong className="text-white">2.0k req/sec</strong></span>
                  <span className="text-[#808080]">677.9k</span>
                </div>

                {/* Vertical Sparse Bars */}
                <div className="h-16 w-full flex items-end justify-between gap-[2px] pt-1">
                  {Array.from({ length: 58 }).map((_, i) => {
                    const height = 18 + Math.sin(i * 0.4) * 5 + (i === 56 ? 12 : 0);
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-[#4f46e5] rounded-[0.5px] opacity-75"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Chart 3: CPU Load / Network Latency */}
              <div className="rounded-xl border border-[#1f2228] bg-[#050607] p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[12px] font-mono text-[#a1a1aa]">
                  <span>avg CPU load: <strong className="text-white">87.8%</strong></span>
                </div>

                {/* Rippling Blue Wave */}
                <div className="h-16 w-full relative">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 60">
                    <defs>
                      <linearGradient id="blueGradRight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="12" x2="300" y2="12" stroke="#1f2228" strokeDasharray="3 3" />

                    <path
                      d="M 0,22 Q 40,18 80,24 T 160,20 T 240,18 T 295,20 L 298,18 L 298,60 L 0,60 Z"
                      fill="url(#blueGradRight)"
                    />
                    <path
                      d="M 0,22 Q 40,18 80,24 T 160,20 T 240,18 T 295,20 L 298,18"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    <circle cx="298" cy="18" r="3" fill="#000000" stroke="#38bdf8" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Go to Benchmark Results Button */}
        <div className="mt-7 flex justify-center">
          <button
            onClick={() => setActiveTab('operator')}
            className="inline-flex items-center gap-2.5 rounded-[8px] bg-[#f3f4f6] hover:bg-white px-5 py-2.5 text-[14px] font-semibold text-black transition-all duration-150 cursor-pointer shadow-sm hover:shadow hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Go to benchmark results</span>
            <span className="text-[16px] leading-none font-normal">→</span>
          </button>
        </div>
      </section>
    </div>
  );
};
