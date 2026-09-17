import React from "react";
import { CreditCard, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { SummaryResponse } from "../services/api";

interface KPIOverviewProps {
  summary: SummaryResponse | null;
  alertCount: number;
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({
  summary,
  alertCount,
}) => {
  const monthlyTotal = summary?.monthly_total ?? 0;
  const annualTotal = summary?.annual_total ?? monthlyTotal * 12;
  const subCount = summary?.sub_count ?? 0;
  const paidByMeCount = summary?.paid_by_me_count ?? 0;
  const nextPayment = summary?.next_payment;
  const nextPaymentDate = summary?.next_payment_date;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Monthly Total */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Monthly Spend
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            ₱
            {monthlyTotal.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Annual est:</span>
            <span className="text-slate-800 dark:text-slate-300 font-medium">
              ₱
              {annualTotal.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Next Upcoming Renewal */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Next Payment
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate"
            title={nextPayment ?? "No payments"}
          >
            {nextPayment || "None Upcoming"}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {nextPaymentDate ? (
              <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                Due:{" "}
                {new Date(nextPaymentDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ) : (
              <span>All renewals clear</span>
            )}
          </div>
        </div>
      </div>

      {/* Active Subscriptions Count */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Subs
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
            <span>
              {summary?.active_count ?? subCount - (summary?.paused_count ?? 0)}
            </span>
            {(summary?.paused_count ?? 0) > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {summary?.paused_count} paused
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="text-indigo-700 dark:text-indigo-300 font-medium">
              {paidByMeCount}
            </span>{" "}
            paid by you ·{" "}
            <span>{subCount - paidByMeCount} shared/covered</span>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Attention
          </span>
          <div
            className={`p-2 rounded-xl ${
              alertCount > 0
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {alertCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {alertCount > 0 ? (
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                Alerts requiring review
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                No urgent alerts
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
