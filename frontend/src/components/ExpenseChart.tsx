import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryBreakdown } from '../services/api';
import { PieChart as PieIcon } from 'lucide-react';

interface ExpenseChartProps {
  categories: CategoryBreakdown[];
  totalMonthly: number;
}

// Minimalist Dark Palette (Amber anchor + sophisticated nocturnal tones)
const PALETTE = [
  '#F59E0B', // Amber 500 (Primary accent)
  '#6366F1', // Indigo 500
  '#10B981', // Emerald 500
  '#A855F7', // Purple 500
  '#F43F5E', // Rose 500
  '#06B6D4', // Cyan 500
  '#64748B', // Slate 500
];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ categories, totalMonthly }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center h-[340px]">
        <div className="w-10 h-10 rounded-xl bg-[#1A1A24] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-3">
          <PieIcon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-display font-medium text-zinc-300">No expense breakdown data</p>
        <p className="text-xs text-zinc-500 font-sans mt-1">Add subscriptions to unlock category analytics.</p>
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
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
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
