import React from 'react';
import { AlertCircle, Clock, GraduationCap, X, CheckCircle2 } from 'lucide-react';
import { AlertsResponse } from '../services/api';

interface AlertBannerProps {
  alerts: AlertsResponse | null;
  onDismissReminder?: (id: number) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismissReminder }) => {
  if (!alerts || alerts.total_alerts === 0) return null;

  return (
    <div className="space-y-3">
      {/* Cancellation Reminders */}
      {alerts.cancellation_reminders.map((sub) => (
        <div
          key={`cancel-${sub.id}`}
          className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start sm:items-center justify-between gap-3 text-rose-200"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5 sm:mt-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Cancel Reminder: {sub.name}</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">
                  Renews {new Date(sub.next_due_date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-rose-300/80 mt-0.5">
                You marked this to be cancelled before next renewal. Current cost: {sub.currency} {sub.price.toFixed(2)} / {sub.billing_cycle}.
              </p>
            </div>
          </div>
          {onDismissReminder && (
            <button
              onClick={() => onDismissReminder(sub.id)}
              className="px-2.5 py-1 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-lg transition shrink-0"
            >
              Disable Reminder
            </button>
          )}
        </div>
      ))}

      {/* Due Soon (within 7 days) */}
      {alerts.due_soon.map((due) => (
        <div
          key={`due-${due.id}`}
          className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start sm:items-center justify-between gap-3 text-amber-200"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 sm:mt-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Payment Due Soon: {due.name}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                  {due.days_left === 0 ? 'Due Today' : due.days_left === 1 ? 'Due Tomorrow' : `In ${due.days_left} days`}
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                {due.currency} {due.price.toFixed(2)} ({due.billing_cycle}) due on {new Date(due.next_due_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Student Expiries */}
      {alerts.student_expiry_reminders.map((exp) => (
        <div
          key={`student-${exp.id}`}
          className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-start sm:items-center justify-between gap-3 text-purple-200"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5 sm:mt-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Student Discount Expiring: {exp.name}</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40">
                  Expires in {exp.days_left} days
                </span>
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Discount status expires on {new Date(exp.student_status_expiry).toLocaleDateString()}. Re-verify your student credentials to maintain discount.
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
