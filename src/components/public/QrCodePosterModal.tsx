import React, { useState } from 'react';
import { X, Check } from '../icons';

interface QrCodePosterModalProps {
  isOpen?: boolean;
  onClose: () => void;
  zoneName?: string;
  url?: string;
}

export const QrCodePosterModal: React.FC<QrCodePosterModalProps> = ({
  isOpen = true,
  onClose,
  zoneName = 'Jharia Coalfield — Sector 4 Village',
  url = 'https://geosentinel.gov.in/status/jharia-sector-4'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-[16px] border border-[#222222] bg-[#050607] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1a1c20] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3fcb7f] animate-pulse" />
              <h3 className="text-[17px] font-semibold text-white tracking-[-0.03em]">
                Public Notice Board QR Code
              </h3>
            </div>
            <p className="text-[12px] text-[#808080] mt-0.5">
              Zero-install, zero-login instant public access poster
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#333333] bg-transparent text-[#808080] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Notice Board Card Mockup */}
        <div className="rounded-[12px] border border-[#333333] bg-white text-black p-6 flex flex-col items-center text-center space-y-4 shadow-lg">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#666666]">
              GOVERNMENT OF INDIA • DISASTER MANAGEMENT
            </div>
            <div className="text-[16px] font-bold tracking-tight text-black">
              LIVE MINE STRATA SAFETY BOARD
            </div>
            <div className="text-[12px] font-medium text-[#2563eb]">
              {zoneName}
            </div>
          </div>

          {/* SVG QR Code */}
          <div className="p-3 bg-white border-2 border-black rounded-[8px] shadow-sm">
            <svg viewBox="0 0 160 160" className="h-36 w-36">
              {/* Outer Position Detection Squares */}
              <rect x="10" y="10" width="40" height="40" fill="none" stroke="#000" strokeWidth="6" />
              <rect x="20" y="20" width="20" height="20" fill="#000" />
              
              <rect x="110" y="10" width="40" height="40" fill="none" stroke="#000" strokeWidth="6" />
              <rect x="120" y="20" width="20" height="20" fill="#000" />

              <rect x="10" y="110" width="40" height="40" fill="none" stroke="#000" strokeWidth="6" />
              <rect x="20" y="120" width="20" height="20" fill="#000" />

              {/* Data Matrix Dots */}
              <rect x="60" y="15" width="8" height="8" fill="#000" />
              <rect x="75" y="15" width="8" height="8" fill="#000" />
              <rect x="90" y="25" width="8" height="8" fill="#000" />
              
              <rect x="60" y="35" width="8" height="8" fill="#000" />
              <rect x="75" y="45" width="8" height="8" fill="#000" />
              <rect x="90" y="45" width="8" height="8" fill="#000" />

              <rect x="15" y="60" width="8" height="8" fill="#000" />
              <rect x="30" y="60" width="8" height="8" fill="#000" />
              <rect x="45" y="60" width="8" height="8" fill="#000" />
              <rect x="60" y="60" width="8" height="8" fill="#000" />
              <rect x="75" y="60" width="8" height="8" fill="#000" />
              <rect x="90" y="60" width="8" height="8" fill="#000" />
              <rect x="105" y="60" width="8" height="8" fill="#000" />
              <rect x="120" y="60" width="8" height="8" fill="#000" />
              <rect x="135" y="60" width="8" height="8" fill="#000" />

              <rect x="15" y="75" width="8" height="8" fill="#000" />
              <rect x="45" y="75" width="8" height="8" fill="#000" />
              <rect x="75" y="75" width="8" height="8" fill="#000" />
              <rect x="105" y="75" width="8" height="8" fill="#000" />
              <rect x="135" y="75" width="8" height="8" fill="#000" />

              <rect x="60" y="90" width="8" height="8" fill="#000" />
              <rect x="75" y="90" width="8" height="8" fill="#000" />
              <rect x="90" y="90" width="8" height="8" fill="#000" />
              <rect x="120" y="90" width="8" height="8" fill="#000" />

              <rect x="60" y="110" width="8" height="8" fill="#000" />
              <rect x="75" y="125" width="8" height="8" fill="#000" />
              <rect x="90" y="110" width="8" height="8" fill="#000" />
              <rect x="110" y="125" width="8" height="8" fill="#000" />
              <rect x="125" y="110" width="8" height="8" fill="#000" />
              <rect x="140" y="125" width="8" height="8" fill="#000" />
            </svg>
          </div>

          <div className="space-y-1">
            <div className="text-[13px] font-bold text-black">
              Scan with Phone Camera
            </div>
            <div className="text-[11px] text-[#444444] leading-tight">
              No App Install • No Login • No Password Required
            </div>
            <div className="text-[11px] font-mono text-[#666666] pt-1">
              Short URL: <span className="font-bold text-black">{url.replace('https://', '')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex-1 rounded-[6px] border border-[#333333] bg-black px-4 py-2 text-[13px] font-medium text-white hover:border-white transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="h-4 w-4 text-[#3fcb7f]" /> : null}
            <span>{copied ? 'Link Copied!' : 'Copy Public URL'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-primary-filled text-[13px] py-2 px-5 rounded-[6px] font-medium"
          >
            Print Poster
          </button>
        </div>

        <div className="text-center text-[11px] text-[#808080]">
          Post this physical QR sheet at Panchayat Bhawan, Primary Health Centers, and Pit Checkpoints.
        </div>
      </div>
    </div>
  );
};
