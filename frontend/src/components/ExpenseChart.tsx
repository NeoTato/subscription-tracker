import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Subscription, CategoryBreakdown } from "../services/api";
import { PieChart as PieIcon, Users, User, Globe } from "lucide-react";

interface ExpenseChartProps {
  subscriptions?: Subscription[];
  categories?: CategoryBreakdown[];
  totalMonthly?: number;
  onAddClick?: () => void;
}

type SpendingScope = "ME" | "SHARED" | "ALL";

const COLORS = [
  "#0ea5e9", // Cyan / Brand
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Teal
  "#64748b", // Slate
];

const FX_RATES_TO_PHP: Record<string, number> = {
  PHP: 1.0,
  USD: 58.5,
  JPY: 0.38,
  EUR: 63.2,
  GBP: 74.5,
  SGD: 43.8,
  AUD: 38.2,
  CAD: 42.5,
};

const toMonthly = (price: number, billingCycle?: string): number => {
  const cycle = (billingCycle || "monthly").toLowerCase();
  if (cycle === "yearly") return price / 12.0;
  if (cycle === "weekly") return price * (52.0 / 12.0);
  if (cycle === "daily") return price * (365.0 / 12.0);
  return price;
};

const toPHP = (price: number, currency?: string): number => {
  const curr = (currency || "PHP").toUpperCase();
  const rate = FX_RATES_TO_PHP[curr] || 1.0;
  return price * rate;
};

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  subscriptions = [],
  categories = [],
  totalMonthly = 0,
  onAddClick,
}) => {
  const [scope, setScope] = useState<SpendingScope>("ME");

  // Compute category breakdown and monthly total dynamically from subscriptions
  const { chartData, computedTotalMonthly, itemCount } = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      // Fallback to backend summary props if subscriptions list isn't populated
      return {
        chartData: categories.map((c) => ({
          name: c.category,
          value: c.total_monthly_php,
          count: c.count,
        })),
        computedTotalMonthly: totalMonthly,
        itemCount: categories.reduce((acc, c) => acc + c.count, 0),
      };
    }

    const filtered = subscriptions.filter((s) => {
      const isActive = (s.status || "active") === "active";
      if (!isActive) return false;
      if (scope === "ME") return s.is_paid_by_me;
      if (scope === "SHARED") return !s.is_paid_by_me;
      return true; // ALL
    });

    const categoryMap: Record<
      string,
      { total: number; count: number; category: string }
    > = {};

    let total = 0;
    for (const sub of filtered) {
      const cat = sub.category || "Other";
      const monthlyPHP = toPHP(
        toMonthly(sub.price, sub.billing_cycle),
        sub.currency,
      );
      total += monthlyPHP;

      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, count: 0, category: cat };
      }
      categoryMap[cat].total += monthlyPHP;
      categoryMap[cat].count += 1;
    }

    const data = Object.values(categoryMap)
      .map((item) => ({
        name: item.category,
        value: Number(item.total.toFixed(2)),
        count: item.count,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      chartData: data,
      computedTotalMonthly: Number(total.toFixed(2)),
      itemCount: filtered.length,
    };
  }, [subscriptions, categories, totalMonthly, scope]);

  const getScopeLabel = () => {
    switch (scope) {
      case "SHARED":
        return "Shared / Covered Value";
      case "ALL":
        return "Overall Value";
      default:
        return "Personal Outflow";
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col min-h-[340px] justify-between">
      {/* Header Controls: Title, Scope Toggle, and Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-brand-400 shrink-0" />
          <h3 className="text-sm font-semibold text-white">
            Category Breakdown
          </h3>
        </div>

        {/* Scope Pill Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setScope("ME")}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
              scope === "ME"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Personal Outflow (Paid by me)"
          >
            <User className="w-3.5 h-3.5" />
            <span>Paid by Me</span>
          </button>
          <button
            type="button"
            onClick={() => setScope("SHARED")}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
              scope === "SHARED"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Covered by family, friends, or shared plans"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Shared</span>
          </button>
          <button
            type="button"
            onClick={() => setScope("ALL")}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
              scope === "ALL"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="All active subscriptions combined"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Overall</span>
          </button>
        </div>

        {/* Dynamic Total Header */}
        <div className="text-right">
          <div className="text-[11px] text-slate-400 font-medium">
            {getScopeLabel()}
          </div>
          <div className="text-sm font-bold text-white font-mono">
            ₱
            {computedTotalMonthly.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-xs text-slate-400 font-normal"> / mo</span>
          </div>
        </div>
      </div>

      {/* Chart Body or Empty State */}
      {chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 mb-2 border border-slate-700/60">
            {scope === "SHARED" ? (
              <Users className="w-5 h-5 text-indigo-400" />
            ) : (
              <PieIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <p className="text-sm font-medium text-slate-200">
            {scope === "SHARED"
              ? "No shared subscriptions tracked"
              : scope === "ME"
                ? "No personal subscriptions tracked"
                : "No subscriptions found"}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            {scope === "SHARED"
              ? "Mark subscriptions as 'Shared' in the table or add modal to track their covered value here."
              : "Add subscriptions to see your monthly spending distribution across categories."}
          </p>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="mt-3.5 px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded-lg border border-slate-700 hover:border-slate-600 shadow-sm transition active:scale-95"
            >
              Add Subscription
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[220px] pt-2">
          <ResponsiveContainer
            width="100%"
            height={230}
          >
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any, item: any) => [
                  `₱${Number(value).toFixed(2)}/mo (${item.payload.count} sub${
                    item.payload.count > 1 ? "s" : ""
                  })`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(val) => (
                  <span className="text-xs text-slate-300 ml-1">{val}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
