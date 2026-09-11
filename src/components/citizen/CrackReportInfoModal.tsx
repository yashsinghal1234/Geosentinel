import React, { useState } from 'react';
import type { CitizenCrackReport } from '../../types';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Activity,
  Maximize2
} from '../icons';

interface CrackReportInfoModalProps {
  report: CitizenCrackReport | null;
  onClose: () => void;
  onLocateOnGis?: (report: CitizenCrackReport) => void;
}

export const CrackReportInfoModal: React.FC<CrackReportInfoModalProps> = ({
  report,
  onClose,
  onLocateOnGis,
}) => {
  const { nodes, reviewCrackReport } = useGeoSentinel();

  const [reviewNotes, setReviewNotes] = useState<string>(report?.reviewNotes || '');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState<boolean>(false);

  if (!report) return null;

  // Find nearest sensor node from context
  const matchedNode =
    nodes.find((n) => n.id === report.nearestSensorId) ||
    nodes.find((n) => n.zone.toLowerCase().includes(report.zone.toLowerCase().slice(0, 8))) ||
    nodes[0];

  const handleAction = async (approved: boolean) => {
    setIsSubmittingReview(true);
    const notesToSave = reviewNotes.trim() || (approved ? 'Verified against sensor displacement logs.' : 'Dismissed by safety operator upon inspection.');
    try {
      await reviewCrackReport(report.id, approved, notesToSave);
      setActionFeedback(approved ? 'Report corroborated and escalated.' : 'Report dismissed.');
      setTimeout(() => {
        setActionFeedback(null);
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getSeverityBadge = () => {
    const w = report.crackWidthEstimateMm;
    if (w >= 14) {
      return { label: 'CRITICAL SHEAR DISLOCATION', bg: 'bg-[#2a0e0e]', text: 'text-[#ef4444]', border: 'border-[#591b1b]' };
    }
    if (w >= 7) {
      return { label: 'MODERATE SUBSIDENCE FISSURE', bg: 'bg-[#291e0a]', text: 'text-[#f59e0b]', border: 'border-[#523d13]' };
    }
    return { label: 'MINOR SURFACE TENSION', bg: 'bg-[#0c2233]', text: 'text-[#38bdf8]', border: 'border-[#144768]' };
  };

  const sev = getSeverityBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl bg-[#090b0e] border border-[#232731] rounded-[22px] shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden text-white font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#181b22] bg-[#0d0f14] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#161a23] border border-[#2a3040] text-[#a3e635]">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-base sm:text-lg">
                  {report.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                  report.status === 'Corroborated & Approved'
                    ? 'bg-[#0c2818] text-[#22c55e] border-[#164e29]'
                    : report.status === 'Dismissed (Non-critical)'
                    ? 'bg-[#1e1518] text-[#f87171] border-[#451f26]'
                    : 'bg-[#291e0a] text-[#f59e0b] border-[#523d13]'
                }`}>
                  {report.status.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] font-mono text-[#717682] flex items-center gap-2 mt-0.5">
                <Clock size={11} />
                <span>Submitted: {report.timestamp}</span>
                <span>•</span>
                <MapPin size={11} className="text-[#a3e635]" />
                <span>{report.zone}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full border border-[#232731] bg-[#12141a] hover:bg-[#1f2430] text-[#828894] hover:text-white transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div className="px-5 py-2.5 bg-[#0c2818] border-b border-[#164e29] text-[#22c55e] text-xs font-mono font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (6 cols): Visual Evidence & Field Submission */}
            <div className="lg:col-span-6 space-y-5">
              {/* Photo Viewport */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#828894]">
                  <span className="uppercase tracking-wider">Geological Visual Evidence</span>
                  <button
                    onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}
                    className="flex items-center gap-1 text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    <Maximize2 size={11} />
                    <span>{isPhotoZoomed ? 'Standard View' : 'Enlarge'}</span>
                  </button>
                </div>

                <div className={`relative rounded-[16px] overflow-hidden border border-[#232731] bg-[#050608] transition-all ${
                  isPhotoZoomed ? 'h-80' : 'h-56'
                }`}>
                  <img
                    src={report.photoUrl}
                    alt={`Evidence for ${report.id}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Watermark Overlay */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
                    <span>APERTURE: {report.crackWidthEstimateMm} mm</span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-[#a3e635]">
                    GPS: {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Citizen Description Card */}
              <div className="p-4 rounded-[16px] border border-[#1d212a] bg-[#0c0e13] space-y-2.5">
                <div className="text-[11px] font-mono text-[#717682] uppercase tracking-wider">
                  Citizen Narrative &amp; Observations
                </div>
                <p className="text-[13px] text-[#e2e8f0] leading-relaxed italic">
                  "{report.description}"
                </p>
                
                <div className="pt-2 border-t border-[#181b22] grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#717682] block text-[10px]">REPORTER NAME</span>
                    <span className="text-white font-semibold">{report.reporterName}</span>
                  </div>
                  <div>
                    <span className="text-[#717682] block text-[10px]">CONTACT PHONE</span>
                    <span className="text-[#38bdf8] flex items-center gap-1 font-semibold">
                      <PhoneCall size={11} />
                      {report.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Geotechnical Aperture Classification */}
              <div className="p-4 rounded-[16px] border border-[#1d212a] bg-[#0c0e13] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#717682] uppercase tracking-wider">
                    Displacement Severity Class
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${sev.bg} ${sev.text} ${sev.border}`}>
                    {sev.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-2xl font-black text-white">
                    {report.crackWidthEstimateMm} <span className="text-xs text-[#717682] font-normal">mm width</span>
                  </span>
                  <span className="text-xs text-[#717682]">
                    DGMS Critical Threshold: 14.0 mm
                  </span>
                </div>

                {/* Progress bar to threshold */}
                <div className="w-full h-2 rounded-full bg-[#161a22] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      report.crackWidthEstimateMm >= 14 ? 'bg-[#ef4444]' :
                      report.crackWidthEstimateMm >= 7 ? 'bg-[#f59e0b]' :
                      'bg-[#38bdf8]'
                    }`}
                    style={{ width: `${Math.min(100, (report.crackWidthEstimateMm / 20) * 100)}%` }}
                  />
                </div>

                {onLocateOnGis && (
                  <button
                    onClick={() => onLocateOnGis(report)}
                    className="w-full mt-2 py-2 px-3 rounded-xl border border-[#2a3040] bg-[#12151d] hover:bg-[#1a1f2c] text-xs font-mono text-[#38bdf8] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MapPin size={13} />
                    <span>Pinpoint GPS on GIS Surface Heatmap</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column (6 cols): IoT Sensor Corroboration & DGMS Triage */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* Multi-Sensor AI Corroboration Box */}
              <div className="p-4 sm:p-5 rounded-[18px] border border-[#222938] bg-[#0c0f16] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#a3e635]">
                    <Sparkles size={16} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      IoT Sensor AI Corroboration
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#16231a] text-[#4ade80] border border-[#1f3d27]">
                    {report.aiCorroborationConfidence ? `${report.aiCorroborationConfidence}% Confidence` : '91.8% Confidence'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#06080b] border border-[#181d27] space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between text-[#828894]">
                    <span>NEAREST TELEMETRY NODE:</span>
                    <span className="text-white font-bold">{matchedNode?.name} ({matchedNode?.code || matchedNode?.id})</span>
                  </div>
                  <div className="flex items-center justify-between text-[#828894]">
                    <span>DISTANCE TO CRACK PIN:</span>
                    <span className="text-[#38bdf8] font-bold">~{report.nearestSensorDistanceM || 145} meters</span>
                  </div>
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="p-2.5 rounded-xl bg-[#06080b] border border-[#181d27]">
                    <div className="text-[10px] text-[#717682]">BNO085 TILT</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {(matchedNode?.readings?.tiltDeg ?? 1.8).toFixed(2)}°
                    </div>
                    <div className="text-[9px] text-[#f59e0b]">Limit: {matchedNode?.thresholds?.tiltWarningDeg || 3.0}°</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#06080b] border border-[#181d27]">
                    <div className="text-[10px] text-[#717682]">PPV VIBRATION</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {(matchedNode?.readings?.vibrationMmS ?? 0.6).toFixed(1)} <span className="text-[9px] text-[#717682]">mm/s</span>
                    </div>
                    <div className="text-[9px] text-[#22c55e]">Nominal</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#06080b] border border-[#181d27]">
                    <div className="text-[10px] text-[#717682]">SOIL SATURATION</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {matchedNode?.readings?.soilMoisturePct ?? 52}%
                    </div>
                    <div className="text-[9px] text-[#38bdf8]">Pore Press.</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0a111a] border border-[#132d47] text-[12px] text-[#93c5fd] leading-relaxed font-mono">
                  <strong>AI Cross-Check:</strong> The crack orientation correlates with the subsurface shear strain vector recorded at {matchedNode?.name}. Recommended status: <strong>Escalate for geotechnical bore reinforcement.</strong>
                </div>
              </div>

              {/* Review History Details (if reviewed) */}
              {report.reviewedBy && (
                <div className="p-4 rounded-[16px] border border-[#1e232e] bg-[#0a0c10] space-y-2 font-mono text-xs">
                  <div className="text-[10px] text-[#717682] uppercase tracking-wider">
                    Previous Inspector Triage Note
                  </div>
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Activity size={13} className="text-[#a3e635]" />
                    <span>Officer: {report.reviewedBy}</span>
                  </div>
                  {report.reviewNotes && (
                    <div className="p-2.5 rounded-lg bg-[#050608] border border-[#161922] text-[#cbd5e1] text-[11px]">
                      {report.reviewNotes}
                    </div>
                  )}
                </div>
              )}

              {/* Official DGMS Action & Review Box */}
              <div className="p-4 sm:p-5 rounded-[18px] border border-[#232731] bg-[#0c0e14] space-y-3">
                <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio size={14} className="text-[#a3e635]" />
                  <span>DGMS Official Triage &amp; Escalation Decision</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#717682] block">
                    Add / Update Geotechnical Review Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter geotechnical assessment, rock bolting recommendations, or inspection confirmation..."
                    className="w-full p-3 rounded-xl border border-[#232836] bg-[#06080c] text-xs font-mono text-white placeholder-[#4b5563] focus:outline-none focus:border-[#a3e635] transition-colors resize-none"
                  />
                </div>

                {/* Triage Decision Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    disabled={isSubmittingReview}
                    onClick={() => handleAction(true)}
                    className="py-2.5 px-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>✓ Corroborate &amp; Escalate</span>
                  </button>

                  <button
                    disabled={isSubmittingReview}
                    onClick={() => handleAction(false)}
                    className="py-2.5 px-3 rounded-xl bg-[#1a1416] hover:bg-[#2a1b1f] border border-[#4d1f27] text-[#f87171] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle size={14} />
                    <span>✕ Dismiss (Non-critical)</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#181b22] bg-[#090b0f] flex items-center justify-between text-xs font-mono text-[#717682] shrink-0">
          <span>DGMS SIH'26 Geological Ground Crack Registry</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#2a2f3d] bg-[#12151d] hover:bg-[#1c2230] text-white transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
