// Centralized API Client for Cloud-Based Expense Tracker

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Perform an authenticated API request
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('expense_tracker_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // If response is unauthorized (expired or invalid token)
  if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
    localStorage.removeItem('expense_tracker_token');
    localStorage.removeItem('expense_tracker_user');
    window.dispatchEvent(new Event('auth-expired'));
  }

  // Handle file responses (e.g. CSV export)
  if (options.responseType === 'blob') {
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to download file');
    }
    return response.blob();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.errors = data.errors;
    throw err;
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/api/auth/me', { method: 'GET' }),
    updateProfile: (payload) => request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  },

  // Expenses
  expenses: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const qs = query.toString();
      return request(`/api/expenses${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    get: (id) => request(`/api/expenses/${id}`, { method: 'GET' }),
    create: (payload) => request('/api/expenses', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => request(`/api/expenses/${id}`, { method: 'DELETE' }),
    downloadCsv: async (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val) query.append(key, val);
      });
      const qs = query.toString();
      const blob = await request(`/api/expenses/export/csv${qs ? `?${qs}` : ''}`, {
        method: 'GET',
        responseType: 'blob'
      });
      return blob;
    }
  },

  // Budgets
  budgets: {
    get: (month) => {
      const url = month ? `/api/budgets?month=${encodeURIComponent(month)}` : '/api/budgets';
      return request(url, { method: 'GET' });
    },
    set: (payload) => request('/api/budgets', { method: 'POST', body: JSON.stringify(payload) }),
    delete: (id) => request(`/api/budgets/${id}`, { method: 'DELETE' }),
  },

  // Analytics
  analytics: {
    getDashboard: () => request('/api/analytics/dashboard', { method: 'GET' }),
  }
};
