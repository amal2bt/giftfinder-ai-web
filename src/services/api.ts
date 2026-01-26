const API_BASE = (import.meta as any).env?.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// ------------------------------
// TOKEN HELPERS
// ------------------------------

function getToken(): string | null {
  return sessionStorage.getItem('auth_token');
}

function getRefreshToken(): string | null {
  return sessionStorage.getItem('refresh_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ------------------------------
// TOKEN REFRESH
// ------------------------------
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!res.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await res.json();
      if (data.token) {
        sessionStorage.setItem('auth_token', data.token);
        return data.token;
      }
      throw new Error('No token in refresh response');
    } catch (error) {
      // Clear sessionStorage on refresh failure
      sessionStorage.clear();
      // Redirect to login if we're in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ------------------------------
// REQUEST FUNCTION
// ------------------------------
async function request(path: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  // Handle 401 - try to refresh token once
  if (res.status === 401 && retryCount === 0) {
    // Try to refresh token for any 401 error (token expired, invalid token, etc.)
    const newToken = await refreshToken();
    if (newToken) {
      // Retry the original request with new token
      return request(path, options, retryCount + 1);
    }

    // If refresh failed, get error message and redirect
    let errorMessage = 'Unauthorized. Please login again.';
    try {
      const errorText = await res.text();
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
    } catch {
      // Ignore errors reading response
    }

    sessionStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error(errorMessage);
  }

  if (!res.ok) {
    const text = await res.text();
    let msg: string;
    try { msg = JSON.parse(text)?.message || text; } catch { msg = text; }
    throw new Error(msg || 'Request failed');
  }

  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
}

// ------------------------------
// TYPES
// ------------------------------
export type Gift = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string | null;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  gift_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  gifts?: { id: number; name: string; category: string; image: string | null };
};

export type Order = {
  id: number;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string | null;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  needs_delivery: boolean;
  delivery_address: string | null;
  delivery_phone: string | null;
  house_name: string | null;
  floor: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user?: { id: string; username: string; email: string };
};

export type Feedback = { id: number; user_id: string; message: string; created_at: string };

export type AISettings = {
  system_prompt: string;
  chat_greeting: string;
  price_sensitivity: number;
  personalization: number;
  trending_items: number;
};

export type AnalyticsSummary = {
  users: { total: number; verified: number; admins: number };
  gifts: { total: number; categories: { category: string; count: number }[] };
  recentUsers: { date: string; count: number }[];
  ai: { chats: number };
  wishlists: { total: number };
  recentActivity: { type: string; message: string; time: string }[];
  salesTrends: { date: string; total: number }[];
  deliveredOrdersTrends?: { date: string; count: number }[];
};

// ------------------------------
// GIFTS API
// ------------------------------
export const giftsApi = {
  async list(q?: string): Promise<{ gifts: Gift[] }> {
    const search = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return request(`/api/gifts${search}`, { method: 'GET' });
  },
  async create(payload: Omit<Gift, 'id'>): Promise<{ message: string; gift: Gift }> {
    return request('/api/gifts', { method: 'POST', body: JSON.stringify(payload) });
  },
  async update(id: number, payload: Partial<Omit<Gift, 'id'>>): Promise<{ message: string; gift: Gift }> {
    return request(`/api/gifts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async remove(id: number): Promise<{ message: string }> {
    return request(`/api/gifts/${id}`, { method: 'DELETE' });
  },
};

// ------------------------------
// ORDERS API
// ------------------------------
export const ordersApi = {
  async list(all?: boolean): Promise<Order[]> {
    const query = all ? '?all=true' : '';
    return request(`/api/orders${query}`, { method: 'GET' });
  },
  async getById(id: number): Promise<Order> {
    return request(`/api/orders/${id}`, { method: 'GET' });
  },
  async updateStatus(id: number, status: Order['status']): Promise<{ message: string; order: Order }> {
    return request(`/api/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
};

// ------------------------------
// FEEDBACK API
// ------------------------------
export async function fetchFeedbacks(query: string = "") {
  const endpoint = `/api/feedback${query}`;
  const res = await request(endpoint, { method: 'GET' });
  return res.feedback;
}


// ------------------------------
// AI SETTINGS
// ------------------------------
export async function fetchAISettings(): Promise<AISettings> {
  return request('/api/ai/settings', { method: 'GET' });
}

export async function updateAISettings(payload: Partial<AISettings>) {
  return request('/api/ai/settings', { method: 'PUT', body: JSON.stringify(payload) });
}

// ------------------------------
// ANALYTICS API
// ------------------------------
export async function fetchAnalyticsSummary(days: number = 14): Promise<AnalyticsSummary> {
  const query = days ? `?days=${days}` : '';
  return request(`/api/analytics/summary${query}`, { method: 'GET' });
}

export async function fetchSalesTrends(days = 14): Promise<{ date: string; total: number }[]> {
  const res = await fetchAnalyticsSummary();
  return res.salesTrends.slice(-days);
}

// ------------------------------
// COMMUNITY API (Admin Only)
// ------------------------------
export type CommunityIdea = {
  id: number;
  user_id: string;
  description: string;
  likes_count: number;
  is_flagged?: boolean;
  image?: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; username: string; email: string };
  comments_count?: number;
};

export const communityApi = {
  // Get all ideas (admin view)
  async list(): Promise<CommunityIdea[]> {
    return request('/api/community/ideas', { method: 'GET' });
  },

  // Update an idea by ID
  async update(id: number, payload: { description: string }): Promise<{ message: string; idea: CommunityIdea }> {
    return request(`/api/community/ideas/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  // Delete an idea by ID
  async remove(id: number): Promise<{ message: string }> {
    return request(`/api/community/ideas/${id}`, { method: 'DELETE' });
  },

  // Delete all flagged ideas (admin only)
  async deleteAllFlagged(): Promise<{ message: string; deleted_count: number }> {
    return request('/api/community/admin/delete-flagged', { method: 'DELETE' });
  },
};

// ------------------------------
// DELIVERY API
// ------------------------------
export type DeliveryWorker = {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
};

export type DeliveryAssignment = {
  id: number;
  order_id: number;
  delivery_worker_id: string;
  delivery_status: 'assigned' | 'in_transit' | 'delivered' | 'failed';
  driver_feedback?: string;
  client_feedback?: string;
  assigned_at: string;
  started_at?: string;
  delivered_at?: string;
  order: Order;
  worker?: DeliveryWorker;
};

export const deliveryApi = {
  async getWorkers(): Promise<{ workers: DeliveryWorker[] }> {
    return request('/api/delivery/workers', { method: 'GET' });
  },
  async getAvailableOrders(): Promise<{ orders: Order[] }> {
    return request('/api/delivery/available-orders', { method: 'GET' });
  },
  async getAllAssignments(): Promise<{ assignments: DeliveryAssignment[] }> {
    return request('/api/delivery/assignments', { method: 'GET' });
  },
  async assignOrder(order_id: number, delivery_worker_id: string): Promise<{ message: string; assignment: DeliveryAssignment }> {
    return request('/api/delivery/assign', { method: 'POST', body: JSON.stringify({ order_id, delivery_worker_id }) });
  },
};

// ------------------------------
// USER MANAGEMENT API
// ------------------------------
export type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
};

export const usersApi = {
  async list(): Promise<{ users: User[] }> {
    return request('/api/auth/users', { method: 'GET' });
  },
  async create(data: { username: string; email: string; password: string; role: string }): Promise<{ message: string; user: User }> {
    return request('/api/auth/users', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: { username?: string; email?: string; password?: string; role?: string }): Promise<{ message: string; user: User }> {
    return request(`/api/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id: string): Promise<{ message: string }> {
    return request(`/api/auth/users/${id}`, { method: 'DELETE' });
  },
};