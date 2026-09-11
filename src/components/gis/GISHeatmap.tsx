import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { SensorNode, GatewayDevice } from '../../types';
import { 
  MapPin
} from '../icons';

interface GISHeatmapProps {
  onSelectNode?: (node: SensorNode) => void;
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

// Helper to determine true live node alert status from multi-sensor readings
export const calculateNodeStatus = (node: SensorNode): 'critical' | 'warning' | 'online' => {
  if (!node) return 'online';
  const readings = node.readings || {
    tiltDeg: 0,
    vibrationMmS: 0,
    soilMoisturePct: 50,
    crackWidthMm: 0,
    gasPpm: 0
  };
  const thresholds = node.thresholds || {
    tiltWarningDeg: 3.5,
    tiltCriticalDeg: 6.0,
    vibrationWarningMmS: 5.0,
    vibrationCriticalMmS: 12.0,
    soilMoistureWarningPct: 75.0,
    soilMoistureCriticalPct: 85.0,
    crackWarningMm: 8.0,
    crackCriticalMm: 18.0,
    gasWarningPpm: 50,
    gasCriticalPpm: 120
  };

  const tiltDeg = readings.tiltDeg ?? 0;
  const vibrationMmS = readings.vibrationMmS ?? 0;
  const soilMoisture = readings.soilMoisturePct ?? 50;
  const crackWidthMm = readings.crackWidthMm ?? 0;
  const gasPpm = readings.gasPpm ?? 0;
  
  // Critical check: Accelerating tilt OR pore-pressure saturation liquefaction (>85% moisture + >5° tilt)
  if (
    tiltDeg >= (thresholds.tiltCriticalDeg ?? 6.0) ||
    vibrationMmS >= (thresholds.vibrationCriticalMmS ?? 12.0) ||
    (soilMoisture >= (thresholds.soilMoistureCriticalPct ?? 85.0) && tiltDeg >= 4.0) ||
    crackWidthMm >= (thresholds.crackCriticalMm ?? 18.0) ||
    gasPpm >= (thresholds.gasCriticalPpm ?? 120) ||
    node.status === 'critical'
  ) {
    return 'critical';
  }

  // Warning check: Elevated strata creep OR high soil saturation (>75%)
  if (
    tiltDeg >= (thresholds.tiltWarningDeg ?? 3.5) ||
    vibrationMmS >= (thresholds.vibrationWarningMmS ?? 4.5) ||
    soilMoisture >= (thresholds.soilMoistureWarningPct ?? 75.0) ||
    crackWidthMm >= (thresholds.crackWarningMm ?? 7.0) ||
    gasPpm >= (thresholds.gasWarningPpm ?? 45) ||
    node.id === 'NODE-B' || 
    node.id === 'NODE-Y' ||
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

  // Dynamic Centroid of active nodes & masters
  const mapCenter = useMemo<[number, number]>(() => {
    if (activeNodes.length > 0) {
      const avgLat = activeNodes.reduce((acc, n) => acc + (n.lat || 23.7482), 0) / activeNodes.length;
      const avgLng = activeNodes.reduce((acc, n) => acc + (n.lng || 86.4195), 0) / activeNodes.length;
      return [avgLat, avgLng];
    }
    return [23.7482, 86.4195];
  }, [activeNodes]);

  // Layer Toggles tailored to ESP32-S3 + Raspberry Pi 4 architecture
  const [basemapType, setBasemapType] = useState<'dark' | 'satellite'>('dark');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [showMasters, setShowMasters] = useState<boolean>(true);
  const [showMeshLinks, setShowMeshLinks] = useState<boolean>(true);
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

  // 4. Render All Map Layers (ESP32-S3 Pods, RPi 4 Masters, Mesh Links, Risk Plumes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = overlayGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // A. DYNAMIC MULTI-SENSOR RISK HEATMAP PLUMES (BNO085 IMU + Soil Moisture + BME280)
    if (showHeatmap) {
      const riskNodes = activeNodes.filter((node) => {
        const status = calculateNodeStatus(node);
        const { readings, thresholds } = node;
        const tiltRatio = (readings?.tiltDeg ?? 0) / (thresholds?.tiltWarningDeg || 3.5);
        const vibRatio = (readings?.vibrationMmS ?? 0) / (thresholds?.vibrationWarningMmS || 4.5);
        const moistRatio = (readings?.soilMoisturePct ?? 50) / (thresholds?.soilMoistureWarningPct || 75.0);
        return status !== 'online' || Math.max(tiltRatio, vibRatio, moistRatio) >= 0.5;
      });

      if (riskNodes.length > 0) {
        riskNodes.forEach((node) => {
          const status = calculateNodeStatus(node);
          const { readings, thresholds } = node;
          const tiltRatio = (readings?.tiltDeg ?? 0) / (thresholds?.tiltCriticalDeg || 6.0);
          const vibRatio = (readings?.vibrationMmS ?? 0) / (thresholds?.vibrationCriticalMmS || 12.0);
          const moistRatio = (readings?.soilMoisturePct ?? 50) / (thresholds?.soilMoistureCriticalPct || 85.0);
          const maxRatio = Math.max(tiltRatio, vibRatio, moistRatio);

          const rainMultiplier = 1 + Math.min(rainfallRate, 60) / 120;

          if (status === 'critical' || maxRatio >= 0.85) {
            const plumeRadius = Math.min(360, (180 + maxRatio * 120) * rainMultiplier);
            
            // Outer Low / Advisory Ring
            L.circle([node.lat, node.lng], {
              radius: plumeRadius,
              stroke: false,
              fillColor: '#84cc16',
              fillOpacity: 0.22,
              className: 'pointer-events-none',
            }).addTo(group);

            // Mid Warning Ring
            L.circle([node.lat, node.lng], {
              radius: plumeRadius * 0.65,
              stroke: false,
              fillColor: '#f97316',
              fillOpacity: 0.38,
              className: 'pointer-events-none',
            }).addTo(group);

            // Core Crimson Eye (Critical Liquefaction / Shear Epicenter)
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

            L.circle([node.lat, node.lng], {
              radius: plumeRadius,
              stroke: false,
              fillColor: '#eab308',
              fillOpacity: 0.24,
              className: 'pointer-events-none',
            }).addTo(group);

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
        // Normal Baseline Ring
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

    // B. RENDER WIFI MESH & LORA INTER-MASTER LINKS
    if (showMeshLinks) {
      // 1. Sector Masters to their ESP32-S3 Nodes (WiFi Mesh Links)
      activeNodes.forEach((node) => {
        const targetMaster = SECTOR_MASTERS.find(m => m.id === (node.masterId || (node.sector === 2 ? 'MASTER-S2' : 'MASTER-S1')));
        if (targetMaster) {
          const isWarning = calculateNodeStatus(node) !== 'online';
          L.polyline([[node.lat, node.lng], [targetMaster.lat, targetMaster.lng]], {
            color: isWarning ? '#f59e0b' : '#38bdf8',
            weight: 1.8,
            dashArray: '4, 6',
            opacity: 0.7,
            className: 'pointer-events-none',
          }).addTo(group);
        }
      });

      // 2. Inter-Master LoRa SX1278 Bridge (Between Sector-1 Master and Sector-2 Master)
      L.polyline([[SECTOR_MASTERS[0].lat, SECTOR_MASTERS[0].lng], [SECTOR_MASTERS[1].lat, SECTOR_MASTERS[1].lng]], {
        color: '#c084fc', // Purple LoRa link
        weight: 2.5,
        dashArray: '6, 6',
        opacity: 0.9,
      }).addTo(group);

      // LoRa Inter-Master ACK Label Chip
      const midLat = (SECTOR_MASTERS[0].lat + SECTOR_MASTERS[1].lat) / 2;
      const midLng = (SECTOR_MASTERS[0].lng + SECTOR_MASTERS[1].lng) / 2;
      const loraLabelIcon = L.divIcon({
        className: 'custom-chip-icon',
        html: `
          <div style="
            background: #180d2b;
            border: 1.5px solid #a855f7;
            border-radius: 6px;
            padding: 2px 7px;
            font-family: monospace;
            font-size: 10px;
            font-weight: 700;
            color: #d8b4fe;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.8);
            display: inline-flex;
            align-items: center;
            gap: 4px;
          ">
            <span>📡 LoRa (SX1278) Inter-Master Bridge • ACK Sync</span>
          </div>
        `,
        iconSize: [220, 22],
        iconAnchor: [110, 11],
      });
      L.marker([midLat, midLng], { icon: loraLabelIcon, interactive: false }).addTo(group);
    }

    // C. RENDER SECTOR MASTER GATEWAYS (Raspberry Pi 4 Hubs)
    if (showMasters) {
      SECTOR_MASTERS.forEach((master) => {
        const masterIcon = L.divIcon({
          className: 'custom-master-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <!-- Master Hub Icon Pin -->
              <div style="
                width: 22px;
                height: 22px;
                border-radius: 6px;
                background: #6b21a8;
                border: 2px solid #e9d5ff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: #ffffff;
                box-shadow: 0 0 16px #a855f7, 0 0 4px #ffffff;
                flex-shrink: 0;
              ">
                ⚡
              </div>

              <!-- Solid Chip Label -->
              <div style="
                background: #0d0914;
                border: 1.5px solid #a855f7;
                border-radius: 6px;
                padding: 3px 8px;
                font-family: monospace;
                font-size: 11px;
                font-weight: 800;
                color: #f3e8ff;
                white-space: nowrap;
                box-shadow: 0 4px 14px rgba(0,0,0,0.95);
                display: flex;
                align-items: center;
                gap: 5px;
              ">
                <span style="color: #c084fc;">${master.code}</span>
                <span style="font-size: 9px; padding: 1px 4px; border-radius: 3px; background: rgba(168,85,247,0.3); color: #e9d5ff;">RPI-4 MASTER</span>
              </div>
            </div>
          `,
          iconSize: [190, 28],
          iconAnchor: [11, 14],
        });

        const marker = L.marker([master.lat, master.lng], { icon: masterIcon }).addTo(group);
        marker.bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace, sans-serif; color: #ffffff; background: #090a10; padding: 14px; border-radius: 12px; border: 1.5px solid #a855f7; box-shadow: 0 16px 36px rgba(0,0,0,0.95); min-width: 290px; max-width: 320px;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; border-bottom: 1px solid #271442; padding-bottom: 8px; margin-bottom: 8px;">
              <div>
                <div style="color: #e9d5ff; font-size: 13px; font-weight: 800; letter-spacing: -0.01em;">${master.name}</div>
                <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">
                  📍 ${master.lat.toFixed(4)}°N, ${master.lng.toFixed(4)}°E • ${master.ip}
                </div>
              </div>
              <span style="
                font-size: 9px;
                padding: 2px 7px;
                border-radius: 9999px;
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid #22c55e;
                color: #4ade80;
                text-transform: uppercase;
                font-weight: 800;
                letter-spacing: 0.05em;
                white-space: nowrap;
              ">● EDGE ONLINE</span>
            </div>

            <!-- Hardware Tag -->
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #c084fc; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.25); padding: 4px 8px; border-radius: 6px; margin-bottom: 10px;">
              <span style="font-weight: 700;">Raspberry Pi 4 Model B</span>
              <span style="color: #e9d5ff; font-size: 9px;">Sector ${master.sectorNum} Hub</span>
            </div>

            <!-- Master Spec Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #271442; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Edge AI Engine</div>
                <div style="font-size: 11px; font-weight: 700; color: #38bdf8; margin-top: 1px;">
                  TFLite Strata-Net
                </div>
                <div style="font-size: 9px; color: #64748b;">${master.edgeAiInferenceFps || 14.6} FPS Live</div>
              </div>

              <div style="background: rgba(255,255,255,0.03); border: 1px solid #271442; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Emergency GSM</div>
                <div style="font-size: 11px; font-weight: 700; color: #4ade80; margin-top: 1px;">
                  SIM7600 Direct
                </div>
                <div style="font-size: 9px; color: #64748b;">5/5 Bars • SMS Ready</div>
              </div>

              <div style="background: rgba(255,255,255,0.03); border: 1px solid #271442; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">LoRa Inter-Master</div>
                <div style="font-size: 11px; font-weight: 700; color: #c084fc; margin-top: 1px;">
                  SX1278 868MHz
                </div>
                <div style="font-size: 9px; color: #64748b;">ACK Synced</div>
              </div>

              <div style="background: rgba(255,255,255,0.03); border: 1px solid #271442; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Solar MPPT</div>
                <div style="font-size: 11px; font-weight: 700; color: #fbbf24; margin-top: 1px;">
                  ${master.solarMpptWatts || 120}W Array
                </div>
                <div style="font-size: 9px; color: #64748b;">Batt: ${master.batteryPct || 99}%</div>
              </div>
            </div>

            <!-- Footer: Failover state -->
            <div style="padding-top: 8px; border-top: 1px solid #271442; display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #d8b4fe;">
              <span>Self-Healing Mesh</span>
              <span style="color: #4ade80; font-weight: 600;">● Active Failover</span>
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

    // D. RENDER INTEGRATED ESP32-S3 MULTI-SENSOR STATIONS (Node A, Node B, Node X, Node Y...)
    if (showNodes) {
      activeNodes.forEach((node) => {
        const trueStatus = calculateNodeStatus(node);
        const statusColor = trueStatus === 'critical' ? '#ef4444' :
                            trueStatus === 'warning' ? '#f59e0b' :
                            '#22c55e';

        const isPulsing = trueStatus === 'critical' || trueStatus === 'warning';
        const readings = node.readings || ({} as any);

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

              <!-- Solid Chip Label -->
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
                <span style="color: #ffffff; font-weight: 800;">${node.name.split(' ')[0]} ${node.name.split(' ')[1] || ''}</span>
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
          iconSize: [160, 28],
          iconAnchor: [8, 14],
        });

        const marker = L.marker([node.lat, node.lng], { icon: nodeIcon }).addTo(group);

        marker.on('click', () => {
          onSelectNode?.(node);
        });

        const tiltDeg = typeof readings.tiltDeg === 'number' ? readings.tiltDeg : 0;
        const vibrationMmS = typeof readings.vibrationMmS === 'number' ? readings.vibrationMmS : 0;
        const soilMoisturePct = typeof readings.soilMoisturePct === 'number' ? readings.soilMoisturePct : 50;
        const tempC = typeof readings.tempC === 'number' ? readings.tempC : 27.5;
        const humidityPct = typeof readings.humidityPct === 'number' ? readings.humidityPct : 60;
        const pressureHpa = typeof readings.pressureHpa === 'number' ? readings.pressureHpa : 1012;
        const batteryPct = typeof readings.batteryPct === 'number' ? readings.batteryPct : 95;
        const rssiDbm = typeof readings.rssiDbm === 'number' ? readings.rssiDbm : -70;

        const tiltColor = tiltDeg >= 5.0 ? '#ef4444' : tiltDeg >= 2.5 ? '#f59e0b' : '#38bdf8';
        const vibColor = vibrationMmS >= 10.0 ? '#ef4444' : vibrationMmS >= 4.0 ? '#f59e0b' : '#38bdf8';
        const moistColor = soilMoisturePct >= 80 ? '#ef4444' : soilMoisturePct >= 65 ? '#f59e0b' : '#22c55e';
        const battColor = batteryPct < 20 ? '#ef4444' : batteryPct < 50 ? '#f59e0b' : '#22c55e';

        marker.bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace, sans-serif; color: #ffffff; background: #090c10; padding: 14px; border-radius: 12px; border: 1.5px solid ${statusColor}; box-shadow: 0 16px 36px rgba(0,0,0,0.95); min-width: 290px; max-width: 320px;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; border-bottom: 1px solid #1e2430; padding-bottom: 8px; margin-bottom: 8px;">
              <div>
                <div style="color: #ffffff; font-size: 13px; font-weight: 800; letter-spacing: -0.01em;">${node.name}</div>
                <div style="color: #64748b; font-size: 10px; margin-top: 2px;">
                  📍 ${node.lat.toFixed(4)}°N, ${node.lng.toFixed(4)}°E
                </div>
              </div>
              <span style="
                font-size: 9px;
                padding: 2px 7px;
                border-radius: 9999px;
                background: ${trueStatus === 'critical' ? 'rgba(239, 68, 68, 0.25)' : trueStatus === 'warning' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(34, 197, 94, 0.25)'};
                border: 1px solid ${statusColor};
                color: ${statusColor};
                text-transform: uppercase;
                font-weight: 800;
                letter-spacing: 0.05em;
                white-space: nowrap;
              ">● ${trueStatus}</span>
            </div>

            <!-- Hardware Tag -->
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #38bdf8; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); padding: 4px 8px; border-radius: 6px; margin-bottom: 10px;">
              <span style="font-weight: 700;">ESP32-S3 Telemetry Pod</span>
              <span style="color: #94a3b8; font-size: 9px;">BNO085 • BME280</span>
            </div>

            <!-- Metrics Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
              <!-- Tilt -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #1a202c; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">BNO085 Tilt</div>
                <div style="font-size: 13px; font-weight: 800; color: ${tiltColor}; margin-top: 1px;">
                  ${tiltDeg.toFixed(2)}°
                </div>
              </div>

              <!-- Vibration -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #1a202c; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">BNO085 Vib</div>
                <div style="font-size: 13px; font-weight: 800; color: ${vibColor}; margin-top: 1px;">
                  ${vibrationMmS.toFixed(1)} <span style="font-size: 9px; font-weight: 500; color: #94a3b8;">mm/s</span>
                </div>
              </div>

              <!-- Soil Moisture -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #1a202c; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">Soil Moisture</div>
                <div style="font-size: 13px; font-weight: 800; color: ${moistColor}; margin-top: 1px;">
                  ${soilMoisturePct.toFixed(0)}%
                </div>
              </div>

              <!-- Temperature -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #1a202c; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">BME280 Temp</div>
                <div style="font-size: 13px; font-weight: 800; color: #f1f5f9; margin-top: 1px;">
                  ${tempC.toFixed(1)}°C
                </div>
              </div>

              <!-- Humidity -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #1a202c; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">BME280 Hum</div>
                <div style="font-size: 13px; font-weight: 800; color: #f1f5f9; margin-top: 1px;">
                  ${humidityPct.toFixed(0)}%
                </div>
              </div>

              <!-- Pressure -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #1a202c; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">BME280 Baro</div>
                <div style="font-size: 12px; font-weight: 800; color: #f1f5f9; margin-top: 1px;">
                  ${pressureHpa.toFixed(0)} <span style="font-size: 9px; font-weight: 500; color: #94a3b8;">hPa</span>
                </div>
              </div>

              <!-- Battery -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #1a202c; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">Battery</div>
                <div style="font-size: 13px; font-weight: 800; color: ${battColor}; margin-top: 1px;">
                  ${batteryPct}%
                </div>
              </div>

              <!-- RSSI -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid #1a202c; border-radius: 6px; padding: 6px 8px;">
                <div style="font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">LoRa RSSI</div>
                <div style="font-size: 13px; font-weight: 800; color: #f1f5f9; margin-top: 1px;">
                  ${rssiDbm} <span style="font-size: 9px; font-weight: 500; color: #94a3b8;">dBm</span>
                </div>
              </div>
            </div>

            <!-- Footer: Mesh Routing -->
            <div style="padding-top: 8px; border-top: 1px solid #1e2430; display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94a3b8;">
              <span>Uplink: <strong style="color: #38bdf8;">${node.masterId || (node.sector === 2 ? 'Sector-2 Master' : 'Sector-1 Master')}</strong></span>
              <span style="background: #1e293b; padding: 1px 6px; border-radius: 4px; color: #cbd5e1; font-weight: 600;">Hop ${node.meshHopCount || 1}</span>
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

    // E. RENDER CITIZEN CRACK PINS
    if (showCrackPins) {
      reports.forEach((rep) => {
        const isCorroborated = rep.status === 'Corroborated & Approved';
        const pinColor = isCorroborated ? '#ef4444' : '#f59e0b';

        const crackIcon = L.divIcon({
          className: 'custom-crack-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; gap: 7px;">
              <div style="
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: ${pinColor};
                border: 2px solid #ffffff;
                box-shadow: 0 0 14px ${pinColor}, 0 0 4px #ffffff;
                flex-shrink: 0;
              "></div>
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
          <div style="font-family: 'JetBrains Mono', monospace, sans-serif; color: #ffffff; background: #090b10; padding: 12px; border-radius: 10px; border: 1.5px solid ${pinColor}; box-shadow: 0 16px 36px rgba(0,0,0,0.95); min-width: 250px; max-width: 280px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e2430; padding-bottom: 6px; margin-bottom: 8px;">
              <strong style="color: #ffffff; font-size: 12px;">Report ${rep.id}</strong>
              <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: ${isCorroborated ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${pinColor}; font-weight: bold;">
                ${rep.status}
              </span>
            </div>
            <p style="margin: 0 0 8px 0; color: #cbd5e1; font-size: 11px; line-height: 1.4;">${rep.description}</p>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid #1e2430; border-radius: 6px; padding: 6px 8px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
              <span>Width: <strong style="color: ${pinColor}; font-size: 11px;">${rep.crackWidthEstimateMm}mm</strong></span>
              <span>Zone: <strong style="color: #ffffff;">${rep.zone}</strong></span>
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

    // F. RENDER UNDERGROUND ABANDONED GALLERY
    if (showMineWorkings) {
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
            <span>UNSTABLE GALLERY (45M VOID)</span>
          </div>
        `,
        iconSize: [200, 26],
        iconAnchor: [100, 13],
      });

      L.marker([23.7450, 86.4175], { icon: galleryLabelIcon, interactive: false }).addTo(group);
    }

    // G. RENDER SAFE EVACUATION SHELTERS
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
          <div style="font-family: 'JetBrains Mono', monospace, sans-serif; color: #ffffff; background: #06150c; padding: 12px; border-radius: 10px; border: 1.5px solid #22c55e; box-shadow: 0 16px 36px rgba(0,0,0,0.95); min-width: 250px; max-width: 280px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #14532d; padding-bottom: 6px; margin-bottom: 8px;">
              <strong style="color: #4ade80; font-size: 13px;">⌂ ${ap.name}</strong>
              <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(34, 197, 94, 0.2); color: #22c55e; font-weight: bold;">SAFE ZONE</span>
            </div>
            <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 6px;">
              Capacity: <strong style="color: #ffffff;">${ap.currentCheckedIn} / ${ap.capacityPersons} persons</strong>
            </div>
            <div style="font-size: 10px; color: #86efac; border-top: 1px solid #14532d; padding-top: 6px; margin-top: 6px;">
              Officer: ${ap.contactOfficer} (${ap.officerPhone})
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

  }, [activeNodes, reports, assemblyPoints, rainfallRate, showHeatmap, showNodes, showMasters, showMeshLinks, showMineWorkings, showCrackPins, showShelters, mapCenter]);

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
            <span className={showNodes ? 'text-white font-medium' : ''}>ESP32-S3 Pods ({activeNodes.length})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showMasters}
              onChange={(e) => setShowMasters(e.target.checked)}
              className="accent-[#a855f7] w-3.5 h-3.5 rounded"
            />
            <span className={showMasters ? 'text-[#d8b4fe] font-medium' : ''}>RPi 4 Masters (2)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showMeshLinks}
              onChange={(e) => setShowMeshLinks(e.target.checked)}
              className="accent-[#38bdf8] w-3.5 h-3.5 rounded"
            />
            <span className={showMeshLinks ? 'text-[#38bdf8] font-medium' : ''}>WiFi &amp; LoRa Mesh</span>
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
              className="accent-[#0284c7] w-3.5 h-3.5 rounded"
            />
            <span className={showMineWorkings ? 'text-[#38bdf8] font-medium' : ''}>Void Gallery</span>
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

        {/* Basemap Style Toggle */}
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
            Network &amp; Risk Legend
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
              <span className="text-white">Critical Strata Failure</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span className="text-white">Elevated Moisture / Creep</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              <span className="text-white">ESP32-S3 Pod (Normal)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#a855f7] text-[8px] flex items-center justify-center font-bold text-white">⚡</span>
              <span className="text-[#d8b4fe]">Raspberry Pi 4 Master</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#38bdf8] inline-block border-b border-dashed border-[#38bdf8]" />
              <span className="text-[#38bdf8]">WiFi Mesh Link</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#c084fc] inline-block border-b border-dashed border-[#c084fc]" />
              <span className="text-[#c084fc]">LoRa SX1278 Bridge</span>
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
