import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryBreakdown } from '../services/api';
import { PieChart as PieIcon, Plus } from 'lucide-react';

interface ExpenseChartProps {
  categories: CategoryBreakdown[];
  totalMonthly: number;
  onAddClick?: () => void;
}

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6', '#64748b'];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ categories, totalMonthly, onAddClick }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center h-[320px]">
        <div className="p-3 rounded-full bg-slate-800 text-slate-400 mb-2">
          <PieIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-200">No expense breakdown data</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Add subscriptions to see your monthly spending distribution.
        </p>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="mt-4 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subscription</span>
          </button>
        )}
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
          Monthly Total: ₱{totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
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
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`₱${Number(value).toFixed(2)}/mo`, 'Cost']}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(val) => <span className="text-xs text-slate-300 ml-1">{val}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
