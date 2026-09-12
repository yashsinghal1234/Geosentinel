import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Server, 
  Radio, 
  HardDrive, 
  Battery, 
  Zap,
  ShieldCheck
} from '../icons';

export const GatewayEdgeView: React.FC = () => {
  const { 
    gateway, 
    risk, 
    nodes, 
    flushGatewayBuffer 
  } = useGeoSentinel();

  const [syncProtocol, setSyncProtocol] = useState<'HTTP POST (JSON)' | 'MQTT v5.0'>('HTTP POST (JSON)');
  const [isSimulatingSms, setIsSimulatingSms] = useState<boolean>(false);
  const [simulatedSmsOutput, setSimulatedSmsOutput] = useState<string | null>(null);

  const handleTestBasicSimSms = () => {
    setIsSimulatingSms(true);
    setSimulatedSmsOutput(null);
    setTimeout(() => {
      setIsSimulatingSms(false);
      setSimulatedSmsOutput(`[AT+CMGS="+919431188421"] MSG: "GEOSENTINEL EVAC ALERT: Jharia Sector 4 slope shear detected. Evacuate to Community Shelter AP-01 immediately. Reply 1 if safe." STATUS: OK (GSM TOWER 4 BARS)`);
    }, 1200);
  };

  const getStatusColor = (level: number) => {
    if (level >= 4) return 'text-[#ef4444]';
    if (level === 3) return 'text-[#f59e0b]';
    if (level === 2) return 'text-[#38bdf8]';
    return 'text-[#22c55e]';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Main Gateway Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Store & Forward Buffer */}
        <div className="p-4.5 rounded-2xl border border-[#1e232d] bg-[#080a0d] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#828894]">Store-and-Forward Queue</span>
            <div className={`p-1.5 rounded-lg ${gateway.storeAndForwardBufferCount > 0 ? 'bg-[#eab308]/10 text-[#eab308]' : 'bg-[#22c55e]/10 text-[#22c55e]'}`}>
              <HardDrive size={14} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {gateway.storeAndForwardBufferCount} <span className="text-sm font-normal text-[#717682]">Packets</span>
            </div>
            <p className="text-xs text-[#828894] mt-1 font-normal">
              {gateway.storeAndForwardBufferCount === 0 
                ? 'Buffer fully synchronized with Cloud database' 
                : 'Buffering telemetry in NVRAM flash memory'}
            </p>
          </div>
          <div className="mt-3.5 pt-2.5 border-t border-[#161920] flex items-center justify-between text-xs font-mono">
            <span className="text-[#717682]">Last Cloud Sync</span>
            <span className="text-[#cbd5e1]">{gateway.lastSyncTime}</span>
          </div>
        </div>

        {/* Local Edge AI Inference */}
        <div className="p-4.5 rounded-2xl border border-[#1e232d] bg-[#080a0d] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#828894]">Local Edge AI Inference</span>
            <div className="p-1.5 rounded-lg bg-[#818cf8]/10 text-[#818cf8]">
              <Zap size={14} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              0.00 <span className="text-sm font-normal text-[#717682]">ms latency</span>
            </div>
            <p className="text-xs text-[#828894] mt-1 font-normal">
              On-board ESP32-S3 / Linux embedded runtime
            </p>
          </div>
          <div className="mt-3.5 pt-2.5 border-t border-[#161920] flex items-center justify-between text-xs">
            <span className="text-[#717682]">Calculated Risk Score</span>
            <span className="text-[#818cf8] font-bold font-mono">{risk.score} / 100</span>
          </div>
        </div>

        {/* GSM / 2G Modem */}
        <div className="p-4.5 rounded-2xl border border-[#1e232d] bg-[#080a0d] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#828894]">SIM800L 2G/GSM Direct SMS</span>
            <div className="p-1.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e]">
              <Radio size={14} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {gateway.gsmSignalBars} / 5 <span className="text-sm font-normal text-[#717682]">Bars</span>
            </div>
            <p className="text-xs text-[#828894] mt-1 font-normal">
              Autonomous SIM dispatch (Zero internet needed)
            </p>
          </div>
          <div className="mt-3.5 pt-2.5 border-t border-[#161920] flex items-center justify-between text-xs font-mono">
            <span className="text-[#717682]">Modem Status</span>
            <span className="text-[#22c55e] font-medium">Registered (BSNL Cell)</span>
          </div>
        </div>

        {/* Solar & Thermal Health */}
        <div className="p-4.5 rounded-2xl border border-[#1e232d] bg-[#080a0d] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#828894]">Solar UPS &amp; Edge CPU</span>
            <div className="p-1.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e]">
              <Battery size={14} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {gateway.batteryPct}% <span className="text-sm font-normal text-[#717682]">LiFePO4</span>
            </div>
            <p className="text-xs text-[#828894] mt-1 font-mono">
              CPU: {gateway.cpuTempC}°C • RAM: {gateway.ramUsagePct}%
            </p>
          </div>
          <div className="mt-3.5 pt-2.5 border-t border-[#161920] flex items-center justify-between text-xs font-mono">
            <span className="text-[#717682]">Solar Ingress</span>
            <span className="text-[#22c55e] font-medium">+4.8W 18V PV</span>
          </div>
        </div>
      </div>

      {/* Simulated Captive Portal & Offline Dashboard Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Edge Local Mini-Dashboard */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-[#1e232d] bg-[#080a0d] shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-[#161920]">
            <div>
              <div className="flex items-center gap-2">
                <Server size={17} className="text-[#818cf8]" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Local Mini-Dashboard (192.168.4.1 Captive Portal)
                </h2>
              </div>
              <p className="text-xs text-[#828894] mt-0.5">
                Served directly by the Gateway over Wi-Fi when village cell towers go dark
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30">
              HTTP/1.1 200 OK
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#040507] border border-[#191d24] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#717682] block">
                  Current Emergency Status
                </span>
                <div className={`text-2xl font-bold tracking-tight mt-0.5 ${getStatusColor(risk.level)}`}>
                  {risk.levelName} <span className="text-xs font-mono text-[#717682] font-normal">(Stage {risk.level}/5)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#717682] block">
                  Local Relay Siren
                </span>
                <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  gateway.localSirenActive 
                    ? 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/40 animate-pulse' 
                    : 'bg-[#181d26] text-[#828894] border border-[#232936]'
                }`}>
                  {gateway.localSirenActive ? 'SIREN ACTIVE (110 dB)' : 'STANDBY IDLE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#161920]">
              <div className="p-3 rounded-lg bg-[#0a0c10] border border-[#161920]">
                <span className="text-[#717682] block text-[10px] uppercase font-semibold">Mesh Sensors</span>
                <span className="text-white font-bold font-mono text-sm mt-0.5 block">{nodes.length} Nodes</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0c10] border border-[#161920]">
                <span className="text-[#717682] block text-[10px] uppercase font-semibold">Peak Deflection</span>
                <span className="text-[#818cf8] font-bold font-mono text-sm mt-0.5 block">{risk.cimfrSubsidenceDepthMm} mm</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0c10] border border-[#161920]">
                <span className="text-[#717682] block text-[10px] uppercase font-semibold">Time To Critical</span>
                <span className="text-[#ef4444] font-bold font-mono text-sm mt-0.5 block">{risk.timeToCriticalHours || 'STABLE'} hrs</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#1a1f29] flex items-start gap-3">
              <ShieldCheck size={18} className="text-[#a3e635] shrink-0 mt-0.5" />
              <div className="text-xs text-[#cbd5e1] leading-relaxed">
                <strong className="text-white font-semibold">Local Edge Guarantee:</strong> All risk scoring, siren triggers, and emergency SMS dispatches execute on-device in under 5 milliseconds with zero dependence on external cloud servers, cellular data, or internet connectivity.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Cloud Sync & Direct SMS Simulator */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-[#1e232d] bg-[#080a0d] flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-[#161920]">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Gateway Sync &amp; SMS Dispatch Test
              </span>
              <span className="text-[10px] font-mono text-[#717682] bg-[#14171e] px-2 py-0.5 rounded border border-[#222733]">
                HARDWARE I/O
              </span>
            </div>

            {/* Protocol Selector */}
            <div className="space-y-2.5 mb-5">
              <label className="text-xs font-medium text-[#828894] block">Cloud Ingestion Protocol</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setSyncProtocol('HTTP POST (JSON)')}
                  className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                    syncProtocol === 'HTTP POST (JSON)'
                      ? 'border-[#818cf8] bg-[#818cf8]/15 text-white font-semibold shadow-sm'
                      : 'border-[#222733] bg-[#0d1016] text-[#828894] hover:text-white hover:bg-[#131720]'
                  }`}
                >
                  HTTP POST (JSON)
                </button>
                <button
                  onClick={() => setSyncProtocol('MQTT v5.0')}
                  className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                    syncProtocol === 'MQTT v5.0'
                      ? 'border-[#818cf8] bg-[#818cf8]/15 text-white font-semibold shadow-sm'
                      : 'border-[#222733] bg-[#0d1016] text-[#828894] hover:text-white hover:bg-[#131720]'
                  }`}
                >
                  MQTT v5.0 (QoS 1)
                </button>
              </div>
            </div>

            {/* Flush Buffer Button */}
            {gateway.storeAndForwardBufferCount > 0 && (
              <div className="p-3.5 rounded-xl border border-[#eab308]/30 bg-[#eab308]/5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#eab308]">
                    {gateway.storeAndForwardBufferCount} Backlog Packets Pending
                  </span>
                </div>
                <button
                  onClick={flushGatewayBuffer}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#eab308] text-black hover:bg-[#ca8a04] transition-colors cursor-pointer"
                >
                  Flush &amp; Sync Backlog to Cloud
                </button>
              </div>
            )}

            {/* GSM SMS Test Trigger */}
            <div className="space-y-2.5">
              <button
                onClick={handleTestBasicSimSms}
                disabled={isSimulatingSms}
                className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#2d3444] bg-[#12161f] hover:bg-[#1b202c] hover:border-[#818cf8]/50 text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSimulatingSms ? 'Sending AT Command via Serial...' : 'Test Direct 2G SIM SMS Dispatch'}
              </button>

              {simulatedSmsOutput && (
                <div className="p-3 rounded-xl bg-[#040507] border border-[#22c55e]/30 text-[11px] font-mono text-[#22c55e] break-all leading-relaxed animate-in fade-in duration-200">
                  {simulatedSmsOutput}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#161920] mt-5 text-[11px] font-mono text-[#717682] flex justify-between">
            <span>Hardware: GeoSentinel-GW-Pro</span>
            <span>MAC: {gateway.mac}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
