import React, { useState, useMemo } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { GatewayDevice, TopologyNode } from '../../types';
import { Radio } from '../icons';

// Default Sector Masters matching physical hardware (Raspberry Pi 4)
const SECTOR_MASTERS: GatewayDevice[] = [
  {
    id: 'MASTER-S1',
    name: 'Sector-1 Master Hub (Raspberry Pi 4)',
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
    name: 'Sector-2 Master Hub (Raspberry Pi 4)',
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

  // Dynamically project real GPS coordinates (lat, lng) to Canvas coordinates (x, y)
  const computedTopology = useMemo(() => {
    // If backend provided pre-computed normalized topology, use it
    if (topologyData && topologyData.nodes && topologyData.nodes.length > 0) {
      return {
        nodes: topologyData.nodes,
        links: topologyData.links,
        metrics: topologyData.metrics,
      };
    }

    // Otherwise, dynamically project from active nodes and sector masters locally
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
      // Longitude maps to X (100px to 900px)
      const normX = 100 + ((p.lng - minLng) / lngSpan) * 800;
      // Latitude maps to Y (Inverted: North at 80px, South at 430px)
      const normY = 430 - ((p.lat - minLat) / latSpan) * 350;

      let colorPrimary = '#22c55e'; // Emerald
      let colorBorder = '#86efac';
      let badgeLabel = 'POD';

      if (p.role === 'master') {
        colorPrimary = '#a855f7'; // Purple
        colorBorder = '#d8b4fe';
        badgeLabel = 'MASTER';
      } else if (p.status === 'critical') {
        colorPrimary = '#ef4444'; // Crimson
        colorBorder = '#fca5a5';
        badgeLabel = 'CRITICAL';
      } else if (p.status === 'warning') {
        colorPrimary = '#f59e0b'; // Amber
        colorBorder = '#fde68a';
        badgeLabel = 'WARNING';
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

    // Auto-generate mesh links
    const links: any[] = [];

    // Inter-Master LoRa Bridge
    links.push({
      id: 'L-MASTERS',
      sourceId: 'MASTER-S1',
      targetId: 'MASTER-S2',
      protocol: 'LoRa 868MHz',
      linkType: 'inter_master_lora',
      rssiDbm: -79,
      packetLossPct: 0.0,
      active: true,
      color: '#c084fc',
      label: 'LoRa 868MHz Bridge (ACK Sync)',
    });

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

  // Position map lookup for SVG rendering
  const nodePositionMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    computedTopology.nodes.forEach((n) => {
      map[n.id] = { x: n.x, y: n.y };
    });
    return map;
  }, [computedTopology]);

  // Dynamic active links with simulated failover rerouting
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

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Top Filter & Automatic Network Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[16px] border border-[#181b20] bg-[#0a0c0f] text-xs">
        {/* Left: Health & Multi-tier Protocol Chips */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#8b949e]">
          <div className="flex items-center gap-2 text-white">
            <Radio size={14} className="text-[#a3e635] animate-pulse" />
            <span className="font-bold">Dual-Tier Mesh:</span>
            <span className="px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold border border-[#38bdf8]/30">
              WiFi 2.4GHz (Pods)
            </span>
            <span className="text-[#64748b]">+</span>
            <span className="px-2 py-0.5 rounded bg-[#a855f7]/15 text-[#c084fc] font-bold border border-[#a855f7]/30">
              LoRa 868MHz (RPi Masters)
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span>PDR: <strong className="text-white">99.8%</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
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
            {/* Color-Coded Tactical Legend (NO EMOJIS) */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[3px] bg-[#a855f7] border border-[#d8b4fe]" />
                <span className="text-[#d8b4fe] font-bold">RPi 4 Master Hub</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                <span className="text-white">Normal Pod</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span className="text-[#f59e0b]">Elevated / Warning</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
                <span className="text-[#ef4444]">Critical Breached</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
                <span className="text-[#64748b]">Simulated Dead</span>
              </span>
            </div>
            <span className="text-[10px] text-[#555]">
              Dynamic GPS Auto-Projected
            </span>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full aspect-[16/10] bg-[#06080c] rounded-[14px] border border-[#161a22] overflow-hidden flex items-center justify-center">
            {/* Tactical Grid Background */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.25) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Sector Cluster Labels */}
            <div className="absolute top-3 left-6 text-[10px] font-bold text-[#38bdf8]/60 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              Sector 1 Cluster (North Overburden)
            </div>
            <div className="absolute top-3 right-6 text-[10px] font-bold text-[#c084fc]/60 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
              Sector 2 Cluster (East Highwall)
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
                    {/* Background Line */}
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

                    {/* Dynamic Moving Signal Packet */}
                    {link.isLinkActive && (
                      <circle 
                        r={isLora ? '4' : '3'} 
                        fill={strokeColor} 
                        filter={isLora ? 'url(#glow-lora-purple)' : 'url(#glow-wifi)'}
                      >
                        <animateMotion
                          path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                          dur={`${isLora ? 2.2 : 1.6}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Link Label Meter */}
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 8}
                      fill={link.isLinkActive ? (link.isFailover ? '#f59e0b' : 'rgba(255,255,255,0.6)') : '#475569'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {link.isLinkActive ? `${link.rssiDbm} dBm` : 'DISCONNECTED'}
                    </text>
                  </g>
                );
              })}

              {/* Draw Nodes & Master Hubs */}
              {computedTopology.nodes.map((node) => {
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
                    className="cursor-pointer transition-all hover:scale-110"
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    {/* Pulsing alert ring for critical nodes */}
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
                        r={isMaster ? '26' : '22'}
                        fill="none"
                        stroke={isMaster ? '#c084fc' : '#a3e635'}
                        strokeWidth="2.5"
                        strokeDasharray="4,3"
                      />
                    )}

                    {/* Master Geometric Square vs Pod Circle */}
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

                    {/* Inner Indicator / Tactile Code (NO EMOJIS) */}
                    {isMaster ? (
                      <text
                        x={node.x}
                        y={node.y + 4}
                        fill={isDisabled ? '#64748b' : '#d8b4fe'}
                        fontSize="10"
                        fontWeight="900"
                        fontFamily="monospace"
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

                    {/* Node ID Badge Label */}
                    <text
                      x={node.x}
                      y={node.y + (isMaster ? 32 : 28)}
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
              <span className="text-xs px-2.5 py-0.5 rounded bg-[#161a22] text-[#38bdf8] font-bold border border-[#232731]">
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
                      EDGE ONLINE
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
                    <span className="text-[9px] text-[#94a3b8] block">5/5 Bars • SMS Ready</span>
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
                      {selectedNode.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">{selectedNode.name}</div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">
                    Lat: {selectedNode.lat.toFixed(4)}°N • Lng: {selectedNode.lng.toFixed(4)}°E
                  </div>
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
