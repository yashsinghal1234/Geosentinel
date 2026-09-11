import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Activity, 
  AlertTriangle, 
  AlertOctagon, 
  Battery, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Layers,
  CloudRain,
  Server
} from '../icons';

export const OperatorDashboard: React.FC = () => {
  const {
    filteredNodes,
    gateway,
    risk,
    alerts,
    rainfallRate,
    selectedMine,
    selectedSector,
    availableMines,
    availableSectors,
    triggerManualAlert,
    triggerEdgeSiren,
    selectedNodeId,
    setSelectedNodeId,
  } = useGeoSentinel();

  const [selectedTab, setSelectedTab] = useState<'nodes' | 'alerts'>('nodes');

  const currentMineObj = availableMines.find((m) => m.id === selectedMine) || availableMines[0];
  const currentSectorObj = availableSectors.find((s) => s.id === selectedSector) || availableSectors[0];

  const onlineNodesCount = filteredNodes.filter(n => n.status === 'online').length;
  const warningNodesCount = filteredNodes.filter(n => n.status === 'warning' || n.status === 'critical').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-[#1f1f1f] bg-[#0c0d0e]/90 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a3e635] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a3e635]" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#a1a1aa]">
              Live Operations Terminal
            </span>
            <span className="text-[#333]">•</span>
            <span className="text-[11px] font-mono text-[#a3e635] flex items-center gap-1">
              <MapPin size={11} /> {currentMineObj?.name} ({currentSectorObj?.shortName})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Mining Sector Dashboard
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => triggerEdgeSiren(!gateway.localSirenActive)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              gateway.localSirenActive
                ? 'bg-[#ef4444] text-white border border-[#ef4444] animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'border border-[#262626] bg-[#141517] hover:border-[#404040] text-white/80'
            }`}
          >
            {gateway.localSirenActive ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {gateway.localSirenActive ? 'Siren Active (Click to Silence)' : 'Test Siren Relay'}
          </button>

          <button
            onClick={() => triggerManualAlert(4, currentSectorObj?.name || 'Active Sector', 'Manual warning broadcast initiated by operator.')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold bg-[#ef4444] hover:bg-[#dc2626] text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
          >
            <AlertOctagon size={14} />
            Emergency Alert
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Level Card */}
        <div className="p-4 rounded-xl border border-[#1f1f1f] bg-[#0c0d0e]/70 space-y-2">
          <div className="flex items-center justify-between text-[#888] text-[12px] font-mono">
            <span>GEOLOGICAL RISK</span>
            <Activity size={14} className="text-[#a3e635]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono">
              {risk.score.toFixed(1)}%
            </div>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
              risk.level >= 4 ? 'border-[#ef4444]/40 text-[#ef4444] bg-[#ef4444]/10' :
              risk.level >= 3 ? 'border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b]/10' :
              risk.level >= 2 ? 'border-[#38bdf8]/40 text-[#38bdf8] bg-[#38bdf8]/10' :
              'border-[#a3e635]/40 text-[#a3e635] bg-[#a3e635]/10'
            }`}>
              {risk.levelName.toUpperCase()}
            </span>
          </div>
          <div className="text-[11px] text-[#71717a] font-mono truncate">
            {risk.triggerExplanation || 'Perimeter stable across all nodes'}
          </div>
        </div>

        {/* Active Nodes Card */}
        <div className="p-4 rounded-xl border border-[#1f1f1f] bg-[#0c0d0e]/70 space-y-2">
          <div className="flex items-center justify-between text-[#888] text-[12px] font-mono">
            <span>ACTIVE SENSORS</span>
            <Layers size={14} className="text-[#a3e635]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono">
              {onlineNodesCount} / {filteredNodes.length}
            </div>
            <span className="text-[11px] font-mono text-[#a3e635] border border-[#a3e635]/30 bg-[#a3e635]/10 px-2 py-0.5 rounded">
              {warningNodesCount > 0 ? `${warningNodesCount} Alert` : '100% ONLINE'}
            </span>
          </div>
          <div className="text-[11px] text-[#71717a] font-mono">
            Sector target: {currentSectorObj?.shortName}
          </div>
        </div>

        {/* Gateway Status Card */}
        <div className="p-4 rounded-xl border border-[#1f1f1f] bg-[#0c0d0e]/70 space-y-2">
          <div className="flex items-center justify-between text-[#888] text-[12px] font-mono">
            <span>GATEWAY EDGE</span>
            <Server size={14} className="text-[#38bdf8]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono">
              {gateway.id}
            </div>
            <span className="text-[11px] font-mono text-[#38bdf8] border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2 py-0.5 rounded">
              {gateway.status.toUpperCase()}
            </span>
          </div>
          <div className="text-[11px] text-[#71717a] font-mono flex items-center justify-between">
            <span>LoRaWAN 868MHz</span>
            <span>Bat: {gateway.batteryPct}%</span>
          </div>
        </div>

        {/* Rainfall & Environmental */}
        <div className="p-4 rounded-xl border border-[#1f1f1f] bg-[#0c0d0e]/70 space-y-2">
          <div className="flex items-center justify-between text-[#888] text-[12px] font-mono">
            <span>RAINFALL RATE</span>
            <CloudRain size={14} className="text-[#a855f7]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono">
              {rainfallRate} <span className="text-xs text-[#888]">mm/hr</span>
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              rainfallRate > 20 ? 'border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b]/10' : 'border-[#262626] text-[#888] bg-[#141517]'
            }`}>
              {rainfallRate > 20 ? 'HEAVY' : 'NORMAL'}
            </span>
          </div>
          <div className="text-[11px] text-[#71717a] font-mono">
            Pore pressure boost: {risk.rainfallBoostMultiplier.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* 3. Main Data Section */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0c0d0e]/80 overflow-hidden">
        {/* Navigation / Filter Tabs */}
        <div className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-3 bg-[#080809]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTab('nodes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedTab === 'nodes'
                  ? 'bg-[#1f2023] text-white border border-[#333]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Sensor Nodes ({filteredNodes.length})
            </button>
            <button
              onClick={() => setSelectedTab('alerts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedTab === 'alerts'
                  ? 'bg-[#1f2023] text-white border border-[#333]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Alert Logs ({alerts.length})
            </button>
          </div>

          <div className="text-[11px] font-mono text-[#71717a] hidden sm:block">
            Showing telemetry for <span className="text-[#a3e635]">{currentMineObj?.name}</span> • <span className="text-white">{currentSectorObj?.shortName}</span>
          </div>
        </div>

        {/* Tab 1: Sensor Nodes Table */}
        {selectedTab === 'nodes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121316] text-[#888888] border-b border-[#1f1f1f]">
                <tr>
                  <th className="py-3 px-4">NODE ID</th>
                  <th className="py-3 px-4">NAME &amp; LOCATION</th>
                  <th className="py-3 px-4">TYPE</th>
                  <th className="py-3 px-4">TILT (DEG)</th>
                  <th className="py-3 px-4">VIBRATION</th>
                  <th className="py-3 px-4">CRACK (MM)</th>
                  <th className="py-3 px-4">BATTERY</th>
                  <th className="py-3 px-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18191c]">
                {filteredNodes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#71717a] font-mono">
                      No sensor nodes deployed in the selected sector.
                    </td>
                  </tr>
                ) : (
                  filteredNodes.map((node) => {
                    const isSelected = node.id === selectedNodeId;
                    return (
                      <tr
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                        className={`hover:bg-[#15171a] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#1a1c20]' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            node.status === 'critical' ? 'bg-[#ef4444]' :
                            node.status === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#a3e635]'
                          }`} />
                          {node.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-medium">{node.name}</div>
                          <div className="text-[10px] text-[#71717a]">{node.zone}</div>
                        </td>
                        <td className="py-3 px-4 text-[#a1a1aa] uppercase">{node.type}</td>
                        <td className="py-3 px-4 font-mono text-white">
                          {node.readings.tiltDeg.toFixed(2)}°
                        </td>
                        <td className="py-3 px-4 font-mono text-white">
                          {node.readings.vibrationMmS.toFixed(1)} mm/s
                        </td>
                        <td className="py-3 px-4 font-mono text-white">
                          {node.readings.crackWidthMm.toFixed(1)} mm
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Battery size={13} className="text-[#888]" />
                            <span className="text-white">{node.readings.batteryPct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            node.status === 'critical' ? 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30' :
                            node.status === 'warning' ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30' :
                            'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30'
                          }`}>
                            {node.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Alert Log */}
        {selectedTab === 'alerts' && (
          <div className="divide-y divide-[#18191c]">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-[#71717a] font-mono text-xs">
                No active or historical alert records in this perimeter.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#121316] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${
                      alert.level >= 4 ? 'bg-[#ef4444]/15 text-[#ef4444]' :
                      alert.level >= 3 ? 'bg-[#f59e0b]/15 text-[#f59e0b]' :
                      'bg-[#38bdf8]/15 text-[#38bdf8]'
                    }`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs font-mono">{alert.id}</span>
                        <span className="text-[#888] text-[11px] font-mono">• {alert.timestamp}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${
                          alert.level >= 4 ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                          alert.level >= 3 ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          'bg-[#38bdf8]/20 text-[#38bdf8]'
                        }`}>
                          {alert.levelName}
                        </span>
                      </div>
                      <p className="text-xs text-[#a1a1aa] mt-1">{alert.notes}</p>
                      <div className="text-[10px] text-[#71717a] mt-1 font-mono">
                        Zone: {alert.zone} • Recipients: {alert.recipientCount} SMS Dispatched
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/30">
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
