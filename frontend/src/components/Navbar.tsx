import React from 'react';
import { ShieldCheck, Plus, Bell, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onAddClick: () => void;
  onRefresh: () => void;
  onTriggerAlerts: () => void;
  alertCount: number;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddClick,
  onRefresh,
  onTriggerAlerts,
  alertCount,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A24] border border-white/[0.1] flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-500/40 transition duration-300">
            <ShieldCheck className="w-5 h-5 text-amber-500" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-display font-bold text-xl text-[#FAFAFA] tracking-tight">SubSentry</span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-mono tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">Atmospheric Subscription Management</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Refresh / Sync */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sync & advance overdue renewal dates"
            className="btn-secondary h-10 px-3.5 flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-zinc-400'}`} strokeWidth={1.75} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Trigger Alert Notification */}
          <button
            onClick={onTriggerAlerts}
            title="Dispatch Telegram Notification"
            className="btn-secondary h-10 px-3.5 relative flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white"
          >
            <Bell className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
            <span className="hidden sm:inline">Alerts</span>
            {alertCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono font-bold text-[#0A0A0F] shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                {alertCount}
              </span>
            )}
          </button>

          {/* Add Subscription (Primary Amber) */}
          <button
            onClick={onAddClick}
            className="btn-amber-primary h-10 px-5 flex items-center gap-2 text-xs font-medium shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          >
            <Plus className="w-4 h-4 text-[#0A0A0F]" strokeWidth={2.25} />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>
    </header>
  );
};
