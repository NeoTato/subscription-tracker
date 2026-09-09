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
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

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
      showToast("Data refreshed and overdue dates synced!");
    } catch (err: any) {
      showToast("Error syncing dates: " + err.message);
      setIsRefreshing(false);
    }
  };

  const handleTriggerAlerts = async () => {
    try {
      const res = await api.triggerNotification();
      if (res?.result?.notification_sent) {
        showToast("Telegram notification dispatched successfully! 🚀");
      } else if (res?.result?.has_alerts) {
        showToast(
          "Alerts checked (configure Telegram Bot Token in .env to receive messages).",
        );
      } else {
        showToast("No active alerts or renewals due this week.");
      }
    } catch (err: any) {
      showToast("Failed to trigger notification: " + err.message);
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
      showToast(`Added ${data.name} to subscriptions!`);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-brand-600 text-white shadow-xl shadow-brand-600/30 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
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

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        {/* KPI Metrics */}
        <KPIOverview
          summary={summary}
          alertCount={alerts?.total_alerts || 0}
        />

        {/* Active Alert Banners */}
        <AlertBanner
          alerts={alerts}
          onDismissReminder={handleDismissReminder}
        />

        {/* Analytics & Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spending Donut Chart */}
          <div className="lg:col-span-2">
            <ExpenseChart
              subscriptions={subscriptions}
              categories={summary?.categories || []}
              totalMonthly={summary?.monthly_total || 0}
              onAddClick={handleAddSubscription}
            />
          </div>

          {/* Quick Insights Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Smart Insights</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                  <span>
                    Your normalized annual recurring expense is{" "}
                    <strong className="text-white font-semibold">
                      ₱
                      {(summary?.annual_total || 0).toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>
                    Automatic daily rollover updates renewal dates seamlessly
                    every day at 9:00 AM.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <span>
                    Multi-currency normalization automatically standardizes USD,
                    JPY, and EUR into Philippine Pesos (PHP).
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px] text-slate-500">
              <span>Database: SQLite</span>
              <span className="text-brand-400 font-mono">
                FastAPI REST Backend
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Subscriptions Table */}
        <SubscriptionTable
          subscriptions={subscriptions}
          onEdit={handleEditSubscription}
          onDelete={handleDeleteSubscription}
          onAddClick={handleAddSubscription}
        />
      </main>

      {/* Subscription Add/Edit Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveSubscription}
        editingSubscription={editingSub}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        SubSentry &copy; {new Date().getFullYear()} · Intelligent Personal
        Subscription Tracker
      </footer>
    </div>
  );
}

export default App;
