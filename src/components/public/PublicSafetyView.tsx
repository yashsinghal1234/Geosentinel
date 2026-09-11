import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { TRANSLATIONS } from '../../services/Localization';
import { QrCodePosterModal } from './QrCodePosterModal';
import { 
  ShieldAlert, 
  ShieldCheck, 
  PhoneCall, 
  Camera, 
  CheckCircle2, 
  AlertOctagon,
  Lock,
  X
} from '../icons';
import confetti from 'canvas-confetti';

export const PublicSafetyView: React.FC = () => {
  const { 
    risk, 
    assemblyPoints, 
    language, 
    setLanguage, 
    submitCheckIn, 
    setActiveTab,
    setIsLoginModalOpen
  } = useGeoSentinel();

  const [residentName, setResidentName] = useState('');
  const [familyCount, setFamilyCount] = useState(4);
  const [residentPhone, setResidentPhone] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState<'safe' | 'help' | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const currentStatus = t.statusLevels[risk.level];

  // 1-Click Instant Safe Check-in (Zero login / Zero password required)
  const handleInstantSafeClick = () => {
    submitCheckIn({
      residentName: residentName.trim() || 'Anonymous Resident (1-Tap Check-In)',
      familyCount: Number(familyCount) || 1,
      zone: 'Sector 4 Village',
      status: 'Safe at High Ground Shelter',
      locationNote: locationNote.trim() || 'Checked in via Public Notice Board Link',
      phone: residentPhone.trim() || 'N/A',
    });

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#3fcb7f', '#ffffff', '#9984d8'],
    });

    setHasCheckedIn(true);
    setShowCheckInModal(null);
  };

  const handleHelpCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    submitCheckIn({
      residentName: residentName.trim() || 'URGENT RESIDENT',
      familyCount: Number(familyCount) || 1,
      zone: 'Sector 4 Village',
      status: 'Trapped - Need Immediate Rescue',
      locationNote: locationNote.trim() || 'CRITICAL SOS RESCUE REQUEST',
      phone: residentPhone.trim() || 'N/A',
    });

    setHasCheckedIn(true);
    setShowCheckInModal(null);
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 space-y-8">
      {/* Top Public Header & Notice Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a1c20] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3fcb7f] animate-ping" />
            <h1 className="text-[20px] font-bold text-white tracking-tight">
              Live Village Safety Board
            </h1>
            <span className="text-[10px] font-mono text-[#3fcb7f] bg-[#3fcb7f]/10 border border-[#3fcb7f]/30 px-2 py-0.5 rounded-full">
              PUBLIC ACCESS • NO LOGIN
            </span>
          </div>
          <p className="text-[12px] text-[#808080] mt-0.5">
            Zone: Jharia Coalfield Sector 4 & High Ground Ridge • Updated Every 3.5s
          </p>
        </div>

        {/* Public Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 rounded-[6px] border border-[#333333] bg-[#050607] px-3 py-1.5 text-[12px] text-white hover:border-white transition-colors cursor-pointer"
          >
            <span>Notice Board QR Code</span>
            <span className="text-[10px]">↗</span>
          </button>

          <button
            onClick={() => setActiveTab('landing')}
            className="text-[12px] text-[#808080] hover:text-white px-2 py-1 transition-colors cursor-pointer"
          >
            Back to Home
          </button>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-1 text-[12px] text-[#b3b3b3] hover:text-white bg-[#111111] border border-[#222222] px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer"
          >
            <Lock className="h-3 w-3 text-[#f59e0b]" />
            <span>Official Login</span>
          </button>
        </div>
      </div>

      {/* Edge Hotspot & Language Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#1a1c20] bg-[#050607] px-4 py-2.5 text-[12px]">
        <div className="flex items-center gap-2 text-[#3fcb7f]">
          <span className="h-2 w-2 rounded-full bg-[#3fcb7f] animate-mint-pulse" />
          <span className="font-semibold">{t.offlineEdgeBadge}</span>
          <span className="text-[10px] text-[#808080] hidden sm:inline">(Local Wi-Fi SSID: GEOSENTINEL_EDGE_GW01)</span>
        </div>

        {/* Language Selector in 5 Local Tongues */}
        <div className="flex items-center gap-1">
          {(['en', 'hi', 'bn', 'or', 'sat'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                language === lang ? 'bg-white text-black font-bold' : 'text-[#808080] hover:text-white'
              }`}
            >
              {lang === 'en' ? 'English' :
               lang === 'hi' ? 'हिंदी' :
               lang === 'bn' ? 'বাংলা' :
               lang === 'or' ? 'ଓଡ଼ିଆ' : 'संथाली'}
            </button>
          ))}
        </div>
      </div>

      {hasCheckedIn && (
        <div className="rounded-[10px] border border-[#3fcb7f] bg-[#3fcb7f]/15 p-4 text-[13px] text-white flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#3fcb7f]" />
            <span>Thank you. Your resident safety check-in status has been transmitted to Gateway GW-01.</span>
          </div>
          <button onClick={() => setHasCheckedIn(false)} className="text-[#808080] hover:text-white text-[12px] underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Status Hero Card (High Contrast, Bold, Color-coded) */}
      <div className={`rounded-[16px] border p-6 sm:p-8 text-center space-y-4 ${
        risk.level === 5 ? 'border-[#ef4444] bg-[#ef4444]/10 gradient-danger-wash' :
        risk.level === 4 ? 'border-[#fb923c] bg-[#fb923c]/10' :
        risk.level === 3 ? 'border-[#facc15] bg-[#facc15]/10' :
        'border-[#3fcb7f]/50 bg-[#3fcb7f]/5'
      }`}>
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[13px] font-bold uppercase tracking-wider bg-black/80 border border-white/20 text-white">
          {currentStatus.badge}
        </div>

        <h1 className="text-[28px] sm:text-[38px] font-bold text-white tracking-tight leading-tight">
          {currentStatus.label}
        </h1>

        <p className="text-[16px] sm:text-[18px] text-[#e8eaee] max-w-[700px] mx-auto leading-relaxed">
          {currentStatus.action}
        </p>

        {/* Time-to-Critical Countdown if Hazard Active */}
        {risk.timeToCriticalHours && (
          <div className="pt-2">
            <div className="text-[13px] text-[#b3b3b3] uppercase tracking-wider font-semibold">
              {t.timeToCritical}
            </div>
            <div className="text-[32px] sm:text-[44px] font-bold text-white font-mono tracking-tight mt-1 animate-pulse">
              0{Math.floor(risk.timeToCriticalHours)}h : {Math.floor((risk.timeToCriticalHours % 1) * 60)}m : 00s
            </div>
          </div>
        )}
      </div>

      {/* 1-Tap Resident SOS & Check-in Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setShowCheckInModal('safe')}
          className="flex items-center justify-center gap-3 rounded-[12px] border border-[#3fcb7f] bg-[#3fcb7f]/15 hover:bg-[#3fcb7f]/25 p-5 text-white transition-all transform active:scale-[0.99] cursor-pointer"
        >
          <CheckCircle2 className="h-7 w-7 text-[#3fcb7f]" />
          <div className="text-left">
            <div className="text-[17px] font-bold text-white">{t.imSafeBtn}</div>
            <div className="text-[12px] text-[#b3b3b3]">1-Tap: Count family as safely arrived at shelter</div>
          </div>
        </button>

        <button
          onClick={() => setShowCheckInModal('help')}
          className="flex items-center justify-center gap-3 rounded-[12px] border border-[#ef4444] bg-[#ef4444]/20 hover:bg-[#ef4444]/30 p-5 text-white transition-all transform active:scale-[0.99] cursor-pointer"
        >
          <AlertOctagon className="h-7 w-7 text-[#ef4444] animate-pulse" />
          <div className="text-left">
            <div className="text-[17px] font-bold text-[#ef4444]">{t.needHelpBtn}</div>
            <div className="text-[12px] text-[#b3b3b3]">Send immediate rescue team to your GPS location</div>
          </div>
        </button>
      </div>

      {/* Safe Assembly Shelter & Evacuation Direction Card */}
      <div className="carbon-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1a1c20] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#3fcb7f]" />
            <h3 className="text-[16px] font-semibold text-white">{t.safeAssembly}</h3>
          </div>
          <span className="pill-badge-mint text-[11px]">OPEN & SECURE</span>
        </div>

        {assemblyPoints.map((ap) => (
          <div key={ap.id} className="rounded-[10px] border border-[#1a1c20] bg-black p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-[16px] font-bold text-white">{ap.name}</h4>
                <p className="text-[12px] text-[#808080]">{ap.zone} • Elevation: {ap.elevationMeters}m (Safe above subsidence trough)</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[14px] font-bold text-[#3fcb7f]">
                  {ap.currentCheckedIn} / {ap.capacityPersons}
                </span>
                <span className="text-[11px] text-[#808080] block">Residents Sheltered</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-[#b3b3b3]">
              {ap.amenities.map((am, i) => (
                <span key={i} className="rounded-[4px] border border-[#333333] px-2 py-0.5">
                  ✓ {am}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#1a1c20] pt-2 text-[12px] text-[#808080]">
              <span>Emergency Officer: {ap.contactOfficer}</span>
              <a href={`tel:${ap.officerPhone}`} className="text-[#3fcb7f] font-mono flex items-center gap-1 hover:underline">
                <PhoneCall className="h-3 w-3" />
                {ap.officerPhone}
              </a>
            </div>
          </div>
        ))}

        <div className="rounded-[8px] bg-[#9984d8]/10 border border-[#9984d8]/30 p-3 text-[13px] text-[#e8eaee]">
          <strong>{t.evacuationRoutes}</strong>
        </div>
      </div>

      {/* Emergency Action Guide Checklist */}
      <div className="carbon-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1a1c20] pb-3">
          <ShieldAlert className="h-5 w-5 text-[#fb923c]" />
          <h3 className="text-[16px] font-semibold text-white">{t.emergencyGuideTitle}</h3>
        </div>

        <ul className="space-y-2.5 text-[13px] text-[#b3b3b3]">
          {t.actionItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-[#1a1c20] text-[#3fcb7f] font-mono text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-[#e8eaee] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between border-t border-[#1a1c20] pt-4 gap-3">
          <button
            onClick={() => setActiveTab('citizen')}
            className="btn-outlined text-[13px] py-1.5 px-4 cursor-pointer"
          >
            <Camera className="h-4 w-4" />
            {t.reportCrackBtn} (Zero Login)
          </button>

          <div className="text-[12px] font-mono text-[#fb923c]">
            {t.callEmergency}
          </div>
        </div>
      </div>

      {/* Zero-Friction Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-[16px] border border-[#222222] bg-[#050607] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#1a1c20] pb-3">
              <div>
                <h3 className="text-[17px] font-semibold text-white">
                  {showCheckInModal === 'safe' ? "I'm Safe Check-In" : "Emergency SOS Check-In"}
                </h3>
                <p className="text-[12px] text-[#808080]">
                  No login or password needed. Transmits to shelter roster.
                </p>
              </div>
              <button
                onClick={() => setShowCheckInModal(null)}
                className="text-[#808080] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={showCheckInModal === 'safe' ? (e) => { e.preventDefault(); handleInstantSafeClick(); } : handleHelpCheckIn} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[#808080] text-[12px] mb-1">Your Name / Head of Family (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Manoj Soren"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#808080] text-[12px] mb-1">Family Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={familyCount}
                    onChange={(e) => setFamilyCount(Number(e.target.value))}
                    className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-[#808080] text-[12px] mb-1">Mobile No (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 94311..."
                    value={residentPhone}
                    onChange={(e) => setResidentPhone(e.target.value)}
                    className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#808080] text-[12px] mb-1">Location / Current Shelter Note</label>
                <input
                  type="text"
                  placeholder="e.g. Hall 2 at Community Center"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-[6px] font-medium text-[14px] cursor-pointer ${
                    showCheckInModal === 'safe'
                      ? 'btn-primary-filled'
                      : 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                  }`}
                >
                  {showCheckInModal === 'safe' ? "Confirm Safe Check-in" : "Send Emergency SOS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Poster Modal */}
      <QrCodePosterModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
};
