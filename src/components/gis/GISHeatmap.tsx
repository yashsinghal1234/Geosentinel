import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { SensorNode } from '../../types';
import { 
  Play, 
  Pause, 
  RotateCcw,
  MapPin
} from '../icons';

interface GISHeatmapProps {
  onSelectNode?: (node: SensorNode) => void;
}

// Helper to determine true live node alert status from readings & thresholds
export const calculateNodeStatus = (node: SensorNode): 'critical' | 'warning' | 'online' => {
  const { readings, thresholds } = node;
  
  // Critical check
  if (
    readings.tiltDeg >= thresholds.tiltCriticalDeg ||
    readings.vibrationMmS >= thresholds.vibrationCriticalMmS ||
    readings.crackWidthMm >= thresholds.crackCriticalMm ||
    readings.gasPpm >= thresholds.gasCriticalPpm ||
    node.status === 'critical'
  ) {
    return 'critical';
  }

  // Warning check (or significant crack expansion / gallery proximity)
  if (
    readings.tiltDeg >= thresholds.tiltWarningDeg ||
    readings.vibrationMmS >= thresholds.vibrationWarningMmS ||
    readings.crackWidthMm >= thresholds.crackWarningMm ||
    readings.gasPpm >= thresholds.gasWarningPpm ||
    readings.crackWidthMm >= 3.0 ||
    node.id === 'SN-03' || 
    node.id === 'SN-05' ||
    node.status === 'warning'
  ) {
    return 'warning';
  }

  return 'online';
};

export const GISHeatmap: React.FC<GISHeatmapProps> = ({ onSelectNode }) => {
  const { nodes, reports, assemblyPoints, rainfallRate } = useGeoSentinel();

  // Layer Toggles: 'dark' (Esri Dark Gray), 'osm' (OSM Inverted Dark), 'satellite' (Esri Satellite)
  const [basemapType, setBasemapType] = useState<'dark' | 'osm' | 'satellite'>('dark');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [showMineWorkings, setShowMineWorkings] = useState<boolean>(true);
  const [showCrackPins, setShowCrackPins] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);

  // Time scrubber state (0 = -24h, 100 = Present/Live)
  const [timelinePos, setTimelinePos] = useState<number>(100);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);

  // Center Coordinates: Jharia Coalfield Sector 4 / Open Pit
  const mapCenter = useMemo<[number, number]>(() => [23.7482, 86.4195], []);

  const getTileConfig = (type: 'dark' | 'osm' | 'satellite') => {
    switch (type) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          className: '',
          maxZoom: 19
        };
      case 'osm':
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          className: 'leaflet-tile-dark',
          maxZoom: 19
        };
      case 'dark':
      default:
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          className: '',
          maxZoom: 19
        };
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 15,
      minZoom: 13,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const config = getTileConfig(basemapType);
    const tiles = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      className: config.className,
    }).addTo(map);

    tileLayerRef.current = tiles;

    const overlayGroup = L.layerGroup().addTo(map);
    overlayGroupRef.current = overlayGroup;

    mapInstanceRef.current = map;

    // Invalidate size to ensure proper tile loading
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Basemap (Dark Technical vs Detailed vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const config = getTileConfig(basemapType);
    tileLayerRef.current.setUrl(config.url);
    
    // Update className for CSS filtering if needed
    const container = tileLayerRef.current.getContainer();
    if (container) {
      container.className = `leaflet-tile-container leaflet-zoom-animated ${config.className}`;
    }
  }, [basemapType]);

  // 3. Timeline Playback Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlayingTimeline) {
      timer = setInterval(() => {
        setTimelinePos((prev) => {
          if (prev >= 100) {
            setIsPlayingTimeline(false);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlayingTimeline]);

  // 4. Render All Map Layers & Data (Heatmap Plumes, Status Nodes, Chips, Polygons)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = overlayGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const timeScale = timelinePos / 100; // 0.0 to 1.0

    // A. RENDER SMOOTH LAYERED RISK HEATMAP PLUMES (Weather-Radar Multi-Stop Gradient)
    if (showHeatmap) {
      // Hotspot 1: Sector 4 Village Slope & Highwall (Epicenter)
      const primaryRadius = Math.max(80, 260 * timeScale);
      
      // Outer Gradient Ring (Low / Advisory Zone: Emerald to Lime)
      L.circle([23.7482, 86.4195], {
        radius: primaryRadius,
        stroke: false,
        fillColor: '#84cc16',
        fillOpacity: 0.12 * timeScale,
        className: 'pointer-events-none',
      }).addTo(group);

      // Mid Gradient Ring (Warning Zone: Amber to Orange)
      L.circle([23.7482, 86.4195], {
        radius: primaryRadius * 0.65,
        stroke: false,
        fillColor: '#f97316',
        fillOpacity: 0.22 * timeScale,
        className: 'pointer-events-none',
      }).addTo(group);

      // Core Gradient Ring (Critical / Shear Epicenter: Deep Crimson Red)
      L.circle([23.7482, 86.4195], {
        radius: primaryRadius * 0.35,
        stroke: true,
        color: '#ef4444',
        weight: 1,
        dashArray: '4, 4',
        fillColor: '#ef4444',
        fillOpacity: 0.38 * timeScale,
        className: 'pointer-events-none',
      }).addTo(group);

      // Hotspot 2: Sector 3 Abandoned Gallery / Extensometer Zone
      const secondaryRadius = Math.max(60, 190 * timeScale);
      L.circle([23.7450, 86.4150], {
        radius: secondaryRadius,
        stroke: false,
        fillColor: '#eab308',
        fillOpacity: 0.15 * timeScale,
        className: 'pointer-events-none',
      }).addTo(group);

      L.circle([23.7450, 86.4150], {
        radius: secondaryRadius * 0.45,
        stroke: false,
        fillColor: '#f97316',
        fillOpacity: 0.30 * timeScale,
        className: 'pointer-events-none',
      }).addTo(group);
    }

    // B. RENDER UNDERGROUND ABANDONED GALLERY (Muted Slate Hatched Void Polygon)
    if (showMineWorkings) {
      const galleryCoords: [number, number][] = [
        [23.7440, 86.4140],
        [23.7480, 86.4180],
        [23.7460, 86.4210],
        [23.7420, 86.4170],
      ];

      L.polygon(galleryCoords, {
        color: '#64748b', // Muted slate border (not harsh purple)
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#334155',
        fillOpacity: 0.12,
      }).addTo(group);

      // Clean Solid Background Chip for Gallery Label (No Text Collision!)
      const galleryLabelIcon = L.divIcon({
        className: 'custom-chip-icon',
        html: `
          <div style="
            background: #0c0e12;
            border: 1px solid #2d3748;
            border-radius: 6px;
            padding: 3px 7px;
            font-family: monospace;
            font-size: 10px;
            font-weight: 600;
            color: #94a3b8;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.8);
            display: inline-flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;"></span>
            <span>UNSTABLE GALLERY (45M VOID)</span>
          </div>
        `,
        iconSize: [190, 24],
        iconAnchor: [95, 12],
      });

      L.marker([23.7450, 86.4175], { icon: galleryLabelIcon, interactive: false }).addTo(group);
    }

    // C. RENDER CITIZEN CRACK PINS (With Background Chips)
    if (showCrackPins) {
      reports.forEach((rep) => {
        const isCorroborated = rep.status === 'Corroborated & Approved';
        const pinColor = isCorroborated ? '#ef4444' : '#f59e0b';

        const crackIcon = L.divIcon({
          className: 'custom-crack-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; gap: 6px;">
              <!-- Pin Dot with Pulse -->
              <div style="
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${pinColor};
                border: 2px solid #ffffff;
                box-shadow: 0 0 10px ${pinColor};
                flex-shrink: 0;
              "></div>
              
              <!-- Solid Background Chip (Prevents Text Collision) -->
              <div style="
                background: #090a0d;
                border: 1px solid ${isCorroborated ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)'};
                border-radius: 6px;
                padding: 2px 6px;
                font-family: monospace;
                font-size: 10px;
                font-weight: 700;
                color: #ffffff;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0,0,0,0.9);
              ">
                <span style="color: ${pinColor};">⚠️ Crack:</span> ${rep.crackWidthEstimateMm}mm
              </div>
            </div>
          `,
          iconSize: [120, 24],
          iconAnchor: [6, 12],
        });

        const marker = L.marker([rep.lat, rep.lng], { icon: crackIcon }).addTo(group);
        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #fff; background: #0c0d10; padding: 10px; border-radius: 8px; border: 1px solid #333; font-size: 12px; max-width: 220px;">
            <strong style="color: ${pinColor};">${rep.id} (${rep.status})</strong>
            <p style="margin: 4px 0; color: #ccc;">${rep.description}</p>
            <div style="font-size: 10px; color: #888; font-family: monospace;">
              Width: ${rep.crackWidthEstimateMm}mm • ${rep.zone}
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

    // D. RENDER SAFE EVACUATION SHELTERS (Green Chips)
    if (showShelters) {
      assemblyPoints.forEach((ap) => {
        const shelterIcon = L.divIcon({
          className: 'custom-shelter-pin',
          html: `
            <div style="
              background: #061c11;
              border: 1px solid rgba(34, 197, 94, 0.6);
              border-radius: 6px;
              padding: 3px 8px;
              font-family: monospace;
              font-size: 10px;
              font-weight: 700;
              color: #4ade80;
              display: inline-flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              box-shadow: 0 4px 12px rgba(0,0,0,0.85);
            ">
              <span style="font-size: 12px;">⌂</span>
              <span>${ap.name.split(' ')[0]} Shelter</span>
            </div>
          `,
          iconSize: [130, 24],
          iconAnchor: [65, 12],
        });

        const marker = L.marker([ap.lat, ap.lng], { icon: shelterIcon }).addTo(group);
        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #fff; background: #0c0d10; padding: 10px; border-radius: 8px; border: 1px solid #22c55e; font-size: 12px;">
            <strong style="color: #22c55e;">${ap.name}</strong>
            <div style="color: #ccc; margin-top: 4px;">Capacity: ${ap.currentCheckedIn} / ${ap.capacityPersons} persons</div>
            <div style="font-size: 10px; color: #888; margin-top: 4px;">Contact: ${ap.contactOfficer} (${ap.officerPhone})</div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

    // E. RENDER LORA SENSOR NODES WITH TRUE STATUS COLORS & SOLID CHIPS
    if (showNodes) {
      nodes.forEach((node) => {
        const trueStatus = calculateNodeStatus(node);
        const statusColor = trueStatus === 'critical' ? '#ef4444' :
                            trueStatus === 'warning' ? '#f59e0b' :
                            '#22c55e';

        const isPulsing = trueStatus === 'critical' || trueStatus === 'warning';

        const nodeIcon = L.divIcon({
          className: 'custom-node-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; gap: 7px; cursor: pointer;">
              <!-- Node Beacon Dot -->
              <div style="position: relative; width: 14px; height: 14px; flex-shrink: 0;">
                ${isPulsing ? `
                  <div style="
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: ${statusColor};
                    opacity: 0.4;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>
                ` : ''}
                <div style="
                  position: relative;
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: ${statusColor};
                  border: 2px solid #ffffff;
                  box-shadow: 0 0 10px ${statusColor};
                "></div>
              </div>

              <!-- Solid Chip Label (Guarantees zero text collision) -->
              <div style="
                background: #0c0e12;
                border: 1px solid ${statusColor};
                border-radius: 6px;
                padding: 2px 7px;
                font-family: monospace;
                font-size: 10px;
                font-weight: 700;
                color: #ffffff;
                white-space: nowrap;
                box-shadow: 0 4px 14px rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                gap: 5px;
              ">
                <span>${node.code}</span>
                <span style="
                  font-size: 8px;
                  padding: 1px 3px;
                  border-radius: 3px;
                  background: ${trueStatus === 'critical' ? 'rgba(239, 68, 68, 0.25)' : trueStatus === 'warning' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(34, 197, 94, 0.25)'};
                  color: ${statusColor};
                  text-transform: uppercase;
                ">${trueStatus}</span>
              </div>
            </div>
          `,
          iconSize: [140, 26],
          iconAnchor: [7, 13],
        });

        const marker = L.marker([node.lat, node.lng], { icon: nodeIcon }).addTo(group);

        marker.on('click', () => {
          onSelectNode?.(node);
        });

        marker.bindPopup(`
          <div style="font-family: monospace; color: #fff; background: #0a0c0f; padding: 12px; border-radius: 10px; border: 1px solid ${statusColor}; font-size: 12px; min-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; padding-bottom: 6px; margin-bottom: 8px;">
              <strong style="color: #fff; font-size: 13px;">${node.name}</strong>
              <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase; font-size: 10px;">${trueStatus}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; color: #aaa; font-size: 11px;">
              <div>Tilt: <strong style="color: #fff;">${node.readings.tiltDeg.toFixed(2)}°</strong></div>
              <div>Vib: <strong style="color: #fff;">${node.readings.vibrationMmS.toFixed(1)} mm/s</strong></div>
              <div>Crack: <strong style="color: #fff;">${node.readings.crackWidthMm.toFixed(1)} mm</strong></div>
              <div>Gas: <strong style="color: #fff;">${node.readings.gasPpm} ppm</strong></div>
              <div>Battery: <strong style="color: #fff;">${node.readings.batteryPct}%</strong></div>
              <div>RSSI: <strong style="color: #fff;">${node.readings.rssiDbm} dBm</strong></div>
            </div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #1f232b; font-size: 10px; color: #777;">
              Mesh Parent: ${node.parentNodeId || 'GW-01'} • Hop: ${node.meshHopCount}
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

  }, [nodes, reports, assemblyPoints, rainfallRate, showHeatmap, showNodes, showMineWorkings, showCrackPins, showShelters, timelinePos]);

  return (
    <div className="space-y-4 select-none">
      {/* 1. TOP CONTROLS & LAYER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[16px] border border-[#181b20] bg-[#0a0c0f] text-xs font-mono">
        {/* Layer Checkboxes */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[#828894]">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="accent-[#a3e635] w-3.5 h-3.5 rounded"
            />
            <span className={showHeatmap ? 'text-white font-medium' : ''}>Risk Heat Plumes</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showNodes}
              onChange={(e) => setShowNodes(e.target.checked)}
              className="accent-[#a3e635] w-3.5 h-3.5 rounded"
            />
            <span className={showNodes ? 'text-white font-medium' : ''}>Status Nodes ({nodes.length})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showCrackPins}
              onChange={(e) => setShowCrackPins(e.target.checked)}
              className="accent-[#ef4444] w-3.5 h-3.5 rounded"
            />
            <span className={showCrackPins ? 'text-white font-medium' : ''}>Crack Fissures ({reports.length})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showMineWorkings}
              onChange={(e) => setShowMineWorkings(e.target.checked)}
              className="accent-[#64748b] w-3.5 h-3.5 rounded"
            />
            <span className={showMineWorkings ? 'text-white font-medium' : ''}>Underground Voids</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showShelters}
              onChange={(e) => setShowShelters(e.target.checked)}
              className="accent-[#22c55e] w-3.5 h-3.5 rounded"
            />
            <span className={showShelters ? 'text-white font-medium' : ''}>Shelters</span>
          </label>
        </div>

        {/* Basemap Style Toggle: Zero Watermark Esri Dark Canvas / OSM / Satellite */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-[#232731] bg-[#121418]">
          <button
            onClick={() => setBasemapType('dark')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              basemapType === 'dark' ? 'bg-[#22262f] text-[#a3e635] font-bold' : 'text-[#717682] hover:text-white'
            }`}
          >
            Dark Canvas
          </button>
          <button
            onClick={() => setBasemapType('osm')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              basemapType === 'osm' ? 'bg-[#22262f] text-[#a3e635] font-bold' : 'text-[#717682] hover:text-white'
            }`}
          >
            OSM Roads
          </button>
          <button
            onClick={() => setBasemapType('satellite')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              basemapType === 'satellite' ? 'bg-[#22262f] text-[#a3e635] font-bold' : 'text-[#717682] hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* 2. LEAFLET MAP CONTAINER */}
      <div className="relative w-full h-[520px] sm:h-[620px] rounded-[18px] border border-[#181b20] overflow-hidden bg-[#050608] shadow-2xl">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Top-Right Legend Pill Overlay */}
        <div className="absolute top-4 right-4 z-20 p-3 rounded-[14px] bg-[#0c0d10]/95 border border-[#23272f] backdrop-blur-md shadow-2xl text-[11px] font-mono space-y-2 pointer-events-auto">
          <div className="text-[#888] font-bold text-[10px] uppercase tracking-wider">
            Risk Severity Scale
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
              <span className="text-white">Critical Shear (&gt; 6.0°)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span className="text-white">Warning / Advisory (3.5°)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              <span className="text-white">Normal Baseline</span>
            </div>
          </div>
        </div>

        {/* Top-Left Coordinate & Basin Chip */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-[#0c0d10]/90 border border-[#23272f] backdrop-blur-md text-[11px] font-mono text-[#a3e635] flex items-center gap-1.5 shadow-lg">
            <MapPin size={12} />
            <span>Jharia Coalfield • 23.7482°N, 86.4195°E</span>
          </div>
        </div>
      </div>

      {/* 3. TIMELINE SCRUBBER CONTROLLER */}
      <div className="p-4 rounded-[16px] border border-[#181b20] bg-[#0a0c0f] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#2d3139] bg-[#14171d] hover:bg-[#1f232b] text-white font-medium cursor-pointer transition-colors"
          >
            {isPlayingTimeline ? <Pause size={14} className="text-[#f59e0b]" /> : <Play size={14} className="text-[#a3e635]" />}
            <span>{isPlayingTimeline ? 'Pause Playback' : 'Simulate 24h'}</span>
          </button>
          
          <button
            onClick={() => {
              setIsPlayingTimeline(false);
              setTimelinePos(100);
            }}
            className="p-2 rounded-lg border border-[#23272f] bg-[#14171d] hover:bg-[#1f232b] text-[#888] hover:text-white cursor-pointer transition-colors"
            title="Reset to Live"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Range Slider */}
        <div className="flex-1 w-full flex items-center gap-3">
          <span className="text-[11px] text-[#717682] whitespace-nowrap">-24 Hours</span>
          <input
            type="range"
            min="0"
            max="100"
            value={timelinePos}
            onChange={(e) => {
              setIsPlayingTimeline(false);
              setTimelinePos(Number(e.target.value));
            }}
            className="w-full accent-[#a3e635] h-1.5 bg-[#1f232b] rounded-lg cursor-pointer"
          />
          <span className={`text-[11px] whitespace-nowrap font-bold ${timelinePos === 100 ? 'text-[#a3e635]' : 'text-white'}`}>
            {timelinePos === 100 ? 'LIVE PRESENT' : `T - ${Math.round(24 * (1 - timelinePos / 100))}h`}
          </span>
        </div>
      </div>
    </div>
  );
};
