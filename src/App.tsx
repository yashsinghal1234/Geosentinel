import React from 'react';
import { GeoSentinelProvider, useGeoSentinel } from './context/GeoSentinelContext';
import { TopNav } from './components/navigation/TopNav';
import { LandingPage } from './components/landing/LandingPage';
import { PublicSafetyView } from './components/public/PublicSafetyView';
import { CitizenCrackPortal } from './components/citizen/CitizenCrackPortal';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { GISHeatmap } from './components/gis/GISHeatmap';
import { MeshTopologyView } from './components/topology/MeshTopologyView';
import { GatewayEdgeView } from './components/gateway/GatewayEdgeView';
import { AdminSettingsView } from './components/admin/AdminSettingsView';
import { LoginModal } from './components/auth/LoginModal';
import { Footer } from './components/navigation/Footer';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    isAuthenticated, 
    isLoginModalOpen, 
    setIsLoginModalOpen 
  } = useGeoSentinel();

  const renderActiveView = () => {
    // Public routes (Zero Login Required)
    if (activeTab === 'landing') {
      return <LandingPage />;
    }
    if (activeTab === 'public') {
      return <PublicSafetyView />;
    }
    if (activeTab === 'citizen') {
      return <CitizenCrackPortal />;
    }

    // Protected routes: Check authentication
    if (!isAuthenticated) {
      return (
        <div className="max-w-[1200px] mx-auto px-4 py-20 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 text-[#818cf8]">
            <span className="text-2xl font-mono">🔒</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Government &amp; Operator Access Only</h2>
          <p className="text-sm text-[#94a3b8] max-w-md mx-auto leading-relaxed">
            This module requires official Directorate General of Mines Safety (DGMS) credentials. Villagers and public citizens can access the Live Safety Board and Citizen Crack Portal without logging in.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2.5 rounded-full text-xs font-mono font-semibold bg-white text-black hover:bg-white/90 transition-colors"
            >
              LOG IN AS OFFICIAL OPERATOR
            </button>
          </div>
        </div>
      );
    }

    // Authenticated views
    switch (activeTab) {
      case 'operator':
        return <OperatorDashboard />;
      case 'gis':
        return (
          <div className="space-y-6 pb-16">
            <div className="p-5 rounded-xl border border-white/10 bg-[#050607]">
              <span className="text-xs font-mono text-[#818cf8] uppercase tracking-wider block mb-1">
                FULL-SCREEN CARTOGRAPHY
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Geological Subsidence GIS Surface Heatmap &amp; Overburden Contours
              </h1>
            </div>
            <GISHeatmap />
          </div>
        );
      case 'topology':
        return <MeshTopologyView />;
      case 'gateway':
        return <GatewayEdgeView />;
      case 'admin':
        return <AdminSettingsView />;
      default:
        return <LandingPage />;
    }
  };

  // If Authenticated: Render the full-screen modern workspace (no footer)
  if (isAuthenticated) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-black text-white selection:bg-[#a3e635]/30">
        <OperatorDashboard />
        {isLoginModalOpen && (
          <LoginModal onClose={() => setIsLoginModalOpen(false)} />
        )}
      </div>
    );
  }

  // Public / Non-authenticated Layout with TopNav & Footer
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#a3e635]/30 flex flex-col justify-between">
      <div>
        <TopNav />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 min-h-[calc(100vh-80px)]">
          {renderActiveView()}
        </main>
      </div>

      {/* Footer is only rendered for public pages */}
      <Footer />

      {/* Global Login Modal for Official Access */}
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
};

export function App() {
  return (
    <GeoSentinelProvider>
      <AppContent />
    </GeoSentinelProvider>
  );
}

export default App;
