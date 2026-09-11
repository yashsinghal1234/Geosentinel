import React, { useState, useMemo, useEffect } from 'react';
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
  CheckCircle2,
  X,
  Maximize2,
  Activity,
  Cpu,
  Zap,
  Sliders,
  CloudRain,
  Check,
  TrendingUp,
  Volume2
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
  const { nodes, topologyData, triggerEdgeSiren } = useGeoSentinel();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('MASTER-S1');
  const [disabledNodeIds, setDisabledNodeIds] = useState<string[]>([]);
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'wifi' | 'lora'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'telemetry' | 'trends' | 'routing' | 'calibration'>('telemetry');
  const [tiltThresholdWarning, setTiltThresholdWarning] = useState<number>(5.0);
  const [tiltThresholdCritical, setTiltThresholdCritical] = useState<number>(10.0);
  const [isCalibratedSaved, setIsCalibratedSaved] = useState<boolean>(false);
  const [isSirenTriggered, setIsSirenTriggered] = useState<boolean>(false);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDetailModalOpen(false);
      }
    };
    if (isDetailModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailModalOpen]);

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
  const fullSensorNode = nodes.find((n) => n.id === selectedNodeId);

  // Subordinate nodes under selected master
  const subordinateNodes = useMemo(() => {
    if (!selectedMaster) return [];
    return computedTopology.nodes.filter(
      (n) => n.role !== 'master' && (n.masterId === selectedMaster.id || (selectedMaster.sectorNum === 2 ? n.sector === 2 : n.sector === 1))
    );
  }, [computedTopology.nodes, selectedMaster]);

  // Quick summary counts
  const totalPodCount = computedTopology.nodes.filter(n => n.role !== 'master').length;
  const criticalCount = computedTopology.nodes.filter(n => n.status === 'critical').length;
  const warningCount = computedTopology.nodes.filter(n => n.status === 'warning').length;
  const normalCount = totalPodCount - criticalCount - warningCount;

  // Open modal handler
  const handleOpenDetailModal = (nodeId?: string) => {
    if (nodeId) {
      setSelectedNodeId(nodeId);
    }
    setIsDetailModalOpen(true);
  };

  const handleSaveCalibration = () => {
    setIsCalibratedSaved(true);
    setTimeout(() => setIsCalibratedSaved(false), 2500);
  };

  const handleTestSiren = () => {
    setIsSirenTriggered(true);
    if (triggerEdgeSiren) {
      triggerEdgeSiren(true);
    }
    setTimeout(() => {
      setIsSirenTriggered(false);
      if (triggerEdgeSiren) {
        triggerEdgeSiren(false);
      }
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans select-none text-white">
      {/* 1. TOP STATS ROW */}
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

      {/* 2. FILTER & SEARCH CONTROLS */}
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
                  Click any node to inspect &amp; open deep telemetry telemetry analytics
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
                      onClick={() => {
                        setSelectedNodeId(node.id);
                      }}
                      onDoubleClick={() => {
                        handleOpenDetailModal(node.id);
                      }}
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

        {/* Right: Selected Node Telemetry Inspector */}
        <div 
          className="lg:col-span-4 p-6 rounded-2xl bg-[#0b0d12] border border-white/[0.08] hover:border-white/20 transition-all shadow-2xl flex flex-col justify-between group cursor-pointer"
          onClick={() => handleOpenDetailModal()}
        >
          <div>
            {/* Inspector Title Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div>
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider block">
                  Node Inspector
                </span>
                <h4 className="text-lg font-semibold text-white mt-0.5 flex items-center gap-2">
                  {selectedNodeId}
                  <span className="text-[11px] font-mono text-[#a3e635] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-normal">
                    <Maximize2 size={12} /> Open Modal
                  </span>
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#111318] border border-white/10 text-[#38bdf8]">
                  {selectedMaster ? 'Master Hub' : selectedNode?.badgeLabel || 'Telemetry Pod'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetailModal();
                  }}
                  title="Open full telemetry modal"
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            {/* Inspecting Master Gateway */}
            {selectedMaster ? (
              <div className="space-y-4">
                {/* Master Hub Banner Box */}
                <div className="p-4 rounded-xl bg-[#120a1f] border border-[#a855f7]/30 hover:border-[#a855f7]/60 transition-all">
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

                {/* 2-Column Metric Tiles */}
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
                <div className="p-4 rounded-xl bg-[#11141d] border border-white/[0.08] hover:border-[#38bdf8]/40 transition-all">
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

                {/* 2-Column Sensor Metric Cards */}
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

          {/* Click to open full details banner */}
          <div className="pt-3">
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#a3e635]/40 text-center text-xs text-[#a3e635] font-medium flex items-center justify-center gap-2 transition-all">
              <Maximize2 size={13} />
              <span>Click to Open Full Telemetry &amp; Diagnostics Modal</span>
            </div>
          </div>

          {/* Simulate Failure Action Button */}
          {selectedNodeId && (
            <div className="pt-3 border-t border-white/[0.08] mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeFailure(selectedNodeId);
                }}
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

      {/* ========================================================================= */}
      {/* 4. FULL DEEP-DIVE TELEMETRY & DIAGNOSTICS MODAL                           */}
      {/* ========================================================================= */}
      {isDetailModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-5xl max-h-[92vh] bg-[#090b10] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header Bar */}
            <div className="px-6 py-5 border-b border-white/10 bg-[#0f1218] flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`p-3 rounded-xl ${
                  selectedMaster 
                    ? 'bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#d8b4fe]' 
                    : 'bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8]'
                }`}>
                  {selectedMaster ? <Server size={22} /> : <Radio size={22} />}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-bold tracking-tight text-white font-mono">
                      {selectedNodeId}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                      Live Synchronized
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-white/70">
                      Sector {selectedMaster ? selectedMaster.sectorNum : selectedNode?.sector || 1}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5 font-sans">
                    {selectedMaster 
                      ? `${selectedMaster.hardwareModel} • Edge AI Gateway & GSM WAN Uplink`
                      : `${fullSensorNode?.hardwareModel || 'ESP32-S3 Dual-Core'} • 6-DoF Inertial + Soil Saturation + BME280`}
                  </p>
                </div>
              </div>

              {/* Quick Node Switcher & Close */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="bg-[#161a23] border border-white/10 text-xs text-white rounded-xl px-3 py-2 outline-none font-mono cursor-pointer"
                >
                  <optgroup label="Sector Master Gateways">
                    {SECTOR_MASTERS.map((m) => (
                      <option key={m.id} value={m.id}>{m.id} ({m.name})</option>
                    ))}
                  </optgroup>
                  <optgroup label="ESP32-S3 Sensor Pods">
                    {computedTopology.nodes.filter(n => n.role !== 'master').map((n) => (
                      <option key={n.id} value={n.id}>{n.id} - {n.name}</option>
                    ))}
                  </optgroup>
                </select>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 py-2.5 bg-[#0a0c10] border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setModalTab('telemetry')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  modalTab === 'telemetry'
                    ? 'bg-[#a3e635] text-black font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity size={13} />
                <span>Live Telemetry &amp; Gauges</span>
              </button>

              <button
                onClick={() => setModalTab('trends')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  modalTab === 'trends'
                    ? 'bg-[#38bdf8] text-black font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp size={13} />
                <span>24h Time-Series &amp; Trends</span>
              </button>

              <button
                onClick={() => setModalTab('routing')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  modalTab === 'routing'
                    ? 'bg-[#c084fc] text-black font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers size={13} />
                <span>Mesh Routing &amp; Array</span>
              </button>

              <button
                onClick={() => setModalTab('calibration')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  modalTab === 'calibration'
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders size={13} />
                <span>Calibration &amp; Actions</span>
              </button>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-160px)] space-y-6">
              
              {/* TAB 1: LIVE TELEMETRY & GAUGES */}
              {modalTab === 'telemetry' && (
                <div className="space-y-6">
                  {selectedMaster ? (
                    /* Master Gateway Diagnostics */
                    <div className="space-y-6">
                      {/* Top Master Specs Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-[#11141c] border border-white/[0.08]">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>CPU Temp</span>
                            <Cpu size={14} className="text-[#38bdf8]" />
                          </div>
                          <div className="text-2xl font-bold text-white mt-1">{selectedMaster.cpuTempC}°C</div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-[#38bdf8] h-full rounded-full" style={{ width: `${(selectedMaster.cpuTempC / 80) * 100}%` }} />
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#11141c] border border-white/[0.08]">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>RAM Usage</span>
                            <Server size={14} className="text-[#a855f7]" />
                          </div>
                          <div className="text-2xl font-bold text-[#d8b4fe] mt-1">{selectedMaster.ramUsagePct}%</div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-[#a855f7] h-full rounded-full" style={{ width: `${selectedMaster.ramUsagePct}%` }} />
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#11141c] border border-white/[0.08]">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>Solar MPPT</span>
                            <Zap size={14} className="text-[#fbbf24]" />
                          </div>
                          <div className="text-2xl font-bold text-[#fbbf24] mt-1">{selectedMaster.solarMpptWatts}W</div>
                          <div className="text-[11px] text-white/40 mt-1">13.8V Float Charging</div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#11141c] border border-white/[0.08]">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>Battery Status</span>
                            <Zap size={14} className="text-[#22c55e]" />
                          </div>
                          <div className="text-2xl font-bold text-[#4ade80] mt-1">{selectedMaster.batteryPct}%</div>
                          <div className="text-[11px] text-[#22c55e] mt-1">LiFePO4 Reserve Optimal</div>
                        </div>
                      </div>

                      {/* Edge AI & GSM Array Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl bg-[#120a1f] border border-[#a855f7]/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-[#d8b4fe] flex items-center gap-2">
                              <Cpu size={16} /> Edge AI Inference Engine
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-[#a855f7]/30 text-[#d8b4fe] text-[10px] font-mono">
                              TFLite Strata-Net
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-black/40">
                              <span className="text-white/50 block">Inference Speed</span>
                              <span className="text-base font-bold text-white mt-0.5 block">{selectedMaster.edgeAiInferenceFps} FPS</span>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40">
                              <span className="text-white/50 block">Hazard Probability</span>
                              <span className="text-base font-bold text-[#22c55e] mt-0.5 block">0.04% (Low)</span>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40">
                              <span className="text-white/50 block">Quantization</span>
                              <span className="text-white font-mono mt-0.5 block">INT8 EdgeTPU</span>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40">
                              <span className="text-white/50 block">Frame Latency</span>
                              <span className="text-white font-mono mt-0.5 block">68.5 ms</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 rounded-xl bg-[#0c1824] border border-[#38bdf8]/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-[#38bdf8] flex items-center gap-2">
                              <Radio size={16} /> Cellular WAN Modem
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-[#38bdf8]/30 text-[#38bdf8] text-[10px] font-mono">
                              SIM7600 4G LTE
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-black/40">
                              <span className="text-white/50 block">Signal Quality</span>
                              <span className="text-base font-bold text-[#4ade80] mt-0.5 block">5 / 5 Bars (-58 dBm)</span>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40">
                              <span className="text-white/50 block">SMS Gateway</span>
                              <span className="text-base font-bold text-white mt-0.5 block">Armed (Ready)</span>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40">
                              <span className="text-white/50 block">Local IP</span>
                              <span className="text-white font-mono mt-0.5 block">{selectedMaster.ip}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40">
                              <span className="text-white/50 block">Hardware MAC</span>
                              <span className="text-white font-mono mt-0.5 block">{selectedMaster.mac}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subordinate Pods List */}
                      <div className="p-5 rounded-xl bg-[#11141c] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Radio size={15} className="text-[#38bdf8]" />
                            Subordinate Multi-Sensor Pods ({subordinateNodes.length})
                          </h4>
                          <span className="text-xs text-white/50">Direct WiFi &amp; LoRa child links</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {subordinateNodes.map((sub) => (
                            <div
                              key={sub.id}
                              onClick={() => setSelectedNodeId(sub.id)}
                              className="p-3 rounded-xl bg-[#090b10] border border-white/[0.06] hover:border-[#38bdf8]/50 transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-white">{sub.id}</span>
                                <span className={`w-2 h-2 rounded-full ${
                                  sub.status === 'critical' ? 'bg-[#ef4444] animate-pulse' :
                                  sub.status === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'
                                }`} />
                              </div>
                              <div className="text-[11px] text-white/60 mt-1 truncate">{sub.name}</div>
                              <div className="flex items-center justify-between text-[10px] text-white/40 mt-2 font-mono">
                                <span>Tilt: {(sub.readings?.tiltDeg ?? 0).toFixed(1)}°</span>
                                <span>Bat: {sub.readings?.batteryPct ?? 95}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : selectedNode ? (
                    /* ESP32-S3 Pod Diagnostics */
                    <div className="space-y-6">
                      {/* Top 4 Sensor Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-[#11141c] border border-white/[0.08]">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>BNO085 Tilt</span>
                            <Activity size={14} className="text-[#38bdf8]" />
                          </div>
                          <div className={`text-2xl font-bold mt-1 ${
                            (selectedNode.readings?.tiltDeg ?? 0) >= 5 ? 'text-[#ef4444]' : 'text-white'
                          }`}>
                            {(selectedNode.readings?.tiltDeg ?? 0).toFixed(2)}°
                          </div>
                          <div className="text-[11px] text-white/40 mt-1">Pitch/Roll Resultant</div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#11141c] border border-white/[0.08]">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>PPV Vibration</span>
                            <Zap size={14} className="text-[#f59e0b]" />
                          </div>
                          <div className="text-2xl font-bold text-white mt-1">
                            {(selectedNode.readings?.vibrationMmS ?? 0).toFixed(1)} <span className="text-xs font-normal text-white/40">mm/s</span>
                          </div>
                          <div className="text-[11px] text-white/40 mt-1">Peak Particle Velocity</div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#11141c] border border-white/[0.08]">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>Soil Saturation</span>
                            <CloudRain size={14} className="text-[#4ade80]" />
                          </div>
                          <div className={`text-2xl font-bold mt-1 ${
                            (selectedNode.readings?.soilMoisturePct ?? 50) >= 75 ? 'text-[#ef4444]' : 'text-[#4ade80]'
                          }`}>
                            {(selectedNode.readings?.soilMoisturePct ?? 50).toFixed(0)}%
                          </div>
                          <div className="text-[11px] text-white/40 mt-1">Capacitive VWC Probe</div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#11141c] border border-white/[0.08]">
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>Battery &amp; RF</span>
                            <Zap size={14} className="text-[#22c55e]" />
                          </div>
                          <div className="text-2xl font-bold text-[#22c55e] mt-1">
                            {selectedNode.readings?.batteryPct ?? 95}%
                          </div>
                          <div className="text-[11px] text-white/40 mt-1 font-mono">
                            {selectedNode.readings?.rssiDbm ?? -70} dBm Signal
                          </div>
                        </div>
                      </div>

                      {/* Detailed Sensor Breakdown 2-Col */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 6-DoF Inertial Breakdown */}
                        <div className="p-5 rounded-xl bg-[#0f131a] border border-white/[0.08] space-y-3">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Activity size={15} className="text-[#38bdf8]" />
                            BNO085 9-DoF Inertial Sensor Telemetry
                          </h4>
                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between p-2.5 rounded-lg bg-black/40">
                              <span className="text-white/60">Pitch Angle (X-Axis):</span>
                              <span className="text-white font-bold">{((selectedNode.readings?.tiltDeg ?? 1.2) * 0.7).toFixed(2)}°</span>
                            </div>
                            <div className="flex justify-between p-2.5 rounded-lg bg-black/40">
                              <span className="text-white/60">Roll Angle (Y-Axis):</span>
                              <span className="text-white font-bold">{((selectedNode.readings?.tiltDeg ?? 1.2) * 0.65).toFixed(2)}°</span>
                            </div>
                            <div className="flex justify-between p-2.5 rounded-lg bg-black/40">
                              <span className="text-white/60">Heading Azimuth (Yaw):</span>
                              <span className="text-white font-bold">{((selectedNode.lng * 10) % 360).toFixed(1)}° NNE</span>
                            </div>
                            <div className="flex justify-between p-2.5 rounded-lg bg-black/40">
                              <span className="text-white/60">Dynamic Acceleration:</span>
                              <span className="text-[#38bdf8] font-bold">{(((selectedNode.readings?.vibrationMmS ?? 0.8) / 98) + 0.98).toFixed(3)} g</span>
                            </div>
                          </div>
                        </div>

                        {/* Environmental BME280 & Soil Probe */}
                        <div className="p-5 rounded-xl bg-[#0f131a] border border-white/[0.08] space-y-3">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <CloudRain size={15} className="text-[#4ade80]" />
                            Environmental &amp; Geotechnical Parameters
                          </h4>
                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between p-2.5 rounded-lg bg-black/40">
                              <span className="text-white/60">Ambient Temperature:</span>
                              <span className="text-white font-bold">{(selectedNode.readings?.tempC ?? 27.5).toFixed(1)} °C</span>
                            </div>
                            <div className="flex justify-between p-2.5 rounded-lg bg-black/40">
                              <span className="text-white/60">Relative Humidity:</span>
                              <span className="text-white font-bold">{((selectedNode.readings?.soilMoisturePct ?? 50) + 12).toFixed(0)} %</span>
                            </div>
                            <div className="flex justify-between p-2.5 rounded-lg bg-black/40">
                              <span className="text-white/60">Atmospheric Barometric Pressure:</span>
                              <span className="text-white font-bold">1013.2 hPa</span>
                            </div>
                            <div className="flex justify-between p-2.5 rounded-lg bg-black/40">
                              <span className="text-white/60">Pore Water Liquefaction Risk:</span>
                              <span className={`${(selectedNode.readings?.soilMoisturePct ?? 50) >= 75 ? 'text-[#ef4444]' : 'text-[#22c55e]'} font-bold`}>
                                {(selectedNode.readings?.soilMoisturePct ?? 50) >= 75 ? 'HIGH (Saturated)' : 'NOMINAL (Stable)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* TAB 2: TIME-SERIES & TRENDS */}
              {modalTab === 'trends' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-[#0e1117] border border-white/[0.08] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">24-Hour Strata Displacement &amp; Vibration Oscillations</h4>
                        <p className="text-xs text-white/50 mt-0.5">High-resolution geotechnical displacement rate (mm/hr) vs BNO085 PPV</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-[#38bdf8]">
                          <span className="w-3 h-0.5 bg-[#38bdf8]" />
                          Displacement (mm/hr)
                        </span>
                        <span className="flex items-center gap-1.5 text-[#f59e0b]">
                          <span className="w-3 h-0.5 bg-[#f59e0b]" />
                          Vibration PPV (mm/s)
                        </span>
                      </div>
                    </div>

                    {/* SVG Trend Graph */}
                    <div className="relative w-full h-56 bg-black/50 rounded-xl border border-white/[0.06] p-4 flex items-center justify-center">
                      <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
                        {/* Grid Lines */}
                        <line x1="40" y1="20" x2="780" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <line x1="40" y1="70" x2="780" y2="70" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <line x1="40" y1="120" x2="780" y2="120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <line x1="40" y1="170" x2="780" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                        {/* Critical Warning Level Band */}
                        <line x1="40" y1="50" x2="780" y2="50" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" strokeOpacity="0.4" />
                        <text x="775" y="45" fill="#ef4444" fontSize="9" textAnchor="end" fontFamily="monospace">DGMS CRITICAL 2.5 mm/hr</text>

                        {/* Displacement Curve (Blue) */}
                        <path
                          d="M 40 150 Q 150 145, 250 130 T 450 110 T 600 85 T 780 70"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="3"
                        />
                        <circle cx="780" cy="70" r="4" fill="#38bdf8" className="animate-ping" />
                        <circle cx="780" cy="70" r="4" fill="#38bdf8" />

                        {/* Vibration Curve (Amber) */}
                        <path
                          d="M 40 165 Q 120 160, 220 155 T 380 140 T 520 160 T 660 130 T 780 145"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                        />
                        <circle cx="780" cy="145" r="3.5" fill="#f59e0b" />

                        {/* X-Axis Time Labels */}
                        <text x="40" y="190" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">24h Ago</text>
                        <text x="225" y="190" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">18h Ago</text>
                        <text x="410" y="190" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">12h Ago</text>
                        <text x="595" y="190" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">6h Ago</text>
                        <text x="780" y="190" fill="#a3e635" fontSize="10" fontWeight="bold" textAnchor="end" fontFamily="monospace">Live (Now)</text>
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-[#090b10] border border-white/[0.06]">
                        <span className="text-white/50 block">Cumulative Velocity</span>
                        <span className="text-base font-bold text-white mt-0.5 block">+1.42 mm/24h</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#090b10] border border-white/[0.06]">
                        <span className="text-white/50 block">Peak Blast PPV</span>
                        <span className="text-base font-bold text-[#f59e0b] mt-0.5 block">2.1 mm/s (Safe)</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#090b10] border border-white/[0.06]">
                        <span className="text-white/50 block">Inverse Velocity (1/v)</span>
                        <span className="text-base font-bold text-[#22c55e] mt-0.5 block">0.704 (Stable)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MESH ROUTING & ARRAY */}
              {modalTab === 'routing' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-[#0e1117] border border-white/[0.08] space-y-4">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Layers size={16} className="text-[#c084fc]" />
                      Multi-Hop Mesh Network Topographic Array
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                        <div className="text-[#38bdf8] font-semibold text-[13px]">RF &amp; Physical Link</div>
                        <div className="flex justify-between text-white/70">
                          <span>Protocol:</span>
                          <span className="text-white font-bold">{selectedMaster ? 'LoRa SX1278 868MHz' : 'ESP-NOW / 802.11 b/g/n'}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>RSSI Signal:</span>
                          <span className="text-[#22c55e] font-bold">{selectedMaster ? '-79 dBm (Excellent)' : `${selectedNode?.readings?.rssiDbm ?? -70} dBm`}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Packet Delivery:</span>
                          <span className="text-white font-bold">99.8% (0.02% dropped)</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Mesh Hop Count:</span>
                          <span className="text-[#a3e635] font-bold">{selectedMaster ? '0 (Master Root)' : `Hop ${selectedNode?.meshHopCount || 1}`}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                        <div className="text-[#c084fc] font-semibold text-[13px]">Gateway &amp; Failover Target</div>
                        <div className="flex justify-between text-white/70">
                          <span>Primary Uplink:</span>
                          <span className="text-white font-bold">{selectedMaster ? 'MASTER-S2 (Inter-Bridge)' : (selectedNode?.parentNodeId || 'MASTER-S1')}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Auto-Failover Partner:</span>
                          <span className="text-[#fbbf24] font-bold">{selectedMaster?.id === 'MASTER-S1' ? 'MASTER-S2' : 'MASTER-S1'}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Store-and-Forward Buffer:</span>
                          <span className="text-white font-bold">0 Pending (Flushed)</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Captive Hotspot SSID:</span>
                          <span className="text-white font-bold">{selectedMaster ? selectedMaster.wifiHotspotSsid : 'GEOSENTINEL_MESH_LAN'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CALIBRATION & ACTIONS */}
              {modalTab === 'calibration' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-[#0e1117] border border-white/[0.08] space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Sliders size={16} className="text-[#a3e635]" />
                        Sensor Threshold Calibration &amp; Emergency Override
                      </h4>
                      <p className="text-xs text-white/50 mt-0.5">
                        Calibrate geomechanical warning and evacuation trigger limits for {selectedNodeId}
                      </p>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#f59e0b] font-semibold">Advisory Warning Tilt Threshold</span>
                          <span className="text-white font-bold">{tiltThresholdWarning.toFixed(1)}°</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="15"
                          step="0.5"
                          value={tiltThresholdWarning}
                          onChange={(e) => setTiltThresholdWarning(parseFloat(e.target.value))}
                          className="w-full accent-[#f59e0b] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/40">
                          <span>1.0° (Ultra Sensitive)</span>
                          <span>DGMS Benchmark: 5.0°</span>
                          <span>15.0° (High)</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#ef4444] font-semibold">Critical Evacuation Tilt Threshold</span>
                          <span className="text-white font-bold">{tiltThresholdCritical.toFixed(1)}°</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="25"
                          step="0.5"
                          value={tiltThresholdCritical}
                          onChange={(e) => setTiltThresholdCritical(parseFloat(e.target.value))}
                          className="w-full accent-[#ef4444] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/40">
                          <span>5.0° (Early Alarm)</span>
                          <span>DGMS Standard: 10.0°</span>
                          <span>25.0° (Maximum)</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={handleSaveCalibration}
                        className="px-5 py-2.5 rounded-xl bg-[#a3e635] text-black font-semibold text-xs transition-all hover:bg-[#8ece28] flex items-center gap-2 cursor-pointer"
                      >
                        {isCalibratedSaved ? <Check size={14} /> : <Sliders size={14} />}
                        <span>{isCalibratedSaved ? 'Thresholds Calibrated!' : 'Save Calibration to Node Flash'}</span>
                      </button>

                      {selectedMaster && (
                        <button
                          onClick={handleTestSiren}
                          className="px-5 py-2.5 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/30 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Volume2 size={14} />
                          <span>{isSirenTriggered ? 'Testing 110dB Siren...' : 'Test Sector Master Siren'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleNodeFailure(selectedNodeId)}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                          disabledNodeIds.includes(selectedNodeId)
                            ? 'bg-[#22c55e] text-black hover:bg-[#16a34a]'
                            : 'bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/25'
                        }`}
                      >
                        <ShieldCheck size={14} />
                        <span>{disabledNodeIds.includes(selectedNodeId) ? `Restore ${selectedNodeId}` : `Simulate Failure (${selectedNodeId})`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom Footer Strip */}
            <div className="px-6 py-4 bg-[#0a0c10] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  CRC32 Frame: <strong className="text-white">0x8F4A2B9C Valid</strong>
                </span>
                <span>Uptime: <strong className="text-white">18d 14h 22m</strong></span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
