import React, { useState, useMemo } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { GatewayDevice } from '../../types';
import { Radio } from '../icons';

interface TopologyNodePos {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  sector: number;
  isMaster?: boolean;
}

// Master Gateway Hubs (Raspberry Pi 4) matching hardware architecture
const SECTOR_MASTERS: GatewayDevice[] = [
  {
    id: 'MASTER-S1',
    name: 'Sector-1 Master (Raspberry Pi 4)',
    code: 'RPI4-SEC1-HUB',
    hardwareModel: 'Raspberry Pi 4 Model B',
    sectorNum: 1,
    lat: 23.7520,
    lng: 86.4220,
    ip: '192.168.1.1',
    mac: 'DC:A6:32:4E:91:A1',
    status: 'online',
    internetConnected: true,
    batteryPct: 99,
    wifiHotspotSsid: 'GEOSENTINEL_SEC1_MASTER',
    localSirenActive: false,
    gsmSignalBars: 5,
    gsmStatus: 'online',
    loraStatus: 'connected',
    edgeAiStatus: 'inferencing',
    edgeAiInferenceFps: 14.6,
    solarMpptWatts: 120,
    selfHealingActive: true,
    storeAndForwardBufferCount: 0,
    lastSyncTime: 'Live',
    firmwareVersion: 'v4.2.0-rpi-edge-ai',
    cpuTempC: 41.5,
    ramUsagePct: 28,
  },
  {
    id: 'MASTER-S2',
    name: 'Sector-2 Master (Raspberry Pi 4)',
    code: 'RPI4-SEC2-HUB',
    hardwareModel: 'Raspberry Pi 4 Model B',
    sectorNum: 2,
    lat: 23.7468,
    lng: 86.4180,
    ip: '192.168.2.1',
    mac: 'DC:A6:32:4E:91:B2',
    status: 'online',
    internetConnected: true,
    batteryPct: 98,
    wifiHotspotSsid: 'GEOSENTINEL_SEC2_MASTER',
    localSirenActive: false,
    gsmSignalBars: 5,
    gsmStatus: 'online',
    loraStatus: 'connected',
    edgeAiStatus: 'inferencing',
    edgeAiInferenceFps: 14.8,
    solarMpptWatts: 120,
    selfHealingActive: true,
    storeAndForwardBufferCount: 0,
    lastSyncTime: 'Live',
    firmwareVersion: 'v4.2.0-rpi-edge-ai',
    cpuTempC: 42.1,
    ramUsagePct: 31,
  },
];

export const MeshTopologyView: React.FC = () => {
  const { nodes } = useGeoSentinel();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('MASTER-S1');
  const [disabledNodeIds, setDisabledNodeIds] = useState<string[]>([]);
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'wifi' | 'lora'>('all');

  // Node spatial SVG layout tailored to Sector 1 & Sector 2 clusters
  const defaultPositions: Record<string, { x: number; y: number }> = {
    // Sector 1 Hub & ESP32-S3 Pods
    'MASTER-S1': { x: 270, y: 105 },
    'NODE-A': { x: 160, y: 225 },
    'NODE-B': { x: 370, y: 225 },
    'NODE-C': { x: 110, y: 375 },
    'NODE-D': { x: 260, y: 385 },

    // Sector 2 Hub & ESP32-S3 Pods
    'MASTER-S2': { x: 730, y: 105 },
    'NODE-X': { x: 630, y: 225 },
    'NODE-Y': { x: 840, y: 225 },
    'NODE-Z': { x: 670, y: 385 },
    'NODE-W': { x: 890, y: 375 },
  };

  // Build full topology node list
  const allNodesList = useMemo<TopologyNodePos[]>(() => {
    const list: TopologyNodePos[] = [
      {
        id: 'MASTER-S1',
        name: 'Sector-1 Master Hub',
        code: 'RPI4-SEC1-HUB',
        x: defaultPositions['MASTER-S1'].x,
        y: defaultPositions['MASTER-S1'].y,
        sector: 1,
        isMaster: true,
      },
      {
        id: 'MASTER-S2',
        name: 'Sector-2 Master Hub',
        code: 'RPI4-SEC2-HUB',
        x: defaultPositions['MASTER-S2'].x,
        y: defaultPositions['MASTER-S2'].y,
        sector: 2,
        isMaster: true,
      },
    ];

    nodes.forEach((n, idx) => {
      const pos = defaultPositions[n.id] || {
        x: n.sector === 2 ? 650 + (idx % 3) * 90 : 180 + (idx % 3) * 90,
        y: 240 + Math.floor(idx / 3) * 120,
      };
      list.push({
        id: n.id,
        name: n.name,
        code: n.code,
        x: pos.x,
        y: pos.y,
        sector: n.sector || (n.id.startsWith('NODE-X') || n.id.startsWith('NODE-Y') ? 2 : 1),
        isMaster: false,
      });
    });

    return list;
  }, [nodes]);

  // Dynamic mesh routing links
  const activeLinks = useMemo(() => {
    const links: Array<{
      id: string;
      sourceId: string;
      targetId: string;
      rssiDbm: number;
      protocol: 'wifi' | 'lora';
      label: string;
      isFailover?: boolean;
    }> = [];

    // 1. Inter-Master LoRa Bridge (868MHz)
    links.push({
      id: 'L-MASTERS',
      sourceId: 'MASTER-S1',
      targetId: 'MASTER-S2',
      rssiDbm: -79,
      protocol: 'lora',
      label: 'LoRa 868MHz Bridge (ACK Sync)',
    });

    // 2. Multi-Hop Pod Mesh Links
    nodes.forEach((node) => {
      let targetId = node.parentNodeId || (node.sector === 2 ? 'MASTER-S2' : 'MASTER-S1');
      let isFailover = false;

      // Failover rerouting simulation
      if (disabledNodeIds.includes(targetId)) {
        if (targetId === 'MASTER-S1') {
          targetId = 'MASTER-S2';
          isFailover = true;
        } else if (targetId === 'MASTER-S2') {
          targetId = 'MASTER-S1';
          isFailover = true;
        } else if (targetId === 'NODE-A') {
          targetId = 'NODE-B';
          isFailover = true;
        } else if (targetId === 'NODE-X') {
          targetId = 'NODE-Y';
          isFailover = true;
        }
      }

      links.push({
        id: `link-${node.id}-${targetId}`,
        sourceId: node.id,
        targetId: targetId,
        rssiDbm: node.readings?.rssiDbm ?? -70,
        protocol: isFailover && targetId.startsWith('MASTER') ? 'lora' : 'wifi',
        label: isFailover ? 'FAILOVER REROUTED' : 'WiFi Mesh 2.4GHz',
        isFailover,
      });
    });

    return links;
  }, [nodes, disabledNodeIds]);

  const toggleNodeFailure = (id: string) => {
    setDisabledNodeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectedMaster = SECTOR_MASTERS.find(m => m.id === selectedNodeId);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Top Filter & Network Stats Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[16px] border border-[#181b20] bg-[#0a0c0f] text-xs">
        {/* Left: Health & Sync Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#8b949e]">
          <div className="flex items-center gap-1.5 text-white">
            <Radio size={14} className="text-[#a3e635] animate-pulse" />
            <span className="font-bold">Dual-Tier Mesh:</span>
            <span className="text-[#38bdf8]">WiFi 2.4GHz (Pods)</span>
            <span>+</span>
            <span className="text-[#c084fc]">LoRa 868MHz (RPi Masters)</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
            <span>PDR: <strong className="text-white">99.8%</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
            <span>Avg Hop: <strong className="text-white">1.4 Hops</strong></span>
          </div>
        </div>

        {/* Right: Protocol Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-[#232731] bg-[#121418]">
          <button
            onClick={() => setProtocolFilter('all')}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
              protocolFilter === 'all' ? 'bg-[#22262f] text-[#a3e635] font-bold' : 'text-[#717682] hover:text-white'
            }`}
          >
            All Links ({activeLinks.length})
          </button>
          <button
            onClick={() => setProtocolFilter('wifi')}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
              protocolFilter === 'wifi' ? 'bg-[#22262f] text-[#38bdf8] font-bold' : 'text-[#717682] hover:text-white'
            }`}
          >
            WiFi Mesh
          </button>
          <button
            onClick={() => setProtocolFilter('lora')}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
              protocolFilter === 'lora' ? 'bg-[#22262f] text-[#c084fc] font-bold' : 'text-[#717682] hover:text-white'
            }`}
          >
            LoRa Bridge
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive SVG Graph + Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: SVG Topology Canvas */}
        <div className="lg:col-span-8 p-4 rounded-[18px] border border-[#181b20] bg-[#000000] shadow-2xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px] text-[#8b949e]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#6b21a8] border border-[#e9d5ff] flex items-center justify-center text-[8px] text-white">⚡</span>
                <span className="text-[#d8b4fe]">RPi 4 Master</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span>
                <span className="text-white">ESP32-S3 Pod</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse"></span>
                <span className="text-white">Critical Node</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#475569]"></span>
                <span className="text-[#64748b]">Simulated Dead</span>
              </span>
            </div>
            <span className="text-[10px] text-[#555]">
              Click any node to inspect telemetry or test failover
            </span>
          </div>

          {/* SVG Map */}
          <div className="relative w-full aspect-[16/10] bg-[#06080c] rounded-[14px] border border-[#161a22] overflow-hidden flex items-center justify-center">
            {/* Background Grid Accent */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.25) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Sector Cluster Labels */}
            <div className="absolute top-3 left-6 text-[11px] font-bold text-[#38bdf8]/60 uppercase tracking-wider">
              ◰ Sector 1 Mesh Cluster (North Ridge)
            </div>
            <div className="absolute top-3 right-6 text-[11px] font-bold text-[#c084fc]/60 uppercase tracking-wider">
              ◰ Sector 2 Mesh Cluster (East Highwall)
            </div>

            <svg viewBox="0 0 1000 500" className="w-full h-full">
              <defs>
                <filter id="glow-wifi" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-lora-purple" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Draw Mesh Links */}
              {activeLinks.map((link) => {
                const src = defaultPositions[link.sourceId];
                const tgt = defaultPositions[link.targetId];
                if (!src || !tgt) return null;

                const isSrcDisabled = disabledNodeIds.includes(link.sourceId);
                const isTgtDisabled = disabledNodeIds.includes(link.targetId);
                const isLinkActive = !isSrcDisabled && !isTgtDisabled;

                if (protocolFilter === 'wifi' && link.protocol !== 'wifi') return null;
                if (protocolFilter === 'lora' && link.protocol !== 'lora') return null;

                const strokeColor = !isLinkActive ? '#262d3d' :
                  link.isFailover ? '#f59e0b' :
                  link.protocol === 'lora' ? '#c084fc' : '#38bdf8';

                return (
                  <g key={link.id}>
                    {/* Background track */}
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={strokeColor}
                      strokeWidth={link.protocol === 'lora' ? '2.5' : '1.8'}
                      strokeDasharray={!isLinkActive ? '4,4' : link.protocol === 'lora' ? '6,6' : link.isFailover ? '5,5' : undefined}
                      strokeOpacity={isLinkActive ? 0.75 : 0.25}
                    />

                    {/* Dynamic Moving Particle along active link */}
                    {isLinkActive && (
                      <circle r={link.protocol === 'lora' ? '4' : '3'} fill={strokeColor} filter={link.protocol === 'lora' ? 'url(#glow-lora-purple)' : 'url(#glow-wifi)'}>
                        <animateMotion
                          path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                          dur={`${link.protocol === 'lora' ? 2.2 : 1.6}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Link Label Meter */}
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 8}
                      fill={isLinkActive ? (link.isFailover ? '#f59e0b' : 'rgba(255,255,255,0.6)') : '#475569'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {isLinkActive ? `${link.rssiDbm} dBm` : 'DISCONNECTED'}
                    </text>
                  </g>
                );
              })}

              {/* Draw Nodes & Master Hubs */}
              {allNodesList.map((node) => {
                const liveNode = nodes.find(n => n.id === node.id);
                const isDisabled = disabledNodeIds.includes(node.id);
                const isSelected = selectedNodeId === node.id;
                
                let fillColor = '#22c55e';
                let strokeColor = '#22c55e';
                let isCritical = false;

                if (node.isMaster) {
                  fillColor = '#a855f7';
                  strokeColor = '#e9d5ff';
                } else if (liveNode) {
                  if (liveNode.status === 'critical') {
                    fillColor = '#ef4444';
                    strokeColor = '#ef4444';
                    isCritical = true;
                  } else if (liveNode.status === 'warning') {
                    fillColor = '#f59e0b';
                    strokeColor = '#f59e0b';
                  }
                }

                if (isDisabled) {
                  fillColor = '#1f293d';
                  strokeColor = '#475569';
                }

                return (
                  <g 
                    key={node.id} 
                    className="cursor-pointer transition-all hover:scale-110"
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
                        className="animate-ping"
                        style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                      />
                    )}

                    {/* Selection halo */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.isMaster ? '26' : '22'}
                        fill="none"
                        stroke={node.isMaster ? '#c084fc' : '#a3e635'}
                        strokeWidth="2.5"
                        strokeDasharray="4,3"
                      />
                    )}

                    {/* Master Square vs Pod Circle */}
                    {node.isMaster ? (
                      <rect
                        x={node.x - 16}
                        y={node.y - 16}
                        width="32"
                        height="32"
                        rx="8"
                        fill="#0d0914"
                        stroke={strokeColor}
                        strokeWidth="2.5"
                      />
                    ) : (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={14}
                        fill="#090c10"
                        stroke={strokeColor}
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Inner Indicator Pip / Icon */}
                    {node.isMaster ? (
                      <text
                        x={node.x}
                        y={node.y + 4}
                        fill={isDisabled ? '#64748b' : '#ffffff'}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        ⚡
                      </text>
                    ) : (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={5}
                        fill={fillColor}
                      />
                    )}

                    {/* Node ID Badge Label */}
                    <text
                      x={node.x}
                      y={node.y + (node.isMaster ? 32 : 28)}
                      fill={isDisabled ? '#64748b' : '#ffffff'}
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

          {/* Bottom Diagnostics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8b949e] pt-3 border-t border-[#181b20]">
            <span>Self-Healing LoRa Mesh: <strong className="text-[#a3e635]">Armed &amp; Dynamic</strong></span>
            <span>Active Sector Hubs: <strong className="text-white">2 / 2 Online</strong></span>
            <span>Mesh Packet Loss: <strong className="text-[#22c55e]">0.02%</strong></span>
          </div>
        </div>

        {/* Right: Selected Node / Hub Telemetry Inspector */}
        <div className="lg:col-span-4 p-4 rounded-[18px] border border-[#181b20] bg-[#0a0c0f] shadow-2xl flex flex-col justify-between">
          <div>
            {/* Inspector Header */}
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#1f242e]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b949e]">
                Mesh Node Inspector
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#161a22] text-[#38bdf8] font-bold border border-[#232731]">
                {selectedNodeId}
              </span>
            </div>

            {/* Inspecting Master Gateway Hub */}
            {selectedMaster ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-[#a855f7]/40 bg-[#120a1f]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#c084fc] font-bold uppercase">Raspberry Pi 4 Master Hub</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#4ade80] font-bold border border-[#22c55e]/40">
                      ● EDGE ONLINE
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">{selectedMaster.name}</div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">
                    IP: {selectedMaster.ip} • MAC: {selectedMaster.mac}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#12161f]">
                    <span className="text-[10px] text-[#718096] block uppercase">Edge AI Model</span>
                    <span className="text-[#38bdf8] font-bold text-[11px]">TFLite Strata-Net</span>
                    <span className="text-[9px] text-[#94a3b8] block">{selectedMaster.edgeAiInferenceFps} FPS</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#12161f]">
                    <span className="text-[10px] text-[#718096] block uppercase">GSM Cellular</span>
                    <span className="text-[#4ade80] font-bold text-[11px]">SIM7600 Direct</span>
                    <span className="text-[9px] text-[#94a3b8] block">5/5 Bars • SMS Armed</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#12161f]">
                    <span className="text-[10px] text-[#718096] block uppercase">Solar MPPT</span>
                    <span className="text-[#fbbf24] font-bold text-[11px]">{selectedMaster.solarMpptWatts}W Array</span>
                    <span className="text-[9px] text-[#94a3b8] block">Battery {selectedMaster.batteryPct}%</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#12161f]">
                    <span className="text-[10px] text-[#718096] block uppercase">System Load</span>
                    <span className="text-white font-bold text-[11px]">{selectedMaster.cpuTempC}°C CPU</span>
                    <span className="text-[9px] text-[#94a3b8] block">RAM {selectedMaster.ramUsagePct}%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#12161f] text-[11px] text-[#94a3b8] space-y-1">
                  <div className="flex justify-between">
                    <span>LoRa SX1278 Bridge:</span>
                    <span className="text-[#c084fc] font-bold">Synchronized</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hotspot Captive SSID:</span>
                    <span className="text-white">{selectedMaster.wifiHotspotSsid}</span>
                  </div>
                </div>
              </div>
            ) : selectedNode ? (
              /* Inspecting ESP32-S3 Multi-Sensor Pod */
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-[#1e2430] bg-[#12161f]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#38bdf8] font-bold uppercase">ESP32-S3 Multi-Sensor Pod</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      selectedNode.status === 'critical' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40' :
                      selectedNode.status === 'warning' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40' :
                      'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40'
                    }`}>
                      ● {selectedNode.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">{selectedNode.name}</div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">{selectedNode.zone}</div>
                </div>

                {/* 2-Column Sensor Telemetry Tiles */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#0c1017]">
                    <span className="text-[10px] text-[#718096] block uppercase">BNO085 Tilt</span>
                    <span className={`text-sm font-extrabold ${
                      (selectedNode.readings?.tiltDeg ?? 0) >= 5 ? 'text-[#ef4444]' : 'text-white'
                    }`}>
                      {(selectedNode.readings?.tiltDeg ?? 0).toFixed(2)}°
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#0c1017]">
                    <span className="text-[10px] text-[#718096] block uppercase">BNO085 Vib</span>
                    <span className="text-sm font-extrabold text-white">
                      {(selectedNode.readings?.vibrationMmS ?? 0).toFixed(1)} <span className="text-[9px] text-[#94a3b8] font-normal">mm/s</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#0c1017]">
                    <span className="text-[10px] text-[#718096] block uppercase">Soil Saturation</span>
                    <span className={`text-sm font-extrabold ${
                      (selectedNode.readings?.soilMoisturePct ?? 50) >= 75 ? 'text-[#ef4444]' : 'text-[#4ade80]'
                    }`}>
                      {(selectedNode.readings?.soilMoisturePct ?? 50).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#0c1017]">
                    <span className="text-[10px] text-[#718096] block uppercase">BME280 Temp</span>
                    <span className="text-sm font-extrabold text-white">
                      {(selectedNode.readings?.tempC ?? 27.5).toFixed(1)}°C
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#0c1017]">
                    <span className="text-[10px] text-[#718096] block uppercase">Battery</span>
                    <span className="text-sm font-extrabold text-[#22c55e]">
                      {selectedNode.readings?.batteryPct ?? 95}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#0c1017]">
                    <span className="text-[10px] text-[#718096] block uppercase">WiFi/LoRa RSSI</span>
                    <span className="text-sm font-extrabold text-[#38bdf8]">
                      {selectedNode.readings?.rssiDbm ?? -70} <span className="text-[9px] text-[#94a3b8] font-normal">dBm</span>
                    </span>
                  </div>
                </div>

                {/* Mesh Routing Hop Info */}
                <div className="p-2.5 rounded-lg border border-[#1e2430] bg-[#0c1017] text-[11px] text-[#94a3b8] space-y-1">
                  <div className="flex justify-between">
                    <span>Mesh Uplink Target:</span>
                    <span className="text-white font-bold">{selectedNode.parentNodeId || (selectedNode.sector === 2 ? 'MASTER-S2' : 'MASTER-S1')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hop Count:</span>
                    <span className="text-[#a3e635] font-bold">Hop {selectedNode.meshHopCount || 1}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Node Failure Simulation Action Button */}
          {selectedNodeId && (
            <div className="pt-3 border-t border-[#1f242e] mt-3">
              <button
                onClick={() => toggleNodeFailure(selectedNodeId)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  disabledNodeIds.includes(selectedNodeId)
                    ? 'bg-[#22c55e] text-black hover:bg-[#16a34a]'
                    : 'border border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20'
                }`}
              >
                {disabledNodeIds.includes(selectedNodeId)
                  ? `RESTORE ${selectedNodeId}`
                  : `SIMULATE FAILURE (${selectedNodeId})`}
              </button>
              <p className="text-[10px] text-[#64748b] text-center mt-1.5">
                Tests self-healing automatic mesh rerouting &amp; failover.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
