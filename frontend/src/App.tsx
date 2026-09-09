import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { KPIOverview } from "./components/KPIOverview";
import { AlertBanner } from "./components/AlertBanner";
import { ExpenseChart } from "./components/ExpenseChart";
import { SubscriptionTable } from "./components/SubscriptionTable";
import { SubscriptionModal } from "./components/SubscriptionModal";
import {
  api,
  SummaryResponse,
  AlertsResponse,
  Subscription,
  SubscriptionCreate,
} from "./services/api";
import { Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export function App() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [sumData, alertData, subsData] = await Promise.all([
        api.getSummary(),
        api.getAlerts(),
        api.getSubscriptions(),
      ]);
      setSummary(sumData);
      setAlerts(alertData);
      setSubscriptions(subsData);
    } catch (err: any) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.advanceDates();
      await loadData();
      showToast("Data refreshed & overdue dates synced.");
    } catch (err: any) {
      showToast("Error syncing dates: " + err.message);
      setIsRefreshing(false);
    }
  };

  const handleTriggerAlerts = async () => {
    try {
      const res = await api.triggerNotification();
      if (res?.result?.notification_sent) {
        showToast("Telegram alert dispatched successfully.");
      } else if (res?.result?.has_alerts) {
        showToast("Alerts evaluated (check TELEGRAM_BOT_TOKEN in .env).");
      } else {
        showToast("No renewals or urgent alerts due this week.");
      }
    } catch (err: any) {
      showToast("Notification trigger error: " + err.message);
    }
  };

  const handleAddSubscription = () => {
    setEditingSub(null);
    setIsModalOpen(true);
  };

  const handleEditSubscription = (sub: Subscription) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleSaveSubscription = async (data: SubscriptionCreate) => {
    if (editingSub) {
      await api.updateSubscription(editingSub.id, data);
      showToast(`Updated ${data.name} successfully.`);
    } else {
      await api.createSubscription(data);
      showToast(`Added ${data.name} to subscriptions.`);
    }
    await loadData();
  };

  const handleDeleteSubscription = async (id: number) => {
    try {
      await api.deleteSubscription(id);
      showToast("Subscription removed.");
      await loadData();
    } catch (err: any) {
      showToast("Failed to delete: " + err.message);
    }
  };

  const handleDismissReminder = async (id: number) => {
    try {
      await api.updateSubscription(id, { remind_to_cancel: false });
      showToast("Cancellation reminder turned off.");
      await loadData();
    } catch (err: any) {
      showToast("Failed to update: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#FAFAFA] font-sans flex flex-col relative selection:bg-amber-500 selection:text-[#0A0A0F]">
      {/* Ambient Atmospheric Glow Orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-10 w-[500px] h-[500px] bg-indigo-500/[0.02] rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1A1A24] border border-amber-500/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.2)] text-xs font-medium flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2
            className="w-4 h-4 text-amber-400"
            strokeWidth={2}
          />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        onAddClick={handleAddSubscription}
        onRefresh={handleRefresh}
        onTriggerAlerts={handleTriggerAlerts}
        alertCount={alerts?.total_alerts || 0}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-6 md:px-8 py-10 space-y-8 flex-1">
        {/* KPI Metric Cards */}
        <KPIOverview
          summary={summary}
          alertCount={alerts?.total_alerts || 0}
        />

        {/* Active Alert Banners */}
        <AlertBanner
          alerts={alerts}
          onDismissReminder={handleDismissReminder}
        />

        {/* Analytics & Insight Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spending Distribution Donut Chart */}
          <div className="lg:col-span-2">
            <ExpenseChart
              categories={summary?.categories || []}
              totalMonthly={summary?.monthly_total || 0}
              onAddClick={handleAddSubscription}
            />
          </div>

          {/* Atmospheric Insights Card */}
          <div className="glass-card p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-display font-semibold text-sm mb-4">
                <Sparkles
                  className="w-4 h-4"
                  strokeWidth={1.5}
                />
                <span>Atmospheric Intelligence</span>
              </div>
              <ul className="space-y-3.5 text-xs text-zinc-400 font-sans">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  <span>
                    Normalized annual recurring commitments equal{" "}
                    <strong className="text-white font-mono font-medium">
                      ₱
                      {(summary?.annual_total || 0).toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                  <span>
                    Automatic daily rollover updates overdue renewal dates every
                    morning at 09:00 AM.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                  <span>
                    Foreign billing currencies (USD, JPY, EUR) are normalized to
                    Philippine Pesos (PHP).
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-white/[0.06] mt-6 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>SQLite Persistence</span>
              <span className="text-amber-500/80">FastAPI REST v2.0</span>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <SubscriptionTable
          subscriptions={subscriptions}
          onEdit={handleEditSubscription}
          onDelete={handleDeleteSubscription}
          onAddClick={handleAddSubscription}
        />
      </main>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveSubscription}
        editingSubscription={editingSub}
      />

      {/* Atmospheric Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-zinc-600 font-sans">
        <div className="flex items-center justify-center gap-2 mb-1 text-zinc-500 font-display">
          <ShieldCheck
            className="w-4 h-4 text-amber-500/60"
            strokeWidth={1.5}
          />
          <span>SubSentry</span>
        </div>
        <p>
          Atmospheric Personal Subscription Management · &copy;{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default App;
