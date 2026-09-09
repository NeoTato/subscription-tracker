export interface Subscription {
  id: number;
  name: string;
  price: number;
  currency: string;
  billing_cycle: "daily" | "weekly" | "monthly" | "yearly";
  next_due_date: string;
  platform?: string;
  plan_type: "solo" | "duo" | "family" | "team";
  tier?: string;
  category?: string;
  payment_method?: string;
  is_paid_by_me: boolean;
  remind_to_cancel: boolean;
  student_status_expiry?: string;
  notes?: string;
}

export type SubscriptionCreate = Omit<Subscription, "id">;
export type SubscriptionUpdate = Partial<SubscriptionCreate>;

export interface CategoryBreakdown {
  category: string;
  total_monthly_php: number;
  count: number;
}

export interface SummaryResponse {
  monthly_total: number;
  annual_total: number;
  currency: string;
  sub_count: number;
  paid_by_me_count: number;
  next_payment?: string | null;
  next_payment_date?: string | null;
  next_payment_amount?: number | null;
  categories: CategoryBreakdown[];
  subscriptions: Subscription[];
}

export interface DueSoonAlert {
  id: number;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  next_due_date: string;
  days_left: number;
}

export interface StudentExpiryAlert {
  id: number;
  name: string;
  price: number;
  currency: string;
  next_due_date: string;
  student_status_expiry: string;
  days_left: number;
}

export interface AlertsResponse {
  due_soon: DueSoonAlert[];
  cancellation_reminders: Subscription[];
  student_expiry_reminders: StudentExpiryAlert[];
  total_alerts: number;
}

const API_BASE = "/api/v1";

async function handleResponse<T>(res: Response, defaultMessage: string): Promise<T> {
  if (!res.ok) {
    let errorDetail = defaultMessage;
    try {
      const data = await res.json();
      if (data?.detail) {
        if (Array.isArray(data.detail)) {
          errorDetail = data.detail
            .map((item: any) => `${item.loc?.slice(1).join(".") || "field"}: ${item.msg}`)
            .join("; ");
        } else if (typeof data.detail === "string") {
          errorDetail = data.detail;
        } else {
          errorDetail = JSON.stringify(data.detail);
        }
      }
    } catch {
      errorDetail = `${defaultMessage} (${res.status} ${res.statusText})`;
    }
    throw new Error(errorDetail);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const api = {
  async getSummary(): Promise<SummaryResponse> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    return handleResponse<SummaryResponse>(res, "Failed to fetch summary");
  },

  async getAlerts(): Promise<AlertsResponse> {
    const res = await fetch(`${API_BASE}/analytics/alerts`);
    return handleResponse<AlertsResponse>(res, "Failed to fetch alerts");
  },

  async getSubscriptions(params?: {
    category?: string;
    is_paid_by_me?: boolean;
    search?: string;
  }): Promise<Subscription[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.is_paid_by_me !== undefined)
      query.append("is_paid_by_me", String(params?.is_paid_by_me));
    if (params?.search) query.append("search", params.search);

    const res = await fetch(`${API_BASE}/subscriptions?${query.toString()}`);
    return handleResponse<Subscription[]>(res, "Failed to fetch subscriptions");
  },

  async createSubscription(data: SubscriptionCreate): Promise<Subscription> {
    const res = await fetch(`${API_BASE}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Subscription>(res, "Failed to create subscription");
  },

  async updateSubscription(
    id: number,
    data: SubscriptionUpdate,
  ): Promise<Subscription> {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Subscription>(res, "Failed to update subscription");
  },

  async deleteSubscription(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: "DELETE",
    });
    return handleResponse<void>(res, "Failed to delete subscription");
  },

  async advanceDates(): Promise<{ message: string; updated_count: number }> {
    const res = await fetch(`${API_BASE}/analytics/advance-dates`, {
      method: "POST",
    });
    return handleResponse<{ message: string; updated_count: number }>(
      res,
      "Failed to advance dates",
    );
  },

  async triggerNotification(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/trigger`, {
      method: "POST",
    });
    return handleResponse<any>(res, "Failed to trigger notification");
  },
};
