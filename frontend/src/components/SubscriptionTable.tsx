import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Calendar, 
  CreditCard, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { Subscription } from '../services/api';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onDelete: (id: number) => void;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterPaidByMe, setFilterPaidByMe] = useState<string>('ALL');

  // Categories list
  const categories = Array.from(new Set(subscriptions.map((s) => s.category || 'Other')));

  // Filter subscriptions
  const filtered = subscriptions.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.platform && s.platform.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || (s.category || 'Other') === selectedCategory;

    const matchesPaid =
      filterPaidByMe === 'ALL' ||
      (filterPaidByMe === 'ME' && s.is_paid_by_me) ||
      (filterPaidByMe === 'OTHERS' && !s.is_paid_by_me);

    return matchesSearch && matchesCategory && matchesPaid;
  });

  const getBillingCycleBadge = (cycle: string) => {
    switch (cycle.toLowerCase()) {
      case 'yearly':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'weekly':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'daily':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Subscriptions ({filtered.length})</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage, filter, and track renewal cycles</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Paid By Filter */}
          <select
            value={filterPaidByMe}
            onChange={(e) => setFilterPaidByMe(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Payees</option>
            <option value="ME">Paid By Me</option>
            <option value="OTHERS">Shared / Covered</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Cost</th>
              <th className="py-3 px-4">Cycle</th>
              <th className="py-3 px-4">Next Renewal</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No subscriptions found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((sub) => {
                const isDueSoon =
                  new Date(sub.next_due_date).getTime() - new Date().getTime() <=
                  7 * 24 * 60 * 60 * 1000;

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    {/* Name / Platform */}
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-brand-400 text-sm border border-slate-700">
                          {sub.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-semibold flex items-center gap-1.5">
                            {sub.name}
                            {sub.remind_to_cancel && (
                              <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Cancel reminder active">
                                <AlertCircle className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>{sub.platform || 'Direct'}</span>
                            <span>•</span>
                            <span className="capitalize">{sub.plan_type}</span>
                            {sub.tier && <span>({sub.tier})</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {sub.currency} {sub.price.toFixed(2)}
                      </div>
                    </td>

                    {/* Billing Cycle */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full border ${getBillingCycleBadge(
                          sub.billing_cycle
                        )}`}
                      >
                        {sub.billing_cycle}
                      </span>
                    </td>

                    {/* Next Renewal */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className={isDueSoon ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                          {new Date(sub.next_due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[11px] border border-slate-700/50">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {sub.category || 'Entertainment'}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span>{sub.payment_method || 'Default Card'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {sub.is_paid_by_me ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> Paid by me
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          Shared
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEdit(sub)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit subscription"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${sub.name}?`)) {
                              onDelete(sub.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete subscription"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
