import React, { useState, useEffect } from "react";
import { X, Sparkles, Layers } from "lucide-react";
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

interface PresetTier {
  id: string;
  name: string;
  tierLabel: string;
  price: number;
  currency: string;
  billing_cycle: "daily" | "weekly" | "monthly" | "yearly";
  plan_type: "solo" | "duo" | "family" | "team";
}

interface PresetService {
  id: string;
  name: string;
  platform: string;
  category: string;
  defaultPaymentMethod?: string;
  isStreamerSub?: boolean;
  streamerPrefix?: string;
  defaultName?: string;
  tiers: PresetTier[];
}

const PRESET_SERVICES: PresetService[] = [
  {
    id: "twitch",
    name: "Twitch Channel Subscription",
    platform: "Twitch",
    category: "Entertainment",
    defaultPaymentMethod: "GCash",
    isStreamerSub: true,
    streamerPrefix: "Twitch",
    tiers: [
      {
        id: "twitch_t1",
        name: "Tier 1: ₱100.00 / mo",
        tierLabel: "Tier 1",
        price: 100.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "twitch_t2",
        name: "Tier 2: ₱200.00 / mo",
        tierLabel: "Tier 2",
        price: 200.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "twitch_t3",
        name: "Tier 3: ₱500.00 / mo",
        tierLabel: "Tier 3",
        price: 500.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
    ],
  },
  {
    id: "discord",
    name: "Discord Nitro",
    platform: "Discord",
    category: "Entertainment",
    defaultPaymentMethod: "GCash",
    defaultName: "Discord Nitro",
    tiers: [
      {
        id: "discord_basic",
        name: "Nitro Basic: ₱99.00 / mo",
        tierLabel: "Basic",
        price: 99.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "discord_full",
        name: "Nitro Full: ₱263.99 / mo",
        tierLabel: "Nitro",
        price: 263.99,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "discord_yearly",
        name: "Nitro Yearly: ₱2,639.99 / yr",
        tierLabel: "Nitro (Yearly)",
        price: 2639.99,
        currency: "PHP",
        billing_cycle: "yearly",
        plan_type: "solo",
      },
    ],
  },
  {
    id: "youtube",
    name: "YouTube Premium & Memberships",
    platform: "Google",
    category: "Entertainment",
    defaultPaymentMethod: "GCash",
    isStreamerSub: true,
    streamerPrefix: "YouTube",
    defaultName: "YouTube Premium",
    tiers: [
      {
        id: "yt_indiv",
        name: "Premium Individual: ₱159.00 / mo",
        tierLabel: "Individual",
        price: 159.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "yt_family",
        name: "Premium Family: ₱239.00 / mo",
        tierLabel: "Family",
        price: 239.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
      {
        id: "yt_student",
        name: "Premium Student: ₱95.00 / mo",
        tierLabel: "Student",
        price: 95.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "yt_member",
        name: "Channel Membership: ₱129.00 / mo",
        tierLabel: "Membership",
        price: 129.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
    ],
  },
  {
    id: "spotify",
    name: "Spotify",
    platform: "Spotify",
    category: "Entertainment",
    defaultPaymentMethod: "GCash",
    defaultName: "Spotify",
    tiers: [
      {
        id: "sp_indiv",
        name: "Individual: ₱149.00 / mo",
        tierLabel: "Individual",
        price: 149.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "sp_duo",
        name: "Duo: ₱199.00 / mo",
        tierLabel: "Duo",
        price: 199.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "duo",
      },
      {
        id: "sp_family",
        name: "Family: ₱279.00 / mo",
        tierLabel: "Family",
        price: 279.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
      {
        id: "sp_student",
        name: "Student: ₱75.00 / mo",
        tierLabel: "Student",
        price: 75.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
    ],
  },
  {
    id: "netflix",
    name: "Netflix",
    platform: "Netflix",
    category: "Entertainment",
    defaultName: "Netflix",
    tiers: [
      {
        id: "nf_mobile",
        name: "Mobile: ₱149.00 / mo",
        tierLabel: "Mobile",
        price: 149.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "nf_basic",
        name: "Basic: ₱249.00 / mo",
        tierLabel: "Basic",
        price: 249.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "nf_std",
        name: "Standard 1080p: ₱399.00 / mo",
        tierLabel: "Standard",
        price: 399.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "duo",
      },
      {
        id: "nf_prem",
        name: "Premium 4K: ₱549.00 / mo",
        tierLabel: "Premium 4K",
        price: 549.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI / ChatGPT",
    platform: "OpenAI",
    category: "Productivity",
    defaultName: "ChatGPT Plus",
    tiers: [
      {
        id: "gpt_plus",
        name: "ChatGPT Plus: $20.00 USD / mo",
        tierLabel: "Plus",
        price: 20.0,
        currency: "USD",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "gpt_team",
        name: "ChatGPT Team: $25.00 USD / mo",
        tierLabel: "Team",
        price: 25.0,
        currency: "USD",
        billing_cycle: "monthly",
        plan_type: "team",
      },
    ],
  },
  {
    id: "google",
    name: "Google One & Google AI",
    platform: "Google",
    category: "Cloud & Dev",
    defaultName: "Google One",
    tiers: [
      {
        id: "g_100gb",
        name: "Google One 100GB: ₱89.00 / mo",
        tierLabel: "100GB",
        price: 89.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "g_200gb",
        name: "Google One 200GB: ₱149.00 / mo",
        tierLabel: "200GB",
        price: 149.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "g_2tb",
        name: "Google One 2TB: ₱479.00 / mo",
        tierLabel: "2TB",
        price: 479.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
      {
        id: "g_ai_pro",
        name: "Google AI Pro: ₱1,100.00 / mo",
        tierLabel: "AI Pro",
        price: 1100.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
    ],
  },
  {
    id: "github",
    name: "GitHub Copilot & Pro",
    platform: "GitHub",
    category: "Cloud & Dev",
    defaultName: "GitHub Copilot",
    tiers: [
      {
        id: "gh_copilot_mo",
        name: "Copilot Monthly: $10.00 USD / mo",
        tierLabel: "Copilot Individual",
        price: 10.0,
        currency: "USD",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "gh_copilot_yr",
        name: "Copilot Yearly: $100.00 USD / yr",
        tierLabel: "Copilot Individual (Yearly)",
        price: 100.0,
        currency: "USD",
        billing_cycle: "yearly",
        plan_type: "solo",
      },
      {
        id: "gh_pro",
        name: "GitHub Pro: $4.00 USD / mo",
        tierLabel: "Pro",
        price: 4.0,
        currency: "USD",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
    ],
  },
  {
    id: "icloud",
    name: "Apple iCloud+ Storage",
    platform: "Apple",
    category: "Utilities",
    defaultPaymentMethod: "GCash",
    defaultName: "iCloud+",
    tiers: [
      {
        id: "icloud_50gb",
        name: "iCloud+ 50GB: ₱49.00 / mo",
        tierLabel: "50GB",
        price: 49.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "icloud_200gb",
        name: "iCloud+ 200GB: ₱149.00 / mo",
        tierLabel: "200GB (Family)",
        price: 149.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
      {
        id: "icloud_2tb",
        name: "iCloud+ 2TB: ₱499.00 / mo",
        tierLabel: "2TB (Family)",
        price: 499.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
      {
        id: "icloud_6tb",
        name: "iCloud+ 6TB: ₱1,490.00 / mo",
        tierLabel: "6TB (Family)",
        price: 1490.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
      {
        id: "icloud_12tb",
        name: "iCloud+ 12TB: ₱2,990.00 / mo",
        tierLabel: "12TB (Family)",
        price: 2990.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
    ],
  },
  {
    id: "apple_one",
    name: "Apple One & Apple Music",
    platform: "Apple",
    category: "Entertainment",
    defaultPaymentMethod: "GCash",
    defaultName: "Apple One",
    tiers: [
      {
        id: "ap_one",
        name: "Apple One Individual: ₱399.00 / mo",
        tierLabel: "Apple One Individual",
        price: 399.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "ap_one_fam",
        name: "Apple One Family: ₱549.00 / mo",
        tierLabel: "Apple One Family",
        price: 549.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
      {
        id: "ap_music_student",
        name: "Apple Music Student: ₱75.00 / mo",
        tierLabel: "Music Student",
        price: 75.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "ap_music_indiv",
        name: "Apple Music Individual: ₱149.00 / mo",
        tierLabel: "Music Individual",
        price: 149.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "ap_music_fam",
        name: "Apple Music Family: ₱239.00 / mo",
        tierLabel: "Music Family",
        price: 239.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
    ],
  },
  {
    id: "disney",
    name: "Disney+",
    platform: "Disney",
    category: "Entertainment",
    defaultName: "Disney+",
    tiers: [
      {
        id: "dis_basic",
        name: "Basic: ₱159.00 / mo",
        tierLabel: "Basic",
        price: 159.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "dis_prem",
        name: "Premium: ₱519.00 / mo",
        tierLabel: "Premium",
        price: 519.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
    ],
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    platform: "Crunchyroll",
    category: "Entertainment",
    defaultName: "Crunchyroll",
    tiers: [
      {
        id: "cr_fan",
        name: "Fan: ₱79.00 / mo",
        tierLabel: "Fan",
        price: 79.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "solo",
      },
      {
        id: "cr_megafan",
        name: "Mega Fan: ₱99.00 / mo",
        tierLabel: "Mega Fan",
        price: 99.0,
        currency: "PHP",
        billing_cycle: "monthly",
        plan_type: "family",
      },
    ],
  },
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSubscription,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("custom");
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [streamerName, setStreamerName] = useState<string>("");

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
    status: "active",
    is_paid_by_me: true,
    remind_to_cancel: false,
    student_status_expiry: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingSubscription) {
      setSelectedPresetId("custom");
      setSelectedTierId("");
      setStreamerName("");
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
        status: editingSubscription.status || "active",
        is_paid_by_me: editingSubscription.is_paid_by_me,
        remind_to_cancel: editingSubscription.remind_to_cancel || false,
        student_status_expiry: editingSubscription.student_status_expiry || "",
        notes: editingSubscription.notes || "",
      });
    } else {
      setSelectedPresetId("custom");
      setSelectedTierId("");
      setStreamerName("");
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
        status: "active",
        is_paid_by_me: true,
        remind_to_cancel: false,
        student_status_expiry: "",
        notes: "",
      });
    }
  }, [editingSubscription, isOpen]);

  // Handle Escape key to close modal (R-32)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPreset = PRESET_SERVICES.find((p) => p.id === selectedPresetId);

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    setStreamerName("");

    if (presetId === "custom") {
      setSelectedTierId("");
      return;
    }

    const preset = PRESET_SERVICES.find((p) => p.id === presetId);
    if (!preset) return;

    const firstTier = preset.tiers[0];
    setSelectedTierId(firstTier ? firstTier.id : "");

    let defaultName = preset.defaultName || preset.name;
    if (preset.isStreamerSub) {
      defaultName = `${preset.streamerPrefix || preset.platform}`;
    }

    setFormData((prev) => ({
      ...prev,
      name: defaultName,
      platform: preset.platform,
      category: preset.category,
      payment_method:
        preset.defaultPaymentMethod || prev.payment_method || "GCash",
      tier: firstTier ? firstTier.tierLabel : "",
      price: firstTier ? firstTier.price : prev.price,
      currency: firstTier ? firstTier.currency : prev.currency,
      billing_cycle: firstTier ? firstTier.billing_cycle : prev.billing_cycle,
      plan_type: firstTier ? firstTier.plan_type : prev.plan_type,
    }));
  };

  const handleTierChange = (tierId: string) => {
    setSelectedTierId(tierId);
    if (!currentPreset) return;

    const tier = currentPreset.tiers.find((t) => t.id === tierId);
    if (!tier) return;

    setFormData((prev) => ({
      ...prev,
      tier: tier.tierLabel,
      price: tier.price,
      currency: tier.currency,
      billing_cycle: tier.billing_cycle,
      plan_type: tier.plan_type,
    }));
  };

  const handleStreamerNameChange = (creator: string) => {
    setStreamerName(creator);
    if (currentPreset?.isStreamerSub) {
      const prefix = currentPreset.streamerPrefix || currentPreset.platform;
      const formattedName = creator.trim()
        ? `${prefix} (${creator.trim()})`
        : prefix;
      setFormData((prev) => ({ ...prev, name: formattedName }));
    }
  };

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
        price: Number(formData.price),
        student_status_expiry:
          formData.student_status_expiry &&
          formData.student_status_expiry.trim() !== ""
            ? formData.student_status_expiry
            : undefined,
        platform: formData.platform?.trim() || undefined,
        tier: formData.tier?.trim() || undefined,
        payment_method: formData.payment_method?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {editingSubscription ? "Edit Subscription" : "New Subscription"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 flex-1 text-xs"
        >
          {/* Preset Template Selector */}
          {!editingSubscription && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div>
                <label className="block text-emerald-700 dark:text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Quick Service Template
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                >
                  <option value="custom">⚡ Custom / Manual Entry</option>
                  <optgroup label="Popular Subscriptions & Platforms">
                    {PRESET_SERVICES.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                      >
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Dynamic Tier Selector for Preset */}
              {currentPreset && currentPreset.tiers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Preset Plan & Pricing
                    </label>
                    <select
                      value={selectedTierId}
                      onChange={(e) => handleTierChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {currentPreset.tiers.map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                        >
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentPreset.isStreamerSub && (
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                        Streamer / Creator Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. keipup, kiichan"
                        value={streamerName}
                        onChange={(e) =>
                          handleStreamerNameChange(e.target.value)
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Service Name & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
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
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Platform / Provider
              </label>
              <input
                type="text"
                placeholder="e.g. Google, Discord"
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Price, Currency & Cycle */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
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
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {CURRENCIES.map((c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
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
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize"
              >
                {BILLING_CYCLES.map((c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Next Due Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Next Renewal Date *
              </label>
              <input
                type="date"
                required
                value={formData.next_due_date}
                onChange={(e) =>
                  setFormData({ ...formData, next_due_date: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Type & Tier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Plan Structure
              </label>
              <select
                value={formData.plan_type}
                onChange={(e) =>
                  setFormData({ ...formData, plan_type: e.target.value as any })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize"
              >
                {PLAN_TYPES.map((p) => (
                  <option
                    key={p}
                    value={p}
                  >
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Tier / Extra Spec
              </label>
              <input
                type="text"
                placeholder="e.g. Pro, Family, 2TB"
                value={formData.tier}
                onChange={(e) =>
                  setFormData({ ...formData, tier: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method & Student Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Payment Method
              </label>
              <input
                type="text"
                placeholder="e.g. GCash, Maya, Card"
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Student Status Expiry (Optional)
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
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-800 dark:text-slate-300 font-medium">
                I personally pay for this
              </span>
              <input
                type="checkbox"
                checked={formData.is_paid_by_me}
                onChange={(e) =>
                  setFormData({ ...formData, is_paid_by_me: e.target.checked })
                }
                className="w-4 h-4 rounded text-emerald-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-0 focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-slate-800 dark:text-slate-300 font-medium block">
                  Remind me to cancel
                </span>
                <span className="text-[10px] text-slate-500">
                  Flags urgent alert before next renewal
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
                className="w-4 h-4 rounded text-rose-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-0 focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div>
                <span className="text-slate-800 dark:text-slate-300 font-medium block flex items-center gap-1.5">
                  <span>Pause subscription</span>
                  {formData.status === "paused" && (
                    <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-amber-500/20 text-amber-400 rounded">
                      PAUSED
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500">
                  Keeps subscription on hold without alerts or affecting monthly
                  spend
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.status === "paused"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.checked ? "paused" : "active",
                  })
                }
                className="w-4 h-4 rounded text-amber-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-0 focus:ring-offset-0"
              />
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
              Notes / Description
            </label>
            <textarea
              rows={2}
              placeholder="Account email, renewal instructions, or split members..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-transparent text-xs sm:text-sm font-medium transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm border border-slate-900 dark:border-emerald-500 shadow-sm transition active:scale-95 disabled:opacity-50"
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
