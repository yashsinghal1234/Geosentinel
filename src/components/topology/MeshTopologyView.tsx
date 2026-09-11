import React, { useState, useMemo } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { GatewayDevice, TopologyNode } from '../../types';
import { 
  Radio, 
  Wifi, 
  Layers, 
  Search, 
  ShieldCheck, 
  Server, 
  Clock, 
  CheckCircle2
} from '../icons';

// Default Sector Masters matching physical hardware (Raspberry Pi 4)
const SECTOR_MASTERS: GatewayDevice[] = [
  {
    id: 'MASTER-S1',
    name: 'Sector-1 Master Hub',
    code: 'RPI4-SEC1-HUB',
    hardwareModel: 'Raspberry Pi 4 Model B',
    sectorNum: 1,
    lat: 23.7535,
    lng: 86.4225,
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
    name: 'Sector-2 Master Hub',
    code: 'RPI4-SEC2-HUB',
    hardwareModel: 'Raspberry Pi 4 Model B',
    sectorNum: 2,
    lat: 23.7465,
    lng: 86.4175,
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
  const { nodes, topologyData } = useGeoSentinel();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('MASTER-S1');
  const [disabledNodeIds, setDisabledNodeIds] = useState<string[]>([]);
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'wifi' | 'lora'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamically project real GPS coordinates (lat, lng) to canvas coordinates (x, y)
  const computedTopology = useMemo(() => {
    if (topologyData && topologyData.nodes && topologyData.nodes.length > 0) {
      return {
        nodes: topologyData.nodes,
        links: topologyData.links,
        metrics: topologyData.metrics,
      };
    }

    // Local dynamic fallback projection
    const allRawPoints: Array<{
      id: string;
      name: string;
      code: string;
      lat: number;
      lng: number;
      role: 'master' | 'node';
      sector: number;
      status: string;
      meshHopCount: number;
      parentNodeId?: string;
      masterId?: string;
      readings?: any;
    }> = [];

    SECTOR_MASTERS.forEach((m) => {
      allRawPoints.push({
        id: m.id,
        name: m.name,
        code: m.code,
        lat: m.lat,
        lng: m.lng,
        role: 'master',
        sector: m.sectorNum || 1,
        status: m.status,
        meshHopCount: 0,
      });
    });

    nodes.forEach((n) => {
      allRawPoints.push({
        id: n.id,
        name: n.name,
        code: n.code,
        lat: n.lat || 23.7500,
        lng: n.lng || 86.4200,
        role: 'node',
        sector: n.sector || (n.id.startsWith('NODE-X') || n.id.startsWith('NODE-Y') ? 2 : 1),
        status: n.status || 'online',
        meshHopCount: n.meshHopCount || 1,
        parentNodeId: n.parentNodeId || undefined,
        masterId: n.masterId || undefined,
        readings: n.readings,
      });
    });

    const lats = allRawPoints.map((p) => p.lat);
    const lngs = allRawPoints.map((p) => p.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = Math.max(maxLat - minLat, 0.005);
    const lngSpan = Math.max(maxLng - minLng, 0.005);

    const mappedNodes: TopologyNode[] = allRawPoints.map((p) => {
      const normX = 100 + ((p.lng - minLng) / lngSpan) * 800;
      const normY = 430 - ((p.lat - minLat) / latSpan) * 350;

      let colorPrimary = '#22c55e';
      let colorBorder = '#86efac';
      let badgeLabel = 'Pod';

      if (p.role === 'master') {
        colorPrimary = '#a855f7';
        colorBorder = '#d8b4fe';
        badgeLabel = 'Master Hub';
      } else if (p.status === 'critical') {
        colorPrimary = '#ef4444';
        colorBorder = '#fca5a5';
        badgeLabel = 'Critical';
      } else if (p.status === 'warning') {
        colorPrimary = '#f59e0b';
        colorBorder = '#fde68a';
        badgeLabel = 'Warning';
      }

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        role: p.role,
        sector: p.sector,
        status: p.status,
        lat: p.lat,
        lng: p.lng,
        x: Math.round(normX),
        y: Math.round(normY),
        colorPrimary,
        colorBorder,
        badgeLabel,
        meshHopCount: p.meshHopCount,
        parentNodeId: p.parentNodeId,
        masterId: p.masterId,
        readings: p.readings,
      };
    });

    const links: any[] = [
      {
        id: 'L-MASTERS',
        sourceId: 'MASTER-S1',
        targetId: 'MASTER-S2',
        protocol: 'LoRa 868MHz',
        linkType: 'inter_master_lora',
        rssiDbm: -79,
        packetLossPct: 0.0,
        active: true,
        color: '#c084fc',
        label: 'LoRa 868MHz Inter-Master Bridge',
      },
    ];

    mappedNodes.forEach((n) => {
      if (n.role === 'master') return;
      const targetId = n.parentNodeId || n.masterId || (n.sector === 2 ? 'MASTER-S2' : 'MASTER-S1');
      links.push({
        id: `link-${n.id}-${targetId}`,
        sourceId: n.id,
        targetId: targetId,
        protocol: 'WiFi Mesh 2.4GHz',
        linkType: targetId.startsWith('MASTER') ? 'mesh_direct' : 'mesh_multi_hop',
        rssiDbm: n.readings?.rssiDbm ?? -70,
        packetLossPct: 0.1,
        active: n.status !== 'offline',
        color: '#38bdf8',
        label: `WiFi Mesh Hop ${n.meshHopCount || 1}`,
      });
    });

    return {
      nodes: mappedNodes,
      links,
      metrics: {
        totalNodes: mappedNodes.length,
        masterCount: 2,
        linkCount: links.length,
        packetDeliveryRate: 99.8,
        avgHopCount: 1.4,
        selfHealingStatus: 'Active',
      },
    };
  }, [nodes, topologyData]);

  // Position lookup map
  const nodePositionMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    computedTopology.nodes.forEach((n) => {
      map[n.id] = { x: n.x, y: n.y };
    });
    return map;
  }, [computedTopology]);

  // Filtered nodes by search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return computedTopology.nodes;
    const q = searchQuery.toLowerCase();
    return computedTopology.nodes.filter(
      (n) => n.id.toLowerCase().includes(q) || n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q)
    );
  }, [computedTopology.nodes, searchQuery]);

  // Dynamic active links with simulated failover
  const activeLinks = useMemo(() => {
    return computedTopology.links.map((link) => {
      const isSrcDisabled = disabledNodeIds.includes(link.sourceId);
      const isTgtDisabled = disabledNodeIds.includes(link.targetId);

      let targetId = link.targetId;
      let isFailover = false;

      if (isTgtDisabled) {
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

      const isLinkActive = !isSrcDisabled && (!isTgtDisabled || isFailover);

      return {
        ...link,
        targetId,
        isFailover,
        isLinkActive,
      };
    });
  }, [computedTopology, disabledNodeIds]);

  const toggleNodeFailure = (id: string) => {
    setDisabledNodeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedMaster = SECTOR_MASTERS.find((m) => m.id === selectedNodeId);
  const selectedNode = computedTopology.nodes.find((n) => n.id === selectedNodeId);

  // Quick summary counts
  const totalPodCount = computedTopology.nodes.filter(n => n.role !== 'master').length;
  const criticalCount = computedTopology.nodes.filter(n => n.status === 'critical').length;
  const warningCount = computedTopology.nodes.filter(n => n.status === 'warning').length;
  const normalCount = totalPodCount - criticalCount - warningCount;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans select-none text-white">
      {/* 1. TOP STATS ROW (Matching Image 2 Aesthetic) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Active Mesh Pods */}
        <div className="p-5 rounded-2xl bg-[#0b0d12] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-white/60">
            <span>Mesh Pods</span>
            <Radio size={15} className="text-[#38bdf8]" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-semibold tracking-tight text-white">{totalPodCount}</div>
            <div className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              {normalCount} Normal • {criticalCount + warningCount} Elevated
            </div>
          </div>
        </div>

        {/* Card 2: Sector Master Hubs */}
        <div className="p-5 rounded-2xl bg-[#0b0d12] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-white/60">
            <span>Sector Masters</span>
            <Server size={15} className="text-[#a855f7]" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-semibold tracking-tight text-[#d8b4fe]">2</div>
            <div className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
              Raspberry Pi 4 Edge Gateways
            </div>
          </div>
        </div>

        {/* Card 3: Packet Delivery Rate */}
        <div className="p-5 rounded-2xl bg-[#0b0d12] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-white/60">
            <span>Packet Delivery</span>
            <CheckCircle2 size={15} className="text-[#22c55e]" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-semibold tracking-tight text-[#22c55e]">99.8%</div>
            <div className="text-xs text-white/40 mt-1">
              0.02% Packet Loss Rate
            </div>
          </div>
        </div>

        {/* Card 4: Average Latency / Hops */}
        <div className="p-5 rounded-2xl bg-[#0b0d12] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-white/60">
            <span>Average Latency</span>
            <Clock size={15} className="text-[#38bdf8]" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-semibold tracking-tight text-white">12 ms</div>
            <div className="text-xs text-white/40 mt-1">
              1.4 Average Hop Distance
            </div>
          </div>
        </div>

        {/* Card 5: Self-Healing State */}
        <div className="p-5 rounded-2xl bg-[#0b0d12] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-medium text-white/60">
            <span>Self-Healing Mesh</span>
            <ShieldCheck size={15} className="text-[#a3e635]" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-semibold tracking-tight text-[#a3e635]">Armed</div>
            <div className="text-xs text-white/40 mt-1">
              LoRa 868MHz Auto-Failover
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROLS (Matching Image 2 Dropdown Bar Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* All Links */}
          <button
            onClick={() => setProtocolFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              protocolFilter === 'all'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-[#0f1217] border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20'
            }`}
          >
            <Layers size={14} />
            <span>All Links ({activeLinks.length})</span>
          </button>

          {/* WiFi Mesh Filter */}
          <button
            onClick={() => setProtocolFilter('wifi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              protocolFilter === 'wifi'
                ? 'bg-[#38bdf8] text-black font-semibold shadow-sm'
                : 'bg-[#0f1217] border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20'
            }`}
          >
            <Wifi size={14} className={protocolFilter === 'wifi' ? 'text-black' : 'text-[#38bdf8]'} />
            <span>WiFi Mesh (2.4GHz)</span>
          </button>

          {/* LoRa Bridge Filter */}
          <button
            onClick={() => setProtocolFilter('lora')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              protocolFilter === 'lora'
                ? 'bg-[#a855f7] text-white font-semibold shadow-sm'
                : 'bg-[#0f1217] border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20'
            }`}
          >
            <Radio size={14} className={protocolFilter === 'lora' ? 'text-white' : 'text-[#c084fc]'} />
            <span>LoRa SX1278 (868MHz)</span>
          </button>
        </div>

        {/* Right Search Box */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search node ID or master..."
            className="w-full bg-[#0f1217] border border-white/[0.08] focus:border-[#a3e635]/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. MAIN GRAPH CANVAS & INSPECTOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive SVG Graph Canvas */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0b0d12] border border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            {/* Header with Title and Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Interactive Mesh Routing Graph
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Dynamic GPS-projected IoT topology with real-time packet transmission
                </p>
              </div>

              {/* Clean Legend Chips */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/70">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/30 text-[#d8b4fe] font-medium">
                  <span className="w-2 h-2 rounded-[2px] bg-[#a855f7]" />
                  Master Hub
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#86efac] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  Normal Pod
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#fca5a5] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                  Critical
                </span>
              </div>
            </div>

            {/* SVG Visualizer Canvas */}
            <div className="relative w-full aspect-[16/10] bg-[#050608] rounded-xl border border-white/[0.06] overflow-hidden flex items-center justify-center">
              {/* Subtle Grid Accent */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.2) 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Sector Overlay Labels */}
              <div className="absolute top-3 left-4 text-[11px] font-medium text-[#38bdf8]/70 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]/40 border border-[#38bdf8]" />
                Sector 1 (North Overburden Ridge)
              </div>
              <div className="absolute top-3 right-4 text-[11px] font-medium text-[#c084fc]/70 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c084fc]/40 border border-[#c084fc]" />
                Sector 2 (East Highwall &amp; Buffer)
              </div>

              <svg viewBox="0 0 1000 500" className="w-full h-full">
                <defs>
                  <filter id="glow-wifi-link" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-lora-link" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Draw Mesh Links */}
                {activeLinks.map((link) => {
                  const src = nodePositionMap[link.sourceId];
                  const tgt = nodePositionMap[link.targetId];
                  if (!src || !tgt) return null;

                  const isLora = link.protocol.includes('LoRa');
                  if (protocolFilter === 'wifi' && isLora) return null;
                  if (protocolFilter === 'lora' && !isLora) return null;

                  const strokeColor = !link.isLinkActive ? '#262d3d' :
                    link.isFailover ? '#f59e0b' :
                    isLora ? '#c084fc' : '#38bdf8';

                  return (
                    <g key={link.id}>
                      {/* Base Track */}
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={strokeColor}
                        strokeWidth={isLora ? '2.5' : '1.8'}
                        strokeDasharray={!link.isLinkActive ? '4,4' : isLora ? '6,6' : link.isFailover ? '5,5' : undefined}
                        strokeOpacity={link.isLinkActive ? 0.75 : 0.25}
                      />

                      {/* Moving Animated Packet Particle */}
                      {link.isLinkActive && (
                        <circle 
                          r={isLora ? '4' : '3'} 
                          fill={strokeColor} 
                          filter={isLora ? 'url(#glow-lora-link)' : 'url(#glow-wifi-link)'}
                        >
                          <animateMotion
                            path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                            dur={`${isLora ? 2.2 : 1.6}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Signal Strength Badge */}
                      <text
                        x={(src.x + tgt.x) / 2}
                        y={(src.y + tgt.y) / 2 - 8}
                        fill={link.isLinkActive ? (link.isFailover ? '#f59e0b' : 'rgba(255,255,255,0.7)') : '#64748b'}
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fontWeight="600"
                      >
                        {link.isLinkActive ? `${link.rssiDbm} dBm` : 'DISCONNECTED'}
                      </text>
                    </g>
                  );
                })}

                {/* Draw Nodes & Master Hubs */}
                {filteredNodes.map((node) => {
                  const isDisabled = disabledNodeIds.includes(node.id);
                  const isSelected = selectedNodeId === node.id;
                  const isMaster = node.role === 'master';
                  const isCritical = node.status === 'critical';

                  let strokeColor = node.colorBorder || '#22c55e';
                  let fillColor = node.colorPrimary || '#22c55e';

                  if (isDisabled) {
                    fillColor = '#1f293d';
                    strokeColor = '#475569';
                  }

                  return (
                    <g 
                      key={node.id} 
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      {/* Pulsing Alert Ring for Critical Nodes */}
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

                      {/* Selection Ring */}
                      {isSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isMaster ? '26' : '22'}
                          fill="none"
                          stroke={isMaster ? '#c084fc' : '#a3e635'}
                          strokeWidth="2.5"
                          strokeDasharray="4,3"
                        />
                      )}

                      {/* Node Shape */}
                      {isMaster ? (
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

                      {/* Inner Indicator */}
                      {isMaster ? (
                        <text
                          x={node.x}
                          y={node.y + 4}
                          fill={isDisabled ? '#64748b' : '#d8b4fe'}
                          fontSize="9"
                          fontWeight="800"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                        >
                          HUB
                        </text>
                      ) : (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={5}
                          fill={fillColor}
                        />
                      )}

                      {/* Node ID Label */}
                      <text
                        x={node.x}
                        y={node.y + (isMaster ? 32 : 28)}
                        fill={isDisabled ? '#64748b' : '#ffffff'}
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                      >
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Footer Info Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50 pt-4 border-t border-white/[0.08] mt-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a3e635]" />
              Self-Healing Protocol: <strong className="text-white">Active</strong>
            </span>
            <span>Mesh Topology: <strong className="text-white">Dynamic Auto-Routed</strong></span>
            <span>WAN Gateway Bridge: <strong className="text-[#38bdf8]">Online</strong></span>
          </div>
        </div>

        {/* Right: Selected Node Telemetry Inspector (Matching Image 2 Card Design) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0b0d12] border border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            {/* Inspector Title Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div>
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider block">
                  Node Inspector
                </span>
                <h4 className="text-lg font-semibold text-white mt-0.5">
                  {selectedNodeId}
                </h4>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#111318] border border-white/10 text-[#38bdf8]">
                {selectedMaster ? 'Master Hub' : selectedNode?.badgeLabel || 'Telemetry Pod'}
              </span>
            </div>

            {/* Inspecting Master Gateway */}
            {selectedMaster ? (
              <div className="space-y-4">
                {/* Master Hub Banner Box */}
                <div className="p-4 rounded-xl bg-[#120a1f] border border-[#a855f7]/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#c084fc] font-semibold">Raspberry Pi 4 Master Gateway</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#4ade80] font-semibold text-[10px]">
                      Online
                    </span>
                  </div>
                  <div className="text-base font-semibold text-white mt-1.5">{selectedMaster.name}</div>
                  <div className="text-xs text-white/50 font-mono mt-1">
                    {selectedMaster.ip} • {selectedMaster.mac}
                  </div>
                </div>

                {/* 2-Column Metric Tiles (Matching Image 2 Box Style) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">Edge AI Engine</div>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-[#38bdf8]">TFLite</div>
                      <div className="text-xs text-white/40 mt-0.5">{selectedMaster.edgeAiInferenceFps} FPS Live</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">GSM Modem</div>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-[#4ade80]">SIM7600</div>
                      <div className="text-xs text-white/40 mt-0.5">5/5 Bars • SMS Ready</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">Solar MPPT</div>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-[#fbbf24]">{selectedMaster.solarMpptWatts}W</div>
                      <div className="text-xs text-white/40 mt-0.5">Battery {selectedMaster.batteryPct}%</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">CPU &amp; Memory</div>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-white">{selectedMaster.cpuTempC}°C</div>
                      <div className="text-xs text-white/40 mt-0.5">RAM Usage {selectedMaster.ramUsagePct}%</div>
                    </div>
                  </div>
                </div>

                {/* Network Routing Summary */}
                <div className="p-3.5 rounded-xl bg-[#111318] border border-white/[0.06] text-xs space-y-1.5">
                  <div className="flex justify-between text-white/60">
                    <span>LoRa Inter-Master Bridge:</span>
                    <span className="text-[#c084fc] font-semibold">SX1278 868MHz Synchronized</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>WiFi Captive Hotspot:</span>
                    <span className="text-white font-mono">{selectedMaster.wifiHotspotSsid}</span>
                  </div>
                </div>
              </div>
            ) : selectedNode ? (
              /* Inspecting ESP32-S3 Pod */
              <div className="space-y-4">
                {/* Pod Banner Box */}
                <div className="p-4 rounded-xl bg-[#11141d] border border-white/[0.08]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#38bdf8] font-semibold">ESP32-S3 Multi-Sensor Station</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                      selectedNode.status === 'critical' ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                      selectedNode.status === 'warning' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                      'bg-[#22c55e]/20 text-[#22c55e]'
                    }`}>
                      {selectedNode.status.charAt(0).toUpperCase() + selectedNode.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-base font-semibold text-white mt-1.5">{selectedNode.name}</div>
                  <div className="text-xs text-white/50 font-mono mt-1">
                    {selectedNode.lat.toFixed(4)}°N, {selectedNode.lng.toFixed(4)}°E • Sector {selectedNode.sector}
                  </div>
                </div>

                {/* 2-Column Sensor Metric Cards (Matching Image 2 Style) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">BNO085 Tilt</div>
                    <div className="mt-2">
                      <div className={`text-2xl font-bold tracking-tight ${
                        (selectedNode.readings?.tiltDeg ?? 0) >= 5 ? 'text-[#ef4444]' : 'text-white'
                      }`}>
                        {(selectedNode.readings?.tiltDeg ?? 0).toFixed(2)}°
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">Strata Inclination</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">BNO085 Vibration</div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold tracking-tight text-white">
                        {(selectedNode.readings?.vibrationMmS ?? 0).toFixed(1)} <span className="text-xs font-normal text-white/40">mm/s</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">Peak Particle Velocity</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">Soil Moisture</div>
                    <div className="mt-2">
                      <div className={`text-2xl font-bold tracking-tight ${
                        (selectedNode.readings?.soilMoisturePct ?? 50) >= 75 ? 'text-[#ef4444]' : 'text-[#4ade80]'
                      }`}>
                        {(selectedNode.readings?.soilMoisturePct ?? 50).toFixed(0)}%
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">Pore Saturation</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">Temperature</div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold tracking-tight text-white">
                        {(selectedNode.readings?.tempC ?? 27.5).toFixed(1)}°C
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">BME280 Ambient</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">Battery Level</div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold tracking-tight text-[#22c55e]">
                        {selectedNode.readings?.batteryPct ?? 95}%
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">LiFePO4 Solar Pod</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between">
                    <div className="text-xs font-medium text-white/60">Signal Strength</div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold tracking-tight text-[#38bdf8]">
                        {selectedNode.readings?.rssiDbm ?? -70} <span className="text-xs font-normal text-white/40">dBm</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">WiFi / LoRa RSSI</div>
                    </div>
                  </div>
                </div>

                {/* Mesh Hop Routing Summary */}
                <div className="p-3.5 rounded-xl bg-[#111318] border border-white/[0.06] text-xs space-y-1.5">
                  <div className="flex justify-between text-white/60">
                    <span>Uplink Destination:</span>
                    <span className="text-white font-medium">
                      {selectedNode.parentNodeId || (selectedNode.sector === 2 ? 'MASTER-S2' : 'MASTER-S1')}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Mesh Hop Level:</span>
                    <span className="text-[#a3e635] font-semibold">Hop {selectedNode.meshHopCount || 1}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Simulate Failure Action Button */}
          {selectedNodeId && (
            <div className="pt-4 border-t border-white/[0.08] mt-4">
              <button
                onClick={() => toggleNodeFailure(selectedNodeId)}
                className={`w-full py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                  disabledNodeIds.includes(selectedNodeId)
                    ? 'bg-[#22c55e] text-black hover:bg-[#16a34a]'
                    : 'bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/25'
                }`}
              >
                {disabledNodeIds.includes(selectedNodeId)
                  ? `Restore ${selectedNodeId}`
                  : `Simulate Failure (${selectedNodeId})`}
              </button>
              <p className="text-[11px] text-white/40 text-center mt-2">
                Simulates real-world hardware failure to demonstrate automatic self-healing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
