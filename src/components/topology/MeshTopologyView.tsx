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
  sector?: number;
}

export const MeshTopologyView: React.FC = () => {
  const { nodes, gateway, links } = useGeoSentinel();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [disabledNodeIds, setDisabledNodeIds] = useState<string[]>([]);
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'WiFi Mesh' | 'LoRa (SX1278)'>('all');

  // SVG Coordinates layout for Sector 1 (Nodes A, B, C), Sector 2 (Nodes X, Y, Z), and Masters (S1, S2)
  const nodePositions: Record<string, { x: number; y: number }> = {
    'MASTER-S1': { x: 300, y: 130 }, // Sector-1 Master Hub (Raspberry Pi 4)
    'MASTER-S2': { x: 700, y: 130 }, // Sector-2 Master Hub (Raspberry Pi 4)
    'NODE-A': { x: 200, y: 270 },    // Sector 1 Ridge (Hop 1 to Master-S1)
    'NODE-B': { x: 340, y: 390 },    // Sector 1 Bench Creep (Hop 1 to Master-S1)
    'NODE-C': { x: 130, y: 440 },    // Sector 1 Perimeter (Hop 2 via Node-A)
    'NODE-X': { x: 670, y: 270 },    // Sector 2 Village Buffer (Hop 1 to Master-S2)
    'NODE-Y': { x: 800, y: 380 },    // Sector 2 Highwall Edge (Hop 1 to Master-S2)
    'NODE-Z': { x: 870, y: 470 },    // Sector 2 Haul Route (Hop 2 via Node-Y)
  };

  const toggleNodeFailure = (id: string) => {
    setDisabledNodeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const masterList: TopologyNodePos[] = [
    { 
      id: 'MASTER-S1', 
      name: 'Sector-1 Master (Raspberry Pi 4)', 
      code: 'RPI4-SEC1-HUB', 
      x: nodePositions['MASTER-S1'].x, 
      y: nodePositions['MASTER-S1'].y, 
      type: 'master_gateway', 
      isGateway: true,
      sector: 1
    },
    { 
      id: 'MASTER-S2', 
      name: 'Sector-2 Master (Raspberry Pi 4)', 
      code: 'RPI4-SEC2-HUB', 
      x: nodePositions['MASTER-S2'].x, 
      y: nodePositions['MASTER-S2'].y, 
      type: 'master_gateway', 
      isGateway: true,
      sector: 2
    },
  ];

  const allNodesList: TopologyNodePos[] = [
    ...masterList,
    ...nodes.map((n, idx) => ({
      id: n.id,
      name: n.name,
      code: n.code,
      x: nodePositions[n.id]?.x || (200 + (idx % 4) * 200),
      y: nodePositions[n.id]?.y || (280 + Math.floor(idx / 4) * 120),
      type: n.type,
      isGateway: false,
      sector: n.sector
    }))
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedMaster = masterList.find(m => m.id === selectedNodeId);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-xl border border-white/10 bg-[#050607]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-white/15 bg-white/5 text-[#818cf8]">
              <Radio size={12} className="animate-pulse" />
              WIFI MESH (ESP32-S3) + LORA SX1278 (RPI-4) HYBRID PROTOCOL
            </span>
            <span className="text-xs font-mono text-white/40">AIR-GAP SELF-HEALING TOPOLOGY</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-white tracking-tight">
            Mesh Network &amp; Sector Gateway Visualizer
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
              onClick={() => setProtocolFilter('WiFi Mesh')}
              className={`px-3 py-1 rounded-md transition-colors ${protocolFilter === 'WiFi Mesh' ? 'bg-[#38bdf8] text-black font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              WiFi Mesh
            </button>
            <button
              onClick={() => setProtocolFilter('LoRa (SX1278)')}
              className={`px-3 py-1 rounded-md transition-colors ${protocolFilter === 'LoRa (SX1278)' ? 'bg-[#c084fc] text-black font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              LoRa (SX1278)
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
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Normal Pod
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] ml-2" /> Creep Warning
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] ml-2 animate-ping" /> Critical Breach
              <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] ml-2" /> RPi-4 Master
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
                {/* Packet Glow Filter */}
                <filter id="glow-packet" x="-20%" y="-20%" width="140%" height="140%">
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
                  link.linkType === 'inter_master_lora' ? '#c084fc' : '#38bdf8';

                return (
                  <g key={link.id}>
                    {/* Link Line */}
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={strokeColor}
                      strokeWidth={link.linkType === 'inter_master_lora' ? '2.5' : isLinkActive ? '2' : '1'}
                      strokeDasharray={!isLinkActive ? '4,4' : link.linkType === 'inter_master_lora' ? '8,4' : '6,3'}
                      strokeOpacity={isLinkActive ? 0.75 : 0.2}
                    />

                    {/* Animated Telemetry Signal Pulse along active links */}
                    {isLinkActive && (
                      <circle r="3.5" fill={strokeColor} filter="url(#glow-packet)">
                        <animateMotion
                          path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                          dur={`${2.2 + Math.random() * 1.2}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Midpoint Signal Strength Meter */}
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 7}
                      fill={isLinkActive ? 'rgba(255,255,255,0.45)' : '#555555'}
                      fontSize="9.5"
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
                  fillColor = '#a855f7';
                  strokeColor = '#c084fc';
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
                        r="26"
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
                        r={node.isGateway ? '28' : '22'}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Main Node Disc */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.isGateway ? 20 : 15}
                      fill="#050607"
                      stroke={strokeColor}
                      strokeWidth="2.5"
                    />

                    {/* Inner Pip */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.isGateway ? 9 : 6}
                      fill={fillColor}
                    />

                    {/* Node Code Label */}
                    <text
                      x={node.x}
                      y={node.y + (node.isGateway ? 34 : 28)}
                      fill={isDisabled ? '#555555' : '#ffffff'}
                      fontSize="11.5"
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
            <span>Avg RSSI: <strong className="text-white">-72 dBm</strong></span>
            <span>Inter-Master LoRa Bridge: <strong className="text-[#c084fc]">Active (ACK Sync)</strong></span>
          </div>
        </div>

        {/* Selected Node / Mesh Inspector Panel */}
        <div className="lg:col-span-4 p-5 rounded-xl border border-white/10 bg-[#050607] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50">
                Node / Link Telemetry Inspector
              </span>
              <span className="text-xs font-mono text-[#38bdf8] font-bold">
                {selectedNodeId || 'MASTER-S1'}
              </span>
            </div>

            {selectedMaster || (!selectedNode && (!selectedNodeId || selectedNodeId === 'MASTER-S1')) ? (
              /* Master Hub Inspector */
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg border border-[#a855f7]/30 bg-[#0e0a16]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#c084fc] font-bold uppercase">SECTOR ROOT SINK</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#d8b4fe] border border-[#a855f7]">
                      ONLINE
                    </span>
                  </div>
                  <div className="text-base font-serif font-bold text-white mt-1">
                    {selectedMaster ? selectedMaster.name : gateway.name}
                  </div>
                  <div className="text-xs font-mono text-[#a855f7] mt-0.5">
                    {selectedMaster ? selectedMaster.code : gateway.code} | Sector {selectedMaster?.sector || 1}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Edge AI Model</span>
                    <span className="text-[#38bdf8] font-semibold">TFLite Strata-Net (14.6 FPS)</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Emergency GSM</span>
                    <span className="text-[#4ade80] font-semibold">SIM7600 (5/5 Bars)</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Inter-Master LoRa</span>
                    <span className="text-[#c084fc] font-semibold">SX1278 868MHz</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Solar MPPT</span>
                    <span className="text-[#fbbf24] font-semibold">120W (Bat: 99%)</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-white/60">
                    <span>WiFi Hotspot:</span>
                    <span className="text-white">GEOSENTINEL_SEC{selectedMaster?.sector || 1}_MASTER</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>CPU Core Temp:</span>
                    <span className="text-white">41.5°C</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Self-Healing State:</span>
                    <span className="text-[#22c55e]">Armed (Instant Failover)</span>
                  </div>
                </div>
              </div>
            ) : selectedNode ? (
              /* Multi-Sensor Pod Inspector */
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40 uppercase">ESP32-S3 Pod</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      disabledNodeIds.includes(selectedNode.id) ? 'bg-white/10 text-white/50 border border-white/20' :
                      selectedNode.status === 'critical' ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]' :
                      selectedNode.status === 'warning' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]' :
                      'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]'
                    }`}>
                      {disabledNodeIds.includes(selectedNode.id) ? 'DEAD / OFFLINE' : selectedNode.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-base font-serif font-bold text-white mt-1">{selectedNode.name}</div>
                  <div className="text-xs font-mono text-white/60 mt-0.5">{selectedNode.zone}</div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">BNO085 Tilt Slope</span>
                    <span className={`font-semibold ${(selectedNode.readings?.tiltDeg ?? 0) >= 3.5 ? 'text-[#ef4444]' : 'text-white'}`}>
                      {selectedNode.readings?.tiltDeg ?? 0}°
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">BNO085 Vib (PPV)</span>
                    <span className="text-white font-semibold">{selectedNode.readings?.vibrationMmS ?? 0} mm/s</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">Soil Moisture (VWC)</span>
                    <span className={`font-semibold ${(selectedNode.readings?.soilMoisturePct ?? 50) >= 75 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                      {selectedNode.readings?.soilMoisturePct ?? 50}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">BME280 Climate</span>
                    <span className="text-white font-semibold">{selectedNode.readings?.tempC ?? 27.5}°C • {selectedNode.readings?.humidityPct ?? 60}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-white/60">
                    <span>Mesh Routing:</span>
                    <span className="text-white">Hop {selectedNode.meshHopCount} via {selectedNode.parentNodeId || 'Master'}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Signal RSSI:</span>
                    <span className="text-white">{selectedNode.readings?.rssiDbm ?? -70} dBm</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Battery Level:</span>
                    <span className="text-[#22c55e] font-bold">{selectedNode.readings?.batteryPct ?? 95}%</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Node Failure Simulation Toggle */}
          {selectedNodeId && !selectedNodeId.startsWith('MASTER') && (
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
                  ? `✓ RESTORE NODE ${selectedNodeId}`
                  : `⚠ SIMULATE NODE FAILURE (${selectedNodeId})`}
              </button>
              <p className="text-[10px] font-mono text-white/40 text-center mt-2">
                Simulates dead state or power cut to test mesh self-healing routing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

