import React from "react";
import { ShieldCheck, Bell, RefreshCw, Sun, Moon } from "lucide-react";

interface NavbarProps {
  onAddClick: () => void;
  onRefresh: () => void;
  onTriggerAlerts: () => void;
  alertCount: number;
  isRefreshing: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddClick,
  onRefresh,
  onTriggerAlerts,
  alertCount,
  isRefreshing,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 dark:bg-slate-800 border border-emerald-500/20 dark:border-slate-700 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                SubSentry
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent Subscription Manager
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button (R-21, R-32, R-34) */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
            aria-label={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Sync / Refresh */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh data and advance overdue dates"
            aria-label="Refresh data and advance overdue dates"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""}`}
            />
          </button>

          {/* Trigger Telegram Alerts */}
          <button
            type="button"
            onClick={onTriggerAlerts}
            title="Dispatch Telegram Notification"
            aria-label="Dispatch Telegram Notification"
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {alertCount}
              </span>
            )}
          </button>

          {/* Add Subscription Primary CTA */}
          <button
            type="button"
            onClick={onAddClick}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm border border-slate-900 dark:border-emerald-500 transition active:scale-95 shadow-sm"
          >
            Add Subscription
          </button>
        </div>
      </div>
    </header>
  );
};
