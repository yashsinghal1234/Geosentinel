import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { Radio } from '../icons';

interface TopologyNodePos {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  type: string;
  isGateway?: boolean;
}

export const MeshTopologyView: React.FC = () => {
  const { nodes, gateway, links } = useGeoSentinel();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [disabledNodeIds, setDisabledNodeIds] = useState<string[]>([]);
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'LoRa 868MHz' | 'ESP-NOW 2.4GHz'>('all');

  // SVG Coordinates layout for 8 sensors + 2 mesh repeaters + 1 gateway
  const nodePositions: Record<string, { x: number; y: number }> = {
    'GW-01': { x: 500, y: 120 }, // Central Base Gateway
    'MR-01': { x: 300, y: 240 }, // North Mesh Repeater
    'MR-02': { x: 700, y: 240 }, // South Mesh Repeater
    'SN-01': { x: 420, y: 250 }, // Sector 4 Ridge (Hop 1 direct to GW)
    'SN-05': { x: 500, y: 300 }, // Village School (Hop 1 direct ESP-NOW)
    'SN-08': { x: 580, y: 250 }, // Optical Rain Gauge (Hop 1 direct ESP-NOW)
    'SN-02': { x: 220, y: 360 }, // North Overburden (Hop 2 via MR-01)
    'SN-06': { x: 340, y: 370 }, // Open Cast Crest (Hop 2 via MR-01)
    'SN-07': { x: 180, y: 460 }, // Riverbed Embankment (Hop 3 via SN-02)
    'SN-03': { x: 680, y: 360 }, // Abandoned Gallery (Hop 2 via MR-02)
    'SN-04': { x: 780, y: 460 }, // Pillar Seam Gas (Hop 3 via SN-03)
  };

  const toggleNodeFailure = (id: string) => {
    setDisabledNodeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const allNodesList: TopologyNodePos[] = [
    { id: 'GW-01', name: gateway.name, code: gateway.code, x: nodePositions['GW-01'].x, y: nodePositions['GW-01'].y, type: 'gateway', isGateway: true },
    { id: 'MR-01', name: 'North Ridge Solar Repeater', code: 'REP-N-01', x: nodePositions['MR-01'].x, y: nodePositions['MR-01'].y, type: 'repeater' },
    { id: 'MR-02', name: 'South Slope Solar Repeater', code: 'REP-S-02', x: nodePositions['MR-02'].x, y: nodePositions['MR-02'].y, type: 'repeater' },
    ...nodes.map(n => ({
      id: n.id,
      name: n.name,
      code: n.code,
      x: nodePositions[n.id]?.x || 500,
      y: nodePositions[n.id]?.y || 300,
      type: n.type,
      isGateway: false
    }))
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-xl border border-white/10 bg-[#050607]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-white/15 bg-white/5 text-[#818cf8]">
              <Radio size={12} className="animate-pulse" />
              LORA 868MHZ + ESP-NOW 2.4GHZ HYBRID PROTOCOL
            </span>
            <span className="text-xs font-mono text-white/40">AIR-GAP SELF-HEALING TOPOLOGY</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-white tracking-tight">
            Mesh Network &amp; Gateway Routing Visualizer
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-lg border border-white/10 bg-white/5 text-xs font-mono">
            <button
              onClick={() => setProtocolFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${protocolFilter === 'all' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              All Links ({links.length})
            </button>
            <button
              onClick={() => setProtocolFilter('LoRa 868MHz')}
              className={`px-3 py-1 rounded-md transition-colors ${protocolFilter === 'LoRa 868MHz' ? 'bg-[#818cf8] text-white font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              LoRa 868MHz
            </button>
            <button
              onClick={() => setProtocolFilter('ESP-NOW 2.4GHz')}
              className={`px-3 py-1 rounded-md transition-colors ${protocolFilter === 'ESP-NOW 2.4GHz' ? 'bg-[#22c55e] text-black font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              ESP-NOW 2.4GHz
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: SVG Topology Map & Inspector Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Graph View */}
        <div className="lg:col-span-8 p-5 rounded-xl border border-white/10 bg-[#050607] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-white/50">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Online Node
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] ml-2" /> Warning
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] ml-2 animate-ping" /> Critical Breached
              <span className="w-2.5 h-2.5 rounded-full bg-white/20 ml-2" /> Simulated Dead
            </span>
            <span className="text-[11px] text-white/40">
              Click any node to inspect telemetry or simulate failover
            </span>
          </div>

          <div className="relative w-full aspect-[16/10] bg-black/60 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
            {/* Background Grid Accent */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.25) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            <svg viewBox="0 0 1000 560" className="w-full h-full">
              <defs>
                {/* LoRa Packet Glow */}
                <filter id="glow-lora" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-critical" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Links Between Nodes */}
              {links.map((link) => {
                const src = nodePositions[link.sourceId];
                const tgt = nodePositions[link.targetId];
                if (!src || !tgt) return null;

                const isSrcDisabled = disabledNodeIds.includes(link.sourceId);
                const isTgtDisabled = disabledNodeIds.includes(link.targetId);
                const isLinkActive = !isSrcDisabled && !isTgtDisabled;

                if (protocolFilter !== 'all' && link.protocol !== protocolFilter) {
                  return null;
                }

                const strokeColor = !isLinkActive ? '#333333' :
                  link.protocol === 'LoRa 868MHz' ? '#818cf8' : '#22c55e';

                return (
                  <g key={link.id}>
                    {/* Link Line */}
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={strokeColor}
                      strokeWidth={isLinkActive ? '2' : '1'}
                      strokeDasharray={!isLinkActive ? '4,4' : link.protocol === 'ESP-NOW 2.4GHz' ? '6,3' : undefined}
                      strokeOpacity={isLinkActive ? 0.6 : 0.2}
                    />

                    {/* Animated Telemetry Signal Pulse along active links */}
                    {isLinkActive && (
                      <circle r="3" fill={strokeColor} filter="url(#glow-lora)">
                        <animateMotion
                          path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                          dur={`${2.5 + Math.random() * 1.5}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Midpoint Signal Strength Meter */}
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 6}
                      fill={isLinkActive ? 'rgba(255,255,255,0.4)' : '#555555'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {isLinkActive ? `${link.rssiDbm} dBm` : 'BROKEN'}
                    </text>
                  </g>
                );
              })}

              {/* Node Circles */}
              {allNodesList.map((node) => {
                const liveNode = nodes.find(n => n.id === node.id);
                const isDisabled = disabledNodeIds.includes(node.id);
                const isSelected = selectedNodeId === node.id;
                
                let fillColor = '#22c55e';
                let strokeColor = '#22c55e';
                let isCritical = false;

                if (node.isGateway) {
                  fillColor = gateway.internetConnected ? '#ffffff' : '#eab308';
                  strokeColor = '#ffffff';
                } else if (node.type === 'repeater') {
                  fillColor = '#818cf8';
                  strokeColor = '#818cf8';
                } else if (liveNode) {
                  if (liveNode.status === 'critical') {
                    fillColor = '#ef4444';
                    strokeColor = '#ef4444';
                    isCritical = true;
                  } else if (liveNode.status === 'warning') {
                    fillColor = '#eab308';
                    strokeColor = '#eab308';
                  }
                }

                if (isDisabled) {
                  fillColor = '#222222';
                  strokeColor = '#444444';
                }

                return (
                  <g 
                    key={node.id} 
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    {/* Pulsing ring for critical nodes */}
                    {isCritical && !isDisabled && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        className="animate-ping origin-center"
                        style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                      />
                    )}

                    {/* Selection halo */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="22"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Main Node Disc */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.isGateway ? 18 : 14}
                      fill="#050607"
                      stroke={strokeColor}
                      strokeWidth="2.5"
                    />

                    {/* Inner Pip */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.isGateway ? 8 : 5}
                      fill={fillColor}
                    />

                    {/* Node Code Label */}
                    <text
                      x={node.x}
                      y={node.y + (node.isGateway ? 32 : 26)}
                      fill={isDisabled ? '#555555' : '#ffffff'}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-white/50 pt-3 border-t border-white/5">
            <span>Mesh Packet Delivery Rate: <strong className="text-[#22c55e]">99.8%</strong></span>
            <span>Avg RSSI: <strong className="text-white">-78 dBm</strong></span>
            <span>Self-Healing Relay: <strong className="text-[#818cf8]">Active</strong></span>
          </div>
        </div>

        {/* Selected Node / Mesh Inspector Panel */}
        <div className="lg:col-span-4 p-5 rounded-xl border border-white/10 bg-[#050607] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50">
                Node / Link Telemetry Inspector
              </span>
              <span className="text-xs font-mono text-white/80">
                {selectedNodeId || 'GW-01'}
              </span>
            </div>

            {selectedNodeId === 'GW-01' || !selectedNodeId ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-white/10 bg-white/5">
                  <span className="text-[10px] font-mono text-white/40 block">ROOT MESH SINK</span>
                  <div className="text-base font-serif font-bold text-white mt-0.5">{gateway.name}</div>
                  <div className="text-xs font-mono text-white/60 mt-1">{gateway.code} | {gateway.ip}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Store-and-Forward</span>
                    <span className="text-white font-semibold">{gateway.storeAndForwardBufferCount} packets buffered</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Captive SSID</span>
                    <span className="text-white font-semibold">{gateway.wifiHotspotSsid}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Edge CPU Temp</span>
                    <span className="text-white font-semibold">{gateway.cpuTempC}°C</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Firmware</span>
                    <span className="text-white font-semibold">{gateway.firmwareVersion}</span>
                  </div>
                </div>
              </div>
            ) : selectedNode ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40 uppercase">{selectedNode.type}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      selectedNode.status === 'critical' ? 'bg-[#ef4444]/20 text-[#ef4444] font-bold' :
                      selectedNode.status === 'warning' ? 'bg-[#eab308]/20 text-[#eab308]' : 'bg-[#22c55e]/20 text-[#22c55e]'
                    }`}>
                      {selectedNode.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-base font-serif font-bold text-white mt-1">{selectedNode.name}</div>
                  <div className="text-xs font-mono text-white/60 mt-0.5">{selectedNode.zone}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Tilt Slope</span>
                    <span className="text-white font-semibold">{selectedNode.readings.tiltDeg}°</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Crack Width</span>
                    <span className="text-white font-semibold">{selectedNode.readings.crackWidthMm} mm</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Vibration PPV</span>
                    <span className="text-white font-semibold">{selectedNode.readings.vibrationMmS} mm/s</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Battery Level</span>
                    <span className="text-[#22c55e] font-semibold">{selectedNode.readings.batteryPct}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-mono space-y-1">
                  <div className="flex justify-between text-white/60">
                    <span>Mesh Routing Hop:</span>
                    <span className="text-white">Hop {selectedNode.meshHopCount} via {selectedNode.parentNodeId || 'Root'}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Signal Strength:</span>
                    <span className="text-white">{selectedNode.readings.rssiDbm} dBm</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Last Heartbeat:</span>
                    <span className="text-[#22c55e]">3.2s ago</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs font-mono text-white/50">
                Mesh Relay Repeater node actively routing LoRa packets.
              </div>
            )}
          </div>

          {/* Node Failure Simulation Toggle */}
          {selectedNodeId && selectedNodeId !== 'GW-01' && (
            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={() => toggleNodeFailure(selectedNodeId)}
                className={`w-full py-2.5 rounded-full text-xs font-mono font-medium transition-all ${
                  disabledNodeIds.includes(selectedNodeId)
                    ? 'bg-[#22c55e] text-black font-semibold hover:bg-[#16a34a]'
                    : 'border border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20'
                }`}
              >
                {disabledNodeIds.includes(selectedNodeId)
                  ? `RESTORE NODE ${selectedNodeId}`
                  : `SIMULATE NODE FAILURE (${selectedNodeId})`}
              </button>
              <p className="text-[10px] font-mono text-white/40 text-center mt-2">
                Simulating power cut or rockfall destruction tests dynamic mesh re-routing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
