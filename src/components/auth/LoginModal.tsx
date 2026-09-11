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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleClose = () => {
    setError(null);
    setIsLoginModalOpen(false);
    onClose?.();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-[16px] border border-[#222222] bg-[#050607] p-6 sm:p-8 shadow-2xl space-y-5">
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

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-[8px] bg-[#2a0f12] border border-[#f87171]/40 text-[#fca5a5] text-[12px] leading-relaxed animate-in fade-in duration-200">
            <span className="text-[14px]">⚠️</span>
            <div className="flex-1">
              <span className="font-semibold text-white">Authentication Rejected: </span>
              {error}
            </div>
          </div>
        )}

        {/* Quick Demo Credentials */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#808080]">
            <span>Verified Database Accounts:</span>
            <span className="text-[#3fcb7f] font-mono text-[10px]">SECURE AUTH</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setEmail('admin@geo.com');
                setPassword('password123');
              }}
              className="flex flex-col items-start p-2.5 rounded-[8px] border border-[#262626] bg-[#0c0d0e] hover:border-[#3fcb7f]/50 hover:bg-[#121416] transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white group-hover:text-[#3fcb7f]">
                <span>👑</span>
                <span>DGMS Admin</span>
              </div>
              <span className="text-[10px] font-mono text-[#888888] truncate w-full">admin@geo.com</span>
              <span className="text-[9px] font-mono text-[#555555]">pass: password123</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setEmail('operator@geosentinel.gov.in');
                setPassword('password123');
              }}
              className="flex flex-col items-start p-2.5 rounded-[8px] border border-[#262626] bg-[#0c0d0e] hover:border-[#38bdf8]/50 hover:bg-[#121416] transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white group-hover:text-[#38bdf8]">
                <span>🛡️</span>
                <span>Chief Operator</span>
              </div>
              <span className="text-[10px] font-mono text-[#888888] truncate w-full">operator@geosentinel.gov.in</span>
              <span className="text-[9px] font-mono text-[#555555]">pass: password123</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-[13px]">
          <div>
            <label className="block text-[#808080] text-[12px] mb-1">Work Email / Govt ID</label>
            <input
              type="email"
              required
              placeholder="admin@geo.com"
              value={email}
              onChange={(e) => {
                setError(null);
                setEmail(e.target.value);
              }}
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
              onChange={(e) => {
                setError(null);
                setPassword(e.target.value);
              }}
              className="w-full rounded-[6px] border border-[#333333] bg-black px-3 py-2 font-mono text-white text-[12px] focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[6px] font-medium text-[14px] cursor-pointer bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Authenticating with Database...' : 'Launch Mission Control'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>

        <div className="border-t border-[#1a1c20] pt-3 text-center text-[11px] text-[#808080]">
          Secured with Hardware SHA-256 Auth • Jharia Coalfield Command Gateway GW-01
        </div>
      </div>
    </div>
  );
};
