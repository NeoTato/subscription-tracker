export interface Subscription {
  id: number;
  name: string;
  price: number;
  currency: string;
  billing_cycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_due_date: string;
  platform?: string;
  plan_type: 'solo' | 'duo' | 'family' | 'team';
  tier?: string;
  category?: string;
  payment_method?: string;
  is_paid_by_me: boolean;
  remind_to_cancel: boolean;
  student_status_expiry?: string;
  notes?: string;
}

export type SubscriptionCreate = Omit<Subscription, 'id'>;
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

const API_BASE = '/api/v1';

export const api = {
  async getSummary(): Promise<SummaryResponse> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  async getAlerts(): Promise<AlertsResponse> {
    const res = await fetch(`${API_BASE}/analytics/alerts`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async getSubscriptions(params?: { category?: string; is_paid_by_me?: boolean; search?: string }): Promise<Subscription[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.is_paid_by_me !== undefined) query.append('is_paid_by_me', String(params?.is_paid_by_me));
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/subscriptions?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json();
  },

  async createSubscription(data: SubscriptionCreate): Promise<Subscription> {
    const res = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create subscription');
    return res.json();
  },

  async updateSubscription(id: number, data: SubscriptionUpdate): Promise<Subscription> {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update subscription');
    return res.json();
  },

  async deleteSubscription(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete subscription');
  },

  async advanceDates(): Promise<{ message: string; updated_count: number }> {
    const res = await fetch(`${API_BASE}/analytics/advance-dates`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to advance dates');
    return res.json();
  },

  async triggerNotification(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/trigger`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger notification');
    return res.json();
  },
};
