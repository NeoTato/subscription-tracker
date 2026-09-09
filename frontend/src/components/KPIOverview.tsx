import React from 'react';
import { CreditCard, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { SummaryResponse } from '../services/api';

interface KPIOverviewProps {
  summary: SummaryResponse | null;
  alertCount: number;
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ summary, alertCount }) => {
  const monthlyTotal = summary?.monthly_total ?? 0;
  const annualTotal = summary?.annual_total ?? monthlyTotal * 12;
  const subCount = summary?.sub_count ?? 0;
  const paidByMeCount = summary?.paid_by_me_count ?? 0;
  const nextPayment = summary?.next_payment;
  const nextPaymentDate = summary?.next_payment_date;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Monthly Total */}
      <div className="glass-card glass-card-interactive p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Monthly Spend</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <CreditCard className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-display font-bold text-[#FAFAFA] tracking-tight">
            ₱{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 font-sans mt-1.5 flex items-center gap-1.5">
            <span>Annual estimate:</span>
            <span className="text-zinc-300 font-mono">₱{annualTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Next Upcoming Renewal */}
      <div className="glass-card glass-card-interactive p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Next Payment</span>
          <div className="w-8 h-8 rounded-lg bg-[#1A1A24] border border-white/[0.08] flex items-center justify-center text-zinc-300">
            <Calendar className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xl font-display font-bold text-[#FAFAFA] truncate" title={nextPayment ?? 'None'}>
            {nextPayment || 'All Paid Up'}
          </div>
          <div className="text-xs text-zinc-400 font-mono mt-1.5">
            {nextPaymentDate ? (
              <span className="text-amber-400 flex items-center gap-1">
                Due {new Date(nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ) : (
              <span className="text-zinc-600">No pending renewals</span>
            )}
          </div>
        </div>
      </div>

      {/* Active Subscriptions Count */}
      <div className="glass-card glass-card-interactive p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Active Services</span>
          <div className="w-8 h-8 rounded-lg bg-[#1A1A24] border border-white/[0.08] flex items-center justify-center text-zinc-300">
            <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-display font-bold text-[#FAFAFA] tracking-tight">
            {subCount}
          </div>
          <div className="text-xs text-zinc-500 font-sans mt-1.5 flex items-center gap-1">
            <span className="text-zinc-300 font-mono font-medium">{paidByMeCount}</span>
            <span>paid by you ·</span>
            <span className="text-zinc-500">{subCount - paidByMeCount} shared</span>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className={`glass-card glass-card-interactive p-6 relative overflow-hidden group ${alertCount > 0 ? 'glass-card-highlight' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Attention</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            alertCount > 0
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-[#1A1A24] border border-white/[0.08] text-zinc-500'
          }`}>
            <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-display font-bold text-[#FAFAFA] tracking-tight">
            {alertCount}
          </div>
          <div className="text-xs font-sans mt-1.5">
            {alertCount > 0 ? (
              <span className="text-amber-400 font-medium">Pending action required</span>
            ) : (
              <span className="text-zinc-500">Everything in sync</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
