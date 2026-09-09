import React, { useState } from 'react';
import { 
  Search, 
  Edit2, 
  Trash2, 
  Calendar, 
  CreditCard, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  PackageOpen
} from 'lucide-react';
import { Subscription } from '../services/api';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onDelete: (id: number) => void;
  onAddClick?: () => void;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  onAddClick,
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
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'weekly':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'daily':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      default:
        return 'bg-zinc-800/60 text-zinc-300 border-white/[0.08]';
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 md:p-6 border-b border-white/[0.06] flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-lg text-[#FAFAFA] flex items-center gap-2">
            <span>Subscriptions</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#1A1A24] text-zinc-400 border border-white/[0.08]">
              {filtered.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">Recurring billing and status tracking</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-9 pr-3 py-2 text-xs placeholder-zinc-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input py-2 px-3 text-xs text-zinc-300"
          >
            <option value="ALL" className="bg-[#12121A]">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#12121A]">{c}</option>
            ))}
          </select>

          {/* Paid By Filter */}
          <select
            value={filterPaidByMe}
            onChange={(e) => setFilterPaidByMe(e.target.value)}
            className="glass-input py-2 px-3 text-xs text-zinc-300"
          >
            <option value="ALL" className="bg-[#12121A]">All Payees</option>
            <option value="ME" className="bg-[#12121A]">Paid By Me</option>
            <option value="OTHERS" className="bg-[#12121A]">Shared / Covered</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#0E0E14] text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              <th className="py-3.5 px-5">Service</th>
              <th className="py-3.5 px-5">Cost</th>
              <th className="py-3.5 px-5">Cycle</th>
              <th className="py-3.5 px-5">Next Renewal</th>
              <th className="py-3.5 px-5">Category</th>
              <th className="py-3.5 px-5">Payment Method</th>
              <th className="py-3.5 px-5">Payer</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs text-zinc-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-zinc-400 font-sans">
                  <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A24] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-3">
                      <PackageOpen className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-display font-medium text-zinc-200">No subscriptions found</p>
                    <p className="text-xs text-zinc-500 mt-1 mb-4">
                      {searchTerm ? 'No results matched your search criteria.' : 'Start tracking your monthly subscriptions and renewals.'}
                    </p>
                    {onAddClick && (
                      <button
                        onClick={onAddClick}
                        className="px-4 py-2 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0A0A0F] text-xs font-semibold rounded-lg shadow-sm transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#0A0A0F]" strokeWidth={2.5} />
                        <span>Add Subscription</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((sub) => {
                const daysDiff =
                  (new Date(sub.next_due_date).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24);
                const isDueSoon = daysDiff >= 0 && daysDiff <= 7;

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-[#1A1A24]/60 transition duration-200 group"
                  >
                    {/* Service Name & Provider */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#14141E] border border-white/[0.08] flex items-center justify-center font-display font-bold text-[#F59E0B] text-xs">
                          {sub.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[#FAFAFA] font-display font-medium text-sm flex items-center gap-2">
                            {sub.name}
                            {sub.remind_to_cancel && (
                              <span className="p-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20" title="Cancel reminder active">
                                <AlertCircle className="w-3 h-3" strokeWidth={2} />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-sans flex items-center gap-1.5 mt-0.5">
                            <span>{sub.platform || 'Direct'}</span>
                            <span>·</span>
                            <span className="capitalize">{sub.plan_type}</span>
                            {sub.tier && <span>({sub.tier})</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-4 px-5 font-mono">
                      <div className="font-semibold text-white">
                        {sub.currency} {sub.price.toFixed(2)}
                      </div>
                    </td>

                    {/* Billing Cycle */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border ${getBillingCycleBadge(
                          sub.billing_cycle
                        )}`}
                      >
                        {sub.billing_cycle}
                      </span>
                    </td>

                    {/* Next Renewal */}
                    <td className="py-4 px-5 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                        <span className={isDueSoon ? 'text-[#F59E0B] font-medium' : 'text-zinc-300'}>
                          {new Date(sub.next_due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1A1A24] text-zinc-300 text-[11px] border border-white/[0.06]">
                        <Tag className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                        {sub.category || 'Entertainment'}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-5 text-zinc-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.5} />
                        <span>{sub.payment_method || 'Default Card'}</span>
                      </div>
                    </td>

                    {/* Payee Status */}
                    <td className="py-4 px-5">
                      {sub.is_paid_by_me ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> You
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                          Shared
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEdit(sub)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
                          title="Edit subscription"
                        >
                          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${sub.name}?`)) {
                              onDelete(sub.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete subscription"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
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
