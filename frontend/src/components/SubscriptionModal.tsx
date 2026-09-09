import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Subscription, SubscriptionCreate } from '../services/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubscriptionCreate) => Promise<void>;
  editingSubscription?: Subscription | null;
}

const CATEGORIES = [
  'Entertainment',
  'Productivity',
  'Utilities',
  'Cloud & Dev',
  'Health & Fitness',
  'Education',
  'Other',
];

const CURRENCIES = ['PHP', 'USD', 'JPY', 'EUR', 'GBP', 'SGD'];
const BILLING_CYCLES = ['daily', 'weekly', 'monthly', 'yearly'];
const PLAN_TYPES = ['solo', 'duo', 'family', 'team'];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSubscription,
}) => {
  const [formData, setFormData] = useState<SubscriptionCreate>({
    name: '',
    price: 0,
    currency: 'PHP',
    billing_cycle: 'monthly',
    next_due_date: new Date().toISOString().split('T')[0],
    platform: '',
    plan_type: 'solo',
    tier: '',
    category: 'Entertainment',
    payment_method: 'GCash',
    is_paid_by_me: true,
    remind_to_cancel: false,
    student_status_expiry: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingSubscription) {
      setFormData({
        name: editingSubscription.name,
        price: editingSubscription.price,
        currency: editingSubscription.currency || 'PHP',
        billing_cycle: editingSubscription.billing_cycle || 'monthly',
        next_due_date: editingSubscription.next_due_date,
        platform: editingSubscription.platform || '',
        plan_type: editingSubscription.plan_type || 'solo',
        tier: editingSubscription.tier || '',
        category: editingSubscription.category || 'Entertainment',
        payment_method: editingSubscription.payment_method || '',
        is_paid_by_me: editingSubscription.is_paid_by_me,
        remind_to_cancel: editingSubscription.remind_to_cancel || false,
        student_status_expiry: editingSubscription.student_status_expiry || '',
        notes: editingSubscription.notes || '',
      });
    } else {
      setFormData({
        name: '',
        price: 0,
        currency: 'PHP',
        billing_cycle: 'monthly',
        next_due_date: new Date().toISOString().split('T')[0],
        platform: '',
        plan_type: 'solo',
        tier: '',
        category: 'Entertainment',
        payment_method: 'GCash',
        is_paid_by_me: true,
        remind_to_cancel: false,
        student_status_expiry: '',
        notes: '',
      });
    }
  }, [editingSubscription, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0 || !formData.next_due_date) {
      alert('Please fill in valid name, price, and renewal date.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        student_status_expiry: formData.student_status_expiry ? formData.student_status_expiry : undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {editingSubscription ? 'Edit Subscription' : 'New Subscription'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Service Name & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Service Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. YouTube Premium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Platform / Provider</label>
              <input
                type="text"
                placeholder="e.g. Google, Discord"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Price, Currency & Cycle */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Price *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="159.00"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Billing Cycle</label>
              <select
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500 capitalize"
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Next Due Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Next Renewal Date *</label>
              <input
                type="date"
                required
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Type & Tier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Plan Structure</label>
              <select
                value={formData.plan_type}
                onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500 capitalize"
              >
                {PLAN_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Tier / Extra Spec</label>
              <input
                type="text"
                placeholder="e.g. Pro, Family, 2TB"
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Payment Method & Student Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Payment Method</label>
              <input
                type="text"
                placeholder="e.g. GCash, Maya, Card"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Student Status Expiry (Optional)</label>
              <input
                type="date"
                value={formData.student_status_expiry}
                onChange={(e) => setFormData({ ...formData, student_status_expiry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300 font-medium">I personally pay for this</span>
              <input
                type="checkbox"
                checked={formData.is_paid_by_me}
                onChange={(e) => setFormData({ ...formData, is_paid_by_me: e.target.checked })}
                className="w-4 h-4 rounded text-brand-500 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-slate-300 font-medium block">Remind me to cancel</span>
                <span className="text-[10px] text-slate-500">Flags urgent alert before next renewal</span>
              </div>
              <input
                type="checkbox"
                checked={formData.remind_to_cancel}
                onChange={(e) => setFormData({ ...formData, remind_to_cancel: e.target.checked })}
                className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0"
              />
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Notes / Description</label>
            <textarea
              rows={2}
              placeholder="Account email, renewal instructions, or split members..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingSubscription ? 'Update Subscription' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
