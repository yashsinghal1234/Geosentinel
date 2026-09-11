import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#1a1c20] bg-[#000000] pt-14 pb-10 text-[#a1a1aa] text-[13px] font-sans w-full">
      <div className="w-full px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Column 1: Logo & Socials (Wider) */}
        <div className="md:col-span-5 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-[#a3e635] font-black text-xl tracking-[-0.1em] font-mono leading-none">///</span>
            <span className="text-white font-bold text-xl leading-none tracking-tight">GeoSentinel</span>
          </div>
          <p className="text-[14px] text-[#808080] max-w-sm leading-relaxed">
            Autonomous geological early warning terminal. Built for resilience in zero-connectivity subsurface environments.
          </p>
          <div className="flex items-center gap-5 pt-4">
            {/* Github */}
            <a 
              href="https://github.com/yashsinghal1234/Geosentinel" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#808080] hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            {/* Discord */}
            <a href="#" className="text-[#808080] hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                <path d="M8.5 16.5c-1 0-1.5-1-1.5-1s.5-1 1.5-1"></path>
                <path d="M15.5 16.5c1 0 1.5-1 1.5-1s-.5-1-1.5-1"></path>
                <path d="M8.5 12c-1.5 0-2-1.5-2-1.5s.5-1.5 2-1.5"></path>
                <path d="M15.5 12c1.5 0 2-1.5 2-1.5s-.5-1.5-2-1.5"></path>
                <path d="M12 16.5v.01"></path>
                <path d="M12 12v.01"></path>
              </svg>
            </a>
            {/* X / Twitter */}
            <a href="#" className="text-[#808080] hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l11.733 16h4.267l-11.733-16z"></path>
                <path d="M4 20l6.768-6.768m2.46-2.46l6.772-6.772"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Link Columns */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
          {/* Documentation */}
          <div className="space-y-5">
            <h4 className="text-white font-medium text-[15px]">Documentation</h4>
            <ul className="space-y-3.5">
              <li><a href="#" className="hover:text-white transition-colors block">Village Safety Board</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Node Schema</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Access Telemetry</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Deployments</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-5">
            <h4 className="text-white font-medium text-[15px]">Resources</h4>
            <ul className="space-y-3.5">
              <li><a href="#" className="hover:text-white transition-colors block">GeoSentinel Studio</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Edge Gateway</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Benchmarks</a></li>
            </ul>
          </div>

          {/* Learn */}
          <div className="space-y-5">
            <h4 className="text-white font-medium text-[15px]">Learn</h4>
            <ul className="space-y-3.5">
              <li><a href="#" className="hover:text-white transition-colors block">Guides</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Tutorials</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Latest Releases</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full px-4 sm:px-6 md:px-8 pt-10 mt-10 border-t border-[#1a1c20] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[12px] text-[#666666]">
          © {new Date().getFullYear()} GeoSentinel SIH2026. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-[12px] text-[#666666]">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
