import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { SensorNode, GatewayDevice } from '../../types';
import { 
  MapPin,
  X,
  ChevronDown,
  ChevronUp
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

  // Inspector States for on-click inspection
  const [selectedNode, setSelectedNode] = useState<SensorNode | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<GatewayDevice | null>(null);
  const [isInspectorExpanded, setIsInspectorExpanded] = useState<boolean>(true);
  const [disabledNodeIds, setDisabledNodeIds] = useState<string[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);

  const toggleNodeDisabled = (id: string) => {
    setDisabledNodeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

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
    const tileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom,
      subdomains: config.subdomains.length > 0 ? config.subdomains : 'abc',
      className: config.className,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    const overlayGroup = L.layerGroup().addTo(map);
    overlayGroupRef.current = overlayGroup;

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

  // 2. Handle Basemap Switcher
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const config = getTileConfig(basemapType);
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom,
      subdomains: config.subdomains.length > 0 ? config.subdomains : 'abc',
      className: config.className,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [basemapType]);

  // 3. Pan to Centroid when sector or mine changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(mapCenter, 16, { duration: 1.2 });
    }
  }, [mapCenter]);

  // 4. Render Layers (Heatmap circles, WiFi mesh links, Master hubs, ESP32 pods, Crack pins, Shelters)
  useEffect(() => {
    if (!overlayGroupRef.current || !mapInstanceRef.current) return;
    const group = overlayGroupRef.current;
    group.clearLayers();

    // A. RENDER DYNAMIC RISK HEAT PLUMES
    if (showHeatmap) {
      activeNodes.forEach((node) => {
        const isDisabled = disabledNodeIds.includes(node.id);
        const trueStatus = isDisabled ? 'online' : calculateNodeStatus(node);
        const readings = node.readings || ({} as any);

        const tilt = readings.tiltDeg ?? 0;
        const moisture = readings.soilMoisturePct ?? 50;
        const vib = readings.vibrationMmS ?? 0;

        let riskScore = 20;
        if (trueStatus === 'critical') {
          riskScore = 88 + Math.min(10, tilt * 1.5 + (moisture - 75) * 0.4);
        } else if (trueStatus === 'warning') {
          riskScore = 55 + Math.min(20, tilt * 3.0 + (moisture - 60) * 0.5);
        } else {
          riskScore = 15 + Math.min(20, tilt * 4.0 + vib * 2.0);
        }

        if (isDisabled) riskScore = 10;

        const radiusMeters = 80 + (riskScore * 1.6);
        const color = riskScore >= 75 ? '#ef4444' : riskScore >= 45 ? '#f59e0b' : '#22c55e';
        const fillOpacity = isDisabled ? 0.05 : riskScore >= 75 ? 0.42 : riskScore >= 45 ? 0.28 : 0.16;

        L.circle([node.lat, node.lng], {
          radius: radiusMeters,
          color: color,
          weight: 1.5,
          opacity: isDisabled ? 0.1 : 0.6,
          fillColor: color,
          fillOpacity: fillOpacity,
          dashArray: riskScore < 45 ? '3, 6' : undefined,
        }).addTo(group);
      });
    }

    // B. RENDER PEER-TO-PEER WIFI MESH & LORA INTER-MASTER LINKS
    if (showMeshLinks) {
      const master1 = SECTOR_MASTERS.find(m => m.id === 'MASTER-S1')!;
      const master2 = SECTOR_MASTERS.find(m => m.id === 'MASTER-S2')!;

      // Sector 1 WiFi Mesh Links
      const nodeA = activeNodes.find(n => n.id === 'NODE-A');
      const nodeB = activeNodes.find(n => n.id === 'NODE-B');
      const nodeC = activeNodes.find(n => n.id === 'NODE-C');

      if (nodeA && master1) {
        const isBroken = disabledNodeIds.includes(nodeA.id);
        L.polyline([[nodeA.lat, nodeA.lng], [master1.lat, master1.lng]], {
          color: isBroken ? '#444444' : '#38bdf8',
          weight: 2,
          opacity: isBroken ? 0.25 : 0.8,
          dashArray: isBroken ? '4, 4' : '6, 4',
        }).addTo(group);
      }
      if (nodeB && master1) {
        const isBroken = disabledNodeIds.includes(nodeB.id);
        L.polyline([[nodeB.lat, nodeB.lng], [master1.lat, master1.lng]], {
          color: isBroken ? '#444444' : '#38bdf8',
          weight: 2,
          opacity: isBroken ? 0.25 : 0.8,
          dashArray: isBroken ? '4, 4' : '6, 4',
        }).addTo(group);
      }
      if (nodeC && nodeA) {
        const isBroken = disabledNodeIds.includes(nodeC.id) || disabledNodeIds.includes(nodeA.id);
        L.polyline([[nodeC.lat, nodeC.lng], [nodeA.lat, nodeA.lng]], {
          color: isBroken ? '#444444' : '#22c55e',
          weight: 2,
          opacity: isBroken ? 0.25 : 0.7,
          dashArray: isBroken ? '4, 4' : '4, 4',
        }).addTo(group);
      }

      // Sector 2 WiFi Mesh Links
      const nodeX = activeNodes.find(n => n.id === 'NODE-X');
      const nodeY = activeNodes.find(n => n.id === 'NODE-Y');
      const nodeZ = activeNodes.find(n => n.id === 'NODE-Z');

      if (nodeX && master2) {
        const isBroken = disabledNodeIds.includes(nodeX.id);
        L.polyline([[nodeX.lat, nodeX.lng], [master2.lat, master2.lng]], {
          color: isBroken ? '#444444' : '#38bdf8',
          weight: 2,
          opacity: isBroken ? 0.25 : 0.8,
          dashArray: isBroken ? '4, 4' : '6, 4',
        }).addTo(group);
      }
      if (nodeY && master2) {
        const isBroken = disabledNodeIds.includes(nodeY.id);
        L.polyline([[nodeY.lat, nodeY.lng], [master2.lat, master2.lng]], {
          color: isBroken ? '#444444' : '#38bdf8',
          weight: 2,
          opacity: isBroken ? 0.25 : 0.8,
          dashArray: isBroken ? '4, 4' : '6, 4',
        }).addTo(group);
      }
      if (nodeZ && nodeY) {
        const isBroken = disabledNodeIds.includes(nodeZ.id) || disabledNodeIds.includes(nodeY.id);
        L.polyline([[nodeZ.lat, nodeZ.lng], [nodeY.lat, nodeY.lng]], {
          color: isBroken ? '#444444' : '#22c55e',
          weight: 2,
          opacity: isBroken ? 0.25 : 0.7,
          dashArray: isBroken ? '4, 4' : '4, 4',
        }).addTo(group);
      }

      // LoRa SX1278 Inter-Master Bridge Link
      if (master1 && master2) {
        L.polyline([[master1.lat, master1.lng], [master2.lat, master2.lng]], {
          color: '#c084fc',
          weight: 3,
          opacity: 0.9,
          dashArray: '8, 4',
        }).addTo(group);

        const midLat = (master1.lat + master2.lat) / 2;
        const midLng = (master1.lng + master2.lng) / 2;

        const loraLabelIcon = L.divIcon({
          className: 'custom-chip-icon',
          html: `
            <div style="
              background: #0d0914;
              border: 1.5px solid #a855f7;
              border-radius: 6px;
              padding: 2px 7px;
              font-family: monospace;
              font-size: 10px;
              font-weight: 700;
              color: #e9d5ff;
              white-space: nowrap;
              box-shadow: 0 4px 12px rgba(0,0,0,0.9);
            ">
              ⚡ LoRa SX1278 Inter-Master Bridge
            </div>
          `,
          iconSize: [220, 22],
          iconAnchor: [110, 11],
        });
        L.marker([midLat, midLng], { icon: loraLabelIcon, interactive: false }).addTo(group);
      }
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
                width: 24px;
                height: 24px;
                border-radius: 6px;
                background: #6b21a8;
                border: 2px solid #e9d5ff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
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
                <span style="font-size: 9px; padding: 1.5px 4px; border-radius: 3px; background: rgba(168,85,247,0.3); color: #e9d5ff;">RPI-4 MASTER</span>
              </div>
            </div>
          `,
          iconSize: [190, 28],
          iconAnchor: [12, 14],
        });

        const marker = L.marker([master.lat, master.lng], { icon: masterIcon }).addTo(group);
        
        marker.on('click', () => {
          setSelectedMaster(master);
          setSelectedNode(null);
        });

        marker.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; background: #080a0f; padding: 14px; border-radius: 12px; border: 1.5px solid #a855f7; font-size: 12px; min-width: 300px; max-width: 340px; box-shadow: 0 12px 36px rgba(0,0,0,0.95);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2e1065; padding-bottom: 8px; margin-bottom: 10px;">
              <div>
                <strong style="color: #ffffff; font-size: 14px;">${master.name}</strong>
                <div style="font-size: 10px; font-family: monospace; color: #c084fc; margin-top: 1px;">${master.code} • Sector ${master.sectorNum}</div>
              </div>
              <span style="padding: 3px 8px; border-radius: 999px; font-size: 9.5px; font-weight: 800; font-family: monospace; background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid #a855f7;">
                ROOT SINK
              </span>
            </div>

            <!-- Hardware Spec Chip -->
            <div style="font-size: 10px; font-family: monospace; color: #d8b4fe; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.25); padding: 4px 8px; border-radius: 6px; margin-bottom: 10px;">
              Raspberry Pi 4 Model B (Cortex-A72 • 4GB RAM)
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
              <div style="background: #120e1c; border: 1px solid #2e1065; border-radius: 8px; padding: 7px;">
                <div style="font-size: 9px; font-weight: 700; color: #c084fc; text-transform: uppercase; margin-bottom: 3px;">🧠 Edge AI Engine</div>
                <div style="font-size: 11px; font-weight: bold; color: #38bdf8; font-family: monospace;">TFLite Strata-Net</div>
                <div style="font-size: 9.5px; color: #a855f7; font-family: monospace; margin-top: 2px;">${master.edgeAiInferenceFps || 14.6} FPS Live</div>
              </div>

              <div style="background: #120e1c; border: 1px solid #2e1065; border-radius: 8px; padding: 7px;">
                <div style="font-size: 9px; font-weight: 700; color: #c084fc; text-transform: uppercase; margin-bottom: 3px;">📶 Emergency GSM</div>
                <div style="font-size: 11px; font-weight: bold; color: #4ade80; font-family: monospace;">SIM7600 4G LTE</div>
                <div style="font-size: 9.5px; color: #4ade80; font-family: monospace; margin-top: 2px;">5/5 Bars • SMS Active</div>
              </div>

              <div style="background: #120e1c; border: 1px solid #2e1065; border-radius: 8px; padding: 7px;">
                <div style="font-size: 9px; font-weight: 700; color: #c084fc; text-transform: uppercase; margin-bottom: 3px;">📻 LoRa Inter-Bridge</div>
                <div style="font-size: 11px; font-weight: bold; color: #ffffff; font-family: monospace;">SX1278 868MHz</div>
                <div style="font-size: 9.5px; color: #94a3b8; font-family: monospace; margin-top: 2px;">Self-Healing ACK</div>
              </div>

              <div style="background: #120e1c; border: 1px solid #2e1065; border-radius: 8px; padding: 7px;">
                <div style="font-size: 9px; font-weight: 700; color: #c084fc; text-transform: uppercase; margin-bottom: 3px;">☀️ Power & MPPT</div>
                <div style="font-size: 11px; font-weight: bold; color: #fbbf24; font-family: monospace;">120W Solar Array</div>
                <div style="font-size: 9.5px; color: #22c55e; font-family: monospace; margin-top: 2px;">Bat: ${master.batteryPct}% • ${master.cpuTempC}°C</div>
              </div>
            </div>

            <div style="padding-top: 6px; border-top: 1px solid #2e1065; font-size: 9.5px; font-family: monospace; color: #a855f7; display: flex; justify-content: space-between;">
              <span>SSID: ${master.wifiHotspotSsid}</span>
              <span style="color: #4ade80;">● Online Relay</span>
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

    // D. RENDER INTEGRATED ESP32-S3 MULTI-SENSOR STATIONS (Node A, Node B, Node X, Node Y...)
    if (showNodes) {
      activeNodes.forEach((node) => {
        const isDisabled = disabledNodeIds.includes(node.id);
        const trueStatus = calculateNodeStatus(node);
        const readings = node.readings || ({} as any);

        const tiltVal = Number(readings.tiltDeg ?? 0);
        const vibVal = Number(readings.vibrationMmS ?? 0);
        const rollVal = Number(readings.rollDeg ?? 0);
        const pitchVal = Number(readings.pitchDeg ?? 0);
        const moistureVal = Number(readings.soilMoisturePct ?? 50);
        const tempVal = Number(readings.tempC ?? 27.5);
        const humidityVal = Number(readings.humidityPct ?? 60);
        const pressureVal = Number(readings.pressureHpa ?? 1012);
        const batteryVal = Number(readings.batteryPct ?? 95);
        const rssiVal = Number(readings.rssiDbm ?? -70);

        const isDead = isDisabled || node.status === 'offline';
        const displayStatus = isDead ? 'DEAD / OFFLINE' : trueStatus === 'critical' ? 'CRITICAL BREACH' : trueStatus === 'warning' ? 'WARNING (CREEP)' : 'ACTIVE (NORMAL)';
        const statusColor = isDead ? '#94a3b8' :
                            trueStatus === 'critical' ? '#ef4444' :
                            trueStatus === 'warning' ? '#f59e0b' :
                            '#22c55e';
        const statusBg = isDead ? 'rgba(148, 163, 184, 0.15)' :
                         trueStatus === 'critical' ? 'rgba(239, 68, 68, 0.25)' :
                         trueStatus === 'warning' ? 'rgba(245, 158, 11, 0.25)' :
                         'rgba(34, 197, 94, 0.25)';

        const moistureStatusText = moistureVal > 85 ? '🚨 LIQUEFACTION RISK' :
                                   moistureVal > 75 ? '⚠️ HIGH SATURATION' :
                                   '✓ OPTIMAL DRAINAGE';
        const moistureColor = moistureVal > 85 ? '#ef4444' :
                              moistureVal > 75 ? '#f59e0b' :
                              '#22c55e';

        const isPulsing = !isDead && (trueStatus === 'critical' || trueStatus === 'warning');

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
                  background: ${statusBg};
                  color: ${statusColor};
                  text-transform: uppercase;
                  font-weight: 800;
                ">${isDead ? 'DEAD' : trueStatus}</span>
              </div>
            </div>
          `,
          iconSize: [160, 28],
          iconAnchor: [8, 14],
        });

        const marker = L.marker([node.lat, node.lng], { icon: nodeIcon }).addTo(group);

        marker.on('click', () => {
          setSelectedNode(node);
          setSelectedMaster(null);
          onSelectNode?.(node);
        });

        marker.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; background: #080a0f; padding: 14px; border-radius: 12px; border: 1.5px solid ${statusColor}; font-size: 12px; min-width: 300px; max-width: 330px; box-shadow: 0 12px 36px rgba(0,0,0,0.95);">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e232d; padding-bottom: 8px; margin-bottom: 8px;">
              <div>
                <strong style="color: #ffffff; font-size: 13.5px;">${node.name}</strong>
                <div style="font-size: 10.5px; font-family: monospace; color: #94a3b8; margin-top: 1px;">${node.code} • Sector ${node.sector}</div>
              </div>
              <span style="padding: 3px 8px; border-radius: 999px; font-size: 9.5px; font-weight: 800; font-family: monospace; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor};">
                ${displayStatus}
              </span>
            </div>

            <!-- Hardware Tag -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-family: monospace; color: #38bdf8; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); padding: 4px 8px; border-radius: 6px; margin-bottom: 10px;">
              <span>📡 ESP32-S3 Pod (BNO085 + BME280 + VWC)</span>
              <span style="color: #cbd5e1;">Mesh Node</span>
            </div>

            <!-- 4 Structured Telemetry Tiles -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
              <!-- Box 1: BNO085 9-DOF IMU -->
              <div style="background: #11141b; border: 1px solid #1f2530; border-radius: 8px; padding: 7px;">
                <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;">🧭 BNO085 IMU</div>
                <div style="font-size: 11px; margin-bottom: 2px;">Tilt: <strong style="color: ${tiltVal >= 3.5 ? '#ef4444' : '#ffffff'}; font-family: monospace;">${tiltVal.toFixed(2)}°</strong></div>
                <div style="font-size: 11px; margin-bottom: 2px;">Vib: <strong style="color: ${vibVal >= 4.5 ? '#ef4444' : '#ffffff'}; font-family: monospace;">${vibVal.toFixed(1)} mm/s</strong></div>
                <div style="font-size: 9px; color: #64748b; font-family: monospace;">R: ${rollVal.toFixed(1)}° | P: ${pitchVal.toFixed(1)}°</div>
              </div>

              <!-- Box 2: Capacitive Soil Moisture -->
              <div style="background: #11141b; border: 1px solid #1f2530; border-radius: 8px; padding: 7px;">
                <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;">💧 Soil Hydrology</div>
                <div style="font-size: 11px; margin-bottom: 2px;">Moisture: <strong style="color: ${moistureColor}; font-family: monospace;">${moistureVal.toFixed(1)}%</strong></div>
                <div style="font-size: 9px; color: ${moistureColor}; font-weight: 700; margin-top: 3px;">${moistureStatusText}</div>
              </div>

              <!-- Box 3: BME280 Atmospheric -->
              <div style="background: #11141b; border: 1px solid #1f2530; border-radius: 8px; padding: 7px;">
                <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;">🌡️ BME280 Climate</div>
                <div style="font-size: 11px; margin-bottom: 2px;">Temp: <strong style="color: #ffffff; font-family: monospace;">${tempVal.toFixed(1)}°C</strong></div>
                <div style="font-size: 11px; margin-bottom: 2px;">Humidity: <strong style="color: #ffffff; font-family: monospace;">${humidityVal}%</strong></div>
                <div style="font-size: 9px; color: #64748b; font-family: monospace;">${pressureVal} hPa</div>
              </div>

              <!-- Box 4: Power & Mesh Network -->
              <div style="background: #11141b; border: 1px solid #1f2530; border-radius: 8px; padding: 7px;">
                <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;">⚡ Power & Mesh</div>
                <div style="font-size: 11px; margin-bottom: 2px;">Battery: <strong style="color: #22c55e; font-family: monospace;">${batteryVal}%</strong></div>
                <div style="font-size: 11px; margin-bottom: 2px;">RSSI: <strong style="color: #ffffff; font-family: monospace;">${rssiVal} dBm</strong></div>
                <div style="font-size: 9px; color: #38bdf8; font-family: monospace;">Hop ${node.meshHopCount || 1} • Connected</div>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding-top: 6px; border-top: 1px solid #1a1e26; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; font-family: monospace; color: #64748b;">
              <span>Uplink: <strong style="color: #a855f7;">${node.masterId || (node.sector === 2 ? 'Sector-2 Master' : 'Sector-1 Master')}</strong></span>
              <span style="color: #22c55e;">● Live Telemetry</span>
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
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fff; background: #0c0d10; padding: 12px; border-radius: 10px; border: 1.5px solid ${pinColor}; font-size: 12px; max-width: 250px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: ${pinColor}; font-size: 13px;">${rep.id}</strong>
              <span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(239,68,68,0.2); color: ${pinColor}; font-weight: bold;">${rep.status}</span>
            </div>
            <p style="margin: 6px 0; color: #cbd5e1; font-size: 11.5px; line-height: 1.3;">${rep.description}</p>
            <div style="font-size: 10px; color: #94a3b8; font-family: monospace; padding-top: 6px; border-top: 1px solid #222;">
              Width: <strong style="color: #fff;">${rep.crackWidthEstimateMm}mm</strong> • ${rep.zone}
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
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fff; background: #0c0d10; padding: 12px; border-radius: 10px; border: 1.5px solid #22c55e; font-size: 12px;">
            <strong style="color: #22c55e; font-size: 13px;">${ap.name}</strong>
            <div style="color: #cbd5e1; margin-top: 4px; font-size: 11.5px;">Capacity: <strong>${ap.currentCheckedIn} / ${ap.capacityPersons} persons</strong></div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; border-top: 1px solid #222; padding-top: 4px; font-family: monospace;">
              Officer: ${ap.contactOfficer} (${ap.officerPhone})
            </div>
          </div>
        `, { className: 'custom-leaflet-popup' });
      });
    }

  }, [activeNodes, reports, assemblyPoints, rainfallRate, showHeatmap, showNodes, showMasters, showMeshLinks, showMineWorkings, showCrackPins, showShelters, mapCenter, disabledNodeIds]);

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
              className="accent-[#38bdf8] w-3.5 h-3.5 rounded"
            />
            <span className={showMineWorkings ? 'text-[#38bdf8] font-medium' : ''}>Gallery Void</span>
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

      {/* 2. LEAFLET MAP CONTAINER WITH ON-MAP INSPECTOR HUD */}
      <div className="relative w-full h-[540px] sm:h-[640px] rounded-[18px] border border-[#181b20] overflow-hidden bg-[#000000] shadow-2xl">
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

        {/* Bottom-Left Live Node / Master Inspector Drawer (Interactive HUD) */}
        {(selectedNode || selectedMaster) && (
          <div className="absolute bottom-4 left-4 z-30 w-[92%] sm:w-[380px] max-w-[400px] rounded-[16px] bg-[#050608]/95 border border-[#282d38] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-4 text-xs font-mono animate-fadeIn pointer-events-auto transition-all">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1c202a]">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  selectedMaster ? 'bg-[#a855f7] shadow-[0_0_8px_#a855f7]' :
                  disabledNodeIds.includes(selectedNode?.id || '') ? 'bg-[#555555]' :
                  calculateNodeStatus(selectedNode!) === 'critical' ? 'bg-[#ef4444] animate-ping' :
                  calculateNodeStatus(selectedNode!) === 'warning' ? 'bg-[#f59e0b]' :
                  'bg-[#22c55e]'
                }`} />
                <span className="text-[13px] font-bold text-white tracking-tight">
                  {selectedMaster ? selectedMaster.name : selectedNode?.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
                  className="p-1 rounded-md text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                  title={isInspectorExpanded ? 'Collapse' : 'Expand'}
                >
                  {isInspectorExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setSelectedMaster(null);
                  }}
                  className="p-1 rounded-md text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                  title="Close Inspector"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Inspector Content */}
            {isInspectorExpanded && (
              <div className="mt-3 space-y-3">
                {selectedMaster ? (
                  /* Master Hub Inspector */
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-lg bg-[#0e0a16] border border-[#2e1065] text-[#d8b4fe]">
                      <div className="text-[10px] uppercase font-bold text-[#c084fc]">Edge AI Master Station</div>
                      <div className="text-white font-bold text-xs mt-0.5">{selectedMaster.hardwareModel}</div>
                      <div className="text-[11px] text-[#a855f7] mt-1">{selectedMaster.code} • IP: {selectedMaster.ip}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-[#717682] block">Edge AI Model</span>
                        <span className="text-[#38bdf8] font-bold">Strata-Net (14.6 FPS)</span>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-[#717682] block">Emergency GSM</span>
                        <span className="text-[#4ade80] font-bold">SIM7600 (5 Bars)</span>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-[#717682] block">Solar MPPT</span>
                        <span className="text-[#fbbf24] font-bold">120W • 99% Battery</span>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-[#717682] block">Inter-Master Bridge</span>
                        <span className="text-[#c084fc] font-bold">SX1278 LoRa ACK</span>
                      </div>
                    </div>
                  </div>
                ) : selectedNode ? (
                  /* Multi-Sensor ESP32-S3 Node Inspector */
                  <div className="space-y-3">
                    {/* Status Pill & Hardware Model */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <div>
                        <div className="text-[10px] text-[#717682]">Hardware Station</div>
                        <div className="text-white font-bold text-xs">ESP32-S3 Multi-Sensor Pod</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        disabledNodeIds.includes(selectedNode.id) ? 'bg-white/10 text-white/50 border border-white/20' :
                        calculateNodeStatus(selectedNode) === 'critical' ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]' :
                        calculateNodeStatus(selectedNode) === 'warning' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]' :
                        'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]'
                      }`}>
                        {disabledNodeIds.includes(selectedNode.id) ? 'DEAD / OFFLINE' : calculateNodeStatus(selectedNode)}
                      </span>
                    </div>

                    {/* Visual Gauges */}
                    <div className="space-y-2">
                      {/* Tilt Gauge */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#828894]">🧭 BNO085 Tilt Slope</span>
                          <span className={`font-bold ${(selectedNode.readings?.tiltDeg ?? 0) >= 3.5 ? 'text-[#ef4444]' : 'text-white'}`}>
                            {(selectedNode.readings?.tiltDeg ?? 0).toFixed(2)}° <span className="text-[#717682] font-normal">/ 6.0° max</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#14171d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (selectedNode.readings?.tiltDeg ?? 0) >= 6.0 ? 'bg-[#ef4444]' :
                              (selectedNode.readings?.tiltDeg ?? 0) >= 3.5 ? 'bg-[#f59e0b]' :
                              'bg-[#22c55e]'
                            }`}
                            style={{ width: `${Math.min(100, ((selectedNode.readings?.tiltDeg ?? 0) / 6.0) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Soil Moisture Gauge */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#828894]">💧 Soil Moisture (VWC)</span>
                          <span className={`font-bold ${(selectedNode.readings?.soilMoisturePct ?? 50) >= 75 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                            {(selectedNode.readings?.soilMoisturePct ?? 50).toFixed(1)}% <span className="text-[#717682] font-normal">/ 85% sat</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#14171d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (selectedNode.readings?.soilMoisturePct ?? 50) >= 85 ? 'bg-[#ef4444]' :
                              (selectedNode.readings?.soilMoisturePct ?? 50) >= 75 ? 'bg-[#f59e0b]' :
                              'bg-[#38bdf8]'
                            }`}
                            style={{ width: `${Math.min(100, (selectedNode.readings?.soilMoisturePct ?? 50))}%` }}
                          />
                        </div>
                      </div>

                      {/* PPV Vibration Gauge */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#828894]">⚡ PPV Peak Vibration</span>
                          <span className="text-white font-bold">
                            {(selectedNode.readings?.vibrationMmS ?? 0).toFixed(1)} mm/s
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#14171d] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#a855f7] transition-all duration-500"
                            style={{ width: `${Math.min(100, ((selectedNode.readings?.vibrationMmS ?? 0) / 12.0) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Environment & Network Strip */}
                    <div className="grid grid-cols-2 gap-2 text-[10.5px] p-2 rounded-lg bg-black/40 border border-white/5">
                      <div className="text-[#94a3b8]">
                        Temp: <span className="text-white font-bold">{selectedNode.readings?.tempC ?? 27.5}°C</span>
                      </div>
                      <div className="text-[#94a3b8]">
                        Humidity: <span className="text-white font-bold">{selectedNode.readings?.humidityPct ?? 60}%</span>
                      </div>
                      <div className="text-[#94a3b8]">
                        Battery: <span className="text-[#22c55e] font-bold">{selectedNode.readings?.batteryPct ?? 95}%</span>
                      </div>
                      <div className="text-[#94a3b8]">
                        RSSI: <span className="text-white font-bold">{selectedNode.readings?.rssiDbm ?? -70} dBm</span>
                      </div>
                    </div>

                    {/* Dynamic Failure Simulation Toggle */}
                    <div className="pt-2 border-t border-[#1c202a]">
                      <button
                        onClick={() => toggleNodeDisabled(selectedNode.id)}
                        className={`w-full py-2 rounded-lg text-[11px] font-bold transition-all ${
                          disabledNodeIds.includes(selectedNode.id)
                            ? 'bg-[#22c55e] text-black hover:bg-[#16a34a]'
                            : 'border border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20'
                        }`}
                      >
                        {disabledNodeIds.includes(selectedNode.id)
                          ? `✓ RESTORE NODE ONLINE (${selectedNode.name.split(' ')[0]} ${selectedNode.name.split(' ')[1] || ''})`
                          : `⚠ SIMULATE NODE FAILURE / DEAD STATE`}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
