import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Server, 
  Radio, 
  HardDrive, 
  Battery, 
  Zap 
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

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Main Gateway Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Store & Forward Buffer */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-white/50">Store-and-Forward Queue</span>
            <HardDrive size={14} className={gateway.storeAndForwardBufferCount > 0 ? 'text-[#eab308]' : 'text-[#22c55e]'} />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {gateway.storeAndForwardBufferCount} <span className="text-sm font-normal text-white/50">Packets</span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-1">
              {gateway.storeAndForwardBufferCount === 0 
                ? 'Buffer fully synced with Cloud' 
                : 'Buffering sensor telemetry in flash memory'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-white/50">Last Cloud Sync</span>
            <span className="text-white/80">{gateway.lastSyncTime}</span>
          </div>
        </div>

        {/* Local Edge AI Inference */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-white/50">Local Edge AI Inference</span>
            <Zap size={14} className="text-[#818cf8]" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              0.00 <span className="text-sm font-normal text-white/50">ms latency</span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-1">
              On-board ESP32-S3 / Linux Edge AI engine
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-white/50">Calculated Risk Score</span>
            <span className="text-[#818cf8] font-bold">{risk.score} / 100</span>
          </div>
        </div>

        {/* GSM / 2G Basic Modem */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-white/50">SIM800L 2G/GSM Direct SMS</span>
            <Radio size={14} className="text-[#22c55e]" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {gateway.gsmSignalBars} / 5 <span className="text-sm font-normal text-white/50">Bars</span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-1">
              Autonomous SIM SMS (No internet needed)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-white/50">Modem Status</span>
            <span className="text-[#22c55e]">Registered to BSNL Cell</span>
          </div>
        </div>

        {/* Solar & Thermal Health */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-white/50">Solar UPS &amp; Edge CPU</span>
            <Battery size={14} className="text-[#22c55e]" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {gateway.batteryPct}% <span className="text-sm font-normal text-white/50">LiFePO4</span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-1">
              CPU: {gateway.cpuTempC}°C | RAM: {gateway.ramUsagePct}%
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-white/50">Solar Charging</span>
            <span className="text-[#22c55e] font-semibold">+4.8W 18V PV Panel</span>
          </div>
        </div>
      </div>

      {/* Simulated Captive Portal & Offline Dashboard Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Edge Local Mini-Dashboard */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-white/10 bg-[#050607]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Server size={16} className="text-[#818cf8]" />
                <h2 className="text-sm font-mono uppercase tracking-wider text-white">
                  Local Mini-Dashboard (192.168.4.1 Captive Portal)
                </h2>
              </div>
              <p className="text-xs font-mono text-white/40 mt-0.5">
                Served directly by the Gateway over Wi-Fi when village cell towers go dark
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/80">
              HTTP/1.1 200 OK
            </span>
          </div>

          <div className="p-4 rounded-lg bg-black/60 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-white/40 block">CURRENT EMERGENCY STATUS</span>
                <div className="text-xl font-serif font-bold text-white">{risk.levelName} (Stage {risk.level}/5)</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-white/40 block">LOCAL RELAY SIREN</span>
                <span className={`text-xs font-mono font-bold ${gateway.localSirenActive ? 'text-[#ef4444] animate-pulse' : 'text-white/60'}`}>
                  {gateway.localSirenActive ? 'SIREN ACTIVE (HIGH DECIBEL)' : 'STANDBY IDLE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-xs font-mono">
              <div className="p-2 rounded bg-white/5">
                <span className="text-white/40 block text-[10px]">Mesh Sensors</span>
                <span className="text-white font-semibold">{nodes.length} Nodes</span>
              </div>
              <div className="p-2 rounded bg-white/5">
                <span className="text-white/40 block text-[10px]">Peak Deflection</span>
                <span className="text-[#818cf8] font-semibold">{risk.cimfrSubsidenceDepthMm} mm</span>
              </div>
              <div className="p-2 rounded bg-white/5">
                <span className="text-white/40 block text-[10px]">Countdown</span>
                <span className="text-[#ef4444] font-semibold">{risk.timeToCriticalHours || 'STABLE'} hrs</span>
              </div>
            </div>

            <div className="p-3 rounded bg-white/5 border border-white/5 text-xs font-mono text-white/70 leading-relaxed">
              <strong>Local Edge Rule:</strong> All risk scoring, siren triggers, and emergency SMS dispatches execute on-device in under 5 milliseconds with ZERO dependence on external cloud servers, cellular data, or internet connectivity.
            </div>
          </div>
        </div>

        {/* Right: Cloud Sync & Direct SMS Simulator */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-white/10 bg-[#050607] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-white/70">
                Gateway Sync &amp; SMS Dispatch Test
              </span>
              <span className="text-xs font-mono text-white/40">HARDWARE I/O</span>
            </div>

            {/* Protocol Selector */}
            <div className="space-y-3 mb-4">
              <label className="text-xs font-mono text-white/60 block">Cloud Ingestion Protocol:</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  onClick={() => setSyncProtocol('HTTP POST (JSON)')}
                  className={`p-2.5 rounded-lg border text-center transition-colors ${
                    syncProtocol === 'HTTP POST (JSON)'
                      ? 'border-[#818cf8] bg-[#818cf8]/10 text-white font-semibold'
                      : 'border-white/5 bg-white/[0.02] text-white/50 hover:text-white'
                  }`}
                >
                  HTTP POST (JSON)
                </button>
                <button
                  onClick={() => setSyncProtocol('MQTT v5.0')}
                  className={`p-2.5 rounded-lg border text-center transition-colors ${
                    syncProtocol === 'MQTT v5.0'
                      ? 'border-[#818cf8] bg-[#818cf8]/10 text-white font-semibold'
                      : 'border-white/5 bg-white/[0.02] text-white/50 hover:text-white'
                  }`}
                >
                  MQTT v5.0 (QoS 1)
                </button>
              </div>
            </div>

            {/* Flush Buffer Button */}
            {gateway.storeAndForwardBufferCount > 0 && (
              <div className="p-3 rounded-lg border border-[#eab308]/30 bg-[#eab308]/5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#eab308] font-bold">
                    {gateway.storeAndForwardBufferCount} Backlog Packets Pending
                  </span>
                </div>
                <button
                  onClick={flushGatewayBuffer}
                  className="w-full py-2 rounded-lg text-xs font-mono font-semibold bg-[#eab308] text-black hover:bg-[#ca8a04] transition-colors"
                >
                  FLUSH &amp; AUTO-SYNC BACKLOG TO CLOUD
                </button>
              </div>
            )}

            {/* GSM SMS Test Trigger */}
            <div className="space-y-2">
              <button
                onClick={handleTestBasicSimSms}
                disabled={isSimulatingSms}
                className="w-full py-2.5 rounded-full text-xs font-mono font-semibold border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                {isSimulatingSms ? 'SENDING AT COMMAND VIA SERIAL...' : 'TEST DIRECT 2G SIM SMS DISPATCH'}
              </button>

              {simulatedSmsOutput && (
                <div className="p-3 rounded-lg bg-black border border-[#22c55e]/30 text-[11px] font-mono text-[#22c55e] break-all">
                  {simulatedSmsOutput}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4 text-[11px] font-mono text-white/40 flex justify-between">
            <span>Hardware Model: GeoSentinel-GW-Pro</span>
            <span>MAC: {gateway.mac}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
