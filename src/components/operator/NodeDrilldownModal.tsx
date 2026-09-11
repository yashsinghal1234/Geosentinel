import React, { useState } from 'react';
import type { SensorNode } from '../../types';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  X, 
  Activity, 
  Battery, 
  Wifi, 
  Check 
} from '../icons';

interface NodeDrilldownModalProps {
  node?: SensorNode;
  nodeId?: string;
  onClose: () => void;
}

export const NodeDrilldownModal: React.FC<NodeDrilldownModalProps> = ({ node: propNode, nodeId, onClose }) => {
  const { nodes, updateNodeThresholds } = useGeoSentinel();
  const node = propNode || nodes.find(n => n.id === nodeId) || nodes[0];

  const [activeTab, setActiveTab] = useState<'telemetry' | 'thresholds' | 'hardware'>('telemetry');
  
  // Local threshold state
  const [tiltCrit, setTiltCrit] = useState(node.thresholds.tiltCriticalDeg);
  const [tiltWarn, setTiltWarn] = useState(node.thresholds.tiltWarningDeg);
  const [crackCrit, setCrackCrit] = useState(node.thresholds.crackCriticalMm);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateNodeThresholds(node.id, {
      ...node.thresholds,
      tiltCriticalDeg: Number(tiltCrit),
      tiltWarningDeg: Number(tiltWarn),
      crackCriticalMm: Number(crackCrit),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-[16px] border border-[#222222] bg-[#050607] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#1a1c20] pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${
              node.status === 'critical' ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]' :
              node.status === 'warning' ? 'bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]' :
              'bg-[#3fcb7f]/20 text-[#3fcb7f] border border-[#3fcb7f]'
            }`}>
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-semibold text-white tracking-[-0.03em]">
                  {node.name}
                </h3>
                <span className="font-mono text-[11px] text-[#808080] border border-[#333333] px-1.5 py-0.2 rounded">
                  {node.code}
                </span>
              </div>
              <p className="text-[12px] text-[#808080]">
                {node.zone} • Elevation: {node.elevationMeters}m • Parent: {node.parentNodeId || 'Gateway GW-01'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#333333] bg-transparent text-[#808080] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#1a1c20] pb-2 text-[13px]">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
              activeTab === 'telemetry' ? 'bg-white/10 text-white font-medium' : 'text-[#808080] hover:text-white'
            }`}
          >
            Telemetry History
          </button>

          <button
            onClick={() => setActiveTab('thresholds')}
            className={`px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
              activeTab === 'thresholds' ? 'bg-white/10 text-white font-medium' : 'text-[#808080] hover:text-white'
            }`}
          >
            Threshold Tuning
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
              activeTab === 'hardware' ? 'bg-white/10 text-white font-medium' : 'text-[#808080] hover:text-white'
            }`}
          >
            Hardware & Radio Diagnostics
          </button>
        </div>

        {/* Tab 1: Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="carbon-card p-3">
                <div className="text-[11px] text-[#808080]">Tilt Angle</div>
                <div className="text-[20px] font-bold text-white font-mono">{node.readings.tiltDeg}°</div>
              </div>
              <div className="carbon-card p-3">
                <div className="text-[11px] text-[#808080]">Crack Width</div>
                <div className="text-[20px] font-bold text-[#fb923c] font-mono">{node.readings.crackWidthMm} mm</div>
              </div>
              <div className="carbon-card p-3">
                <div className="text-[11px] text-[#808080]">Vibration (PPV)</div>
                <div className="text-[20px] font-bold text-[#3fcb7f] font-mono">{node.readings.vibrationMmS} mm/s</div>
              </div>
              <div className="carbon-card p-3">
                <div className="text-[11px] text-[#808080]">Mine Gas</div>
                <div className="text-[20px] font-bold text-[#38bdf8] font-mono">{node.readings.gasPpm} PPM</div>
              </div>
            </div>

            {/* Historical Trend Curve Visualizer */}
            <div className="rounded-[12px] border border-[#1a1c20] bg-black p-4 space-y-2">
              <div className="flex items-center justify-between text-[12px] text-[#808080]">
                <span>20-Point Rolling Telemetry Trend</span>
                <span className="font-mono text-[11px] text-[#3fcb7f]">Live 3.5s Sampling</span>
              </div>

              <div className="h-32 w-full pt-2">
                <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="nodeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9984d8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#9984d8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Draw area spline from history */}
                  {node.history.length > 1 && (
                    <path
                      d={`M 0,90 ${node.history.map((pt, i) => {
                        const x = (i / (node.history.length - 1)) * 400;
                        const y = Math.max(10, 90 - (pt.crackWidthMm * 3.5));
                        return `L ${x},${y}`;
                      }).join(' ')} L 400,90 Z`}
                      fill="url(#nodeGrad)"
                    />
                  )}

                  {node.history.length > 1 && (
                    <path
                      d={`M 0,90 ${node.history.map((pt, i) => {
                        const x = (i / (node.history.length - 1)) * 400;
                        const y = Math.max(10, 90 - (pt.crackWidthMm * 3.5));
                        return `L ${x},${y}`;
                      }).join(' ')}`}
                      fill="none"
                      stroke="#9984d8"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Threshold Tuning */}
        {activeTab === 'thresholds' && (
          <form onSubmit={handleSaveThresholds} className="space-y-4 text-[13px]">
            {savedSuccess && (
              <div className="rounded-[8px] bg-[#3fcb7f]/10 border border-[#3fcb7f] p-3 text-[#3fcb7f] flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Threshold parameters uploaded to LoRa Node EEPROM memory!</span>
              </div>
            )}

            <div>
              <label className="block text-[#808080] text-[12px] mb-1">Tilt Critical Threshold (Degrees)</label>
              <input
                type="number"
                step="0.1"
                value={tiltCrit}
                onChange={(e) => setTiltCrit(Number(e.target.value))}
                className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[#808080] text-[12px] mb-1">Tilt Warning Threshold (Degrees)</label>
              <input
                type="number"
                step="0.1"
                value={tiltWarn}
                onChange={(e) => setTiltWarn(Number(e.target.value))}
                className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[#808080] text-[12px] mb-1">Crack Critical Aperture (mm)</label>
              <input
                type="number"
                step="0.5"
                value={crackCrit}
                onChange={(e) => setCrackCrit(Number(e.target.value))}
                className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white font-mono"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-filled w-full py-2.5 rounded-[6px] font-medium cursor-pointer"
            >
              <span>Save & Calibrate Over LoRa Air</span>
            </button>
          </form>
        )}

        {/* Tab 3: Hardware Diagnostics */}
        {activeTab === 'hardware' && (
          <div className="space-y-3 text-[13px]">
            <div className="grid grid-cols-2 gap-3">
              <div className="carbon-card p-3 space-y-1">
                <div className="text-[#808080] text-[11px] flex items-center gap-1">
                  <Battery className="h-3 w-3" /> Battery LiFePO4
                </div>
                <div className="font-mono text-white text-[16px] font-bold">
                  {node.readings.batteryPct.toFixed(1)}% (3.32V)
                </div>
              </div>

              <div className="carbon-card p-3 space-y-1">
                <div className="text-[#808080] text-[11px] flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> LoRa RSSI
                </div>
                <div className="font-mono text-[#3fcb7f] text-[16px] font-bold">
                  {node.readings.rssiDbm} dBm (Good)
                </div>
              </div>
            </div>

            <div className="rounded-[8px] bg-black border border-[#1a1c20] p-3 text-[12px] text-[#b3b3b3] space-y-1">
              <div>Microcontroller: ESP32-S3 Dual Core 240MHz</div>
              <div>LoRa Transceiver: Semtech SX1262 868MHz (Spreading Factor SF9)</div>
              <div>Firmware: v3.8.1-cimfr-edge-optimized</div>
              <div>GPS Fix: 23.7482° N, 86.4195° E (Lock: 9 Satellites)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
