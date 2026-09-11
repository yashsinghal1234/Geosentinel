import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Key, 
  Lock, 
  Sliders, 
  Check, 
  Users 
} from '../icons';

export const AdminSettingsView: React.FC = () => {
  const { 
    nodes, 
    gateway, 
    assemblyPoints, 
    updateNodeThresholds 
  } = useGeoSentinel();

  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || 'SN-01');
  const [apiKey, setApiKey] = useState<string>('geo_live_9f88c3a1b49e8271034f59d');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [gatewaySsid, setGatewaySsid] = useState<string>(gateway.wifiHotspotSsid);
  const [gatewayPassword, setGatewayPassword] = useState<string>('JhariaSafety#2026');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const [tiltWarning, setTiltWarning] = useState<number>(activeNode.thresholds.tiltWarningDeg);
  const [tiltCritical, setTiltCritical] = useState<number>(activeNode.thresholds.tiltCriticalDeg);
  const [crackWarning, setCrackWarning] = useState<number>(activeNode.thresholds.crackWarningMm);
  const [crackCritical, setCrackCritical] = useState<number>(activeNode.thresholds.crackCriticalMm);
  const [vibrationWarning, setVibrationWarning] = useState<number>(activeNode.thresholds.vibrationWarningMmS);
  const [vibrationCritical, setVibrationCritical] = useState<number>(activeNode.thresholds.vibrationCriticalMmS);
  const [gasWarning, setGasWarning] = useState<number>(activeNode.thresholds.gasWarningPpm);
  const [gasCritical, setGasCritical] = useState<number>(activeNode.thresholds.gasCriticalPpm);

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const n = nodes.find(item => item.id === nodeId);
    if (n) {
      setTiltWarning(n.thresholds.tiltWarningDeg);
      setTiltCritical(n.thresholds.tiltCriticalDeg);
      setCrackWarning(n.thresholds.crackWarningMm);
      setCrackCritical(n.thresholds.crackCriticalMm);
      setVibrationWarning(n.thresholds.vibrationWarningMmS);
      setVibrationCritical(n.thresholds.vibrationCriticalMmS);
      setGasWarning(n.thresholds.gasWarningPpm);
      setGasCritical(n.thresholds.gasCriticalPpm);
    }
  };

  const handleSaveThresholds = () => {
    updateNodeThresholds(selectedNodeId, {
      tiltWarningDeg: tiltWarning,
      tiltCriticalDeg: tiltCritical,
      crackWarningMm: crackWarning,
      crackCriticalMm: crackCritical,
      vibrationWarningMmS: vibrationWarning,
      vibrationCriticalMmS: vibrationCritical,
      gasWarningPpm: gasWarning,
      gasCriticalPpm: gasCritical,
    });
    setSaveSuccessMessage(`Thresholds for node ${selectedNodeId} calibrated successfully.`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleGenerateNewApiKey = () => {
    const chars = 'abcdef0123456789';
    let newKey = 'geo_live_';
    for (let i = 0; i < 24; i++) {
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(newKey);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-xl border border-white/10 bg-[#050607]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-white/15 bg-white/5 text-[#818cf8]">
              <Lock size={12} />
              SYSTEM ADMINISTRATION &amp; SECURITY PROTOCOLS
            </span>
            <span className="text-xs font-mono text-white/40">ROLE: SYSTEM ADMIN (L4)</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-white tracking-tight">
            Security Layer &amp; Threshold Governance
          </h1>
        </div>

        {saveSuccessMessage && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-medium border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]">
            <Check size={14} />
            {saveSuccessMessage}
          </div>
        )}
      </div>

      {/* Main Grid: Threshold Calibration & Security/Escalation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sensor Threshold Calibration */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-white/10 bg-[#050607] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#818cf8]" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-white">
                Per-Node Dynamic Threshold Calibration
              </h2>
            </div>
            <select
              value={selectedNodeId}
              onChange={(e) => handleSelectNode(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-white/15 bg-black text-xs font-mono text-white focus:outline-none focus:border-[#818cf8]"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.id} - {n.name}</option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-mono">
            <span className="text-white/40 block text-[10px]">SELECTED SENSOR</span>
            <div className="text-white font-semibold text-sm">{activeNode.name} ({activeNode.code})</div>
            <div className="text-white/60">{activeNode.zone} | Elevation: {activeNode.elevationMeters}m</div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tilt Slope Thresholds */}
            <div className="p-3.5 rounded-lg border border-white/5 bg-white/[0.02] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/70">Tilt Warning Threshold:</span>
                <span className="text-[#eab308] font-bold">{tiltWarning}°</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="8.0" 
                step="0.1" 
                value={tiltWarning} 
                onChange={(e) => setTiltWarning(parseFloat(e.target.value))}
                className="w-full accent-[#eab308] cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono pt-1">
                <span className="text-white/70">Tilt Critical Threshold:</span>
                <span className="text-[#ef4444] font-bold">{tiltCritical}°</span>
              </div>
              <input 
                type="range" 
                min="2.0" 
                max="12.0" 
                step="0.1" 
                value={tiltCritical} 
                onChange={(e) => setTiltCritical(parseFloat(e.target.value))}
                className="w-full accent-[#ef4444] cursor-pointer"
              />
            </div>

            {/* Crack Width Thresholds */}
            <div className="p-3.5 rounded-lg border border-white/5 bg-white/[0.02] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/70">Crack Warning (mm):</span>
                <span className="text-[#eab308] font-bold">{crackWarning} mm</span>
              </div>
              <input 
                type="range" 
                min="2.0" 
                max="15.0" 
                step="0.5" 
                value={crackWarning} 
                onChange={(e) => setCrackWarning(parseFloat(e.target.value))}
                className="w-full accent-[#eab308] cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono pt-1">
                <span className="text-white/70">Crack Critical (mm):</span>
                <span className="text-[#ef4444] font-bold">{crackCritical} mm</span>
              </div>
              <input 
                type="range" 
                min="5.0" 
                max="30.0" 
                step="0.5" 
                value={crackCritical} 
                onChange={(e) => setCrackCritical(parseFloat(e.target.value))}
                className="w-full accent-[#ef4444] cursor-pointer"
              />
            </div>

            {/* Vibration PPV Thresholds */}
            <div className="p-3.5 rounded-lg border border-white/5 bg-white/[0.02] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/70">PPV Vibration Warning:</span>
                <span className="text-[#eab308] font-bold">{vibrationWarning} mm/s</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="15.0" 
                step="0.5" 
                value={vibrationWarning} 
                onChange={(e) => setVibrationWarning(parseFloat(e.target.value))}
                className="w-full accent-[#eab308] cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono pt-1">
                <span className="text-white/70">PPV Vibration Critical:</span>
                <span className="text-[#ef4444] font-bold">{vibrationCritical} mm/s</span>
              </div>
              <input 
                type="range" 
                min="3.0" 
                max="25.0" 
                step="0.5" 
                value={vibrationCritical} 
                onChange={(e) => setVibrationCritical(parseFloat(e.target.value))}
                className="w-full accent-[#ef4444] cursor-pointer"
              />
            </div>

            {/* Gas PPM Thresholds */}
            <div className="p-3.5 rounded-lg border border-white/5 bg-white/[0.02] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/70">Gas Warning (PPM):</span>
                <span className="text-[#eab308] font-bold">{gasWarning} PPM</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="5" 
                value={gasWarning} 
                onChange={(e) => setGasWarning(parseInt(e.target.value))}
                className="w-full accent-[#eab308] cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono pt-1">
                <span className="text-white/70">Gas Critical (PPM):</span>
                <span className="text-[#ef4444] font-bold">{gasCritical} PPM</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="250" 
                step="5" 
                value={gasCritical} 
                onChange={(e) => setGasCritical(parseInt(e.target.value))}
                className="w-full accent-[#ef4444] cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleSaveThresholds}
            className="w-full py-2.5 rounded-full text-xs font-mono font-semibold bg-white text-black hover:bg-white/90 transition-colors"
          >
            COMMIT THRESHOLD UPDATES TO MESH NODES
          </button>
        </div>

        {/* Right Column: Security Keys & Escalation Roster */}
        <div className="lg:col-span-5 space-y-6">
          {/* Security & API Key Management */}
          <div className="p-5 rounded-xl border border-white/10 bg-[#050607] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Key size={16} className="text-[#818cf8]" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-white">
                API Authentication &amp; Edge Wi-Fi
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-white/60 block">Ingestion API Key (LoRa &amp; Cloud Gateway):</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={apiKey}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 bg-black text-xs font-mono text-white/90 focus:outline-none"
                />
                <button
                  onClick={handleCopyApiKey}
                  className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-white transition-colors"
                >
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
              <button
                onClick={handleGenerateNewApiKey}
                className="text-[11px] font-mono text-[#818cf8] hover:underline"
              >
                + Rotate &amp; Generate New Secure Ingestion Key
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-mono text-white/60 block">Local Gateway WPA3 Wi-Fi SSID:</label>
              <input 
                type="text" 
                value={gatewaySsid}
                onChange={(e) => setGatewaySsid(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/15 bg-black text-xs font-mono text-white focus:outline-none focus:border-[#818cf8]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-white/60 block">Captive Hotspot Access Password:</label>
              <input 
                type="password" 
                value={gatewayPassword}
                onChange={(e) => setGatewayPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/15 bg-black text-xs font-mono text-white focus:outline-none focus:border-[#818cf8]"
              />
            </div>
          </div>

          {/* Safe Assembly Points & Escalation Contacts */}
          <div className="p-5 rounded-xl border border-white/10 bg-[#050607] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Users size={16} className="text-[#818cf8]" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-white">
                Evacuation Assembly Shelters ({assemblyPoints.length})
              </h2>
            </div>

            <div className="space-y-3">
              {assemblyPoints.map((ap) => (
                <div key={ap.id} className="p-3 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">{ap.name}</span>
                    <span className="text-[#22c55e]">{ap.status}</span>
                  </div>
                  <div className="text-white/50 text-[11px] mt-1">
                    Capacity: {ap.currentCheckedIn} / {ap.capacityPersons} persons | Elevation: {ap.elevationMeters}m
                  </div>
                  <div className="text-white/60 text-[11px] mt-1">
                    Officer: {ap.contactOfficer} ({ap.officerPhone})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
