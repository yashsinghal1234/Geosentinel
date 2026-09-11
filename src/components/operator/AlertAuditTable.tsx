import React from 'react';
import { useGeoSentinel } from '../../context/GeoSentinelContext';
import { 
  Bell, 
  AlertTriangle, 
  Volume2, 
  RotateCcw,
  VolumeX
} from '../icons';

export const AlertAuditTable: React.FC = () => {
  const { 
    alerts, 
    triggerManualAlert, 
    cancelAlertAsFalseAlarm,
    gateway,
    triggerEdgeSiren 
  } = useGeoSentinel();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a1c20] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#f59e0b]" />
            <h2 className="text-[20px] font-semibold text-white tracking-[-0.03em]">
              Life-Safety Alert Dispatch Log & Hardware Relays
            </h2>
          </div>
          <p className="text-[13px] text-[#b3b3b3] mt-0.5">
            Immutable audit record of all automated LoRa alerts, solar siren activations, and SMS dispatches.
          </p>
        </div>

        {/* Manual Siren and Trigger Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerEdgeSiren(!gateway.localSirenActive)}
            className={`flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
              gateway.localSirenActive
                ? 'border-[#ef4444] bg-[#ef4444] text-white animate-pulse'
                : 'border-[#333333] bg-[#050607] text-[#b3b3b3] hover:text-white hover:border-[#808080]'
            }`}
          >
            {gateway.localSirenActive ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            <span>{gateway.localSirenActive ? 'Silence Hardware Siren' : 'Test Edge Siren'}</span>
          </button>

          <button
            onClick={() => triggerManualAlert(4, 'Sector 4 (Village Slope)', 'Operator manual evacuation drill test.')}
            className="btn-primary-filled text-[12px] py-1.5 px-3 cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Dispatch Drill Alert</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="carbon-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#1a1c20] bg-black/40 text-[11px] font-mono uppercase tracking-wider text-[#808080]">
                <th className="px-4 py-3">Alert ID</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Level / Severity</th>
                <th className="px-4 py-3">Target Zone</th>
                <th className="px-4 py-3">Channels Fired</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1c20]">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-white font-semibold">
                    {alert.id}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#808080] text-[12px]">
                    {alert.timestamp}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      alert.level === 5 ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]' :
                      alert.level === 4 ? 'bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]' :
                      alert.level === 3 ? 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]' :
                      'bg-[#3fcb7f]/20 text-[#3fcb7f] border border-[#3fcb7f]'
                    }`}>
                      Level {alert.level}: {alert.levelName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#e8eaee]">
                    {alert.zone}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#b3b3b3]">
                    <div className="flex flex-wrap gap-1">
                      {alert.channelsTriggered.map((ch, idx) => (
                        <span key={idx} className="bg-[#080a0c] border border-[#222222] px-1.5 py-0.2 rounded text-[10px] font-mono">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] ${
                      alert.status.includes('Cancelled') ? 'text-[#808080] line-through' :
                      alert.status.includes('Active') ? 'text-[#ef4444] font-bold' :
                      'text-[#3fcb7f]'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!alert.status.includes('Cancelled') ? (
                      <button
                        onClick={() => cancelAlertAsFalseAlarm(alert.id)}
                        className="text-[11px] font-mono text-[#fb923c] hover:underline flex items-center gap-1 justify-end ml-auto cursor-pointer"
                        title="Suppress false alarm and broadcast correction to village"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Cancel (False Blast)</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#808080] font-mono">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
