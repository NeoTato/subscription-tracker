import React from "react";
import { ShieldCheck, Bell, RefreshCw } from "lucide-react";

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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                SubSentry
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent Subscription Manager
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh data and advance overdue dates"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-400" : ""}`}
            />
          </button>

          <button
            onClick={onTriggerAlerts}
            title="Dispatch Telegram Notification"
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {alertCount}
              </span>
            )}
          </button>

          <button
            onClick={onAddClick}
            className="px-4 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-medium text-xs sm:text-sm border border-slate-700 hover:border-slate-600 transition active:scale-95 shadow-sm"
          >
            Add Subscription
          </button>
        </div>
      </div>
    </header>
  );
};
