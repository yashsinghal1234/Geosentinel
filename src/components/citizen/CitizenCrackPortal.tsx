import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import type { CitizenCrackReport } from '../../types';
import { 
  Camera, 
  CheckCircle, 
  Lock
} from '../icons';

export const CitizenCrackPortal: React.FC = () => {
  const { 
    reports, 
    submitCrackReport, 
    reviewCrackReport, 
    setActiveTab,
    isAuthenticated,
    setIsLoginModalOpen
  } = useGeoSentinel();

  // Form states
  const [reporterName, setReporterName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('Sector 4 (Village Slope)');
  const [crackWidth, setCrackWidth] = useState(12);
  const [description, setDescription] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Review modal state for operator triage
  const [reviewingReport, setReviewingReport] = useState<CitizenCrackReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState('Matches ground displacement trend on nearest extensometer.');

  const samplePhotos = [
    {
      url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
      title: 'Ground Fissure in Soil/Courtyard',
    },
    {
      url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80',
      title: 'Masonry Wall Shear Separation',
    },
    {
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
      title: 'Road Surface Fracture',
    },
  ];

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();

    // Default coords near Sector 4 with small jitter
    const lat = 23.7480 + (Math.random() * 0.006 - 0.003);
    const lng = 86.4200 + (Math.random() * 0.006 - 0.003);

    submitCrackReport({
      reporterName: reporterName.trim() || 'Anonymous Resident',
      phone: phone.trim() || '+91 94311 00000',
      lat,
      lng,
      zone,
      crackWidthEstimateMm: crackWidth,
      photoUrl: samplePhotos[selectedPhotoIndex].url,
      description: description.trim() || 'Observed rapid crack dilation over the past 12 hours.',
    });

    setSubmittedSuccess(true);
    setReporterName('');
    setDescription('');
    setTimeout(() => setSubmittedSuccess(false), 4000);
  };

  const handleApprove = () => {
    if (!reviewingReport) return;
    reviewCrackReport(reviewingReport.id, true, reviewNotes);
    setReviewingReport(null);
  };

  const handleDismiss = () => {
    if (!reviewingReport) return;
    reviewCrackReport(reviewingReport.id, false, 'Dismissed: Non-structural superficial surface shrinkage.');
    setReviewingReport(null);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner with Public Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a1c20] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#9984d8]" />
            <h1 className="text-[24px] font-semibold text-white tracking-[-0.03em]">
              Citizen Ground Crack Reporting Portal
            </h1>
            <span className="text-[10px] font-mono text-[#3fcb7f] bg-[#3fcb7f]/10 border border-[#3fcb7f]/30 px-2 py-0.5 rounded-full">
              PUBLIC • NO LOGIN REQUIRED
            </span>
          </div>
          <p className="text-[14px] text-[#b3b3b3] mt-1">
            Anyone can upload geotagged photos of ground fissures. No password or registration required.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('public')}
            className="btn-outlined text-[12px] py-1.5 px-3 cursor-pointer"
          >
            Village Safety Board
          </button>

          <button
            onClick={() => setActiveTab('landing')}
            className="text-[12px] text-[#808080] hover:text-white px-2 py-1 transition-colors cursor-pointer"
          >
            Home
          </button>

          {!isAuthenticated && (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1 text-[12px] text-[#b3b3b3] hover:text-white bg-[#111111] border border-[#222222] px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer"
            >
              <Lock className="h-3 w-3 text-[#f59e0b]" />
              <span>Operator Login</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Submission Form (5 cols) */}
        <div className="lg:col-span-5 carbon-card p-6 space-y-5">
          <div className="border-b border-[#1a1c20] pb-3">
            <h3 className="text-[16px] font-semibold text-white">Report New Surface Fissure</h3>
            <p className="text-[12px] text-[#808080]">Direct submission to Geological Survey Review Queue</p>
          </div>

          {submittedSuccess && (
            <div className="rounded-[8px] border border-[#3fcb7f] bg-[#3fcb7f]/10 p-3 text-[13px] text-[#3fcb7f] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Report uploaded successfully! Pin placed on Operator GIS Map.</span>
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="space-y-4 text-[13px]">
            <div>
              <label className="block text-[#808080] text-[12px] mb-1">Your Name / Resident (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Rameshwar Soren (or leave blank for Anonymous)"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#808080] text-[12px] mb-1">Contact Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 94311..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[#808080] text-[12px] mb-1">Mining Sector / Village</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white focus:outline-none focus:border-white"
                >
                  <option value="Sector 4 (Village Slope)">Sector 4 (Village Slope)</option>
                  <option value="Sector 3 (Abandoned Gallery)">Sector 3 (Abandoned Gallery)</option>
                  <option value="Sector 2 (Riverbank Overburden)">Sector 2 (Riverbank Overburden)</option>
                  <option value="Sector 1 (Open Cast Pit)">Sector 1 (Open Cast Pit)</option>
                </select>
              </div>
            </div>

            {/* Crack Width Slider */}
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-[#808080]">Estimated Crack Width</span>
                <span className="font-mono font-bold text-[#fb923c]">{crackWidth} mm</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={crackWidth}
                onChange={(e) => setCrackWidth(Number(e.target.value))}
                className="w-full accent-[#fb923c] bg-[#222222] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Photo Selection */}
            <div>
              <label className="block text-[#808080] text-[12px] mb-2">Select or Capture Photo</label>
              <div className="grid grid-cols-3 gap-2">
                {samplePhotos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={`cursor-pointer rounded-[6px] border overflow-hidden transition-all ${
                      selectedPhotoIndex === index ? 'border-[#3fcb7f] ring-2 ring-[#3fcb7f]/30' : 'border-[#222222] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt={photo.title} className="h-16 w-full object-cover" />
                    <div className="p-1 text-[9px] text-center bg-black/80 text-[#b3b3b3] truncate">
                      {photo.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#808080] text-[12px] mb-1">Observation Description</label>
              <textarea
                rows={3}
                placeholder="Describe where the crack is located (e.g. Near village school boundary wall, opened up after last night's rainfall)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white placeholder-[#666666] text-[12px] focus:outline-none focus:border-white"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-filled w-full py-2.5 rounded-[6px] font-medium cursor-pointer"
            >
              <span>Submit Geotagged Crack Report</span>
            </button>
          </form>
        </div>

        {/* Right Column: Operator Triage & Live Submissions Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a1c20] pb-3">
            <div>
              <h3 className="text-[18px] font-semibold text-white">Live Ground Fissure Reports</h3>
              <p className="text-[12px] text-[#808080]">
                {isAuthenticated 
                  ? 'Operator Mode Active: Click any report to corroborate against extensometer trends.'
                  : 'Public Community Feed • Operator review queue active at command center.'}
              </p>
            </div>
            <span className="font-mono text-[12px] text-[#9984d8] bg-[#9984d8]/10 border border-[#9984d8]/30 px-2 py-0.5 rounded-full">
              {reports.length} Total Reports
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => {
                  if (isAuthenticated) {
                    setReviewingReport(report);
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="carbon-card-interactive p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={report.photoUrl}
                    alt={report.description}
                    className="h-16 w-16 rounded-[8px] object-cover border border-[#222222] flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-[14px]">{report.id}</span>
                      <span className="text-[11px] font-mono text-[#808080]">• {report.timestamp}</span>
                    </div>
                    <div className="text-[12px] text-[#fb923c] font-mono font-medium">
                      Est. Width: {report.crackWidthEstimateMm} mm • {report.zone}
                    </div>
                    <p className="text-[12px] text-[#b3b3b3] mt-1 line-clamp-2">
                      "{report.description}"
                    </p>
                    <div className="text-[10px] text-[#808080] mt-0.5">
                      Reported by: {report.reporterName} ({report.phone})
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    report.status === 'Corroborated & Approved'
                      ? 'bg-[#3fcb7f]/15 text-[#3fcb7f] border border-[#3fcb7f]'
                      : report.status === 'Dismissed (Non-critical)'
                      ? 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]'
                      : 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]'
                  }`}>
                    {report.status}
                  </span>

                  <span className="text-[11px] text-[#9984d8] hover:underline flex items-center gap-1">
                    {isAuthenticated ? 'Triage Review →' : 'Operator Triage →'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operator Review Modal */}
      {reviewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg rounded-[16px] border border-[#222222] bg-[#050607] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#1a1c20] pb-3">
              <div>
                <h3 className="text-[18px] font-semibold text-white">
                  Corroborate Report: {reviewingReport.id}
                </h3>
                <p className="text-[12px] text-[#808080]">{reviewingReport.zone}</p>
              </div>
              <button
                onClick={() => setReviewingReport(null)}
                className="text-[#808080] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <img
                src={reviewingReport.photoUrl}
                alt={reviewingReport.description}
                className="h-44 w-full rounded-[8px] object-cover border border-[#222222]"
              />

              <div className="p-3 rounded-[8px] bg-black border border-[#1a1c20] space-y-1">
                <div className="text-[#808080] text-[11px]">Reporter Statement:</div>
                <div className="text-white">"{reviewingReport.description}"</div>
                <div className="text-[11px] font-mono text-[#fb923c]">Estimated Aperture: {reviewingReport.crackWidthEstimateMm} mm</div>
              </div>

              <div>
                <label className="block text-[#808080] text-[12px] mb-1">Geologist Review Notes</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white text-[12px] focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleApprove}
                  className="flex-1 py-2.5 rounded-[6px] bg-[#3fcb7f] text-black font-semibold text-[13px] hover:bg-[#34b570] transition-colors cursor-pointer"
                >
                  ✓ Corroborate & Escalate Risk
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-[6px] border border-[#ef4444] text-[#ef4444] font-medium text-[13px] hover:bg-[#ef4444]/10 transition-colors cursor-pointer"
                >
                  Dismiss (Non-critical)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
