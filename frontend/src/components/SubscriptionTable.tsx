import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  CheckCircle,
  AlertCircle,
  PackageOpen,
  PauseCircle,
  ChevronDown,
  Check,
} from "lucide-react";
import { Subscription } from "../services/api";

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onDelete: (id: number) => void;
  onStatusChange?: (sub: Subscription, newStatus: "active" | "paused") => void;
  onTogglePause?: (sub: Subscription) => void;
  onAddClick?: () => void;
}

const getPlatformIcon = (platform?: string, name?: string): string | null => {
  const p = (platform || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (
    p.includes("twitch") ||
    n.includes("twitch") ||
    n.includes("keipup") ||
    n.includes("kiichan")
  ) {
    return "/icons/twitch_colored.svg";
  }
  if (p.includes("discord") || n.includes("discord") || n.includes("nitro")) {
    return "/icons/discord_colored.svg";
  }
  if (p.includes("spotify") || n.includes("spotify")) {
    return "/icons/spotify_colored.svg";
  }
  if (
    p.includes("youtube") ||
    n.includes("youtube") ||
    n.includes("millie parfait")
  ) {
    return "/icons/youtube_colored.svg";
  }
  if (p.includes("google") || n.includes("google") || n.includes("gdrive")) {
    return "/icons/google_colored.svg";
  }
  return null;
};

const PlatformAvatar: React.FC<{ sub: Subscription }> = ({ sub }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const iconUrl = getPlatformIcon(sub.platform, sub.name);

  if (iconUrl && !imgFailed) {
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
        <img
          src={iconUrl}
          alt={sub.platform || sub.name}
          className="w-full h-full object-contain"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400 text-sm border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
      {sub.name.charAt(0).toUpperCase()}
    </div>
  );
};

// Custom Interactive Status Dropdown Popover Component (R-26, R-32)
interface StatusDropdownProps {
  currentStatus: "active" | "paused";
  onSelect: (newStatus: "active" | "paused") => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isPaused = currentStatus === "paused";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleChoose = (status: "active" | "paused") => {
    onSelect(status);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 text-[11px] font-semibold rounded-lg border transition shadow-sm ${
          isPaused
            ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/20"
            : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/20"
        }`}
      >
        {isPaused ? (
          <PauseCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}
        <span className="capitalize">{currentStatus}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Active Option */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleChoose("active")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition font-medium ${
              !isPaused
                ? "bg-emerald-50 text-emerald-900 font-semibold border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 hover:text-emerald-900 dark:hover:text-emerald-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Active</span>
            </div>
            {!isPaused && (
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            )}
          </button>

          {/* Paused Option */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleChoose("paused")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition font-medium mt-0.5 ${
              isPaused
                ? "bg-amber-50 text-amber-900 font-semibold border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                : "text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-500/15 hover:text-amber-900 dark:hover:text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <PauseCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Paused</span>
            </div>
            {isPaused && (
              <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  onStatusChange,
  onTogglePause,
  onAddClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<
    "ALL" | "active" | "paused"
  >("ALL");

  const categories = Array.from(
    new Set(subscriptions.map((s) => s.category).filter(Boolean)),
  );

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.platform &&
        sub.platform.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.category &&
        sub.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || sub.category === selectedCategory;

    const subStatus = sub.status || "active";
    const matchesStatus =
      selectedStatus === "ALL" || subStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getBillingCycleBadge = (cycle?: string) => {
    const c = (cycle || "monthly").toLowerCase();
    switch (c) {
      case "yearly":
        return "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
      case "weekly":
        return "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20";
      case "daily":
        return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const handleStatusSelect = (
    sub: Subscription,
    newStatus: "active" | "paused",
  ) => {
    if (onStatusChange) {
      onStatusChange(sub, newStatus);
    } else if (onTogglePause) {
      onTogglePause(sub);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Table Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Subscription Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredSubscriptions.length} of {subscriptions.length}{" "}
            subscriptions tracked
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search service, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table or Empty State (R-03 Responsive Overflow + R-27 Empty States) */}
      {filteredSubscriptions.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="p-3.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 mb-3 border border-slate-200 dark:border-slate-700/60">
            <PackageOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
            No subscriptions matched
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {searchTerm ||
            selectedCategory !== "ALL" ||
            selectedStatus !== "ALL"
              ? "Try adjusting your search query, status, or category filter."
              : "Get started by logging your first recurring subscription."}
          </p>
          {onAddClick && subscriptions.length === 0 && (
            <button
              type="button"
              onClick={onAddClick}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
            >
              Add Subscription
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Service</th>
                <th className="py-3 px-4 font-semibold">Cost</th>
                <th className="py-3 px-4 font-semibold">Cycle</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Next Due Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSubscriptions.map((sub) => {
                const isPaused = (sub.status || "active") === "paused";
                const isStudent = !!sub.student_status_expiry;
                const isRemind = !!sub.remind_to_cancel;

                return (
                  <tr
                    key={sub.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                      isPaused ? "opacity-60 bg-slate-50/30 dark:bg-slate-900/30" : ""
                    }`}
                  >
                    {/* Service Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <PlatformAvatar sub={sub} />
                        <div>
                          <div
                            className={`font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 ${
                              isPaused ? "line-through text-slate-500 dark:text-slate-400" : ""
                            }`}
                          >
                            <span>{sub.name}</span>
                            {isStudent && (
                              <span
                                title={`Student discount active until ${new Date(
                                  sub.student_status_expiry!,
                                ).toLocaleDateString()}`}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                              >
                                Student
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            {sub.platform && <span>{sub.platform}</span>}
                            {sub.tier && (
                              <>
                                <span>·</span>
                                <span>{sub.tier}</span>
                              </>
                            )}
                            {sub.plan_type && sub.plan_type !== "solo" && (
                              <>
                                <span>·</span>
                                <span className="capitalize">
                                  {sub.plan_type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3.5 px-4">
                      <div
                        className={`font-semibold ${
                          isPaused
                            ? "text-slate-400 line-through"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {sub.currency} {sub.price.toFixed(2)}
                      </div>
                      {sub.payment_method && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <CreditCard className="w-3 h-3" />
                          <span>{sub.payment_method}</span>
                        </div>
                      )}
                    </td>

                    {/* Billing Cycle */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border ${getBillingCycleBadge(
                          sub.billing_cycle,
                        )}`}
                      >
                        {sub.billing_cycle || "Monthly"}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sub.category || "Uncategorized"}</span>
                      </div>
                    </td>

                    {/* Next Due Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(sub.next_due_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      {isRemind && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          <span>Cancel before renewal</span>
                        </div>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusDropdown
                          currentStatus={
                            (sub.status || "active") as "active" | "paused"
                          }
                          onSelect={(newStatus) =>
                            handleStatusSelect(sub, newStatus)
                          }
                        />

                        {/* Payee Subtext */}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {sub.is_paid_by_me
                            ? "Paid by me"
                            : "Shared / Covered"}
                        </span>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(sub)}
                          title="Edit Subscription"
                          aria-label={`Edit ${sub.name}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete ${sub.name}?`,
                              )
                            ) {
                              onDelete(sub.id);
                            }
                          }}
                          title="Delete Subscription"
                          aria-label={`Delete ${sub.name}`}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
