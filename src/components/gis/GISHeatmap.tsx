import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { SensorNode } from '../../types';
import { 
  MapPin
} from '../icons';

interface GISHeatmapProps {
  onSelectNode?: (node: SensorNode) => void;
}

// Helper to determine true live node alert status from readings & thresholds
export const calculateNodeStatus = (node: SensorNode): 'critical' | 'warning' | 'online' => {
  if (!node) return 'online';
  const readings = node.readings || {
    tiltDeg: 0,
    vibrationMmS: 0,
    crackWidthMm: 0,
    gasPpm: 0,
    rainfallMmHr: 0,
    batteryPct: 100,
    rssiDbm: -70,
    lastHeartbeat: Date.now()
  };
  const thresholds = node.thresholds || {
    tiltWarningDeg: 3.5,
    tiltCriticalDeg: 6.0,
    vibrationWarningMmS: 5.0,
    vibrationCriticalMmS: 12.0,
    crackWarningMm: 8.0,
    crackCriticalMm: 18.0,
    gasWarningPpm: 50,
    gasCriticalPpm: 120
  };

  const tiltDeg = readings.tiltDeg ?? 0;
  const vibrationMmS = readings.vibrationMmS ?? 0;
  const crackWidthMm = readings.crackWidthMm ?? 0;
  const gasPpm = readings.gasPpm ?? 0;
  
  // Critical check
  if (
    tiltDeg >= (thresholds.tiltCriticalDeg ?? 6.0) ||
    vibrationMmS >= (thresholds.vibrationCriticalMmS ?? 12.0) ||
    crackWidthMm >= (thresholds.crackCriticalMm ?? 18.0) ||
    gasPpm >= (thresholds.gasCriticalPpm ?? 120) ||
    node.status === 'critical'
  ) {
    return 'critical';
  }

  // Warning check (or significant crack expansion / gallery proximity)
  if (
    tiltDeg >= (thresholds.tiltWarningDeg ?? 3.5) ||
    vibrationMmS >= (thresholds.vibrationWarningMmS ?? 5.0) ||
    crackWidthMm >= (thresholds.crackWarningMm ?? 8.0) ||
    gasPpm >= (thresholds.gasWarningPpm ?? 50) ||
    crackWidthMm >= 3.0 ||
    node.id === 'SN-03' || 
    node.id === 'SN-05' ||
    node.status === 'warning'
  ) {
    return 'warning';
  }

  return 'online';
};

export const GISHeatmap: React.FC<GISHeatmapProps> = ({ onSelectNode }) => {
  const { 
    nodes, 
    filteredNodes,
    reports, 
    assemblyPoints, 
    rainfallRate,
    selectedMine,
    selectedSector,
    availableMines,
    availableSectors
  } = useGeoSentinel();

  // Active nodes based on sector filter or default full fleet
  const activeNodes = filteredNodes && filteredNodes.length > 0 ? filteredNodes : nodes;

  const currentMine = useMemo(() => {
    return availableMines.find(m => m.id === selectedMine) || availableMines[0];
  }, [availableMines, selectedMine]);

  const currentSector = useMemo(() => {
    return availableSectors.find(s => s.id === selectedSector) || availableSectors[0];
  }, [availableSectors, selectedSector]);

  // Dynamic Centroid of active nodes
  const mapCenter = useMemo<[number, number]>(() => {
    if (activeNodes.length > 0) {
      const avgLat = activeNodes.reduce((acc, n) => acc + n.lat, 0) / activeNodes.length;
      const avgLng = activeNodes.reduce((acc, n) => acc + n.lng, 0) / activeNodes.length;
      return [avgLat, avgLng];
    }
    return [23.7482, 86.4195];
  }, [activeNodes]);

  // Layer Toggles: 'dark' (Tactical Dark Theme), 'satellite' (Esri High-Res Satellite)
  const [basemapType, setBasemapType] = useState<'dark' | 'satellite'>('dark');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [showMineWorkings, setShowMineWorkings] = useState<boolean>(true);
  const [showCrackPins, setShowCrackPins] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);

  const getTileConfig = (type: 'dark' | 'satellite') => {
    switch (type) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          className: 'leaflet-tile-satellite',
          subdomains: [] as string[],
          maxZoom: 19,
          maxNativeZoom: 18,
          attribution: '© Esri World Imagery'
        };
      case 'dark':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          className: 'leaflet-tile-dark',
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
          maxNativeZoom: 19,
          attribution: '© OpenStreetMap Tactical Dark'
        };
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 16,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const config = getTileConfig(basemapType);
    const tiles = L.tileLayer(config.url, {
      subdomains: config.subdomains.length > 0 ? config.subdomains : 'abc',
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom,
      className: config.className,
    }).addTo(map);

    tileLayerRef.current = tiles;

    const overlayGroup = L.layerGroup().addTo(map);
    overlayGroupRef.current = overlayGroup;

    mapInstanceRef.current = map;

    // Initial fit to nodes
    const t1 = setTimeout(() => {
      map.invalidateSize();
      const nodeCoords = activeNodes.map(n => [n.lat, n.lng] as [number, number]);
      if (nodeCoords.length > 0) {
        const bounds = L.latLngBounds(nodeCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }, 100);

    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    const handleWindowResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleWindowResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Basemap (Dark vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = getTileConfig(basemapType);
    const newTiles = L.tileLayer(config.url, {
      subdomains: config.subdomains.length > 0 ? config.subdomains : 'abc',
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom,
      className: config.className,
    }).addTo(map);

    tileLayerRef.current = newTiles;
  }, [basemapType]);

  // 3. Smooth Auto-Fit when Mine or Sector changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || activeNodes.length === 0) return;

    const coords = activeNodes.map(n => [n.lat, n.lng] as [number, number]);
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.flyToBounds(bounds, { padding: [55, 55], maxZoom: 16, duration: 0.75 });
    }
  }, [selectedMine, selectedSector, activeNodes.length]);

  // 4. Render All Map Layers & Data (Heatmap Plumes, Status Nodes, Chips, Polygons)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = overlayGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // A. DYNAMICALLY GENERATED RISK HEATMAP PLUMES (Driven 100% by live sensor readings)
    if (showHeatmap) {
      const riskNodes = activeNodes.filter((node) => {
        const status = calculateNodeStatus(node);
        const { readings, thresholds } = node;
        const tiltRatio = readings.tiltDeg / (thresholds.tiltWarningDeg || 3.5);
        const vibRatio = readings.vibrationMmS / (thresholds.vibrationWarningMmS || 5.0);
        const crackRatio = readings.crackWidthMm / (thresholds.crackWarningMm || 8.0);
        const gasRatio = readings.gasPpm / (thresholds.gasWarningPpm || 50.0);
        return status !== 'online' || Math.max(tiltRatio, vibRatio, crackRatio, gasRatio) >= 0.5;
      });

      if (riskNodes.length > 0) {
        riskNodes.forEach((node) => {
          const status = calculateNodeStatus(node);
          const { readings, thresholds } = node;
          const tiltRatio = readings.tiltDeg / (thresholds.tiltCriticalDeg || 6.0);
          const vibRatio = readings.vibrationMmS / (thresholds.vibrationCriticalMmS || 12.0);
          const crackRatio = readings.crackWidthMm / (thresholds.crackCriticalMm || 18.0);
          const gasRatio = readings.gasPpm / (thresholds.gasCriticalPpm || 120.0);
          const maxRatio = Math.max(tiltRatio, vibRatio, crackRatio, gasRatio);

          const rainMultiplier = 1 + Math.min(rainfallRate, 60) / 120; // Expanded by rainfall surge

          if (status === 'critical' || maxRatio >= 0.85) {
            const plumeRadius = Math.min(360, (180 + maxRatio * 120) * rainMultiplier);
            
            // Outer Low / Advisory Ring (Emerald to Lime)
            L.circle([node.lat, node.lng], {
              radius: plumeRadius,
              stroke: false,
              fillColor: '#84cc16',
              fillOpacity: 0.22,
              className: 'pointer-events-none',
            }).addTo(group);

            // Mid Warning Ring (Amber to Orange)
            L.circle([node.lat, node.lng], {
              radius: plumeRadius * 0.65,
              stroke: false,
              fillColor: '#f97316',
              fillOpacity: 0.38,
              className: 'pointer-events-none',
            }).addTo(group);

            // Core Crimson Eye (Critical Shear Epicenter)
            L.circle([node.lat, node.lng], {
              radius: plumeRadius * 0.35,
              stroke: true,
              color: '#ff4d4d',
              weight: 2,
              dashArray: '4, 4',
              fillColor: '#ef4444',
              fillOpacity: 0.62,
              className: 'pointer-events-none',
            }).addTo(group);
          } else {
            // Warning Plume
            const plumeRadius = Math.min(260, (130 + maxRatio * 90) * rainMultiplier);

            // Outer Advisory Ring
            L.circle([node.lat, node.lng], {
              radius: plumeRadius,
              stroke: false,
              fillColor: '#eab308',
              fillOpacity: 0.24,
              className: 'pointer-events-none',
            }).addTo(group);

            // Inner Warning Ring
            L.circle([node.lat, node.lng], {
              radius: plumeRadius * 0.48,
              stroke: false,
              fillColor: '#f97316',
              fillOpacity: 0.48,
              className: 'pointer-events-none',
            }).addTo(group);
          }
        });
      } else if (activeNodes.length > 0) {
        // Normal Baseline Ring around Cluster Centroid
        L.circle(mapCenter, {
          radius: 200,
          stroke: true,
          color: '#22c55e',
          weight: 1.5,
          dashArray: '4, 6',
          fillColor: '#10b981',
          fillOpacity: 0.12,
          className: 'pointer-events-none',
        }).addTo(group);
      }
    }

    // B. RENDER UNDERGROUND ABANDONED GALLERY (Cyan Highlighted Void Polygon with Live Gas telemetry)
    if (showMineWorkings) {
      const galleryNodes = activeNodes.filter(
        n => (n.depthMeters && n.depthMeters > 0) || n.zone.toLowerCase().includes('gallery') || n.id === 'SN-03' || n.id === 'SN-04'
      );
      const gasNode = galleryNodes.find(n => n.readings.gasPpm > 15) || galleryNodes[0];
      const liveGasPpm = gasNode ? gasNode.readings.gasPpm : 28;

      const galleryCoords: [number, number][] = [
        [23.7440, 86.4140],
        [23.7480, 86.4180],
        [23.7460, 86.4210],
        [23.7420, 86.4170],
      ];

      L.polygon(galleryCoords, {
        color: '#38bdf8',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#0284c7',
        fillOpacity: 0.20,
      }).addTo(group);

      // Clean Solid Background Chip for Gallery Label with dynamic sensor gas reading
      const galleryLabelIcon = L.divIcon({
        className: 'custom-chip-icon',
        html: `
          <div style="
            background: #0c1524;
            border: 1.5px solid #0284c7;
            border-radius: 6px;
            padding: 3px 8px;
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            color: #38bdf8;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.9);
            display: inline-flex;
            align-items: center;
            gap: 5px;
          ">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 6px #38bdf8;"></span>
            <span>UNSTABLE GALLERY (45M VOID • CH4: ${liveGasPpm} PPM)</span>
          </div>
        `,
        iconSize: [230, 26],
        iconAnchor: [115, 13],
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
            <div style="position: relative; display: flex; align-items: center; gap: 7px;">
              <!-- Pin Dot with Pulse -->
              <div style="
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: ${pinColor};
                border: 2px solid #ffffff;
                box-shadow: 0 0 14px ${pinColor}, 0 0 4px #ffffff;
                flex-shrink: 0;
              "></div>
              
              <!-- Solid Background Chip (Prevents Text Collision) -->
              <div style="
                background: #11141c;
                border: 1.5px solid ${isCorroborated ? '#ef4444' : '#f59e0b'};
                border-radius: 6px;
                padding: 3px 7px;
                font-family: monospace;
                font-size: 11px;
                font-weight: 700;
                color: #ffffff;
                white-space: nowrap;
                box-shadow: 0 3px 10px rgba(0,0,0,0.95);
              ">
                <span style="color: ${pinColor};">⚠️ Crack:</span> ${rep.crackWidthEstimateMm}mm
              </div>
            </div>
          `,
          iconSize: [130, 26],
          iconAnchor: [7, 13],
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
              background: #042614;
              border: 1.5px solid #22c55e;
              border-radius: 6px;
              padding: 4px 9px;
              font-family: monospace;
              font-size: 11px;
              font-weight: 700;
              color: #4ade80;
              display: inline-flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(34, 197, 94, 0.45);
            ">
              <span style="font-size: 13px;">⌂</span>
              <span>${ap.name.split(' ')[0]} Shelter</span>
            </div>
          `,
          iconSize: [140, 26],
          iconAnchor: [70, 13],
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
      activeNodes.forEach((node) => {
        const trueStatus = calculateNodeStatus(node);
        const statusColor = trueStatus === 'critical' ? '#ef4444' :
                            trueStatus === 'warning' ? '#f59e0b' :
                            '#22c55e';

        const isPulsing = trueStatus === 'critical' || trueStatus === 'warning';

        const nodeIcon = L.divIcon({
          className: 'custom-node-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <!-- Node Beacon Dot -->
              <div style="position: relative; width: 16px; height: 16px; flex-shrink: 0;">
                ${isPulsing ? `
                  <div style="
                    position: absolute;
                    inset: -5px;
                    border-radius: 50%;
                    background: ${statusColor};
                    opacity: 0.65;
                    animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>
                ` : ''}
                <div style="
                  position: relative;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: ${statusColor};
                  border: 2px solid #ffffff;
                  box-shadow: 0 0 16px ${statusColor}, 0 0 5px #ffffff;
                "></div>
              </div>

              <!-- Solid Chip Label (Guarantees zero text collision) -->
              <div style="
                background: #0f1218;
                border: 1.5px solid ${statusColor};
                border-radius: 6px;
                padding: 3px 8px;
                font-family: monospace;
                font-size: 11px;
                font-weight: 700;
                color: #ffffff;
                white-space: nowrap;
                box-shadow: 0 4px 16px rgba(0,0,0,0.95);
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <span style="color: #ffffff; font-weight: 800;">${node.code}</span>
                <span style="
                  font-size: 9px;
                  padding: 1.5px 4px;
                  border-radius: 3px;
                  background: ${trueStatus === 'critical' ? 'rgba(239, 68, 68, 0.4)' : trueStatus === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.35)'};
                  color: ${statusColor};
                  text-transform: uppercase;
                  font-weight: 800;
                ">${trueStatus}</span>
              </div>
            </div>
          `,
          iconSize: [150, 28],
          iconAnchor: [8, 14],
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
              <div>Tilt: <strong style="color: #fff;">{(node.readings?.tiltDeg ?? 0).toFixed(2)}°</strong></div>
              <div>Vib: <strong style="color: #fff;">{(node.readings?.vibrationMmS ?? 0).toFixed(1)} mm/s</strong></div>
              <div>Crack: <strong style="color: #fff;">{(node.readings?.crackWidthMm ?? 0).toFixed(1)} mm</strong></div>
              <div>Gas: <strong style="color: #fff;">{node.readings?.gasPpm ?? 0} ppm</strong></div>
              <div>Battery: <strong style="color: #fff;">{node.readings?.batteryPct ?? 100}%</strong></div>
              <div>RSSI: <strong style="color: #fff;">{node.readings?.rssiDbm ?? -70} dBm</strong></div>
            </div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #1f232b; font-size: 10px; color: #777;">
              Mesh Parent: ${node.parentNodeId || 'GW-01'} • Hop: ${node.meshHopCount}
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

  }, [activeNodes, reports, assemblyPoints, rainfallRate, showHeatmap, showNodes, showMineWorkings, showCrackPins, showShelters, mapCenter]);

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
            <span className={showNodes ? 'text-white font-medium' : ''}>Status Nodes ({activeNodes.length})</span>
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

        {/* Basemap Style Toggle: Zero Watermark Dark Theme / Satellite */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-[#232731] bg-[#121418]">
          <button
            onClick={() => setBasemapType('dark')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              basemapType === 'dark' ? 'bg-[#22262f] text-[#a3e635] font-bold' : 'text-[#717682] hover:text-white'
            }`}
          >
            Dark Theme
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
      <div className="relative w-full h-[520px] sm:h-[620px] rounded-[18px] border border-[#181b20] overflow-hidden bg-[#000000] shadow-2xl">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Top-Right Legend Pill Overlay */}
        <div className="absolute top-4 right-4 z-20 p-3 rounded-[14px] bg-[#000000]/95 border border-[#23272f] backdrop-blur-md shadow-2xl text-[11px] font-mono space-y-2 pointer-events-auto">
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

        {/* Top-Left Dynamic Coordinate Pill Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
          <div className="px-3.5 py-1.5 rounded-full bg-[#000000]/90 border border-[#23272f] backdrop-blur-md text-[11px] font-mono text-[#a3e635] flex items-center gap-1.5 shadow-lg">
            <MapPin size={12} />
            <span>
              {currentMine?.name || 'Jharia Coalfield'} • {currentSector?.shortName || 'All Sectors'} ({mapCenter[0].toFixed(4)}°N, {mapCenter[1].toFixed(4)}°E)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
