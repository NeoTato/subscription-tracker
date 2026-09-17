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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
} from "lucide-react";

export function App() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Theme Management (Light & Dark mode - R-21, R-34)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("subsentry_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("subsentry_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Toast Message State
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
      showToast("Data refreshed and overdue dates synced successfully.");
    } catch (err: any) {
      showToast("Error syncing dates: " + err.message);
      setIsRefreshing(false);
    }
  };

  const handleTriggerAlerts = async () => {
    try {
      const res = await api.triggerNotification();
      if (res?.result?.notification_sent) {
        showToast("Telegram notification dispatched successfully.");
      } else if (res?.result?.has_alerts) {
        showToast(
          "Alerts generated (configure Telegram Bot Token in .env to receive messages).",
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

  const handleStatusChange = async (
    sub: Subscription,
    newStatus: "active" | "paused",
  ) => {
    // Optimistic UI state update
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s)),
    );

    try {
      await api.updateSubscription(sub.id, { status: newStatus });
      showToast(
        newStatus === "paused"
          ? `Paused ${sub.name}. It will not count toward spend or trigger alerts.`
          : `Resumed ${sub.name}.`,
      );
      await loadData();
    } catch (err: any) {
      showToast("Failed to update status: " + err.message);
      await loadData();
    }
  };

  const handleDismissReminder = async (id: number) => {
    try {
      await api.updateSubscription(id, { remind_to_cancel: false });
      showToast("Cancellation reminder disabled.");
      await loadData();
    } catch (err: any) {
      showToast("Failed to update: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Accessible Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xl shadow-black/20 text-xs font-semibold flex items-center gap-2 border border-slate-700 dark:border-emerald-500 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        onAddClick={handleAddSubscription}
        onRefresh={handleRefresh}
        onTriggerAlerts={handleTriggerAlerts}
        alertCount={alerts?.total_alerts || 0}
        isRefreshing={isRefreshing}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        {/* KPI Metrics */}
        <KPIOverview
          summary={summary}
          alertCount={alerts?.total_alerts || 0}
        />

        {/* Actionable Alert Banners */}
        <AlertBanner
          alerts={alerts}
          onDismissReminder={handleDismissReminder}
        />

        {/* Analytics & Insights Section */}
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

          {/* Quick Insights Card (C-1 Purpose-Gated, High Contrast) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Financial Highlights</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>
                    Normalized annual recurring expense is{" "}
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      ₱
                      {(summary?.annual_total || 0).toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span>
                    Automatic daily maintenance advances renewal dates
                    seamlessly every morning.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>
                    Foreign currency conversion normalizes USD, JPY, and EUR
                    into Philippine Pesos (PHP).
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Engine: SQLite Storage</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                FastAPI 2.0 Backend
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Subscriptions Table */}
        <SubscriptionTable
          subscriptions={subscriptions}
          onEdit={handleEditSubscription}
          onDelete={handleDeleteSubscription}
          onStatusChange={handleStatusChange}
          onAddClick={handleAddSubscription}
        />
      </main>

      {/* Subscription Add / Edit Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveSubscription}
        editingSubscription={editingSub}
      />

      {/* Accessible Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        SubSentry &copy; {new Date().getFullYear()} · Intelligent Subscription
        Management System
      </footer>
    </div>
  );
}

export default App;
