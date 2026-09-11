import React, { useState } from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  X, 
  ArrowRight 
} from '../icons';

interface LoginModalProps {
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useGeoSentinel();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isLoginModalOpen) return null;

  const handleClose = () => {
    setIsLoginModalOpen(false);
    onClose?.();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by context alert
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-[16px] border border-[#222222] bg-[#050607] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1a1c20] pb-4">
          <div className="flex items-center gap-3">
            {/* Checkerboard Logo */}
            <div className="grid grid-cols-4 gap-0.5 w-6 h-6">
              <div className="w-1.2 h-1.2 bg-white rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white/20 rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white/20 rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white/20 rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white/20 rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white/20 rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-[#3fcb7f] rounded-[0.5px] shadow-[0_0_6px_#3fcb7f]" />
              <div className="w-1.2 h-1.2 bg-white/20 rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white/20 rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white/20 rounded-[0.5px]" />
              <div className="w-1.2 h-1.2 bg-white rounded-[0.5px]" />
            </div>

            <div>
              <h3 className="text-[18px] font-semibold text-white tracking-[-0.03em]">
                Staff & Admin Sign In
              </h3>
              <p className="text-[12px] text-[#808080]">
                Access the geological early warning terminal
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#333333] bg-transparent text-[#808080] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-[13px]">
          <div>
            <label className="block text-[#808080] text-[12px] mb-1">Work Email / Govt ID</label>
            <input
              type="email"
              required
              placeholder="operator@geosentinel.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 font-mono text-white text-[12px] focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#808080] text-[12px] mb-1">Security Token / Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 font-mono text-white text-[12px] focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[6px] font-medium text-[14px] cursor-pointer bg-white text-black hover:bg-gray-200 transition-colors"
            >
              <span>Launch Mission Control</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="border-t border-[#1a1c20] pt-4 text-center text-[11px] text-[#808080]">
          Secured with Hardware SHA-256 Auth • Jharia Coalfield Command Gateway GW-01
        </div>
      </div>
    </div>
  );
};
