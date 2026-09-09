import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryBreakdown } from '../services/api';
import { PieChart as PieIcon, Plus } from 'lucide-react';

interface ExpenseChartProps {
  categories: CategoryBreakdown[];
  totalMonthly: number;
  onAddClick?: () => void;
}

// Solid palette (Amber anchor + clear distinct colors, no gradients)
const PALETTE = [
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ categories, totalMonthly, onAddClick }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center h-[340px]">
        <div className="w-11 h-11 rounded-xl bg-[#1A1A24] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
          <PieIcon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-display font-medium text-zinc-200">No expense breakdown data</p>
        <p className="text-xs text-zinc-500 font-sans mt-1 max-w-xs">
          Add your active subscriptions to visualize your monthly category distribution.
        </p>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="mt-4 px-4 py-2 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0A0A0F] text-xs font-semibold rounded-lg shadow-sm transition active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#0A0A0F]" strokeWidth={2.5} />
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
    <div className="glass-card p-6 md:p-8 flex flex-col h-[340px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-semibold text-[#FAFAFA] flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          Category Spending Distribution
        </h3>
        <span className="text-xs font-mono text-zinc-400">
          Monthly: <strong className="text-white font-semibold">₱{totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="#0A0A0F" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`₱${Number(value).toFixed(2)}/mo`, 'Cost']}
              contentStyle={{
                backgroundColor: '#12121A',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#FAFAFA',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(val) => <span className="text-xs font-sans text-zinc-400 ml-1 hover:text-zinc-200 transition">{val}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
