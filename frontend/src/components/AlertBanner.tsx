import React from 'react';
import { AlertCircle, Clock, GraduationCap, X } from 'lucide-react';
import { AlertsResponse } from '../services/api';

interface AlertBannerProps {
  alerts: AlertsResponse | null;
  onDismissReminder?: (id: number) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismissReminder }) => {
  if (!alerts || alerts.total_alerts === 0) return null;

  return (
    <div className="space-y-3.5">
      {/* Cancellation Reminders */}
      {alerts.cancellation_reminders.map((sub) => (
        <div
          key={`cancel-${sub.id}`}
          className="glass-card p-5 border-rose-500/20 bg-[#171216]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.08)]"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display font-semibold text-sm text-[#FAFAFA] flex items-center gap-2">
                <span>Cancel Before Renewal: {sub.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">
                  Renews {new Date(sub.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Marked for cancellation. Scheduled charge: <span className="font-mono text-zinc-300">{sub.currency} {sub.price.toFixed(2)}</span> ({sub.billing_cycle}).
              </p>
            </div>
          </div>
          {onDismissReminder && (
            <button
              onClick={() => onDismissReminder(sub.id)}
              className="btn-secondary h-8 px-3 text-xs text-rose-300 hover:text-white border-rose-500/20 hover:border-rose-500/40 shrink-0 self-start sm:self-center"
            >
              Turn Off Reminder
            </button>
          )}
        </div>
      ))}

      {/* Due Soon (within 7 days) */}
      {alerts.due_soon.map((due) => (
        <div
          key={`due-${due.id}`}
          className="glass-card p-5 border-amber-500/20 bg-[#161412]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.08)]"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display font-semibold text-sm text-[#FAFAFA] flex items-center gap-2">
                <span>Renewal Due Soon: {due.name}</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {due.days_left === 0 ? 'Due Today' : due.days_left === 1 ? 'Due Tomorrow' : `In ${due.days_left} days`}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                <span className="font-mono text-zinc-300">{due.currency} {due.price.toFixed(2)}</span> ({due.billing_cycle}) scheduled on{' '}
                {new Date(due.next_due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Student Expiries */}
      {alerts.student_expiry_reminders.map((exp) => (
        <div
          key={`student-${exp.id}`}
          className="glass-card p-5 border-purple-500/20 bg-[#141218]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.08)]"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display font-semibold text-sm text-[#FAFAFA] flex items-center gap-2">
                <span>Student Discount Expiration: {exp.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  Expires in {exp.days_left} days
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Educational discount expires on {new Date(exp.student_status_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Verify credentials to renew student rate.
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
