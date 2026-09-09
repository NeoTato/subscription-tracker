import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { CategoryBreakdown } from "../services/api";
import { PieChart as PieIcon } from "lucide-react";

interface ExpenseChartProps {
  categories: CategoryBreakdown[];
  totalMonthly: number;
}

const COLORS = [
  "#38bdf8",
  "#818cf8",
  "#34d399",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#94a3b8",
];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  categories,
  totalMonthly,
}) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center h-[320px]">
        <div className="p-3 rounded-full bg-slate-800 text-slate-500 mb-2">
          <PieIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-400">
          No expense breakdown data
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Add subscriptions to see your spending analytics.
        </p>
      </div>
    );
  }

  const chartData = categories.map((c) => ({
    name: c.category,
    value: c.total_monthly_php,
    count: c.count,
  }));

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-brand-400" />
          Category Spending Breakdown
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          Monthly Total: ₱
          {totalMonthly.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
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
              formatter={(value: any) => [
                `₱${Number(value).toFixed(2)}/mo`,
                "Cost",
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
    </div>
  );
};
