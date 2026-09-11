import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { SensorNode } from '../../types';
import { 
  Play, 
  Pause, 
  RotateCcw
} from '../icons';

interface GISHeatmapProps {
  onSelectNode?: (node: SensorNode) => void;
}

export const GISHeatmap: React.FC<GISHeatmapProps> = ({ onSelectNode }) => {
  const { nodes, reports, assemblyPoints, rainfallRate } = useGeoSentinel();

  // Layer toggles
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [showMineWorkings, setShowMineWorkings] = useState<boolean>(true);
  const [showRainfall, setShowRainfall] = useState<boolean>(true);
  const [showCrackPins, setShowCrackPins] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);

  // Time scrubber state (0 = 24h ago, 100 = Present/Live)
  const [timelinePos, setTimelinePos] = useState<number>(100);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Bounds for coordinate projection
  // Lat: 23.740 to 23.762, Lng: 86.408 to 86.430
  const bounds = useMemo(() => ({
    minLat: 23.740,
    maxLat: 23.762,
    minLng: 86.408,
    maxLng: 86.430,
  }), []);

  const projectCoord = useCallback((lat: number, lng: number, width: number, height: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
    // Invert Y because canvas Y goes top-down, latitude goes south-north
    const y = height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
    return { x, y };
  }, [bounds]);

  // Timeline playback loop
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

  // Render Canvas Cartography
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Clear background (Pure Black / Deep Coalfield Dark)
    ctx.fillStyle = '#050607';
    ctx.fillRect(0, 0, width, height);

    // 2. Render Topographic Grid & Elevation Contours
    ctx.strokeStyle = '#15181c';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // River Damodar Cartographic Path (South border)
    ctx.beginPath();
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 8;
    ctx.moveTo(0, height - 30);
    ctx.bezierCurveTo(width * 0.3, height - 50, width * 0.6, height - 20, width, height - 40);
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    ctx.font = '10px monospace';
    ctx.fillText('DAMODAR RIVERBED OVERBURDEN (SECTOR 2)', 20, height - 45);

    // 3. Render Underground Abandoned Mining Galleries (Hatched Void Polygon)
    if (showMineWorkings) {
      const g1 = projectCoord(23.7440, 86.4140, width, height);
      const g2 = projectCoord(23.7480, 86.4180, width, height);
      const g3 = projectCoord(23.7460, 86.4210, width, height);
      const g4 = projectCoord(23.7420, 86.4170, width, height);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(g1.x, g1.y);
      ctx.lineTo(g2.x, g2.y);
      ctx.lineTo(g3.x, g3.y);
      ctx.lineTo(g4.x, g4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(153, 132, 216, 0.08)';
      ctx.fill();
      ctx.strokeStyle = '#9984d8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#9984d8';
      ctx.font = '10px monospace';
      ctx.fillText('UNSTABLE ABANDONED GALLERY (DEPTH 45M)', g1.x - 10, g1.y - 15);
    }

    // 4. Render Subsidence Heatmap Contours (Dynamic based on timeline scrubber)
    if (showHeatmap) {
      const timeScale = timelinePos / 100; // 0.0 to 1.0

      // High Risk Center (Sector 4 Village Slope)
      const p1 = projectCoord(23.7482, 86.4195, width, height);
      const grad1 = ctx.createRadialGradient(p1.x, p1.y, 5, p1.x, p1.y, 140 * timeScale);
      grad1.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      grad1.addColorStop(0.4, 'rgba(251, 146, 60, 0.28)');
      grad1.addColorStop(0.7, 'rgba(250, 204, 21, 0.15)');
      grad1.addColorStop(1, 'rgba(63, 203, 127, 0)');

      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 140 * timeScale, 0, Math.PI * 2);
      ctx.fill();

      // Secondary Risk Center (Sector 3 Gallery)
      const p2 = projectCoord(23.7450, 86.4150, width, height);
      const grad2 = ctx.createRadialGradient(p2.x, p2.y, 5, p2.x, p2.y, 100 * timeScale);
      grad2.addColorStop(0, 'rgba(251, 146, 60, 0.35)');
      grad2.addColorStop(0.5, 'rgba(250, 204, 21, 0.18)');
      grad2.addColorStop(1, 'rgba(63, 203, 127, 0)');

      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 100 * timeScale, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Rainfall Radar Cloud Particles
    if (showRainfall && rainfallRate > 10) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      for (let i = 0; i < 40; i++) {
        const rx = (Math.sin(i * 99 + timelinePos) * 0.5 + 0.5) * width;
        const ry = (Math.cos(i * 33 + timelinePos) * 0.5 + 0.5) * height;
        ctx.fillRect(rx, ry, 1.5, 8);
      }
    }

    // 6. Draw Citizen Crack Pins
    if (showCrackPins) {
      reports.forEach((rep) => {
        const pos = projectCoord(rep.lat, rep.lng, width, height);
        ctx.fillStyle = rep.status === 'Corroborated & Approved' ? '#ef4444' : '#facc15';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.fillText(`Crack: ${rep.crackWidthEstimateMm}mm`, pos.x + 8, pos.y + 3);
      });
    }

    // 7. Draw Safe Assembly Shelters
    if (showShelters) {
      assemblyPoints.forEach((ap) => {
        const pos = projectCoord(ap.lat, ap.lng, width, height);
        ctx.fillStyle = '#3fcb7f';
        ctx.fillRect(pos.x - 7, pos.y - 7, 14, 14);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - 7, pos.y - 7, 14, 14);

        ctx.fillStyle = '#3fcb7f';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`⌂ ${ap.name}`, pos.x + 10, pos.y + 4);
      });
    }

    // 8. Draw LoRa Sensor Nodes
    if (showNodes) {
      nodes.forEach((node) => {
        const pos = projectCoord(node.lat, node.lng, width, height);

        // Outer pulse circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = node.status === 'critical' ? 'rgba(239, 68, 68, 0.3)' :
                        node.status === 'warning' ? 'rgba(251, 146, 60, 0.3)' :
                        'rgba(63, 203, 127, 0.25)';
        ctx.fill();

        // Inner solid dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = node.status === 'critical' ? '#ef4444' :
                        node.status === 'warning' ? '#fb923c' :
                        '#3fcb7f';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(node.code, pos.x + 8, pos.y - 4);
      });
    }

  }, [bounds, nodes, reports, assemblyPoints, rainfallRate, showHeatmap, showNodes, showMineWorkings, showRainfall, showCrackPins, showShelters, timelinePos, projectCoord]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Find closest node within 20px
    let closestNode: SensorNode | null = null;
    let minDist = 25;

    nodes.forEach((node) => {
      const pos = projectCoord(node.lat, node.lng, canvas.width, canvas.height);
      const dist = Math.hypot(pos.x - x, pos.y - y);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    });

    if (closestNode && onSelectNode) {
      onSelectNode(closestNode);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Layer Toggles Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#1a1c20] bg-[#050607] p-3 text-[12px]">
        {/* Layer Checkboxes */}
        <div className="flex flex-wrap items-center gap-3 text-[#b3b3b3]">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="accent-[#3fcb7f]"
            />
            <span>Subsidence Heat Contours</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showNodes}
              onChange={(e) => setShowNodes(e.target.checked)}
              className="accent-[#3fcb7f]"
            />
            <span>LoRa Sensor Nodes</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showMineWorkings}
              onChange={(e) => setShowMineWorkings(e.target.checked)}
              className="accent-[#9984d8]"
            />
            <span>Underground Void Hatches</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showRainfall}
              onChange={(e) => setShowRainfall(e.target.checked)}
              className="accent-[#38bdf8]"
            />
            <span>Rainfall Radar</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showCrackPins}
              onChange={(e) => setShowCrackPins(e.target.checked)}
              className="accent-[#fb923c]"
            />
            <span>Citizen Crack Pins</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showShelters}
              onChange={(e) => setShowShelters(e.target.checked)}
              className="accent-[#3fcb7f]"
            />
            <span>Assembly Shelters</span>
          </label>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#808080]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#3fcb7f]" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#facc15]" /> Advisory
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" /> Critical
          </span>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative rounded-[16px] border border-[#1a1c20] bg-black overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={960}
          height={480}
          onClick={handleCanvasClick}
          className="w-full h-[480px] cursor-crosshair block"
        />

        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          <div className="rounded-[6px] border border-[#333333] bg-black/85 px-2.5 py-1 text-[11px] font-mono text-white backdrop-blur-sm">
            Bounding Box: Jharia Basin Sector 1-4 • 23.748°N, 86.420°E
          </div>
          <div className="rounded-[6px] border border-[#3fcb7f]/40 bg-[#3fcb7f]/10 px-2.5 py-1 text-[11px] font-mono text-[#3fcb7f] backdrop-blur-sm">
            LoRa SX1262 Mesh Telemetry Active • Click any node dot for telemetry history
          </div>
        </div>

        <div className="absolute bottom-4 right-4 pointer-events-none">
          <div className="rounded-[6px] border border-[#333333] bg-black/85 px-3 py-1.5 text-[11px] font-mono text-[#808080] backdrop-blur-sm">
            Scale: 1:5000 • InSAR Baseline: 12-Day Sentinel-1 Repeat
          </div>
        </div>
      </div>

      {/* 24-Hour Time Scrubber Playback Controls */}
      <div className="rounded-[12px] border border-[#1a1c20] bg-[#050607] p-4 flex flex-col sm:flex-row items-center gap-4 text-[12px]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#333333] bg-black text-white hover:border-white transition-colors cursor-pointer"
          >
            {isPlayingTimeline ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            onClick={() => { setTimelinePos(0); setIsPlayingTimeline(false); }}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#333333] bg-black text-[#808080] hover:text-white transition-colors cursor-pointer"
            title="Reset to 24h Ago"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 w-full space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-[#808080]">
            <span>-24 Hours Ago (Pre-Monsoon)</span>
            <span className="text-white font-bold">
              {timelinePos === 100 ? '● LIVE / REAL-TIME NOW' : `T - ${Math.round((100 - timelinePos) * 0.24)} Hours`}
            </span>
            <span>Present / Live</span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={timelinePos}
            onChange={(e) => {
              setTimelinePos(Number(e.target.value));
              setIsPlayingTimeline(false);
            }}
            className="w-full accent-[#3fcb7f] bg-[#1a1c20] h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
