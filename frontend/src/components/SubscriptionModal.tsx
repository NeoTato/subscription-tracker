import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Subscription, SubscriptionCreate } from "../services/api";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubscriptionCreate) => Promise<void>;
  editingSubscription?: Subscription | null;
}

const CATEGORIES = [
  "Entertainment",
  "Productivity",
  "Utilities",
  "Cloud & Dev",
  "Health & Fitness",
  "Education",
  "Other",
];

const CURRENCIES = ["PHP", "USD", "JPY", "EUR", "GBP", "SGD"];
const BILLING_CYCLES = ["daily", "weekly", "monthly", "yearly"];
const PLAN_TYPES = ["solo", "duo", "family", "team"];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSubscription,
}) => {
  const [formData, setFormData] = useState<SubscriptionCreate>({
    name: "",
    price: 0,
    currency: "PHP",
    billing_cycle: "monthly",
    next_due_date: new Date().toISOString().split("T")[0],
    platform: "",
    plan_type: "solo",
    tier: "",
    category: "Entertainment",
    payment_method: "GCash",
    is_paid_by_me: true,
    remind_to_cancel: false,
    student_status_expiry: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingSubscription) {
      setFormData({
        name: editingSubscription.name,
        price: editingSubscription.price,
        currency: editingSubscription.currency || "PHP",
        billing_cycle: editingSubscription.billing_cycle || "monthly",
        next_due_date: editingSubscription.next_due_date,
        platform: editingSubscription.platform || "",
        plan_type: editingSubscription.plan_type || "solo",
        tier: editingSubscription.tier || "",
        category: editingSubscription.category || "Entertainment",
        payment_method: editingSubscription.payment_method || "",
        is_paid_by_me: editingSubscription.is_paid_by_me,
        remind_to_cancel: editingSubscription.remind_to_cancel || false,
        student_status_expiry: editingSubscription.student_status_expiry || "",
        notes: editingSubscription.notes || "",
      });
    } else {
      setFormData({
        name: "",
        price: 0,
        currency: "PHP",
        billing_cycle: "monthly",
        next_due_date: new Date().toISOString().split("T")[0],
        platform: "",
        plan_type: "solo",
        tier: "",
        category: "Entertainment",
        payment_method: "GCash",
        is_paid_by_me: true,
        remind_to_cancel: false,
        student_status_expiry: "",
        notes: "",
      });
    }
  }, [editingSubscription, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0 || !formData.next_due_date) {
      alert("Please fill in valid name, price, and renewal date.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        student_status_expiry: formData.student_status_expiry
          ? formData.student_status_expiry
          : undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0F]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#0F0F17]/95 border border-white/[0.1] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-[#FAFAFA]">
            {editingSubscription ? "Edit Subscription" : "New Subscription"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
          >
            <X
              className="w-4 h-4"
              strokeWidth={1.75}
            />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 flex-1 text-xs font-sans"
        >
          {/* Service Name & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Service Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. YouTube Premium"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="glass-input w-full px-3.5 py-2.5 placeholder-zinc-600"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Platform / Provider
              </label>
              <input
                type="text"
                placeholder="e.g. Google, Discord"
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
                className="glass-input w-full px-3.5 py-2.5 placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Price, Currency & Cycle */}
          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Price *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="159.00"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className="glass-input w-full px-3.5 py-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="glass-input w-full px-3 py-2.5 font-mono"
              >
                {CURRENCIES.map((c) => (
                  <option
                    key={c}
                    value={c}
                    className="bg-[#12121A]"
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Billing Cycle
              </label>
              <select
                value={formData.billing_cycle}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billing_cycle: e.target.value as any,
                  })
                }
                className="glass-input w-full px-3 py-2.5 capitalize"
              >
                {BILLING_CYCLES.map((c) => (
                  <option
                    key={c}
                    value={c}
                    className="bg-[#12121A]"
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Next Due Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Next Renewal Date *
              </label>
              <input
                type="date"
                required
                value={formData.next_due_date}
                onChange={(e) =>
                  setFormData({ ...formData, next_due_date: e.target.value })
                }
                className="glass-input w-full px-3.5 py-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="glass-input w-full px-3 py-2.5"
              >
                {CATEGORIES.map((c) => (
                  <option
                    key={c}
                    value={c}
                    className="bg-[#12121A]"
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Type & Tier */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Plan Structure
              </label>
              <select
                value={formData.plan_type}
                onChange={(e) =>
                  setFormData({ ...formData, plan_type: e.target.value as any })
                }
                className="glass-input w-full px-3 py-2.5 capitalize"
              >
                {PLAN_TYPES.map((p) => (
                  <option
                    key={p}
                    value={p}
                    className="bg-[#12121A]"
                  >
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Tier / Plan Level
              </label>
              <input
                type="text"
                placeholder="e.g. Pro, Family, 2TB"
                value={formData.tier}
                onChange={(e) =>
                  setFormData({ ...formData, tier: e.target.value })
                }
                className="glass-input w-full px-3.5 py-2.5 placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Payment Method & Student Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Payment Method
              </label>
              <input
                type="text"
                placeholder="e.g. GCash, Maya, Card"
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
                className="glass-input w-full px-3.5 py-2.5 placeholder-zinc-600"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">
                Student Expiry (Optional)
              </label>
              <input
                type="date"
                value={formData.student_status_expiry}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    student_status_expiry: e.target.value,
                  })
                }
                className="glass-input w-full px-3.5 py-2.5 font-mono"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="p-4 bg-[#12121A] rounded-xl border border-white/[0.06] space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-zinc-200 font-medium">
                I personally pay for this
              </span>
              <input
                type="checkbox"
                checked={formData.is_paid_by_me}
                onChange={(e) =>
                  setFormData({ ...formData, is_paid_by_me: e.target.checked })
                }
                className="w-4 h-4 rounded text-amber-500 bg-[#1A1A24] border-white/[0.1] focus:ring-0 focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-zinc-200 font-medium block">
                  Remind me to cancel
                </span>
                <span className="text-[10px] text-zinc-500">
                  Triggers urgent alert before upcoming cycle
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.remind_to_cancel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    remind_to_cancel: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-rose-500 bg-[#1A1A24] border-white/[0.1] focus:ring-0 focus:ring-offset-0"
              />
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1.5">
              Notes / Description
            </label>
            <textarea
              rows={2}
              placeholder="Account email, renewal instructions, or split members..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="glass-input w-full px-3.5 py-2.5 placeholder-zinc-600 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary h-10 px-5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-amber-primary h-10 px-6 text-xs font-semibold shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingSubscription
                  ? "Update Subscription"
                  : "Create Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
