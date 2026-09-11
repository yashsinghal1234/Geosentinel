import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  X, 
  FileText, 
  Download 
} from '../icons';

interface IncidentReportModalProps {
  onClose: () => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ onClose }) => {
  const { risk, nodes, rainfallRate, alerts } = useGeoSentinel();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl rounded-[16px] border border-[#222222] bg-[#050607] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1a1c20] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/10 text-white">
              <FileText className="h-5 w-5 text-[#3fcb7f]" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-white tracking-[-0.03em]">
                DGMS-Compliant Geological Incident Report
              </h3>
              <p className="text-[12px] text-[#808080]">
                Automated post-event telemetry audit for Ministry of Mines & DGMS Safety Directorate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#333333] bg-transparent text-[#808080] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Document Preview */}
        <div className="rounded-[12px] border border-[#333333] bg-[#000000] p-6 space-y-6 text-[13px] font-mono leading-relaxed">
          {/* Document Header */}
          <div className="border-b border-[#222222] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
            <div>
              <div className="text-white font-bold tracking-wider">GEOSENTINEL AUTONOMOUS EARLY WARNING AUDIT</div>
              <div className="text-[#808080]">Command Terminal ID: GW-JHR-04 • Jharia Coalfield Basin</div>
            </div>
            <div className="text-right text-[#808080]">
              <div>Generated: {new Date().toLocaleString()}</div>
              <div>Report Reference: INC-DGMS-2026-09A</div>
            </div>
          </div>

          {/* Incident Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#080a0c] border border-[#1a1c20] rounded-[6px]">
              <div className="text-[11px] text-[#808080]">Threat Classification</div>
              <div className="text-[16px] font-bold text-[#ef4444]">{risk.levelName} (Level {risk.level})</div>
            </div>
            <div className="p-3 bg-[#080a0c] border border-[#1a1c20] rounded-[6px]">
              <div className="text-[11px] text-[#808080]">CIMFR Subsidence Trough</div>
              <div className="text-[16px] font-bold text-white">{risk.cimfrSubsidenceDepthMm} mm Max Depth</div>
            </div>
            <div className="p-3 bg-[#080a0c] border border-[#1a1c20] rounded-[6px]">
              <div className="text-[11px] text-[#808080]">Rainfall Infiltration</div>
              <div className="text-[16px] font-bold text-[#38bdf8]">{rainfallRate.toFixed(1)} mm/hr</div>
            </div>
          </div>

          {/* Trigger Mechanism */}
          <div className="p-4 bg-[#080a0c] border border-[#1a1c20] rounded-[6px] space-y-2">
            <div className="text-white font-bold">Physics Evaluation & Corroboration Summary:</div>
            <div className="text-[#e8eaee]">{risk.triggerExplanation}</div>
            <div className="text-[11px] text-[#808080]">
              Corroborating Nodes: {risk.corroboratedNodeIds.length > 0 ? risk.corroboratedNodeIds.join(', ') : 'None (Baseline)'}
            </div>
          </div>

          {/* Sensor Nodes Table */}
          <div className="space-y-2">
            <div className="text-white font-bold">Field Sensors Matrix Snapshot:</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#222222] text-[#808080]">
                    <th className="py-1">Node Code</th>
                    <th className="py-1">Zone</th>
                    <th className="py-1">Tilt (Deg)</th>
                    <th className="py-1">Crack (mm)</th>
                    <th className="py-1">PPV (mm/s)</th>
                    <th className="py-1">Gas (PPM)</th>
                    <th className="py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((n) => (
                    <tr key={n.id} className="border-b border-[#111111]">
                      <td className="py-1 text-white">{n.code}</td>
                      <td className="py-1 text-[#808080]">{n.zone}</td>
                      <td className="py-1 text-white">{n.readings.tiltDeg}°</td>
                      <td className="py-1 text-[#fb923c]">{n.readings.crackWidthMm} mm</td>
                      <td className="py-1 text-[#3fcb7f]">{n.readings.vibrationMmS} mm/s</td>
                      <td className="py-1 text-[#38bdf8]">{n.readings.gasPpm} PPM</td>
                      <td className="py-1 uppercase text-white">{n.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dispatched Alerts History */}
          <div className="space-y-1 text-[11px] text-[#808080]">
            <div className="text-white font-bold">Life-Safety Dispatch Record:</div>
            <div>Recent Dispatches: {alerts.length} Records Verified in Hardware Store-and-Forward Buffer</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="btn-outlined text-[13px] py-2 px-4 cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleDownload}
            className="btn-primary-filled text-[13px] py-2 px-5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{downloading ? 'Preparing Print...' : 'Export DGMS PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
